"""DuckDB connection settings."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class DuckDBConnectionSettings:
    """Connection options for Gold layer analytical queries."""

    database: str = ":memory:"
    read_only: bool = True
