"""Pydantic schemas for auth APIs."""

from __future__ import annotations

from pydantic import BaseModel


class TokenResponse(BaseModel):
    """Bearer token response."""

    access_token: str
    token_type: str = "bearer"
