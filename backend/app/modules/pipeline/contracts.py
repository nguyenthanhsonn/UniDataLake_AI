"""Generic pipeline results and outbound ports."""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Protocol

if TYPE_CHECKING:
    from collections.abc import Mapping, Sequence

    from app.domains.base import DataLayer, QualityResult, Record


@dataclass(frozen=True)
class PipelineEvent:
    """Runtime lineage and quality evidence emitted by a pipeline run."""

    run_id: str
    domain_id: str
    source: str
    targets: tuple[str, ...]
    quality_results: tuple[QualityResult, ...]


@dataclass(frozen=True)
class PipelineRunResult:
    """Published output of one Bronze-to-Silver-to-Gold run."""

    run_id: str
    domain_id: str
    silver: Mapping[str, tuple[Record, ...]]
    gold: Mapping[str, tuple[Record, ...]]
    quality_results: tuple[QualityResult, ...]


class LayerPublisher(Protocol):
    """Storage port used by the pipeline to publish validated datasets."""

    def publish(
        self,
        domain_id: str,
        layer: DataLayer,
        datasets: Mapping[str, Sequence[Record]],
    ) -> None:
        """Atomically publish datasets for a logical layer."""


class PipelineEventSink(Protocol):
    """Governance port receiving runtime pipeline evidence."""

    def publish(self, event: PipelineEvent) -> None:
        """Record one successful pipeline event."""


class InMemoryLayerPublisher:
    """Reference publisher used by tests and local proof-of-concept runs."""

    def __init__(self) -> None:
        self.datasets: dict[tuple[str, DataLayer, str], tuple[Record, ...]] = {}

    def publish(
        self,
        domain_id: str,
        layer: DataLayer,
        datasets: Mapping[str, Sequence[Record]],
    ) -> None:
        for name, records in datasets.items():
            self.datasets[(domain_id, layer, name)] = tuple(dict(record) for record in records)
