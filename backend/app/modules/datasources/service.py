"""Data source service logic."""

from __future__ import annotations

from collections.abc import Collection
from typing import TYPE_CHECKING, Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.modules.datasources.schemas import (
    DataSourceCreate,
    DataSourceFilter,
    DataSourceItem,
    DataSourceResponse,
)
from app.repositories.datasource_repo import DataSourceRepository

if TYPE_CHECKING:
    from app.modules.datasources.models import DataSource

ALLOWED_DATA_SOURCE_ROLES = {"DATA_ADMIN", "ADMIN", "ANALYST", "VIEWER"}
ALLOWED_DATA_SOURCE_ROLES_RESPONSE = tuple(sorted(ALLOWED_DATA_SOURCE_ROLES))


class DataSourceService:
    def __init__(self, db: AsyncSession) -> None:
        self.datasource_repo = DataSourceRepository(db)

    async def get_data_source(
        self,
        req: DataSourceFilter,
        current_user: dict[str, Any],
    ) -> DataSourceResponse:
        """Lấy danh sách data source có phân quyền, filter và phân trang."""

        # 2. Kiểm tra role lấy từ access token; user không đủ quyền sẽ nhận 403.
        self._ensure_can_read_data_sources(current_user)

        # 3. Query params đã được Pydantic validate trong DataSourceFilter.
        #    Ở đây chỉ chuyển page/page_size sang offset/limit cho SQL.
        offset = (req.page - 1) * req.page_size

        # 4. Repository chịu trách nhiệm SELECT + JOIN source_system,
        #    áp dụng filter, đếm total và phân trang bằng LIMIT/OFFSET.
        rows, total = await self.datasource_repo.list_with_source_system(
            req,
            limit=req.page_size,
            offset=offset,
        )

        # 5. Map dữ liệu sang response public.
        #    Không đưa configuration/credential ra ngoài để tránh lộ thông tin kết nối.
        items = [
            self._to_public_item(data_source, source_system_name)
            for data_source, source_system_name in rows
        ]

        # 6. Trả response 200 qua router với items + total + thông tin phân trang.
        return DataSourceResponse(
            items=items,
            total=total,
            page=req.page,
            page_size=req.page_size,
        )

    async def get_data_source_detail(
        self,
        data_source_id: int,
        current_user: dict[str, Any],
    ) -> DataSourceItem:
        """Lấy chi tiết một data source theo id, có phân quyền và response public."""

        # Dùng cùng rule đọc danh sách: DATA_ADMIN, ADMIN, ANALYST, VIEWER.
        self._ensure_can_read_data_sources(current_user)

        # Repository JOIN source_system để response có source_system_name.
        row = await self.datasource_repo.get_with_source_system(data_source_id)
        if row is None:
            raise AppException(
                "Không tìm thấy nguồn dữ liệu",
                code="DATA_SOURCE_NOT_FOUND",
                status_code=404,
                details={"data_source_id": data_source_id},
            )

        data_source, source_system_name = row
        return self._to_public_item(data_source, source_system_name)

    @staticmethod
    def _to_public_item(data_source: DataSource, source_system_name: str) -> DataSourceItem:
        """Map ORM DataSource sang payload public, không trả configuration/credential."""

        return DataSourceItem(
            data_source_id=data_source.data_source_id,
            source_system_id=data_source.source_system_id,
            source_system_name=source_system_name,
            source_name=data_source.source_name,
            source_type=data_source.source_type,
            connection_type=data_source.connection_type,
            location=data_source.location,
            description=data_source.description,
            is_active=data_source.is_active,
            last_ingested_at=data_source.last_ingested_at,
            last_ingestion_status=data_source.last_ingestion_status,
            ingestion_count=data_source.ingestion_count,
            created_by=data_source.created_by,
            created_at=data_source.created_at,
            updated_at=data_source.updated_at,
        )

    @staticmethod
    def _ensure_can_read_data_sources(current_user: dict[str, Any]) -> None:
        """Chỉ cho phép các role được đọc danh sách data source."""

        # Token payload chứa roles do AuthService đưa vào lúc login/refresh.
        roles: object = current_user.get("roles", ())
        role_set: set[str]
        if isinstance(roles, str):
            role_set = {roles}
        elif isinstance(roles, Collection):
            role_set = {role for role in roles if isinstance(role, str)}
        else:
            role_set = set()

        if role_set.isdisjoint(ALLOWED_DATA_SOURCE_ROLES):
            raise AppException(
                "Bạn không có quyền xem danh sách nguồn dữ liệu",
                code="FORBIDDEN",
                status_code=403,
                details={"allowed_roles": list(ALLOWED_DATA_SOURCE_ROLES_RESPONSE)},
            )

    @staticmethod
    def _ensure_can_write_data_sources(current_user: dict[str, Any]) -> None:
        """Chỉ cho phép các role được ghi data source."""

        roles: object = current_user.get("roles", ())
        role_set: set[str]
        if isinstance(roles, str):
            role_set = {roles}
        elif isinstance(roles, Collection):
            role_set = {role for role in roles if isinstance(role, str)}
        else:
            role_set = set()

        if role_set.isdisjoint(ALLOWED_DATA_SOURCE_ROLES):
            raise AppException(
                "Bạn không có quyền ghi data source",
                code="FORBIDDEN",
                status_code=403,
                details={"allowed_roles": list(ALLOWED_DATA_SOURCE_ROLES_RESPONSE)},
            )

    async def create_data_source(
        self,
        current_user: dict[str, Any],
        req: DataSourceCreate,
    ) -> DataSourceItem:
        self._ensure_can_write_data_sources(current_user)

        # Kiểm tra source_system_id có tồn tại và is_active = true.
        if not await self.datasource_repo.check_exist_source_system(req.source_system_id):
            raise AppException(
                "Source system không tồn tại hoặc đã bị vô hiệu hóa",
                code="SOURCE_SYSTEM_NOT_FOUND",
                status_code=404,
            )

        # Kiểm tra source_name không bị trùng trong cùng source_system.
        if await self.datasource_repo.check_source_name(req.source_name, req.source_system_id):
            raise AppException(
                "Source name đã tồn tại",
                code="SOURCE_NAME_EXIST",
                status_code=400,
            )

        # Kiểm tra source_type thuộc danh sách hỗ trợ.
        if req.source_type not in await self.datasource_repo.help_source_type():
            raise AppException(
                "Không tìm thấy loại nguồn dữ liệu",
                code="SOURCE_TYPE_NOT_FOUND",
                status_code=404,
            )

        # Kiểm tra configuration có đủ key bắt buộc và đúng kiểu theo source_type.
        configuration_errors = self.datasource_repo.validate_configuration(
            req.source_type,
            req.configuration,
        )
        if configuration_errors:
            raise AppException(
                "Configuration không hợp lệ",
                code="CONFIGURATION_INVALID",
                status_code=400,
                details={"errors": configuration_errors},
            )

        data_source = await self.datasource_repo.create_data_source(
            req,
            created_by=self._current_user_id(current_user),
        )
        row = await self.datasource_repo.get_with_source_system(data_source.data_source_id)
        if row is None:
            raise AppException(
                "Không tìm thấy nguồn dữ liệu vừa tạo",
                code="DATA_SOURCE_NOT_FOUND",
                status_code=404,
                details={"data_source_id": data_source.data_source_id},
            )

        created_data_source, source_system_name = row
        return self._to_public_item(created_data_source, source_system_name)

    @staticmethod
    def _current_user_id(current_user: dict[str, Any]) -> int | None:
        """Lấy app_user_id từ token payload nếu có."""

        subject = current_user.get("sub")
        if subject is None:
            return None
        try:
            return int(subject)
        except (TypeError, ValueError) as exc:
            raise AppException(
                "Phiên đăng nhập không hợp lệ",
                code="INVALID_TOKEN",
                status_code=401,
            ) from exc
