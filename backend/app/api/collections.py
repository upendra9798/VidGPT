from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

from app.models.schemas import CollectionCreateRequest

router = APIRouter(prefix="", tags=["collections"])


@router.get("/collections")
def collections(request: Request) -> dict:
    container = request.app.state.container
    items = container.storage.list_collections()
    return {"items": [item.model_dump() for item in items]}


@router.post("/collections")
def create_collection(request: Request, payload: CollectionCreateRequest) -> dict:
    container = request.app.state.container
    item = container.storage.upsert_collection(payload.name, payload.description, payload.video_ids)
    return item.model_dump()

