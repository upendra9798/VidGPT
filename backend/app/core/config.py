from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "YoutuLearn AI"
    app_version: str = "1.0.0"
    environment: str = Field(default="development", alias="ENVIRONMENT")

    groq_api_key: str = Field(default="", alias="GROQ_API_KEY")
    groq_model: str = Field(default="llama-3.3-70b-versatile", alias="GROQ_MODEL")
    hf_embedding_model: str = Field(default="BAAI/bge-small-en-v1.5", alias="HF_EMBEDDING_MODEL")

    chroma_path: Path = Field(default=Path("backend/chroma"), alias="CHROMA_PATH")
    data_dir: Path = Field(default=Path("backend/data"), alias="DATA_DIR")
    max_upload_seconds: int = Field(default=7200, alias="MAX_UPLOAD_SECONDS")
    rate_limit_per_minute: int = Field(default=60, alias="RATE_LIMIT_PER_MINUTE")

    cors_origins: str = Field(default="http://localhost:5173", alias="CORS_ORIGINS")
    frontend_url: str = Field(default="http://localhost:5173", alias="FRONTEND_URL")
    ffmpeg_path: str = Field(default="", alias="FFMPEG_PATH")
    redis_url: str = Field(default="", alias="REDIS_URL")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    settings = Settings()
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    settings.chroma_path.mkdir(parents=True, exist_ok=True)
    return settings
