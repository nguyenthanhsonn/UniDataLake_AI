"""LLM client interfaces."""

from __future__ import annotations


class MockLLMClient:
    """Deterministic LLM client for tests and local development."""

    async def complete(self, prompt: str) -> str:
        return prompt
