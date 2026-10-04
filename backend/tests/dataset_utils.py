"""Load the source DB design, dataset schemas (docs/data-schema/<name>_v1.schema.json) and sample CSVs."""

from __future__ import annotations

import csv
import json
import re
from datetime import date
from decimal import Decimal
from functools import cache
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SCHEMA_DIR = REPO_ROOT / "docs" / "data-schema"
SAMPLES_DIR = REPO_ROOT / "data" / "samples"
DATASETS = sorted(
    p.name.removesuffix("_v1.schema.json") for p in SCHEMA_DIR.glob("*_v1.schema.json")
)


SOURCE_DB = SCHEMA_DIR / "unilake-db-architecture.txt"


@cache
def source_db() -> dict[str, list[dict]]:
    """Parse the team's DB design (Eraser syntax) into {table: [column, ...]}.

    Each column is {"name", "db_type", "nullable", "pk", "unique", "references"}; a column
    without the ``nullable`` flag is NOT NULL, and ``references`` comes from the relation lines.
    """
    text = SOURCE_DB.read_text(encoding="utf-8")
    refs = {
        src: tuple(dst.split("."))
        for src, dst in re.findall(r"^(\w+\.\w+) [<>-] (\w+\.\w+)$", text, re.M)
    }
    tables: dict[str, list[dict]] = {}
    for match in re.finditer(r"^(\w+) \[[^\]]*\] \{\n(.*?)^\}", text, re.M | re.S):
        table, body = match.groups()
        columns = []
        for line in body.strip().splitlines():
            name, db_type, *flags = line.split()
            columns.append(
                {
                    "name": name,
                    "db_type": db_type,
                    "nullable": "nullable" in flags,
                    "pk": "pk" in flags,
                    "unique": "unique" in flags,
                    "references": refs.get(f"{table}.{name}"),
                }
            )
        tables[table] = columns
    return tables


@cache
def load_schema(dataset: str) -> dict:
    return json.loads((SCHEMA_DIR / f"{dataset}_v1.schema.json").read_text(encoding="utf-8"))


def entity_spec(dataset: str, entity: str) -> dict:
    """Entity spec, following {"from_dataset": ...} to the dataset that defines it."""
    spec = load_schema(dataset)["entities"][entity]
    if "from_dataset" in spec:
        return {**entity_spec(spec["from_dataset"], entity), "owned_by_dataset": False}
    return spec


def entities(dataset: str) -> dict[str, dict]:
    return {name: entity_spec(dataset, name) for name in load_schema(dataset)["entities"]}


@cache
def _read_csv(rel: str) -> tuple[dict[str, str], ...]:
    with (SAMPLES_DIR / rel).open(encoding="utf-8", newline="") as f:
        return tuple(csv.DictReader(f))


def rows(dataset: str, entity: str) -> tuple[dict[str, str], ...]:
    return _read_csv(entity_spec(dataset, entity)["file"])


def index(dataset: str, entity: str) -> dict[str, dict[str, str]]:
    (pk,) = entity_spec(dataset, entity)["primary_key"]
    return {r[pk]: r for r in rows(dataset, entity)}


def parse(value: str, sql_type: str) -> object:
    """Parse a CSV cell by its DBML type; raise ValueError when it does not fit."""
    base, _, args = sql_type.partition("(")
    args = args.rstrip(")")
    if base in {"int", "bigint"}:
        return int(value)
    if base == "decimal":
        precision, scale = (int(x) for x in args.split(","))
        number = Decimal(value)
        exponent = number.as_tuple().exponent
        if not isinstance(exponent, int) or -exponent > scale:
            raise ValueError(f"{value} does not fit {sql_type}")
        if len(number.as_tuple().digits) > precision:
            raise ValueError(f"{value} does not fit {sql_type}")
        return number
    if base == "date":
        return date.fromisoformat(value)
    if base == "boolean":
        if value not in {"true", "false"}:
            raise ValueError(value)
        return value == "true"
    if base == "varchar":
        if len(value) > int(args):
            raise ValueError(f"{value!r} longer than {sql_type}")
        return value
    if base == "text":
        return value
    raise AssertionError(f"unsupported type {sql_type}")
