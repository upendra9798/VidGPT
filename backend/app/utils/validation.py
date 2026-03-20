from __future__ import annotations

import re
from urllib.parse import parse_qs, urlparse


YOUTUBE_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{11}$")


def extract_video_id(url: str) -> str:
    parsed = urlparse(url)
    if parsed.netloc in {"youtu.be", "www.youtu.be"}:
        candidate = parsed.path.lstrip("/")
    elif "youtube.com" in parsed.netloc:
        if parsed.path == "/watch":
            candidate = parse_qs(parsed.query).get("v", [""])[0]
        else:
            parts = [segment for segment in parsed.path.split("/") if segment]
            candidate = parts[-1] if parts else ""
    else:
        candidate = ""
    if not YOUTUBE_ID_PATTERN.match(candidate):
        raise ValueError("Invalid YouTube URL")
    return candidate


def seconds_to_timestamp(seconds: float) -> str:
    total = max(0, int(seconds))
    hours, remainder = divmod(total, 3600)
    minutes, secs = divmod(remainder, 60)
    if hours:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"
