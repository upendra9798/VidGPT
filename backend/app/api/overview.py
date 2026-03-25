from __future__ import annotations

from fastapi import APIRouter, Request

router = APIRouter(prefix="", tags=["overview"])


@router.get("/videos")
def videos(request: Request, limit: int = 12) -> dict:
    container = request.app.state.container
    items = container.storage.list_videos(limit=limit)
    return {"items": [item.model_dump() for item in items]}


@router.get("/stats")
def stats(request: Request) -> dict:
    container = request.app.state.container
    videos = container.storage.list_videos(limit=200)
    history = container.storage.list_history(limit=200)
    collections = container.storage.list_collections()
    bookmarks = container.storage.list_bookmarks()
    study_hours = round(sum(video.duration for video in videos) / 3600, 1)
    quiz_score = min(100, 65 + len(history) * 2)
    return {
        "videos_processed": len(videos),
        "questions_asked": len(history),
        "study_hours": study_hours,
        "quiz_score": quiz_score,
        "collections": len(collections),
        "bookmarks": len(bookmarks),
    }
