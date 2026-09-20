"""DuckDB-backed Gold query adapter scaffolding."""

from __future__ import annotations


class EmptyGoldQueryExecutor:
    """Deterministic placeholder until the Gold query adapter is implemented."""

    async def execute(self, sql: str) -> list[dict[str, object]]:
        """Return an empty result while preserving the read-port contract."""
        _ = sql
        return []
