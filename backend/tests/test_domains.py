from __future__ import annotations

import ast
from dataclasses import replace
from pathlib import Path

import pytest

from app.domains.base import DataLayer
from app.domains.registry import DomainRegistry, DomainRegistryError, get_domain_registry
from app.modules.governance.service import GovernanceService
from app.modules.ingestion.service import InMemoryBronzeRepository, ingest_records
from app.modules.nlq.schema_retriever import retrieve_schema_context
from app.modules.pipeline.contracts import InMemoryLayerPublisher
from app.modules.pipeline.service import PipelineOrchestrator, PipelineQualityError


def test_demo_domain_runs_through_generic_pipeline() -> None:
    registry = get_domain_registry()
    bronze = InMemoryBronzeRepository()
    published = InMemoryLayerPublisher()
    governance = GovernanceService(registry)

    batch = ingest_records(
        "demo",
        "demo_csv",
        [
            {"id": "S-1", "full_name": "Ada", "active": True},
            {"id": "S-2", "full_name": "Linus", "active": False},
            {"id": "S-3", "full_name": "Grace", "active": True},
        ],
        bronze,
        registry=registry,
    )
    result = PipelineOrchestrator(
        published,
        event_sink=governance,
        registry=registry,
    ).run(batch)

    assert bronze.batches[batch.batch_id] == batch
    assert result.silver["demo_students"][0]["name"] == "Ada"
    assert result.gold["demo_student_summary"] == (
        {"status": "active", "student_count": 2},
        {"status": "inactive", "student_count": 1},
    )
    assert published.datasets[("demo", DataLayer.GOLD, "demo_student_summary")]
    assert governance.lineage(domain_id="demo")[0].run_id == result.run_id


def test_governance_and_nlq_consume_registered_metadata() -> None:
    registry = get_domain_registry()
    governance = GovernanceService(registry)
    catalog = governance.catalog(domain_id="demo")
    quality_rules = governance.quality_rules(domain_id="demo")
    context = retrieve_schema_context("aggregate", ["demo"], registry=registry)

    assert {entry.dataset for entry in catalog} == {
        "demo_students",
        "demo_student_summary",
    }
    assert quality_rules[0].rule_id == "demo_students_required_fields"
    assert quality_rules[0].dataset == "demo_students"
    assert "Metric student_count" in context
    assert "SUM(student_count)" in context


def test_pipeline_stops_before_publish_when_quality_fails() -> None:
    registry = get_domain_registry()
    bronze = InMemoryBronzeRepository()
    published = InMemoryLayerPublisher()
    batch = ingest_records(
        "demo",
        "demo_csv",
        [{"id": "S-1", "full_name": "", "active": True}],
        bronze,
        registry=registry,
    )

    with pytest.raises(PipelineQualityError, match="demo_students_required_fields"):
        PipelineOrchestrator(published, registry=registry).run(batch)

    assert published.datasets == {}


def test_registry_rejects_duplicate_domain_ids() -> None:
    definition = get_domain_registry().get("demo")
    registry = DomainRegistry()
    registry.register(definition)

    with pytest.raises(DomainRegistryError, match="Duplicate domain id"):
        registry.register(definition)


def test_registry_rejects_domain_without_required_layers() -> None:
    definition = get_domain_registry().get("demo")
    silver_only = replace(
        definition,
        datasets=tuple(
            dataset for dataset in definition.datasets if dataset.layer is DataLayer.SILVER
        ),
        semantic_model=replace(definition.semantic_model, metrics=()),
    )

    with pytest.raises(DomainRegistryError, match="at least one Gold dataset"):
        DomainRegistry().register(silver_only)


def test_generic_modules_do_not_import_concrete_domains() -> None:
    app_root = Path(__file__).parents[1] / "app"
    generic_files = (
        app_root / "modules" / "ingestion" / "service.py",
        app_root / "modules" / "pipeline" / "contracts.py",
        app_root / "modules" / "pipeline" / "service.py",
        app_root / "modules" / "governance" / "service.py",
        app_root / "modules" / "nlq" / "schema_retriever.py",
    )

    for path in generic_files:
        tree = ast.parse(path.read_text(encoding="utf-8"))
        imported_modules: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.ImportFrom) and node.module is not None:
                imported_modules.add(node.module)
            elif isinstance(node, ast.Import):
                imported_modules.update(alias.name for alias in node.names)
        allowed_domain_modules = {"app.domains.base", "app.domains.registry"}
        concrete_imports = {
            module
            for module in imported_modules
            if module.startswith("app.domains.") and module not in allowed_domain_modules
        }
        assert concrete_imports == set()
