from __future__ import annotations

from fastapi import APIRouter

from app.api.bookmarks import router as bookmarks_router
from app.api.chat import router as chat_router
from app.api.collections import router as collections_router
from app.api.flashcards import router as flashcards_router
from app.api.history import router as history_router
from app.api.overview import router as overview_router
from app.api.notes import router as notes_router
from app.api.study import router as study_router
from app.api.quiz import router as quiz_router
from app.api.search import router as search_router
from app.api.summary import router as summary_router
from app.api.video import router as video_router

api_router = APIRouter()
api_router.include_router(video_router)
api_router.include_router(chat_router)
api_router.include_router(summary_router)
api_router.include_router(quiz_router)
api_router.include_router(notes_router)
api_router.include_router(search_router)
api_router.include_router(history_router)
api_router.include_router(overview_router)
api_router.include_router(study_router)
api_router.include_router(flashcards_router)
api_router.include_router(collections_router)
api_router.include_router(bookmarks_router)

