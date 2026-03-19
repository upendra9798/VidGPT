from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from uuid import uuid4

from app.models.schemas import BookmarkItem, CollectionItem, HistoryItem, TranscriptChunk, VideoMetadata


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


@dataclass(slots=True)
class StoredVideo:
    metadata: VideoMetadata
    transcript_text: str
    transcript_source: str


class StorageService:
    def __init__(self, database_path: Path) -> None:
        self.database_path = database_path
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database_path)
        connection.row_factory = sqlite3.Row
        return connection

    def _initialize(self) -> None:
        with self._connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS videos (
                    video_id TEXT PRIMARY KEY,
                    url TEXT NOT NULL,
                    title TEXT NOT NULL,
                    channel TEXT NOT NULL,
                    duration INTEGER NOT NULL,
                    thumbnail TEXT NOT NULL,
                    description TEXT NOT NULL,
                    processed_at TEXT NOT NULL,
                    transcript_text TEXT NOT NULL,
                    transcript_source TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS transcript_chunks (
                    chunk_id TEXT PRIMARY KEY,
                    video_id TEXT NOT NULL,
                    text TEXT NOT NULL,
                    start_time REAL NOT NULL,
                    end_time REAL NOT NULL,
                    duration REAL NOT NULL,
                    order_index INTEGER NOT NULL
                );

                CREATE TABLE IF NOT EXISTS conversations (
                    conversation_id TEXT PRIMARY KEY,
                    video_id TEXT,
                    collection_id TEXT,
                    question TEXT NOT NULL,
                    answer TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS collections (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT NOT NULL,
                    video_ids TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS bookmarks (
                    id TEXT PRIMARY KEY,
                    target_type TEXT NOT NULL,
                    target_id TEXT NOT NULL,
                    label TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );
                """
            )

    def upsert_video(self, metadata: VideoMetadata, transcript_text: str, transcript_source: str) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO videos (video_id, url, title, channel, duration, thumbnail, description, processed_at, transcript_text, transcript_source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(video_id) DO UPDATE SET
                    url=excluded.url,
                    title=excluded.title,
                    channel=excluded.channel,
                    duration=excluded.duration,
                    thumbnail=excluded.thumbnail,
                    description=excluded.description,
                    processed_at=excluded.processed_at,
                    transcript_text=excluded.transcript_text,
                    transcript_source=excluded.transcript_source
                """,
                (
                    metadata.video_id,
                    metadata.url,
                    metadata.title,
                    metadata.channel,
                    metadata.duration,
                    metadata.thumbnail,
                    metadata.description,
                    metadata.processed_at.isoformat(),
                    transcript_text,
                    transcript_source,
                ),
            )

    def save_chunks(self, video_id: str, chunks: list[TranscriptChunk]) -> None:
        with self._connect() as connection:
            connection.execute("DELETE FROM transcript_chunks WHERE video_id = ?", (video_id,))
            connection.executemany(
                """
                INSERT INTO transcript_chunks (chunk_id, video_id, text, start_time, end_time, duration, order_index)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    (
                        chunk.chunk_id,
                        chunk.video_id,
                        chunk.text,
                        chunk.start_time,
                        chunk.end_time,
                        chunk.duration,
                        chunk.order_index,
                    )
                    for chunk in chunks
                ],
            )

    def get_video(self, video_id: str) -> Optional[VideoMetadata]:
        with self._connect() as connection:
            row = connection.execute("SELECT * FROM videos WHERE video_id = ?", (video_id,)).fetchone()
        if row is None:
            return None
        return VideoMetadata(
            video_id=row["video_id"],
            url=row["url"],
            title=row["title"],
            channel=row["channel"],
            duration=row["duration"],
            thumbnail=row["thumbnail"],
            description=row["description"],
            processed_at=datetime.fromisoformat(row["processed_at"]),
        )

    def get_video_record(self, video_id: str) -> Optional[StoredVideo]:
        with self._connect() as connection:
            row = connection.execute("SELECT * FROM videos WHERE video_id = ?", (video_id,)).fetchone()
        if row is None:
            return None
        return StoredVideo(
            metadata=VideoMetadata(
                video_id=row["video_id"],
                url=row["url"],
                title=row["title"],
                channel=row["channel"],
                duration=row["duration"],
                thumbnail=row["thumbnail"],
                description=row["description"],
                processed_at=datetime.fromisoformat(row["processed_at"]),
            ),
            transcript_text=row["transcript_text"],
            transcript_source=row["transcript_source"],
        )

    def list_videos(self, limit: int = 20) -> list[VideoMetadata]:
        with self._connect() as connection:
            rows = connection.execute("SELECT * FROM videos ORDER BY processed_at DESC LIMIT ?", (limit,)).fetchall()
        return [
            VideoMetadata(
                video_id=row["video_id"],
                url=row["url"],
                title=row["title"],
                channel=row["channel"],
                duration=row["duration"],
                thumbnail=row["thumbnail"],
                description=row["description"],
                processed_at=datetime.fromisoformat(row["processed_at"]),
            )
            for row in rows
        ]

    def list_chunks(self, video_id: str) -> list[TranscriptChunk]:
        with self._connect() as connection:
            rows = connection.execute(
                "SELECT * FROM transcript_chunks WHERE video_id = ? ORDER BY order_index ASC",
                (video_id,),
            ).fetchall()
        return [
            TranscriptChunk(
                chunk_id=row["chunk_id"],
                video_id=row["video_id"],
                text=row["text"],
                start_time=row["start_time"],
                end_time=row["end_time"],
                duration=row["duration"],
                order_index=row["order_index"],
            )
            for row in rows
        ]

    def create_conversation(self, video_id: Optional[str], collection_id: Optional[str], question: str, answer: str) -> str:
        conversation_id = str(uuid4())
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO conversations (conversation_id, video_id, collection_id, question, answer, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (conversation_id, video_id, collection_id, question, answer, utcnow().isoformat()),
            )
        return conversation_id

    def list_history(self, limit: int = 50) -> list[HistoryItem]:
        with self._connect() as connection:
            rows = connection.execute(
                "SELECT * FROM conversations ORDER BY created_at DESC LIMIT ?",
                (limit,),
            ).fetchall()
        return [
            HistoryItem(
                conversation_id=row["conversation_id"],
                video_id=row["video_id"],
                collection_id=row["collection_id"],
                question=row["question"],
                answer=row["answer"],
                created_at=datetime.fromisoformat(row["created_at"]),
            )
            for row in rows
        ]

    def upsert_collection(self, name: str, description: str, video_ids: list[str]) -> CollectionItem:
        collection_id = str(uuid4())
        now = utcnow()
        with self._connect() as connection:
            connection.execute(
                "INSERT INTO collections (id, name, description, video_ids, created_at) VALUES (?, ?, ?, ?, ?)",
                (collection_id, name, description, json.dumps(video_ids), now.isoformat()),
            )
        return CollectionItem(id=collection_id, name=name, description=description, video_ids=video_ids, created_at=now)

    def list_collections(self) -> list[CollectionItem]:
        with self._connect() as connection:
            rows = connection.execute("SELECT * FROM collections ORDER BY created_at DESC").fetchall()
        return [
            CollectionItem(
                id=row["id"],
                name=row["name"],
                description=row["description"],
                video_ids=json.loads(row["video_ids"]),
                created_at=datetime.fromisoformat(row["created_at"]),
            )
            for row in rows
        ]

    def add_bookmark(self, target_type: str, target_id: str, label: str) -> BookmarkItem:
        bookmark_id = str(uuid4())
        now = utcnow()
        with self._connect() as connection:
            connection.execute(
                "INSERT INTO bookmarks (id, target_type, target_id, label, created_at) VALUES (?, ?, ?, ?, ?)",
                (bookmark_id, target_type, target_id, label, now.isoformat()),
            )
        return BookmarkItem(id=bookmark_id, target_type=target_type, target_id=target_id, label=label, created_at=now)

    def list_bookmarks(self) -> list[BookmarkItem]:
        with self._connect() as connection:
            rows = connection.execute("SELECT * FROM bookmarks ORDER BY created_at DESC").fetchall()
        return [
            BookmarkItem(
                id=row["id"],
                target_type=row["target_type"],
                target_id=row["target_id"],
                label=row["label"],
                created_at=datetime.fromisoformat(row["created_at"]),
            )
            for row in rows
        ]
