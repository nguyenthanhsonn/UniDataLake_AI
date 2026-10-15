"""Public hand-off contracts owned by the ingestion module."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Protocol

if TYPE_CHECKING:
    from collections.abc import Mapping

    from app.domains.base import Record


@dataclass(frozen=True)
class FileProvenance:
    """Evidence for one parsed file snapshot; not a durable Bronze receipt."""

    source_system_id: str
    data_source_id: str
    dataset_id: str
    source_type: str
    source_ref: str
    object_version_id: str | None
    content_sha256: str
    parser_fingerprint: str
    columns_fingerprint: str
    captured_at: str
    locator_kind: str
    workbook_epoch: str | None = None

    @property
    def input_version(self) -> str:
        return "sha256:" + self.content_sha256


@dataclass(frozen=True)
class MappingBinding:
    """Pinned source/entity/profile identity for structural normalization."""

    source_system_id: str
    entity: str
    source_schema_version: str
    mapping_id: str
    mapping_version: str
    target_schema_version: str


@dataclass(frozen=True)
class BronzeBatch:
    """Immutable hand-off from ingestion to downstream consumers."""

    batch_id: str
    domain_id: str
    source_type: str
    records: tuple[Record, ...]
    metadata: Mapping[str, str] = field(default_factory=dict)
    mapping_binding: MappingBinding | None = None
    record_locators: tuple[str, ...] = ()
    source_paths: tuple[str, ...] = ()
    provenance: FileProvenance | None = None


class BronzeRepository(Protocol):
    """Port for persisting raw batches in the Bronze layer."""

    def write(self, batch: BronzeBatch) -> None:
        """Persist a raw batch without applying domain transformations."""
