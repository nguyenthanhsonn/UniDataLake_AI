"""Pydantic schemas for auth APIs."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class LoginRequest(BaseModel):
    """Login request credentials."""

    username: str
    password: str


class UserProfileDTO(BaseModel):
    """Authenticated user profile returned to the client."""

    user_id: int
    username: str
    role: str


# Hàm trả về access_token và refresh_token
class LoginResponse(BaseModel):
    """Login response with user profile."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserProfileDTO


class RefreshTokenRequest(BaseModel):
    """Payload to request a new access token using a refresh token."""

    refresh_token: str


class LogoutRequest(BaseModel):
    """Payload for logout request."""

    refresh_token: str | None = None


class MessageResponse(BaseModel):
    """Generic status/message response."""

    message: str


class SessionRead(BaseModel):
    """Active login session returned to the authenticated user."""

    login_session_id: int
    login_at: datetime
    ip_address: str | None = None
    user_agent: str | None = None
    session_status: str
