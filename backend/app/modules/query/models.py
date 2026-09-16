"""Backward-compatible SQLAlchemy model exports for the old query module."""

from __future__ import annotations

from app.modules.dashboard.models import Base

__all__ = ["Base"]
