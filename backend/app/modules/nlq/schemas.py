"""Pydantic schemas for natural-language queries."""

from __future__ import annotations

from pydantic import BaseModel


class NaturalLanguageQueryRequest(BaseModel):
    """User question submitted to the NLQ engine."""

    question: str


class NaturalLanguageQueryResponse(BaseModel):
    """NLQ response payload."""

    sql: str
    rows: list[dict[str, object]] = []
