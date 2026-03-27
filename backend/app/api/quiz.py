from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request
from langchain_core.messages import HumanMessage, SystemMessage

from app.models.schemas import QuizRequest
from app.prompts.quiz import QUIZ_SYSTEM_PROMPT

router = APIRouter(prefix="", tags=["quiz"])


@router.post("/quiz")
def quiz(request: Request, payload: QuizRequest) -> dict:
    container = request.app.state.container
    if container.storage.get_video_record(payload.video_id) is None:
        raise HTTPException(status_code=404, detail="Video not found")
    context, hits = container.rag.build_context(
        f"Generate {payload.count} {payload.format} questions at {payload.difficulty} difficulty.",
        limit=10,
        video_ids=[payload.video_id],
    )
    prompt = (
        f"Generate {payload.count} {payload.format} study questions at {payload.difficulty} difficulty.\n\n"
        f"Transcript context:\n{context}\n\n"
        "Return clear questions, answers, and brief explanations."
    )
    answer = container.groq.chat([SystemMessage(content=QUIZ_SYSTEM_PROMPT), HumanMessage(content=prompt)])
    return {"difficulty": payload.difficulty, "format": payload.format, "quiz": answer, "sources": [hit.model_dump() for hit in hits]}

