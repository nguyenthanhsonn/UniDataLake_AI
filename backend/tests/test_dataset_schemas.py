"""Generic checks for every dataset schema: DBML match, sample CSVs, keys, FKs and DDL."""

from __future__ import annotations

import csv
import re
from collections import Counter
from decimal import InvalidOperation

import pytest

from tests.dataset_utils import (
    DATASETS,
    SAMPLES_DIR,
    SCHEMA_DIR,
    entities,
    load_schema,
    parse,
    rows,
)

ENTITY_CASES = [(d, e) for d in DATASETS for e in load_schema(d)["entities"]]
ENTITY_IDS = [f"{d}.{e}" for d, e in ENTITY_CASES]


def test_datasets_found() -> None:
    assert {"admissions", "academic", "hr"} <= set(DATASETS)


@pytest.mark.parametrize("dataset", DATASETS)
def test_schema_matches_source_dbml(dataset: str) -> None:
    dbml = (SCHEMA_DIR / "unilake-db.dbml").read_text(encoding="utf-8")
    for name, spec in entities(dataset).items():
        match = re.search(rf"^Table {name} \{{\n(.*?)^\}}", dbml, re.M | re.S)
        assert match, f"table {name} missing in DBML"
        dbml_cols = re.findall(r"^  (\w+) (\w+(?:\(\d+(?:,\d+)?\))?)", match.group(1), re.M)
        assert [(c["name"], c["type"]) for c in spec["columns"]] == dbml_cols, name
        not_null = set(re.findall(r"^  (\w+) .*(?:not null|pk)", match.group(1), re.M))
        pk_index = re.search(r"\(([\w, ]+)\) \[pk\]", match.group(1))
        if pk_index:
            not_null |= {c.strip() for c in pk_index.group(1).split(",")}
        declared = {c["name"] for c in spec["columns"] if not c["nullable"]}
        assert declared == not_null, f"{name} nullability differs from DBML"


@pytest.mark.parametrize("dataset", DATASETS)
def test_load_order_covers_all_entities_and_respects_fks(dataset: str) -> None:
    order = load_schema(dataset)["load_order"]
    specs = entities(dataset)
    assert sorted(order) == sorted(specs)
    for name, spec in specs.items():
        for col in spec["columns"]:
            ref = col.get("references")
            if ref and ref["entity"] != name:
                assert ref["entity"] in specs, f"{dataset}: {name}.{col['name']} refs unknown"
                assert order.index(ref["entity"]) < order.index(name), f"{name}.{col['name']}"


@pytest.mark.parametrize(("dataset", "entity"), ENTITY_CASES, ids=ENTITY_IDS)
def test_header_matches_schema(dataset: str, entity: str) -> None:
    spec = entities(dataset)[entity]
    with (SAMPLES_DIR / spec["file"]).open(encoding="utf-8", newline="") as f:
        header = next(csv.reader(f))
    assert header == [c["name"] for c in spec["columns"]]


@pytest.mark.parametrize(("dataset", "entity"), ENTITY_CASES, ids=ENTITY_IDS)
def test_columns_types_nullability_and_constraints(dataset: str, entity: str) -> None:
    data = rows(dataset, entity)
    assert data, f"{entity} sample is empty"
    for col in entities(dataset)[entity]["columns"]:
        name = col["name"]
        for i, row in enumerate(data, start=2):
            raw = row[name]
            where = f"{entity} line {i} column {name}"
            if raw == "":
                assert col["nullable"], f"{where}: required"
                continue
            try:
                value = parse(raw, col["type"])
            except (ValueError, InvalidOperation) as exc:
                pytest.fail(f"{where}: {exc}")
            if "enum" in col:
                assert raw in col["enum"], f"{where}: {raw!r} not in enum"
            if "pattern" in col:
                assert re.fullmatch(col["pattern"], raw), f"{where}: {raw!r} !~ {col['pattern']}"
            if "min" in col:
                assert value >= col["min"], f"{where}: below min"
            if "max" in col:
                assert value <= col["max"], f"{where}: above max"


@pytest.mark.parametrize(("dataset", "entity"), ENTITY_CASES, ids=ENTITY_IDS)
def test_primary_and_unique_keys(dataset: str, entity: str) -> None:
    spec = entities(dataset)[entity]
    keys = [spec["primary_key"], *spec.get("unique_together", [])]
    keys += [[c["name"]] for c in spec["columns"] if c.get("unique")]
    for key in keys:
        values = [tuple(r[k] for k in key) for r in rows(dataset, entity) if all(r[k] for k in key)]
        dupes = [v for v, n in Counter(values).items() if n > 1]
        assert not dupes, f"{entity} duplicate {key}: {dupes[:5]}"


@pytest.mark.parametrize(("dataset", "entity"), ENTITY_CASES, ids=ENTITY_IDS)
def test_foreign_keys_resolve(dataset: str, entity: str) -> None:
    for col in entities(dataset)[entity]["columns"]:
        if not (ref := col.get("references")):
            continue
        targets = {r[ref["column"]] for r in rows(dataset, ref["entity"])}
        missing = {r[col["name"]] for r in rows(dataset, entity) if r[col["name"]]} - targets
        assert not missing, f"{entity}.{col['name']} -> {ref['entity']}: {sorted(missing)[:5]}"


@pytest.mark.parametrize("dataset", DATASETS)
def test_ddl_declares_every_owned_column(dataset: str) -> None:
    ddl = (SCHEMA_DIR / f"{dataset}_v1.sql").read_text(encoding="utf-8")
    for name, spec in entities(dataset).items():
        if not spec["owned_by_dataset"]:
            continue
        match = re.search(rf"CREATE TABLE IF NOT EXISTS {name} \((.*?)\n\);", ddl, re.S)
        assert match, f"missing DDL for {name}"
        declared = re.findall(r"^\s{4}([a-z_]+)\s", match.group(1), re.M)
        assert declared == [c["name"] for c in spec["columns"]], name
