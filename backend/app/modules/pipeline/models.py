"""Backward-compatible SQLAlchemy model exports for the old pipeline module."""

from __future__ import annotations

from app.modules.ingestion.models import Base

__all__ = ["Base"]
