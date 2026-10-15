"""Composition adapters: capture one immutable file copy and persist it to MinIO."""

from __future__ import annotations

import hashlib
import shutil
from dataclasses import replace
from datetime import UTC
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import TYPE_CHECKING, Any
from zoneinfo import ZoneInfo

import pyarrow as pa  # type: ignore[import-untyped]
import pyarrow.parquet as pq  # type: ignore[import-untyped]

from app.core.config import settings
from app.infra.minio.bronze import client, object_key
from app.modules.ingestion.contracts import CapturedArtifact
from app.modules.ingestion.readers.factory import SourceReaderFactory
from app.modules.ingestion.readers.minio_file_resolver import resolve_file_request

if TYPE_CHECKING:
    from types import TracebackType

    from app.modules.ingestion.contracts import BronzeWriteContext
    from app.modules.ingestion.readers.contract import ReadRequest


class BronzeCapture:
    def __enter__(self) -> BronzeCapture:
        self.temp = TemporaryDirectory(prefix="bronze_execution_")
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc_value: BaseException | None,
        traceback: TracebackType | None,
    ) -> None:
        self.temp.cleanup()

    def read(self, request: ReadRequest) -> CapturedArtifact:
        reader = SourceReaderFactory.get_reader(request.source_type)
        version = None
        if request.source_type in {"CSV", "EXCEL"}:
            with resolve_file_request(request) as resolved:
                if not resolved.location or not request.source_table:
                    raise ValueError("SOURCE_LOCATION_AND_TABLE_REQUIRED")
                origin = Path(resolved.location).expanduser()
                if origin.is_dir():
                    origin = origin / request.source_table
                if origin.name != request.source_table:
                    raise ValueError("SOURCE_TABLE_MISMATCH")
                path = Path(self.temp.name) / origin.name
                shutil.copyfile(origin, path)
                version = resolved.object_version_id
            result = reader.read(replace(request, location=str(path)))
        else:
            result = reader.read(request)
            path = Path(self.temp.name) / "snapshot.parquet"
            # Durable typed DB export; never stringify decimals/dates with default=str.
            table = pa.table(
                {name: [row[i] for row in result.rows] for i, name in enumerate(result.columns)}
            )
            pq.write_table(table, path)
        with path.open("rb") as stream:
            digest = hashlib.file_digest(stream, "sha256").hexdigest()
        return CapturedArtifact(path, result.rows_read, digest, version)


def store_bronze(
    artifact: CapturedArtifact,
    domain: str,
    job: BronzeWriteContext,
) -> dict[str, Any]:
    storage = client()
    bucket = settings.minio_bucket_bronze
    if storage.get_bucket_versioning(bucket).status != "Enabled":
        raise RuntimeError("BRONZE_VERSIONING_REQUIRED")
    day = job.created_at.replace(tzinfo=UTC).astimezone(ZoneInfo("Asia/Ho_Chi_Minh")).date()
    key = object_key(domain, day, f"job-{job.ingestion_job_id}", artifact.path.name)
    uploaded = storage.fput_object(
        bucket, key, str(artifact.path), metadata={"sha256": artifact.sha256}
    )
    if not uploaded.version_id or uploaded.version_id == "null":
        raise RuntimeError("BRONZE_VERSION_REQUIRED")
    response = storage.get_object(bucket, key, version_id=uploaded.version_id)
    try:
        digest = hashlib.sha256()
        for chunk in response.stream(1024 * 1024):
            digest.update(chunk)
        if digest.hexdigest() != artifact.sha256:
            raise RuntimeError("BRONZE_CHECKSUM_MISMATCH")
    finally:
        response.close()
        response.release_conn()
    return {
        "uri": f"s3://{bucket}/{key}",
        "version_id": uploaded.version_id,
        "sha256": artifact.sha256,
        "size_bytes": artifact.path.stat().st_size,
        "source_version_id": artifact.source_version_id,
    }
