"""Verify the delivered manual-demo files through actual readers and publication."""

from __future__ import annotations

import importlib.util
import os
from pathlib import Path

import pytest
from sqlalchemy import create_engine

from app.infra.db.base import Base
from app.modules.pipeline.identity_contracts import CrosswalkEntry, CrosswalkSnapshot
from app.modules.pipeline.silver_repository import SILVER_TABLES, SilverRepository
from app.modules.pipeline.silver_storage import LocalSilverStore, SilverError

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location(
    "live_demo", ROOT / "scripts/standardization/live_demo.py"
)
demo = importlib.util.module_from_spec(spec)
cwd = Path.cwd()
try:
    spec.loader.exec_module(demo)
finally:
    os.chdir(cwd)


@pytest.mark.parametrize("extension", ["csv", "xlsx"])
def test_delivered_files_publish_reject_retry_and_update(tmp_path, extension):
    entries = tuple(
        CrosswalkEntry(
            "DEMO_live_" + c["domain"],
            c["entity"],
            (c["records"][0]["id"],),
            100 + i,
            "synthetic",
            demo.WHEN,
        )
        for i, c in enumerate(demo.profiles())
    )
    snapshot = CrosswalkSnapshot(demo.RELEASE, entries)
    engine = create_engine("sqlite://", execution_options={"schema_translate_map": {"app": None}})
    Base.metadata.create_all(engine, tables=SILVER_TABLES)
    publisher = demo.SilverPublicationService(
        repository=SilverRepository(engine),
        storage=LocalSilverStore(tmp_path),
        contracts={
            d: demo.read_json(f"docs/standardization/silver-schemas/{d}.json") for d in demo.DOMAINS
        },
        scope="demo-file-verification",
        mode="rehearsal",
    )
    cases = [
        ("01-admissions", "admissions", None),
        ("02-academic", "academic", None),
        ("03-hr", "hr", None),
        ("04-bad-date", "academic", "DATE_PARSE_ERROR"),
        ("05-unknown-id", "hr", "SOURCE_ID_UNMAPPED"),
        ("06-hr-updated", "hr", None),
    ]
    for name, domain, error in cases:
        result = demo.normalize(
            domain, str(ROOT / f"data/standardization/live-demo/{name}.{extension}"), snapshot
        )
        before = publisher.repository.head(publisher.scope)
        if error:
            assert error in [i.code for i in (*result.type_issues, *result.issues)]
            with pytest.raises(SilverError):
                publisher.publish((result,), base_snapshot=before)
            assert publisher.repository.head(publisher.scope) == before
        else:
            assert len(result.accepted) == 1
            receipt = publisher.publish((result,), base_snapshot=before)
            tables = publisher.read_snapshot(receipt.snapshot_id)
            assert len(tables[result.key.entity]) == 1
            retry = publisher.publish((result,), base_snapshot=before)
            assert retry.reused
            assert retry.snapshot_id == receipt.snapshot_id
    assert set(tables) == {"admission_method", "semester", "position"}
    assert tables["position"][0]["position_name"] == "Giảng viên giả lập cập nhật"
    engine.dispose()
