"""Public application contracts owned by the NLQ module."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


class LLMPort(Protocol):
    """Completion capability required by the NLQ application service."""

    async def complete(self, prompt: str) -> str:
        """Return a completion for the supplied prompt."""


class GoldQueryPort(Protocol):
    """Read-only analytical query capability required by NLQ."""

    async def execute(self, sql: str) -> list[dict[str, object]]:
        """Execute validated read-only SQL against published Gold data."""


@dataclass(frozen=True)
class NLQResult:
    """Transport-neutral result returned by the NLQ use case."""

    sql: str
    rows: tuple[dict[str, object], ...]
