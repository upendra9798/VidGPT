from __future__ import annotations

from typing import Iterable

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_groq import ChatGroq

from app.core.config import get_settings


class GroqService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def client(self) -> ChatGroq:
        if not self.settings.groq_api_key:
            raise RuntimeError("GROQ_API_KEY is not configured")
        return ChatGroq(
            api_key=self.settings.groq_api_key,
            model=self.settings.groq_model,
            temperature=0.2,
            max_tokens=1200,
        )

    def chat(self, messages: list[BaseMessage]) -> str:
        response = self.client().invoke(messages)
        if isinstance(response, AIMessage):
            return str(response.content)
        return str(response.content)

    def stream(self, messages: list[BaseMessage]) -> Iterable[str]:
        for chunk in self.client().stream(messages):
            content = getattr(chunk, "content", "")
            if content:
                yield str(content)

    def build_messages(self, system_prompt: str, history: list[dict[str, str]], user_prompt: str) -> list[BaseMessage]:
        messages: list[BaseMessage] = [SystemMessage(content=system_prompt)]
        for item in history:
            role = item.get("role")
            content = item.get("content", "")
            if role == "assistant":
                messages.append(AIMessage(content=content))
            else:
                messages.append(HumanMessage(content=content))
        messages.append(HumanMessage(content=user_prompt))
        return messages

