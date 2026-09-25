"""Composition providers wiring application ports to concrete adapters."""

from __future__ import annotations

from functools import lru_cache

from app.infra.duckdb.query import EmptyGoldQueryExecutor
from app.infra.llm import MockLLMClient
from app.modules.nlq.service import NLQService


@lru_cache(maxsize=1)
def provide_nlq_service() -> NLQService:
    """Build the NLQ service with development-safe adapters."""
    return NLQService(llm=MockLLMClient(), query_executor=EmptyGoldQueryExecutor())
