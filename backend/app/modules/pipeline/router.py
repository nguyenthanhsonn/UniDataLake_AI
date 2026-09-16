"""Backward-compatible pipeline API exports."""

from __future__ import annotations

from app.modules.ingestion.router import router

__all__ = ["router"]
