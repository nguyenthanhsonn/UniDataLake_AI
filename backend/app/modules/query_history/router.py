"""Query history API routes."""

from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/query-history", tags=["query-history"])
