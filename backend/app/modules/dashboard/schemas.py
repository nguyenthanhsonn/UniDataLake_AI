"""Pydantic schemas for dashboard APIs."""

from __future__ import annotations

from pydantic import BaseModel


class KpiRead(BaseModel):
    """Dashboard KPI payload."""

    key: str
    value: float
    unit: str | None = None
