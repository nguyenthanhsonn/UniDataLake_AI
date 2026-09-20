"""DuckDB infrastructure for read-only Gold layer queries."""

from __future__ import annotations

from app.infra.duckdb.connection import DuckDBConnectionSettings
from app.infra.duckdb.query import EmptyGoldQueryExecutor

__all__ = ["DuckDBConnectionSettings", "EmptyGoldQueryExecutor"]
