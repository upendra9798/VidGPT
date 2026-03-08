from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, HttpUrl


class ProcessVideoRequest(BaseModel):
    url: HttpUrl
    collection_id: Optional[str] = None


class VideoMetadata(BaseModel):
    video_id: str
    url: str
    title: str
    channel: str
    duration: int
    thumbnail: str
    description: str = ""
    processed_at: datetime


class TranscriptChunk(BaseModel):
    chunk_id: str
    video_id: str
    text: str
    start_time: float
    end_time: float
    duration: float
    order_index: int


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4000)
    video_id: Optional[str] = None
    collection_id: Optional[str] = None
    conversation_id: Optional[str] = None
    stream: bool = True
    history: list[dict[str, str]] = Field(default_factory=list)


class SourceCitation(BaseModel):
    video_id: str
    title: str
    timestamp: float
    snippet: str
    similarity: float


class ChatResponse(BaseModel):
    answer: str
    confidence: float
    sources: list[SourceCitation]
    conversation_id: str
    suggested_questions: list[str]
    answer_markdown: str


class SummaryRequest(BaseModel):
    video_id: str
    mode: Literal["quick", "detailed", "bullet", "takeaways", "exam", "interview"] = "quick"


class QuizRequest(BaseModel):
    video_id: str
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    count: int = Field(default=5, ge=3, le=20)
    format: Literal["mcq", "short", "flashcards", "true_false", "coding", "interview"] = "mcq"


class FlashcardsRequest(BaseModel):
    video_id: str
    count: int = Field(default=8, ge=3, le=20)


class FlashcardItem(BaseModel):
    front: str
    back: str
    hint: str = ""


class NoteRequest(BaseModel):
    video_id: str
    style: Literal["markdown", "exam", "research", "outline"] = "markdown"


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=1000)
    video_ids: list[str] = Field(default_factory=list)
    collection_id: Optional[str] = None
    limit: int = Field(default=8, ge=1, le=25)


class SearchHit(BaseModel):
    chunk_id: str
    video_id: str
    title: str
    timestamp: float
    text: str
    score: float


class CollectionCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str = Field(default="", max_length=400)
    video_ids: list[str] = Field(default_factory=list)


class CollectionItem(BaseModel):
    id: str
    name: str
    description: str
    video_ids: list[str]
    created_at: datetime


class HistoryItem(BaseModel):
    conversation_id: str
    video_id: Optional[str] = None
    collection_id: Optional[str] = None
    question: str
    answer: str
    created_at: datetime


class BookmarkCreateRequest(BaseModel):
    target_type: Literal["answer", "transcript", "timestamp"]
    target_id: str
    label: str = Field(min_length=1, max_length=200)


class BookmarkItem(BaseModel):
    id: str
    target_type: str
    target_id: str
    label: str
    created_at: datetime
