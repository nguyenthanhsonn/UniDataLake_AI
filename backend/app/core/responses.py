"""Shared API response schemas and OpenAPI response metadata."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class ErrorBody(BaseModel):
    """Standard error object returned inside the API error envelope."""

    code: str
    message: str
    details: dict[str, Any] = Field(default_factory=dict)
    request_id: str | None = None


class ErrorResponse(BaseModel):
    """Standard API error response shape used by AppException."""

    success: Literal[False] = False
    error: ErrorBody


COMMON_ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {
    401: {
        "model": ErrorResponse,
        "description": "Unauthorized - token is missing, invalid, or expired.",
    },
    403: {
        "model": ErrorResponse,
        "description": "Forbidden - current user does not have a required role.",
    },
    404: {
        "model": ErrorResponse,
        "description": "Not found - requested resource does not exist.",
    },
    500: {
        "model": ErrorResponse,
        "description": "Internal server error.",
    },
}
