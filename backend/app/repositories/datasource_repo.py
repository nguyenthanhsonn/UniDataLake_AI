from __future__ import annotations

from typing import TYPE_CHECKING, Any, cast

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.elements import ColumnElement

from app.modules.datasources.models import DataSource, SourceSystem
from app.repositories.base_repo import BaseRepository

if TYPE_CHECKING:
    from app.modules.datasources.schemas import DataSourceCreate, DataSourceFilter


REQUIRED_CONFIG: dict[str, dict[str, type[Any]]] = {
    "CSV": {
        "delimiter": str,
        "encoding": str,
        "has_header": bool,
    },
    "JSON": {
        "encoding": str,
    },
}


class DataSourceRepository(BaseRepository[DataSource]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(DataSource, db)

    async def get_with_source_system(self, data_source_id: int) -> tuple[DataSource, str] | None:
        """Lấy một data source theo id, kèm tên source system từ bảng join."""

        query = (
            select(DataSource, SourceSystem.source_name.label("source_system_name"))
            .join(SourceSystem, SourceSystem.source_system_id == DataSource.source_system_id)
            .where(DataSource.data_source_id == data_source_id)
        )
        result = await self.db.execute(query)
        row = result.tuples().one_or_none()
        if row is None:
            return None
        return row

    async def create_data_source(
        self,
        req: DataSourceCreate,
        *,
        created_by: int | None,
    ) -> DataSource:
        """Tạo data source mới và flush để lấy generated primary key."""

        data_source = DataSource(
            source_system_id=req.source_system_id,
            source_name=req.source_name,
            source_type=req.source_type,
            connection_type=req.connection_type,
            location=req.location,
            configuration=req.configuration,
            description=req.description,
            is_active=req.is_active,
            created_by=created_by,
        )
        self.db.add(data_source)
        await self.db.flush()
        return data_source

    # Hàm lấy danh sách data source có filter và pagination.
    async def list_with_source_system(
        self,
        filters: DataSourceFilter,
        *,
        limit: int,
        offset: int,
    ) -> tuple[list[tuple[DataSource, str]], int]:
        # Chỉ thêm điều kiện cho filter thật sự được truyền từ query params.
        conditions: list[ColumnElement[bool]] = []
        if filters.source_system_id is not None:
            conditions.append(DataSource.source_system_id == filters.source_system_id)
        if filters.source_type is not None:
            conditions.append(DataSource.source_type == filters.source_type)
        if filters.is_active is not None:
            conditions.append(DataSource.is_active == filters.is_active)

        # SELECT data_source và JOIN source_system để lấy source_system_name cho response.
        base_query = (
            select(DataSource, SourceSystem.source_name.label("source_system_name"))
            .join(SourceSystem, SourceSystem.source_system_id == DataSource.source_system_id)
            .where(*conditions)
        )

        # Count dùng cùng JOIN/filter nhưng không limit/offset,
        # để client biết tổng số bản ghi theo bộ lọc hiện tại.
        count_query = (
            select(func.count())
            .select_from(DataSource)
            .join(SourceSystem, SourceSystem.source_system_id == DataSource.source_system_id)
            .where(*conditions)
        )

        total_result = await self.db.execute(count_query)
        total = int(total_result.scalar_one())

        # Query dữ liệu trang hiện tại. Service sẽ map thủ công các field public,
        # không trả configuration/credential ra response.
        rows_result = await self.db.execute(
            self._apply_pagination(base_query, limit=limit, offset=offset)
        )
        rows = cast("list[tuple[DataSource, str]]", rows_result.tuples().all())
        return rows, total

    @staticmethod
    def _apply_pagination(
        query: Any,
        *,
        limit: int,
        offset: int,
    ) -> Any:
        # Sắp xếp ổn định trước khi phân trang để dữ liệu không bị nhảy giữa các page.
        return (
            query.order_by(DataSource.created_at.desc(), DataSource.data_source_id.desc())
            .limit(limit)
            .offset(offset)
        )

    async def check_exist_source_system(self, source_system_id: int) -> bool:
        """Kiểm tra source system tồn tại và còn active."""

        query = (
            select(func.count())
            .select_from(SourceSystem)
            .where(SourceSystem.source_system_id == source_system_id)
            .where(SourceSystem.is_active.is_(True))
        )
        result = await self.db.execute(query)
        return result.scalar_one() > 0

    async def check_source_name(self, source_name: str, source_system_id: int) -> bool:
        """Kiểm tra trùng source_name trong cùng source_system."""

        if not source_name or not source_system_id:
            return False

        query = (
            select(func.count())
            .select_from(DataSource)
            .where(DataSource.source_name == source_name)
            .where(DataSource.source_system_id == source_system_id)
        )
        result = await self.db.execute(query)
        return result.scalar_one() > 0

    async def help_source_type(self) -> list[str]:
        """Danh sách source_type đang được hỗ trợ validate configuration."""

        return sorted(REQUIRED_CONFIG)

    def validate_configuration(
        self,
        source_type: str,
        configuration: dict[str, Any],
    ) -> list[str]:
        """Validate required configuration keys and types for a source type."""

        if source_type not in REQUIRED_CONFIG:
            return [f"Unsupported source type: {source_type}"]

        required_fields = REQUIRED_CONFIG[source_type]
        errors: list[str] = []

        for key, expected_type in required_fields.items():
            if key not in configuration:
                errors.append(f"Missing required configuration: {key}")
                continue

            if not isinstance(configuration[key], expected_type):
                expected_name = expected_type.__name__
                actual_name = type(configuration[key]).__name__
                errors.append(
                    f"Invalid type for configuration '{key}': expected {expected_name}, got {actual_name}"
                )

        return errors
