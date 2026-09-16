"""Pydantic schemas for data source APIs."""

from __future__ import annotations

from pydantic import BaseModel


class DataSourceRead(BaseModel):
    """Registered data source payload."""

    id: int
    name: str
    source_type: str
