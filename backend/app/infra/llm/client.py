"""LLM client interfaces."""

from __future__ import annotations

from typing import Protocol


class LLMClient(Protocol):
    """Interface implemented by concrete LLM providers."""

    async def complete(self, prompt: str) -> str:
        """Return a completion for the supplied prompt."""


class MockLLMClient:
    """Deterministic LLM client for tests and local development."""

    async def complete(self, prompt: str) -> str:
        return prompt
