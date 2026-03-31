from __future__ import annotations

from fastapi import APIRouter, Request

router = APIRouter(prefix="", tags=["history"])


@router.get("/history")
def history(request: Request, limit: int = 50) -> dict:
    container = request.app.state.container
    items = container.storage.list_history(limit=limit)
    return {"items": [item.model_dump() for item in items]}

