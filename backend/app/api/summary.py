from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request
from langchain_core.messages import HumanMessage, SystemMessage

from app.models.schemas import SummaryRequest
from app.prompts.summary import SUMMARY_SYSTEM_PROMPT

router = APIRouter(prefix="", tags=["summary"])


@router.post("/summary")
def summary(request: Request, payload: SummaryRequest) -> dict:
    container = request.app.state.container
    record = container.storage.get_video_record(payload.video_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Video not found")
    context, hits = container.rag.build_context(f"Summarize this video in {payload.mode} mode.", limit=8, video_ids=[payload.video_id])
    prompt = (
        f"Create a {payload.mode} summary for the transcript below.\n\n"
        f"Transcript context:\n{context}\n\n"
        "Include timestamp references, key takeaways, and study-friendly structure."
    )
    answer = container.groq.chat([SystemMessage(content=SUMMARY_SYSTEM_PROMPT), HumanMessage(content=prompt)])
    return {"mode": payload.mode, "summary": answer, "sources": [hit.model_dump() for hit in hits]}

