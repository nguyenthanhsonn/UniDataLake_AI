"""Pipeline API routes."""

from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/pipeline", tags=["pipeline"])

__all__ = ["router"]
