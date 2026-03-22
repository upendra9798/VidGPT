from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException, Request

from app.models.schemas import ProcessVideoRequest

router = APIRouter(prefix="", tags=["video"])


@router.post("/process-video")
def process_video(request: Request, payload: ProcessVideoRequest) -> dict:
    container = request.app.state.container
    url = str(payload.url)
    try:
        video_id = container.youtube.validate_url(url)
        existing = container.storage.get_video_record(video_id)
        if existing is not None:
            chunks = container.storage.list_chunks(video_id)
            return {
                "video": existing.metadata.model_dump(),
                "transcript_source": existing.transcript_source,
                "chunk_count": len(chunks),
                "status": "cached",
            }

        metadata = container.youtube.fetch_metadata(url)
        transcript_entries = container.youtube.fetch_transcript(metadata.video_id)
        transcript_source = "youtube_transcript_api"
        if transcript_entries is None:
            transcript_source = "faster_whisper"
            audio_path = container.youtube.download_audio(url, container.settings.data_dir / "audio")
            transcript_entries = container.whisper.transcribe(audio_path)

        chunks = container.transcripts.chunk_transcript(metadata.video_id, transcript_entries)
        transcript_text = container.transcripts.combine_entries(transcript_entries)
        container.storage.upsert_video(metadata, transcript_text, transcript_source)
        container.storage.save_chunks(metadata.video_id, chunks)
        container.rag.index_chunks(metadata.title, chunks)
        return {
            "video": metadata.model_dump(),
            "transcript_source": transcript_source,
            "chunk_count": len(chunks),
            "status": "processed",
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Video processing failed: {exc}") from exc


@router.get("/transcript/{video_id}")
def get_transcript(request: Request, video_id: str) -> dict:
    container = request.app.state.container
    record = container.storage.get_video_record(video_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Transcript not found")
    chunks = container.storage.list_chunks(video_id)
    return {
        "video": record.metadata.model_dump(),
        "transcript_source": record.transcript_source,
        "transcript_text": record.transcript_text,
        "chunks": [chunk.model_dump() for chunk in chunks],
    }
