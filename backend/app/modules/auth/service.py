"""Authentication service logic."""

from __future__ import annotations

import hashlib
from datetime import datetime

from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    verify_password,
)
from app.infra.db.session import async_session_factory
from app.modules.auth.models import LoginSession
from app.modules.auth.schemas import TokenResponse
from app.modules.users.models import User
from app.modules.users.service import get_user_by_username


async def login(
    request: OAuth2PasswordRequestForm,
    db: AsyncSession | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> TokenResponse:
    """Authenticate user with username and password.

    1. Verify username & password; if invalid, raise 401 Unauthorized.
    2. Generate access_token with sub=user_id, username, and role claims.
    3. Generate refresh_token with sub=user_id.
    4. Save login session record to app.login_session with token hash.
    5. Return TokenResponse with access_token and refresh_token.
    """
    try:
        user = await get_user_by_username(request.username, session=db)
    except AppException as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tên đăng nhập hoặc mật khẩu không chính xác",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    if not verify_password(request.password, str(user.password_hash)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tên đăng nhập hoặc mật khẩu không chính xác",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = str(user.app_user_id)
    role_name = getattr(user, "role", None) or "USER"

    access_token = create_access_token(
        subject=user_id_str,
        claims={
            "username": user.username,
            "role": role_name,
        },
    )
    refresh_token_str = create_refresh_token(subject=user_id_str)

    # Hash refresh token bằng SHA-256 để lưu an toàn vào DB
    refresh_token_hash = hashlib.sha256(refresh_token_str.encode()).hexdigest()

    # lưu session login vào DB
    session_log = LoginSession(
        app_user_id=user.app_user_id,
        ip_address=ip_address,
        user_agent=user_agent,
        refresh_token_hash=refresh_token_hash,
        session_status="ACTIVE",
    )

    # Nếu có session DB thì lưu vào DB, ngược lại thì tạo session mới để lưu
    if db is not None:
        db.add(session_log)
        await db.flush()
    else:
        async with async_session_factory() as session:
            session.add(session_log)
            await session.commit()

    # Trả về access_token và refresh_token
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token_str,
        token_type="bearer",
    )


async def refresh_token(
    refresh_token_str: str,
    db: AsyncSession | None = None,
) -> TokenResponse:
    """Refresh an access token using a valid, active refresh token.

    1. Decode JWT refresh token and verify signature & expiration.
    2. Hash token with SHA-256 and query app.login_session.
    3. Verify session exists, session_status == 'ACTIVE', and logout_at IS NULL.
       If revoked/expired/not found: raise 401 Unauthorized.
    4. Fetch user from DB, generate new access token.
    5. Return TokenResponse.
    """
    # 1. Decode & verify JWT signature and token type
    try:
        payload = decode_access_token(refresh_token_str)
    except AppException as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phiên làm việc không hợp lệ, vui lòng đăng nhập lại",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. Hash refresh token để query vào bảng login_session
    token_hash = hashlib.sha256(refresh_token_str.encode()).hexdigest()

    # 3. Query bảng login_session kiểm tra trạng thái session
    async def _check_session(session: AsyncSession) -> LoginSession | None:
        stmt = select(LoginSession).where(
            LoginSession.refresh_token_hash == token_hash,  # type: ignore[arg-type]
            LoginSession.session_status == "ACTIVE",  # type: ignore[arg-type]
            LoginSession.logout_at.is_(None),  # type: ignore[attr-defined]
        )
        result = await session.execute(stmt)
        return result.scalars().first()

    if db is not None:
        session_record = await _check_session(db)
    else:
        async with async_session_factory() as session:
            session_record = await _check_session(session)

    if not session_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phiên đăng nhập đã hết hạn hoặc bị đăng xuất, vui lòng đăng nhập lại",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 4. Lấy thông tin user từ DB để cấp Access Token mới
    app_user_id = session_record.app_user_id
    if db is not None:
        user_result = await db.execute(select(User).where(User.app_user_id == app_user_id))
        user = user_result.scalars().first()
    else:
        async with async_session_factory() as session:
            user_result = await session.execute(select(User).where(User.app_user_id == app_user_id))
            user = user_result.scalars().first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tài khoản của bạn đã bị khóa hoặc không tồn tại trên hệ thống",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = str(user.app_user_id)
    role_name = getattr(user, "role", None) or "USER"

    # 5. Sinh Access Token mới
    new_access_token = create_access_token(
        subject=user_id_str,
        claims={
            "username": user.username,
            "role": role_name,
        },
    )

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=refresh_token_str,
        token_type="bearer",
    )


async def logout(refresh_token_str: str, db: AsyncSession | None = None) -> dict[str, str]:
    """Logout user by revoking all matching active refresh token sessions.

    1. Hash the refresh token with SHA-256.
    2. Update active session records in app.login_session:
       set session_status = 'REVOKED' and logout_at = NOW (do not DELETE for audit log).
    3. Return success status dictionary.
    """
    token_hash = hashlib.sha256(refresh_token_str.encode()).hexdigest()
    stmt = (
        update(LoginSession)
        .where(
            LoginSession.refresh_token_hash == token_hash,  # type: ignore[arg-type]
            LoginSession.session_status == "ACTIVE",  # type: ignore[arg-type]
            LoginSession.logout_at.is_(None),  # type: ignore[attr-defined]
        )
        .values(
            session_status="REVOKED",
            logout_at=datetime.now(),
        )
    )

    async def _execute_update(session: AsyncSession) -> int:
        result = await session.execute(stmt)
        return int(getattr(result, "rowcount", 0) or 0)

    if db is not None:
        updated_count = await _execute_update(db)
        await db.flush()
    else:
        async with async_session_factory() as session:
            updated_count = await _execute_update(session)
            await session.commit()

    if updated_count == 0:
        raise AppException(
            "Phiên đăng nhập đã hết hạn hoặc bị đăng xuất, vui lòng đăng nhập lại",
            code="UNAUTHORIZED",
            status_code=401,
        )

    return {"message": "Đăng xuất thành công"}
