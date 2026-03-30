from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException, Request
from langchain_core.messages import HumanMessage, SystemMessage

from app.models.schemas import FlashcardsRequest, FlashcardItem

router = APIRouter(prefix="", tags=["flashcards"])


@router.post("/flashcards")
def flashcards(request: Request, payload: FlashcardsRequest) -> dict:
    container = request.app.state.container
    if container.storage.get_video_record(payload.video_id) is None:
        raise HTTPException(status_code=404, detail="Video not found")
    context, hits = container.rag.build_context(f"Create {payload.count} flashcards from this transcript.", limit=10, video_ids=[payload.video_id])
    prompt = (
        f"Create exactly {payload.count} flashcards. Return JSON only as an array of objects with front, back, and hint fields.\n\n"
        f"Transcript context:\n{context}\n"
    )
    raw = container.groq.chat([SystemMessage(content="You create precise study flashcards from transcript context."), HumanMessage(content=prompt)])
    cards: list[FlashcardItem] = []
    try:
        parsed = json.loads(raw)
        cards = [FlashcardItem(**item) for item in parsed]
    except Exception:
        cards = [FlashcardItem(front=f"Key idea {index + 1}", back=hit.text[:240], hint=f"{hit.title} @ {hit.timestamp:.0f}s") for index, hit in enumerate(hits[: payload.count])]
    return {"items": [card.model_dump() for card in cards[: payload.count]], "sources": [hit.model_dump() for hit in hits]}
