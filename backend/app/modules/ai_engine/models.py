"""Backward-compatible SQLAlchemy model exports for the old AI engine module."""

from __future__ import annotations

from app.modules.nlq.models import Base

__all__ = ["Base"]
