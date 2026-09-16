"""Read-only query execution boundary for NLQ."""

from __future__ import annotations


async def execute_read_only_sql(sql: str) -> list[dict[str, object]]:
    """Execute read-only SQL against the Gold layer."""
    _ = sql
    return []
