"""Manual Bronze -> Silver rehearsal using real MinIO and PostgreSQL metadata.

Explicit synthetic source profiles replace the catalog/API for this demo only.
Never creates buckets/tables or enables production; apply migrations separately.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import asdict
from datetime import datetime
from pathlib import Path
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))
# Settings use relative .env paths, including the reader's MinIO client.
os.chdir(ROOT / "backend")

from app.core.config import settings
from app.modules.ingestion.contracts import MappingBinding
from app.modules.ingestion.reader_batch import reader_to_batch
from app.modules.ingestion.readers.contract import ReadRequest
from app.modules.ingestion.readers.factory import SourceReaderFactory
from app.modules.ingestion.readers.file_snapshot import read_file_snapshot
from app.modules.pipeline.identity_repository import RELEASES, CrosswalkRepository
from app.modules.pipeline.identity_standardization import (
    IdentityStandardizationService,
    ValueDictionary,
)
from app.modules.pipeline.mapping_profiles import build_profile
from app.modules.pipeline.schema_mapping import (
    MappingKey,
    MappingRegistry,
    SchemaMappingService,
)
from app.modules.pipeline.silver_publication import SilverPublicationService
from app.modules.pipeline.silver_repository import SilverRepository
from app.modules.pipeline.silver_storage import MinioSilverStore, SilverError
from app.modules.pipeline.type_standardization import (
    FieldOptions,
    TypeStandardizationService,
)
from minio import Minio
from sqlalchemy import URL, create_engine, inspect, select

DOMAINS = ("admissions", "academic", "hr")
RELEASE = "manual-live-demo-crosswalk-v1"
WHEN = datetime.fromisoformat("2026-01-01T00:00:00+00:00")


def read_json(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def profiles():
    return [
        c
        for c in read_json("data/standardization/s2/examples.json")
        if c["id"].endswith("-flat")
    ]


def normalize(domain, location, snapshot, *, version=None):
    case = next(c for c in profiles() if c["domain"] == domain)
    contract = read_json(f"docs/standardization/silver-schemas/{domain}.json")
    source_type = "EXCEL" if location.lower().endswith(".xlsx") else "CSV"
    key = MappingKey(
        f"DEMO_live_{domain}",
        domain,
        case["entity"],
        "1",
        f"manual-{domain}-{source_type.lower()}",
        "1",
        contract["x-version"],
    )
    config = (
        {"sheet_name": "Data", "header_row": 1, "skip_rows": 0}
        if source_type == "EXCEL"
        else {"delimiter": ",", "encoding": "utf-8", "has_header": True}
    )
    request = ReadRequest(source_type, location, config, Path(location).name, version)
    raw = read_file_snapshot(
        request,
        SourceReaderFactory.get_reader(source_type),
        source_system_id=key.source_system_id,
        data_source_id=f"manual-{domain}",
        dataset_id=case["entity"],
    )
    binding = MappingBinding(
        key.source_system_id,
        key.entity,
        key.source_schema_version,
        key.mapping_id,
        key.mapping_version,
        key.target_schema_version,
    )
    batch = reader_to_batch(
        raw,
        batch_id=str(uuid4()),
        domain_id=domain,
        source_type=source_type,
        binding=binding,
    )
    fields = tuple(contract["$defs"][key.entity]["properties"])
    profile = build_profile(
        key=key,
        source_type=source_type,
        target_fields=fields,
        source_columns=tuple(case["source_paths"]),
        field_paths={k: tuple(v) for k, v in case["field_paths"].items()},
        ignored_sources=tuple(case["ignored_sources"]),
        deferred_fields=tuple(n for n in fields if n not in case["field_paths"]),
    )
    mapped = SchemaMappingService(MappingRegistry((profile,))).map_batch(batch)
    options = {}
    if domain == "admissions":
        options = {
            "max_score": FieldOptions(decimal_separator=","),
            "is_active": FieldOptions(true_tokens=("Có",), false_tokens=("Không",)),
        }
    if domain == "academic":
        options = {
            f: FieldOptions(date_format="%d/%m/%Y") for f in ("start_date", "end_date")
        }
    types = TypeStandardizationService(
        key=key, conversion_version="manual-types-1", contract=contract, options=options
    )
    aliases = read_json("data/standardization/s4/preview-profiles.json")["profiles"][
        key.entity
    ]["dictionaries"]
    identity = IdentityStandardizationService(
        types=types,
        version="manual-identity-1",
        crosswalk=snapshot,
        dictionaries={
            f: ValueDictionary("manual-dict-1", tuple(a.items()))
            for f, a in aliases.items()
        },
        reference_namespaces={},
        effective_at=WHEN,
    )
    return identity.standardize(types.standardize(mapped))


def initialize_crosswalk(engine):
    with engine.begin() as conn:
        repo = CrosswalkRepository(conn)
        if conn.execute(
            select(RELEASES.c.version).where(RELEASES.c.version == RELEASE)
        ).first():
            return repo.load(RELEASE)
        for c in profiles():
            repo.register(
                namespace=f"DEMO_live_{c['domain']}",
                entity=c["entity"],
                source=(c["records"][0]["id"],),
                evidence="Synthetic manual demo v1; not a production match",
                valid_from=WHEN,
            )
        return repo.freeze(RELEASE)


def main():
    reconfigure = getattr(sys.stdout, "reconfigure", None)
    if callable(reconfigure):
        reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("check", "init-crosswalk", "run", "inspect"))
    parser.add_argument("--domain", choices=DOMAINS)
    parser.add_argument("--object", help="Object key inside configured Bronze bucket")
    parser.add_argument("--version", help="Pin a specific Bronze object version")
    parser.add_argument("--session", default="buoi1")
    parser.add_argument(
        "--base", default="none", help="none, active, or exact parent snapshot UUID"
    )
    args = parser.parse_args()
    if (
        not args.session.isascii()
        or not args.session.replace("-", "").isalnum()
        or len(args.session) > 40
    ):
        parser.error("session: use 1-40 ASCII letters/digits/hyphens")
    if args.action == "run" and (not args.domain or not args.object):
        parser.error("run requires --domain and --object")
    if args.action == "run" and (
        not args.object.startswith("demo/")
        or not args.object.lower().endswith((".csv", ".xlsx"))
    ):
        parser.error("Demo only accepts .csv/.xlsx objects under demo/")
    engine = create_engine(
        URL.create(
            "postgresql+psycopg",
            username=settings.db_user,
            password=settings.db_password,
            host=settings.db_host,
            port=settings.db_port,
            database=settings.db_name,
        ),
        connect_args={"connect_timeout": 5},
    )
    client = Minio(
        settings.minio_endpoint,
        access_key=settings.minio_access_key,
        secret_key=settings.minio_secret_key,
        secure=settings.minio_secure,
    )
    try:
        if args.action == "check":
            required = {
                "canonical_identity",
                "identity_crosswalk",
                "crosswalk_release",
                "silver_run",
                "silver_snapshot",
                "silver_head",
            }
            missing = required - set(inspect(engine).get_table_names(schema="app"))
            buckets = {
                b: client.bucket_exists(b)
                for b in (settings.minio_bucket_bronze, settings.minio_bucket_silver)
            }
            versioning = (
                client.get_bucket_versioning(settings.minio_bucket_bronze).status
                if buckets[settings.minio_bucket_bronze]
                else None
            )
            print(
                json.dumps(
                    {
                        "missing_tables": sorted(missing),
                        "buckets": buckets,
                        "bronze_versioning": versioning,
                    },
                    indent=2,
                )
            )
            return (
                0
                if not missing and all(buckets.values()) and versioning == "Enabled"
                else 1
            )
        if args.action == "init-crosswalk":
            snapshot = initialize_crosswalk(engine)
            print(
                json.dumps(
                    {
                        "release": snapshot.version,
                        "demo_entries": [
                            asdict(e)
                            for e in snapshot.entries
                            if e.namespace.startswith("DEMO_live_")
                        ],
                    },
                    default=str,
                    indent=2,
                )
            )
            return 0
        repo = SilverRepository(engine)
        publisher = SilverPublicationService(
            repository=repo,
            storage=MinioSilverStore(client, settings.minio_bucket_silver),
            contracts={
                d: read_json(f"docs/standardization/silver-schemas/{d}.json")
                for d in DOMAINS
            },
            scope=f"manual-demo-{args.session}",
            mode="rehearsal",
        )
        before = repo.head(publisher.scope)
        if args.action == "inspect":
            print(
                json.dumps(
                    {
                        "active_snapshot": before,
                        "tables": publisher.read_snapshot(before) if before else {},
                    },
                    default=str,
                    ensure_ascii=False,
                    indent=2,
                )
            )
            return 0
        with engine.begin() as conn:
            crosswalk = CrosswalkRepository(conn).load(RELEASE)
        stat = client.stat_object(
            settings.minio_bucket_bronze, args.object, version_id=args.version
        )
        if not stat.version_id or stat.version_id == "null":
            raise ValueError(
                "BRONZE_VERSIONING_REQUIRED: upload again after enabling versioning"
            )
        result = normalize(
            args.domain,
            f"s3://{settings.minio_bucket_bronze}/{args.object}",
            crosswalk,
            version=stat.version_id,
        )
        base = (
            before
            if args.base == "active"
            else None
            if args.base == "none"
            else args.base
        )
        report = {
            "scope": publisher.scope,
            "source": args.object,
            "source_version": stat.version_id,
            "base_snapshot": base,
            "head_before": before,
            "input_rows": result.total_count,
            "accepted_rows": len(result.accepted),
            "rejected_locators": result.rejected_locators,
            "issues": [
                asdict(i)
                for i in (*result.mapping_issues, *result.type_issues, *result.issues)
            ],
        }
        try:
            receipt = publisher.publish((result,), base_snapshot=base)
            report.update(
                status="PUBLISHED",
                receipt=asdict(receipt),
                tables=publisher.read_snapshot(receipt.snapshot_id),
            )
        except SilverError as exc:
            report.update(status="FAILED", error=str(exc))
        report["head_after"] = repo.head(publisher.scope)
        output = ROOT / ".local/live-demo/reports" / f"{uuid4()}.json"
        output.parent.mkdir(parents=True, exist_ok=True)
        encoded = json.dumps(report, default=str, ensure_ascii=False, indent=2)
        output.write_text(encoded, encoding="utf-8")
        print(encoded)
        print(f"Report: {output}")
        return 0 if report["status"] == "PUBLISHED" else 2
    finally:
        engine.dispose()


if __name__ == "__main__":
    raise SystemExit(main())
