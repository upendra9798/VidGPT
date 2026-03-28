from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request
from langchain_core.messages import HumanMessage, SystemMessage

from app.prompts.study import STUDY_SYSTEM_PROMPT

router = APIRouter(prefix="", tags=["study"])


@router.post("/study")
def study(request: Request, video_id: str) -> dict:
    container = request.app.state.container
    if container.storage.get_video_record(video_id) is None:
        raise HTTPException(status_code=404, detail="Video not found")
    context, hits = container.rag.build_context("Create a study roadmap with important concepts and revision notes.", limit=10, video_ids=[video_id])
    prompt = (
        "Create a practical study roadmap, learning checklist, important concepts, revision notes, and a short mind map outline.\n\n"
        f"Transcript context:\n{context}\n"
    )
    answer = container.groq.chat([SystemMessage(content=STUDY_SYSTEM_PROMPT), HumanMessage(content=prompt)])
    return {"study_mode": answer, "sources": [hit.model_dump() for hit in hits]}
