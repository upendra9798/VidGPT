from __future__ import annotations

from typing import Iterable

from app.models.schemas import TranscriptChunk


class TranscriptService:
    def combine_entries(self, entries: Iterable[dict[str, object]]) -> str:
        parts: list[str] = []
        for entry in entries:
            text = str(entry.get("text", "")).strip()
            start = float(entry.get("start", 0.0))
            duration = float(entry.get("duration", 0.0))
            if text:
                parts.append(f"[{start:.2f}|{duration:.2f}] {text}")
        return "\n".join(parts)

    def chunk_transcript(self, video_id: str, entries: list[dict[str, object]]) -> list[TranscriptChunk]:
        chunks: list[TranscriptChunk] = []
        order_index = 0
        buffer_text = ""
        buffer_start = 0.0
        buffer_end = 0.0

        for entry in entries:
            text = str(entry.get("text", "")).strip()
            if not text:
                continue
            start = float(entry.get("start", 0.0))
            duration = float(entry.get("duration", 0.0))
            marker = f"[{start:.2f}|{duration:.2f}] {text}"
            if not buffer_text:
                buffer_start = start
            buffer_text = f"{buffer_text} {marker}".strip()
            buffer_end = start + duration
            if len(buffer_text) >= 1000:
                chunks.append(
                    TranscriptChunk(
                        chunk_id=f"{video_id}-{order_index}",
                        video_id=video_id,
                        text=buffer_text,
                        start_time=buffer_start,
                        end_time=buffer_end,
                        duration=max(0.0, buffer_end - buffer_start),
                        order_index=order_index,
                    )
                )
                order_index += 1
                buffer_text = ""

        if buffer_text:
            chunks.append(
                TranscriptChunk(
                    chunk_id=f"{video_id}-{order_index}",
                    video_id=video_id,
                    text=buffer_text,
                    start_time=buffer_start,
                    end_time=buffer_end,
                    duration=max(0.0, buffer_end - buffer_start),
                    order_index=order_index,
                )
            )
        return chunks

