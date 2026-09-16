"""Schema retrieval for NLQ context construction."""

from __future__ import annotations


def retrieve_schema_context(intent: str) -> str:
    """Return schema context relevant to a parsed intent."""
    return f"schema_context:{intent}"
