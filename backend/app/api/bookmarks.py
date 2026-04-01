from __future__ import annotations

from fastapi import APIRouter, Request

from app.models.schemas import BookmarkCreateRequest

router = APIRouter(prefix="", tags=["bookmarks"])


@router.get("/bookmarks")
def bookmarks(request: Request) -> dict:
    container = request.app.state.container
    return {"items": [bookmark.model_dump() for bookmark in container.storage.list_bookmarks()]}


@router.post("/bookmarks")
def create_bookmark(request: Request, payload: BookmarkCreateRequest) -> dict:
    container = request.app.state.container
    bookmark = container.storage.add_bookmark(payload.target_type, payload.target_id, payload.label)
    return bookmark.model_dump()

