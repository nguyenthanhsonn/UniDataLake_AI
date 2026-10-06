"""Pydantic schemas for query history APIs."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class QueryHistoryRead(BaseModel):
    """Recorded natural-language query payload."""

    id: int
    question: str
    created_at: datetime
