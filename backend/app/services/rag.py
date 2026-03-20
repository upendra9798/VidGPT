from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.core.config import get_settings
from app.models.schemas import SearchHit, SourceCitation, TranscriptChunk
from app.services.embeddings import EmbeddingService


@dataclass(slots=True)
class RagResult:
    answer: str
    confidence: float
    sources: list[SourceCitation]
    suggested_questions: list[str]


class RagService:
    def __init__(self, embeddings: EmbeddingService) -> None:
        self.settings = get_settings()
        self.embeddings = embeddings
        self.client = chromadb.PersistentClient(
            path=str(self.settings.chroma_path),
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        self.collection = self.client.get_or_create_collection(
            name="youtulearn_chunks",
            metadata={"hnsw:space": "cosine"},
        )

    def index_chunks(self, metadata_title: str, chunks: list[TranscriptChunk]) -> None:
        if not chunks:
            return
        documents = [chunk.text for chunk in chunks]
        metadatas = [
            {
                "video_id": chunk.video_id,
                "title": metadata_title,
                "start_time": chunk.start_time,
                "end_time": chunk.end_time,
                "duration": chunk.duration,
                "order_index": chunk.order_index,
            }
            for chunk in chunks
        ]
        ids = [chunk.chunk_id for chunk in chunks]
        embeddings = self.embeddings.embed_documents(documents)
        self.collection.upsert(ids=ids, embeddings=embeddings, documents=documents, metadatas=metadatas)

    def search(self, query: str, limit: int = 6, video_ids: Optional[list[str]] = None) -> list[SearchHit]:
        where = None
        if video_ids:
            where = {"video_id": {"$in": video_ids}}
        result = self.collection.query(
            query_embeddings=[self.embeddings.embed_query(query)],
            n_results=limit,
            where=where,
        )
        hits: list[SearchHit] = []
        rows = zip(
            result.get("ids", [[]])[0],
            result.get("metadatas", [[]])[0],
            result.get("documents", [[]])[0],
            result.get("distances", [[]])[0],
        )
        for chunk_id, metadata, document, distance in rows:
            similarity = max(0.0, 1.0 - float(distance))
            hits.append(
                SearchHit(
                    chunk_id=str(chunk_id),
                    video_id=str(metadata.get("video_id", "")),
                    title=str(metadata.get("title", "")),
                    timestamp=float(metadata.get("start_time", 0.0)),
                    text=str(document),
                    score=similarity,
                )
            )
        return hits

    def build_context(self, query: str, limit: int = 6, video_ids: Optional[list[str]] = None) -> tuple[str, list[SearchHit]]:
        hits = self.search(query=query, limit=limit, video_ids=video_ids)
        context_blocks = [
            f"Video: {hit.title}\nTimestamp: {hit.timestamp:.2f}\nSimilarity: {hit.score:.2f}\nTranscript: {hit.text}"
            for hit in hits
        ]
        return "\n\n".join(context_blocks), hits

