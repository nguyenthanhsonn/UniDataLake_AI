"""Security helpers for passwords and HMAC-signed JWT tokens."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
from datetime import UTC, datetime, timedelta
from secrets import token_bytes
from typing import Any, cast

from app.core.config import settings
from app.core.exceptions import AppException


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(f"{data}{padding}")


def hash_password(password: str) -> str:
    """Hash a password with PBKDF2-HMAC-SHA256."""
    salt = token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 210_000)
    return f"pbkdf2_sha256${_b64url_encode(salt)}${_b64url_encode(digest)}"


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against a PBKDF2 hash."""
    try:
        algorithm, encoded_salt, encoded_digest = password_hash.split("$", 2)
    except ValueError:
        return False

    if algorithm != "pbkdf2_sha256":
        return False

    salt = _b64url_decode(encoded_salt)
    expected = _b64url_decode(encoded_digest)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 210_000)
    return hmac.compare_digest(digest, expected)


def create_access_token(
    subject: str,
    *,
    expires_delta: timedelta | None = None,
    claims: dict[str, Any] | None = None,
) -> str:
    """Create a compact HS256 JWT access token."""
    expire_at = datetime.now(UTC) + (
        expires_delta or timedelta(minutes=settings.jwt_access_token_expire_minutes)
    )
    header = {"alg": settings.jwt_algorithm, "typ": "JWT"}
    payload = {"sub": subject, "exp": int(expire_at.timestamp()), **(claims or {})}

    encoded_header = _b64url_encode(json.dumps(header, separators=(",", ":")).encode())
    encoded_payload = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode())
    signing_input = f"{encoded_header}.{encoded_payload}".encode()
    signature = hmac.new(settings.jwt_secret_key.encode(), signing_input, hashlib.sha256).digest()
    return f"{encoded_header}.{encoded_payload}.{_b64url_encode(signature)}"


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and verify a compact HS256 JWT access token."""
    try:
        encoded_header, encoded_payload, encoded_signature = token.split(".", 2)
    except ValueError as exc:
        raise AppException("Invalid token", code="INVALID_TOKEN", status_code=401) from exc

    signing_input = f"{encoded_header}.{encoded_payload}".encode()
    expected = hmac.new(settings.jwt_secret_key.encode(), signing_input, hashlib.sha256).digest()
    if not hmac.compare_digest(_b64url_decode(encoded_signature), expected):
        raise AppException("Invalid token signature", code="INVALID_TOKEN", status_code=401)

    payload = cast("dict[str, Any]", json.loads(_b64url_decode(encoded_payload)))
    if int(payload.get("exp", 0)) < int(datetime.now(UTC).timestamp()):
        raise AppException("Token expired", code="TOKEN_EXPIRED", status_code=401)
    return payload
