"""Generic catalog and runtime governance services."""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

from app.domains.registry import get_domain_registry

if TYPE_CHECKING:
    from app.domains.base import DataLayer, FieldDefinition
    from app.domains.registry import DomainRegistry
    from app.modules.pipeline.contracts import PipelineEvent


@dataclass(frozen=True)
class CatalogEntry:
    """Catalog projection built from a registered domain dataset."""

    domain_id: str
    dataset: str
    layer: DataLayer
    schema_version: str
    description: str
    fields: tuple[FieldDefinition, ...]


@dataclass(frozen=True)
class QualityRuleEntry:
    """Discoverable quality-rule metadata projected from a domain."""

    domain_id: str
    rule_id: str
    dataset: str
    description: str


class GovernanceService:
    """Consumes domain metadata and pipeline evidence without domain branches."""

    def __init__(self, registry: DomainRegistry | None = None) -> None:
        self._registry = registry or get_domain_registry()
        self._events: list[PipelineEvent] = []

    def catalog(self, *, domain_id: str | None = None) -> tuple[CatalogEntry, ...]:
        """Project registered schemas into generic catalog entries."""
        definitions = (
            (self._registry.get(domain_id),) if domain_id is not None else self._registry.all()
        )
        return tuple(
            CatalogEntry(
                domain_id=definition.domain_id,
                dataset=dataset.name,
                layer=dataset.layer,
                schema_version=definition.schema_version,
                description=dataset.description,
                fields=dataset.fields,
            )
            for definition in definitions
            for dataset in definition.datasets
        )

    def publish(self, event: PipelineEvent) -> None:
        """Store runtime lineage and quality evidence emitted by the pipeline."""
        self._registry.get(event.domain_id)
        self._events.append(event)

    def quality_rules(self, *, domain_id: str | None = None) -> tuple[QualityRuleEntry, ...]:
        """Return static quality-rule metadata from registered domains."""
        definitions = (
            (self._registry.get(domain_id),) if domain_id is not None else self._registry.all()
        )
        return tuple(
            QualityRuleEntry(
                domain_id=definition.domain_id,
                rule_id=rule.rule_id,
                dataset=rule.dataset,
                description=rule.description,
            )
            for definition in definitions
            for rule in definition.quality_rules
        )

    def lineage(self, *, domain_id: str | None = None) -> tuple[PipelineEvent, ...]:
        """Return captured runtime lineage events."""
        return tuple(
            event for event in self._events if domain_id is None or event.domain_id == domain_id
        )
