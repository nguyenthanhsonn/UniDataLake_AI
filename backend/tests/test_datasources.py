"""Unit tests for data source service logic."""

from __future__ import annotations

from datetime import datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.core.exceptions import AppException
from app.core.responses import ErrorResponse
from app.modules.datasources.router import DATA_SOURCE_ERROR_RESPONSES
from app.modules.datasources.schemas import DataSourceFilter, DataSourceResponse
from app.modules.datasources.service import ALLOWED_DATA_SOURCE_ROLES_RESPONSE, DataSourceService
from app.repositories.datasource_repo import DataSourceRepository


def _db() -> MagicMock:
    return MagicMock()


def _data_source() -> SimpleNamespace:
    return SimpleNamespace(
        data_source_id=10,
        source_system_id=3,
        source_name="Admissions CSV 2026",
        source_type="CSV",
        connection_type="FILE",
        location="s3://bronze/admissions.csv",
        configuration={"access_key": "secret", "delimiter": ","},
        description="Admissions sample source",
        is_active=True,
        last_ingested_at=None,
        last_ingestion_status=None,
        ingestion_count=2,
        created_by=1,
        created_at=datetime(2026, 10, 8, 8, 0, 0),
        updated_at=None,
    )


@pytest.mark.asyncio
async def test_get_data_source_returns_paginated_public_payload() -> None:
    service = DataSourceService(_db())
    service.datasource_repo.list_with_source_system = AsyncMock(
        return_value=([(_data_source(), "Admissions System")], 1)
    )

    response = await service.get_data_source(
        DataSourceFilter(source_type="CSV", is_active=True, page=2, page_size=5),
        {"roles": ["VIEWER"]},
    )

    assert isinstance(response, DataSourceResponse)
    assert response.total == 1
    assert response.page == 2
    assert response.page_size == 5
    assert response.items[0].source_system_name == "Admissions System"
    assert response.items[0].source_name == "Admissions CSV 2026"
    assert "configuration" not in response.items[0].model_dump()
    service.datasource_repo.list_with_source_system.assert_awaited_once()
    _, kwargs = service.datasource_repo.list_with_source_system.await_args
    assert kwargs == {"limit": 5, "offset": 5}


@pytest.mark.asyncio
async def test_get_data_source_rejects_user_without_allowed_role() -> None:
    service = DataSourceService(_db())
    service.datasource_repo.list_with_source_system = AsyncMock()

    with pytest.raises(AppException) as exc_info:
        await service.get_data_source(DataSourceFilter(), {"roles": ["STUDENT"]})

    assert exc_info.value.status_code == 403
    assert exc_info.value.code == "FORBIDDEN"
    assert exc_info.value.details == {"allowed_roles": list(ALLOWED_DATA_SOURCE_ROLES_RESPONSE)}
    service.datasource_repo.list_with_source_system.assert_not_awaited()


@pytest.mark.asyncio
async def test_get_data_source_detail_returns_public_payload() -> None:
    service = DataSourceService(_db())
    service.datasource_repo.get_with_source_system = AsyncMock(
        return_value=(_data_source(), "Admissions System")
    )

    response = await service.get_data_source_detail(10, {"roles": ["ANALYST"]})

    assert response.data_source_id == 10
    assert response.source_system_name == "Admissions System"
    assert response.source_name == "Admissions CSV 2026"
    assert "configuration" not in response.model_dump()
    service.datasource_repo.get_with_source_system.assert_awaited_once_with(10)


@pytest.mark.asyncio
async def test_get_data_source_detail_raises_404_when_missing() -> None:
    service = DataSourceService(_db())
    service.datasource_repo.get_with_source_system = AsyncMock(return_value=None)

    with pytest.raises(AppException) as exc_info:
        await service.get_data_source_detail(999, {"roles": ["DATA_ADMIN"]})

    assert exc_info.value.status_code == 404
    assert exc_info.value.code == "DATA_SOURCE_NOT_FOUND"
    assert exc_info.value.details == {"data_source_id": 999}


def test_data_source_role_check_accepts_role_string_payload() -> None:
    DataSourceService._ensure_can_read_data_sources({"roles": "DATA_ADMIN"})


def test_data_source_role_check_rejects_missing_roles() -> None:
    with pytest.raises(AppException) as exc_info:
        DataSourceService._ensure_can_read_data_sources({})

    assert exc_info.value.status_code == 403
    assert exc_info.value.details["allowed_roles"] == list(ALLOWED_DATA_SOURCE_ROLES_RESPONSE)


def test_data_source_route_documents_standard_error_response() -> None:
    forbidden_response = DATA_SOURCE_ERROR_RESPONSES[403]

    assert forbidden_response["model"] is ErrorResponse
    assert "DATA_ADMIN" in forbidden_response["description"]
    assert "VIEWER" in forbidden_response["description"]


def test_validate_configuration_accepts_valid_csv_config() -> None:
    repo = DataSourceRepository(_db())

    errors = repo.validate_configuration(
        "CSV",
        {"delimiter": ",", "encoding": "utf-8", "has_header": True},
    )

    assert errors == []


def test_validate_configuration_reports_missing_and_invalid_fields() -> None:
    repo = DataSourceRepository(_db())

    errors = repo.validate_configuration("CSV", {"delimiter": ",", "has_header": "yes"})

    assert "Missing required configuration: encoding" in errors
    assert "Invalid type for configuration 'has_header': expected bool, got str" in errors


def test_validate_configuration_reports_unsupported_source_type() -> None:
    repo = DataSourceRepository(_db())

    assert repo.validate_configuration("REST_API", {}) == ["Unsupported source type: REST_API"]
