from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request
from langchain_core.messages import HumanMessage, SystemMessage

from app.models.schemas import NoteRequest
from app.prompts.notes import NOTES_SYSTEM_PROMPT

router = APIRouter(prefix="", tags=["notes"])


@router.post("/notes")
def notes(request: Request, payload: NoteRequest) -> dict:
    container = request.app.state.container
    if container.storage.get_video_record(payload.video_id) is None:
        raise HTTPException(status_code=404, detail="Video not found")
    context, hits = container.rag.build_context(f"Create {payload.style} notes from this video.", limit=8, video_ids=[payload.video_id])
    prompt = f"Create {payload.style} Markdown notes from the transcript below.\n\nTranscript context:\n{context}\n"
    answer = container.groq.chat([SystemMessage(content=NOTES_SYSTEM_PROMPT), HumanMessage(content=prompt)])
    return {"style": payload.style, "notes": answer, "sources": [hit.model_dump() for hit in hits]}

