"""Read-only SQL validation for NLQ-generated queries."""

from __future__ import annotations

from app.core.exceptions import AppException


def validate_read_only_sql(sql: str) -> str:
    """Reject obviously unsafe non-read-only SQL before execution."""
    normalized = sql.strip().lower()
    blocked = ("insert ", "update ", "delete ", "drop ", "alter ", "truncate ", "create ")
    if not normalized.startswith("select") or any(keyword in normalized for keyword in blocked):
        raise AppException("Only read-only SELECT queries are allowed", code="INVALID_SQL")
    return sql
