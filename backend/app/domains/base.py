"""Stable contracts implemented by every UniLake business domain."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum
from typing import TYPE_CHECKING, Protocol, TypeAlias

if TYPE_CHECKING:
    from collections.abc import Mapping, Sequence

Record: TypeAlias = dict[str, object]


class DataLayer(StrEnum):
    """Logical data-lake layers exposed to domain implementations."""

    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"


@dataclass(frozen=True)
class FieldDefinition:
    """Portable field metadata used by catalog and NLQ consumers."""

    name: str
    data_type: str
    nullable: bool = True
    description: str = ""


@dataclass(frozen=True)
class DatasetDefinition:
    """A logical dataset owned by a domain."""

    name: str
    layer: DataLayer
    fields: tuple[FieldDefinition, ...]
    description: str = ""
    primary_key: tuple[str, ...] = ()
    synonyms: tuple[str, ...] = ()


@dataclass(frozen=True)
class SourceMapping:
    """Versioned mapping from one source shape to a Silver dataset."""

    source_type: str
    target_dataset: str
    version: str
    field_map: Mapping[str, str]


@dataclass(frozen=True)
class MetricDefinition:
    """Business metric exposed to analytical and NLQ consumers."""

    name: str
    dataset: str
    expression: str
    description: str = ""
    synonyms: tuple[str, ...] = ()


@dataclass(frozen=True)
class SemanticModel:
    """NLQ-facing metadata for a domain's published Gold layer."""

    metrics: tuple[MetricDefinition, ...] = ()


@dataclass(frozen=True)
class QualityResult:
    """Outcome of evaluating one domain quality rule."""

    rule_id: str
    passed: bool
    message: str
    failed_count: int = 0


class QualityRule(Protocol):
    """A quality rule bound to one declared domain dataset."""

    @property
    def rule_id(self) -> str:
        """Stable rule identifier."""

    @property
    def dataset(self) -> str:
        """Dataset evaluated by this rule."""

    @property
    def description(self) -> str:
        """Human-readable rule intent."""

    def evaluate(self, records: Sequence[Record]) -> QualityResult:
        """Evaluate records and return a serializable result."""


class DomainTransformer(Protocol):
    """Domain-owned transformations called by the generic pipeline."""

    def to_silver(
        self,
        records: Sequence[Record],
        mapping: SourceMapping,
    ) -> list[Record]:
        """Normalize Bronze records into the mapping's Silver dataset."""

    def to_gold(self, records: Sequence[Record]) -> dict[str, list[Record]]:
        """Build declared Gold datasets from validated Silver records."""


@dataclass(frozen=True)
class DomainDefinition:
    """Manifest joining the independently consumable domain contracts."""

    domain_id: str
    display_name: str
    version: str
    schema_version: str
    datasets: tuple[DatasetDefinition, ...]
    mappings: tuple[SourceMapping, ...]
    transformer: DomainTransformer
    quality_rules: tuple[QualityRule, ...] = ()
    semantic_model: SemanticModel = field(default_factory=SemanticModel)

    def mapping_for(self, source_type: str) -> SourceMapping:
        """Return the mapping for a source type or raise a precise error."""
        matches = [mapping for mapping in self.mappings if mapping.source_type == source_type]
        if len(matches) != 1:
            raise LookupError(
                f"Domain '{self.domain_id}' has no unique mapping for source '{source_type}'"
            )
        return matches[0]

    def datasets_for(self, layer: DataLayer) -> tuple[DatasetDefinition, ...]:
        """Return datasets declared for a logical layer."""
        return tuple(dataset for dataset in self.datasets if dataset.layer is layer)
