"""FastAPI dependencies shared across modules."""

from __future__ import annotations

from typing import TYPE_CHECKING, Annotated, Any

from fastapi import Depends, Header

from app.core.exceptions import AppException
from app.core.security import decode_access_token

if TYPE_CHECKING:
    from collections.abc import Callable


async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
) -> dict[str, Any]:
    """Resolve the current user from a bearer token."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise AppException("Missing bearer token", code="UNAUTHORIZED", status_code=401)
    return decode_access_token(authorization.split(" ", 1)[1])


def require_role(*roles: str) -> Callable[[dict[str, Any]], dict[str, Any]]:
    """Build a dependency that requires one of the supplied roles."""

    def dependency(
        current_user: Annotated[dict[str, Any], Depends(get_current_user)],
    ) -> dict[str, Any]:
        user_roles = set(current_user.get("roles", []))
        if roles and user_roles.isdisjoint(roles):
            raise AppException("Insufficient permissions", code="FORBIDDEN", status_code=403)
        return current_user

    return dependency
