"""Unit tests for Auth service and login API endpoint."""

from __future__ import annotations

from collections.abc import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException
from fastapi.security import OAuth2PasswordRequestForm

from app.core.exceptions import AppException
from app.core.security import hash_password
from app.infra.db.session import engine
from app.main import app
from app.modules.auth.schemas import TokenResponse
from app.modules.auth.service import login as login_service


@pytest.fixture(autouse=True)
async def dispose_engine() -> AsyncGenerator[None]:
    """Dispose DB engine before each test to prevent event loop mismatch."""
    await engine.dispose()
    yield
    await engine.dispose()


@pytest.mark.asyncio
async def test_login_success() -> None:
    """Test login service succeeds with valid username and password."""
    password_raw = "Password@123"
    hashed_pwd = hash_password(password_raw)

    mock_user = MagicMock()
    mock_user.app_user_id = 1
    mock_user.username = "testuser"
    mock_user.password_hash = hashed_pwd
    mock_user.role = "ADMIN"

    mock_db = AsyncMock()

    request_form = OAuth2PasswordRequestForm(
        username="testuser",
        password=password_raw,
        scope="",
        client_id=None,
        client_secret=None,
    )

    with patch(
        "app.modules.auth.service.get_user_by_username", new_callable=AsyncMock
    ) as mock_get_user:
        mock_get_user.return_value = mock_user

        response = await login_service(
            request=request_form,
            db=mock_db,
            ip_address="127.0.0.1",
            user_agent="pytest-client",
        )

        assert isinstance(response, TokenResponse)
        assert response.token_type == "bearer"
        assert response.access_token is not None
        assert response.refresh_token is not None
        mock_db.add.assert_called_once()
        mock_db.flush.assert_called_once()


@pytest.mark.asyncio
async def test_login_user_not_found() -> None:
    """Test login service raises 401 when user does not exist."""
    mock_db = AsyncMock()
    request_form = OAuth2PasswordRequestForm(
        username="nonexistent",
        password="Password@123",
        scope="",
        client_id=None,
        client_secret=None,
    )

    with patch(
        "app.modules.auth.service.get_user_by_username", new_callable=AsyncMock
    ) as mock_get_user:
        mock_get_user.side_effect = AppException(
            "User not found", code="USER_NOT_FOUND", status_code=404
        )

        with pytest.raises(HTTPException) as exc_info:
            await login_service(request=request_form, db=mock_db)

        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == "Tên đăng nhập hoặc mật khẩu không chính xác"


@pytest.mark.asyncio
async def test_login_invalid_password() -> None:
    """Test login service raises 401 when password is wrong."""
    mock_user = MagicMock()
    mock_user.app_user_id = 1
    mock_user.username = "testuser"
    mock_user.password_hash = hash_password("CorrectPassword123")

    mock_db = AsyncMock()
    request_form = OAuth2PasswordRequestForm(
        username="testuser",
        password="WrongPassword123",
        scope="",
        client_id=None,
        client_secret=None,
    )

    with patch(
        "app.modules.auth.service.get_user_by_username", new_callable=AsyncMock
    ) as mock_get_user:
        mock_get_user.return_value = mock_user

        with pytest.raises(HTTPException) as exc_info:
            await login_service(request=request_form, db=mock_db)

        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == "Tên đăng nhập hoặc mật khẩu không chính xác"


@pytest.mark.asyncio
async def test_login_api_endpoint() -> None:
    """Integration test for POST /api/v1/auth/login endpoint."""
    from httpx import ASGITransport, AsyncClient

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/auth/login",
            data={"username": "admin", "password": "Password@123"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_logout_api_endpoint() -> None:
    """Integration test for full login -> logout -> refresh token revocation flow."""
    from httpx import ASGITransport, AsyncClient

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login to get a valid refresh token
        login_res = await ac.post(
            "/api/v1/auth/login",
            data={"username": "admin", "password": "Password@123"},
        )
        assert login_res.status_code == 200
        refresh_token = login_res.json()["refresh_token"]

        # 2. Call logout with the refresh token
        logout_res = await ac.post(
            "/api/v1/auth/logout",
            json={"refresh_token": refresh_token},
        )
        assert logout_res.status_code == 200
        assert logout_res.json() == {"message": "Đăng xuất thành công"}

        # 3. Verify attempting to refresh token now fails with 401
        refresh_res = await ac.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert refresh_res.status_code == 401
        assert (
            refresh_res.json()["detail"]
            == "Phiên đăng nhập đã hết hạn hoặc bị đăng xuất, vui lòng đăng nhập lại"
        )
