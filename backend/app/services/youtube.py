from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi

from app.core.config import get_settings
from app.models.schemas import TranscriptChunk, VideoMetadata
from app.utils.validation import extract_video_id


class YouTubeService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def validate_url(self, url: str) -> str:
        return extract_video_id(url)

    def fetch_metadata(self, url: str) -> VideoMetadata:
        with yt_dlp.YoutubeDL({"quiet": True, "skip_download": True}) as ydl:
            info: dict[str, Any] = ydl.extract_info(url, download=False)
        video_id = str(info.get("id") or self.validate_url(url))
        return VideoMetadata(
            video_id=video_id,
            url=url,
            title=str(info.get("title") or "Untitled video"),
            channel=str(info.get("uploader") or info.get("channel") or "Unknown channel"),
            duration=int(info.get("duration") or 0),
            thumbnail=str(info.get("thumbnail") or ""),
            description=str(info.get("description") or ""),
            processed_at=datetime.now(timezone.utc),
        )

    def fetch_transcript(self, video_id: str) -> Optional[list[dict[str, Any]]]:
        try:
            return YouTubeTranscriptApi.get_transcript(video_id, languages=["en", "en-US", "en-GB"])
        except Exception:
            return None

    def download_audio(self, url: str, target_dir: Path) -> Path:
        target_dir.mkdir(parents=True, exist_ok=True)
        options: dict[str, Any] = {
            "quiet": True,
            "format": "bestaudio/best",
            "outtmpl": str(target_dir / "%(id)s.%(ext)s"),
            "noplaylist": True,
            "postprocessors": [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "wav",
                    "preferredquality": "192",
                }
            ],
        }
        if self.settings.ffmpeg_path:
            options["ffmpeg_location"] = self.settings.ffmpeg_path
        with yt_dlp.YoutubeDL(options) as ydl:
            info = ydl.extract_info(url, download=True)
            downloaded = Path(ydl.prepare_filename(info))
        return downloaded.with_suffix(".wav")

