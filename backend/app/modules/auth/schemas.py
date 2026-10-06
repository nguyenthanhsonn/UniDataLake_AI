"""Pydantic schemas for auth APIs."""

from __future__ import annotations

from pydantic import BaseModel


# Hàm trả về access_token và refresh_token
class TokenResponse(BaseModel):
    """Bearer token response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    """Payload to request a new access token using a refresh token."""

    refresh_token: str


class LogoutRequest(BaseModel):
    """Payload for logout request."""

    refresh_token: str | None = None


class MessageResponse(BaseModel):
    """Generic status/message response."""

    message: str
