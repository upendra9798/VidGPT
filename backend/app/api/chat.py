from __future__ import annotations

import json
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from app.models.schemas import ChatRequest
from app.prompts.chat import SYSTEM_CHAT_PROMPT

router = APIRouter(prefix="", tags=["chat"])


def _collection_video_ids(container, collection_id: str | None) -> list[str]:
    if not collection_id:
        return []
    for collection in container.storage.list_collections():
        if collection.id == collection_id:
            return collection.video_ids
    return []


def _build_messages(container, question: str, context: str, history: list[dict[str, str]]) -> list:
    messages = [SystemMessage(content=SYSTEM_CHAT_PROMPT)]
    for item in history:
        role = item.get("role", "user")
        content = item.get("content", "")
        if role == "assistant":
            messages.append(AIMessage(content=content))
        else:
            messages.append(HumanMessage(content=content))
    messages.append(
        HumanMessage(
            content=(
                f"Context:\n{context}\n\nQuestion: {question}\n\n"
                "Provide a precise study answer with timestamps, transcript snippets, and a confidence score."
            )
        )
    )
    return messages


@router.post("/chat")
def chat(request: Request, payload: ChatRequest):
    container = request.app.state.container
    try:
        video_ids = [payload.video_id] if payload.video_id else _collection_video_ids(container, payload.collection_id)
        context, hits = container.rag.build_context(payload.question, limit=6, video_ids=video_ids or None)
        messages = _build_messages(container, payload.question, context, payload.history)
        suggested_questions = [
            "Can you explain the most important concept in simpler terms?",
            "What timestamp covers the implementation details?",
            "How does this compare to the previous section?",
        ]
        conversation_id = payload.conversation_id or str(uuid4())

        if payload.stream:
            def event_stream():
                yield f"data: {json.dumps({'type': 'meta', 'conversation_id': conversation_id, 'sources': [hit.model_dump() for hit in hits], 'suggested_questions': suggested_questions})}\n\n"
                answer_parts: list[str] = []
                for token in container.groq.stream(messages):
                    answer_parts.append(token)
                    yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
                answer = "".join(answer_parts).strip()
                stored_conversation_id = container.storage.create_conversation(payload.video_id, payload.collection_id, payload.question, answer)
                conversation_id = stored_conversation_id
                yield f"data: {json.dumps({'type': 'final', 'answer': answer, 'confidence': min(0.98, 0.55 + (hits[0].score if hits else 0.0) * 0.4), 'sources': [hit.model_dump() for hit in hits], 'conversation_id': conversation_id, 'suggested_questions': suggested_questions})}\n\n"

            return StreamingResponse(event_stream(), media_type="text/event-stream")

        answer = container.groq.chat(messages)
        conversation_id = container.storage.create_conversation(payload.video_id, payload.collection_id, payload.question, answer)
        return {
            "answer": answer,
            "confidence": min(0.98, 0.55 + (hits[0].score if hits else 0.0) * 0.4),
            "sources": [hit.model_dump() for hit in hits],
            "conversation_id": conversation_id,
            "suggested_questions": suggested_questions,
            "answer_markdown": answer,
        }
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Chat failed: {exc}") from exc
