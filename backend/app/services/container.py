from __future__ import annotations

from dataclasses import dataclass

from app.core.config import Settings
from app.services.embeddings import EmbeddingService
from app.services.storage import StorageService
from app.services.transcript import TranscriptService
from app.services.youtube import YouTubeService

# Try to import optional services that may have heavy dependencies
try:
    from app.services.groq import GroqService
    GROQ_AVAILABLE = True
except (ImportError, OSError, ModuleNotFoundError):
    GROQ_AVAILABLE = False
    GroqService = None

try:
    from app.services.whisper import WhisperService
    WHISPER_AVAILABLE = True
except (ImportError, OSError, ModuleNotFoundError):
    WHISPER_AVAILABLE = False
    WhisperService = None

try:
    from app.services.rag import RagService
    RAG_AVAILABLE = True
except (ImportError, OSError, ModuleNotFoundError):
    RAG_AVAILABLE = False
    RagService = None


@dataclass(slots=True)
class ServiceContainer:
    settings: Settings
    storage: StorageService
    youtube: YouTubeService
    whisper: 'WhisperService | None'
    transcripts: TranscriptService
    embeddings: EmbeddingService
    groq: 'GroqService | None'
    rag: 'RagService | None'


def build_service_container(settings: Settings) -> ServiceContainer:
    embeddings = EmbeddingService()
    storage = StorageService(settings.data_dir / "youtulearn.sqlite3")
    youtube = YouTubeService()
    transcripts = TranscriptService()
    
    # Optionally load heavy-dependency services
    whisper = None
    groq = None
    rag = None
    
    if WHISPER_AVAILABLE:
        whisper = WhisperService()
    
    if GROQ_AVAILABLE:
        groq = GroqService()
    
    if RAG_AVAILABLE:
        rag = RagService(embeddings)
    elif embeddings is not None:
        # Create a minimal RAG service even without Groq.
        try:
            from app.services.rag import RagService as RagService_

            rag = RagService_(embeddings)
        except Exception:
            pass
    
    return ServiceContainer(
        settings=settings,
        storage=storage,
        youtube=youtube,
        whisper=whisper,
        transcripts=transcripts,
        embeddings=embeddings,
        groq=groq,
        rag=rag,
    )
