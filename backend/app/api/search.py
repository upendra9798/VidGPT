from __future__ import annotations

from fastapi import APIRouter, Request

router = APIRouter(prefix="", tags=["search"])


@router.get("/search")
def search(request: Request, query: str, limit: int = 8, video_id: str | None = None) -> dict:
    container = request.app.state.container
    video_ids = [video_id] if video_id else None
    hits = container.rag.search(query=query, limit=limit, video_ids=video_ids)
    return {"query": query, "results": [hit.model_dump() for hit in hits]}

