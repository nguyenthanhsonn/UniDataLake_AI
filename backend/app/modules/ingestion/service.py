"""Generic Source-to-Bronze ingestion boundary."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Protocol
from uuid import uuid4

from app.domains.registry import get_domain_registry

if TYPE_CHECKING:
    from collections.abc import Mapping, Sequence

    from app.domains.base import Record
    from app.domains.registry import DomainRegistry


@dataclass(frozen=True)
class BronzeBatch:
    """Immutable hand-off from generic ingestion to the pipeline."""

    batch_id: str
    domain_id: str
    source_type: str
    records: tuple[Record, ...]
    metadata: Mapping[str, str] = field(default_factory=dict)


class BronzeRepository(Protocol):
    """Storage port implemented by the Bronze infrastructure adapter."""

    def write(self, batch: BronzeBatch) -> None:
        """Persist a raw batch without applying domain transformations."""


class InMemoryBronzeRepository:
    """Deterministic repository for tests and local proof-of-concept runs."""

    def __init__(self) -> None:
        self.batches: dict[str, BronzeBatch] = {}

    def write(self, batch: BronzeBatch) -> None:
        self.batches[batch.batch_id] = batch


def ingest_records(
    domain_id: str,
    source_type: str,
    records: Sequence[Record],
    repository: BronzeRepository,
    *,
    metadata: Mapping[str, str] | None = None,
    registry: DomainRegistry | None = None,
) -> BronzeBatch:
    """Validate routing metadata and persist raw records to Bronze."""
    active_registry = registry or get_domain_registry()
    domain = active_registry.get(domain_id)
    domain.mapping_for(source_type)

    batch = BronzeBatch(
        batch_id=str(uuid4()),
        domain_id=domain_id,
        source_type=source_type,
        records=tuple(dict(record) for record in records),
        metadata=dict(metadata or {}),
    )
    repository.write(batch)
    return batch
