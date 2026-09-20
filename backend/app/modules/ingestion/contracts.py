"""Public hand-off contracts owned by the ingestion module."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Protocol

if TYPE_CHECKING:
    from collections.abc import Mapping

    from app.domains.base import Record


@dataclass(frozen=True)
class BronzeBatch:
    """Immutable hand-off from ingestion to downstream consumers."""

    batch_id: str
    domain_id: str
    source_type: str
    records: tuple[Record, ...]
    metadata: Mapping[str, str] = field(default_factory=dict)


class BronzeRepository(Protocol):
    """Port for persisting raw batches in the Bronze layer."""

    def write(self, batch: BronzeBatch) -> None:
        """Persist a raw batch without applying domain transformations."""
