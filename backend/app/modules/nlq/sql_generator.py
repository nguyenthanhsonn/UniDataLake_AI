"""SQL generation boundary for NLQ."""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.infra.llm import LLMClient


async def generate_sql(question: str, schema_context: str, llm_client: LLMClient) -> str:
    """Generate SQL from a question and schema context."""
    prompt = f"{schema_context}\nQuestion: {question}\nSQL:"
    return await llm_client.complete(prompt)
