"""Pydantic schemas for ingestion jobs."""

from __future__ import annotations

from pydantic import BaseModel


class IngestionJobRead(BaseModel):
    """Ingestion job status payload."""

    id: int
    status: str
    datasource_id: int
