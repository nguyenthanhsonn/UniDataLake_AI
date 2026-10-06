"""Authentication API routes."""

from __future__ import annotations

from fastapi import APIRouter, Body, Cookie, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.infra.db.session import get_db
from app.modules.auth.schemas import (
    LogoutRequest,
    MessageResponse,
    RefreshTokenRequest,
    TokenResponse,
)
from app.modules.auth.service import login as login_service
from app.modules.auth.service import logout as logout_service
from app.modules.auth.service import refresh_token as refresh_token_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Authenticate user with OAuth2 username and password, return JWT tokens."""
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    return await login_service(
        request=form_data,
        db=db,
        ip_address=ip_address,
        user_agent=user_agent,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Issue a new access token using a valid, active refresh token."""
    return await refresh_token_service(
        refresh_token_str=payload.refresh_token,
        db=db,
    )


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Đăng xuất hệ thống (Logout)",
    description="Đăng xuất người dùng, vô hiệu hóa phiên đăng nhập (login_session) và xóa HttpOnly Cookie chứa Refresh Token.",
)
async def logout(
    response: Response,
    payload: LogoutRequest | None = Body(None),
    refresh_token_cookie: str | None = Cookie(None, alias="refresh_token"),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Logout user, revoke login session, and instruct client to delete HttpOnly cookie."""

    token = (
        payload.refresh_token if (payload and payload.refresh_token) else None
    ) or refresh_token_cookie
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phiên đăng nhập đã hết hạn hoặc bị đăng xuất, vui lòng đăng nhập lại",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await logout_service(refresh_token_str=token, db=db)
    response.delete_cookie(
        key="refresh_token",
        path="/",
        httponly=True,
        samesite="lax",
    )
    return MessageResponse(**result)
