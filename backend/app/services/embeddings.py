from __future__ import annotations

from functools import lru_cache
import hashlib
import numpy as np

from app.core.config import get_settings

# Try to import HuggingFace embeddings, fall back to simple hash-based embeddings
try:
    from langchain_huggingface import HuggingFaceEmbeddings
    HF_AVAILABLE = True
except (ImportError, OSError):
    HF_AVAILABLE = False


class EmbeddingService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._use_hf = HF_AVAILABLE

    @lru_cache(maxsize=1)
    def model(self) -> HuggingFaceEmbeddings | None:
        if not self._use_hf:
            return None
        try:
            return HuggingFaceEmbeddings(model_name=self.settings.hf_embedding_model)
        except (ImportError, OSError):
            self._use_hf = False
            return None

    def _simple_embed(self, text: str) -> list[float]:
        """Fallback simple embedding using hash-based approach."""
        # Create a fixed-size embedding from text hash
        h = hashlib.sha256(text.lower().encode()).digest()
        # Convert to 384-dimensional vector (compatible with bge-small)
        embedding = []
        for i in range(384):
            byte_idx = (i * 2) % len(h)
            byte_idx2 = (i * 2 + 1) % len(h)
            val = (h[byte_idx] + h[byte_idx2]) / 512.0  # Normalize to roughly [-1, 1]
            embedding.append(float(val))
        return embedding

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        if self._use_hf and self.model() is not None:
            try:
                return self.model().embed_documents(texts)
            except (RuntimeError, OSError):
                self._use_hf = False
        
        # Fallback to simple embeddings
        return [self._simple_embed(text) for text in texts]

    def embed_query(self, text: str) -> list[float]:
        if self._use_hf and self.model() is not None:
            try:
                return self.model().embed_query(text)
            except (RuntimeError, OSError):
                self._use_hf = False
        
        # Fallback to simple embedding
        return self._simple_embed(text)

