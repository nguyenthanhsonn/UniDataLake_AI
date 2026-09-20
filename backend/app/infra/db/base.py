"""Declarative base shared by UniLake persistence adapters."""

from __future__ import annotations

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for SQLAlchemy persistence models."""
