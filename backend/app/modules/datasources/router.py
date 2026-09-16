"""Data source API routes."""

from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/datasources", tags=["datasources"])
