"""Pydantic schemas for the users module."""

from __future__ import annotations

from pydantic import BaseModel


class UserRead(BaseModel):
    """Public user payload."""

    id: int
    email: str
    roles: list[str] = []
