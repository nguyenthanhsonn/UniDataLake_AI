"""User service logic."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.infra.db.session import async_session_factory
from app.modules.users.models import User


async def get_user_by_username(
    username: str,
    session: AsyncSession | None = None,
) -> User:
    """Find a user by username.

    If found, return the User instance.
    If not found, raise AppException (404 Not Found / Không tồn tại).
    """
    if session is not None:
        result = await session.execute(select(User).where(User.username == username))  # type: ignore[arg-type]
        user = result.scalars().first()
    else:
        async with async_session_factory() as db:
            result = await db.execute(select(User).where(User.username == username))  # type: ignore[arg-type]
            user = result.scalars().first()

    if not user:
        raise AppException(
            message=f"Không tồn tại người dùng {username}",
            code="USER_NOT_FOUND",
            status_code=404,
        )

    return user
