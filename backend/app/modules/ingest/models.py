"""Backward-compatible SQLAlchemy model exports for the old ingest module."""

from __future__ import annotations

from app.modules.datasources.models import Base

__all__ = ["Base"]
