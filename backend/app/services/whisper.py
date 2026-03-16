from __future__ import annotations

from pathlib import Path

from faster_whisper import WhisperModel


class WhisperService:
    def __init__(self, model_size: str = "small") -> None:
        self.model_size = model_size
        self._model: WhisperModel | None = None

    @property
    def model(self) -> WhisperModel:
        if self._model is None:
            self._model = WhisperModel(self.model_size, device="auto", compute_type="int8")
        return self._model

    def transcribe(self, audio_path: Path) -> list[dict[str, float | str]]:
        segments, _info = self.model.transcribe(str(audio_path), vad_filter=True)
        return [
            {
                "text": segment.text.strip(),
                "start": float(segment.start),
                "duration": float(segment.end - segment.start),
            }
            for segment in segments
            if segment.text.strip()
        ]

