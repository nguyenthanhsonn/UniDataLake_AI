"""API/worker thật bằng SA runtime; schema và prefix UUID riêng cho dữ liệu kiểm thử."""

from __future__ import annotations

import asyncio
import os
from datetime import timedelta
from pathlib import Path
from uuid import uuid4

import asyncpg
import httpx
import pytest
from fastapi import FastAPI
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app import ingestion_worker
from app.core.config import settings
from app.core.deps import get_current_user, get_db
from app.core.exceptions import AppException, app_exception_handler
from app.infra.minio.bronze import client
from app.infra.minio.client import bronze_reader_client, bronze_verifier_client
from app.modules.datasources.models import DataSource
from app.modules.ingestion.models import IngestionJob
from app.modules.ingestion.router import router
from app.repositories.ingestion_repo import IngestionRepository, utcnow

pytestmark = pytest.mark.skipif(
    os.getenv("INGESTION_LIVE_TEST") != "1", reason="Requires PostgreSQL and MinIO"
)


@pytest.mark.asyncio
@pytest.mark.parametrize("domain", ["admissions", "academic", "hr"])
async def test_api_queue_worker_storage_failures_and_recovery(tmp_path, monkeypatch, domain):
    suffix = uuid4().hex
    schema, bucket = "ingestion_test_" + suffix, settings.minio_bucket_bronze
    # Policy SA chỉ cấp bucket Bronze thật; không nới policy để test bucket tùy ý.
    partition = f"{domain}-iam-{suffix}"
    root = Path(__file__).resolve().parents[2]
    ddl = (root / "infra/postgres/init/02-schema.sql").read_text(encoding="utf-8")
    ddl = ddl.replace("CREATE SCHEMA IF NOT EXISTS app;", f"CREATE SCHEMA {schema};")
    ddl = ddl.replace("SET search_path TO app, public;", f"SET search_path TO {schema}, public;")
    storage = client()
    engine = create_async_engine(
        settings.database_url,
        poolclass=NullPool,
        execution_options={"schema_translate_map": {"app": schema}},
    )
    factory = async_sessionmaker(engine, expire_on_commit=False)
    monkeypatch.setattr(ingestion_worker, "async_session_factory", factory)
    path = tmp_path / "input.csv"
    path.write_bytes(b"id,name\r\n001,Example\r\n")
    conn = await asyncpg.connect(
        host=settings.db_host,
        port=settings.db_port,
        user=settings.db_user,
        password=settings.db_password,
        database=settings.db_name,
    )
    try:
        await conn.execute(ddl)
        await conn.execute(
            "INSERT INTO source_system(source_code, source_name, source_type) VALUES ('TEST', 'Test', 'CSV')"
        )
        await conn.execute(
            "INSERT INTO data_layer(layer_code, layer_name) VALUES ('BRONZE', 'Bronze')"
        )
        await conn.execute(
            "INSERT INTO dataset(dataset_code,dataset_name,domain,source_system_id,data_layer_id) VALUES ('test','Test',$1,1,1)",
            partition,
        )
        await conn.execute(
            "INSERT INTO data_source(source_system_id,source_name,source_type,location,configuration) VALUES (1,'Test','CSV',$1,$2::jsonb)",
            str(path),
            '{"delimiter":",","encoding":"utf-8","has_header":true}',
        )
        app = FastAPI()
        app.add_exception_handler(AppException, app_exception_handler)
        app.include_router(router)
        user = {"sub": "test-user", "roles": ["ADMIN"]}
        app.dependency_overrides[get_current_user] = lambda: user

        async def db_override():
            async with factory() as session:
                yield session

        app.dependency_overrides[get_db] = db_override
        payload = {"data_source_id": 1, "dataset_id": 1, "source_table": "input.csv"}
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://test"
        ) as api:
            user["roles"] = ["VIEWER"]
            assert (await api.post("/ingestion/jobs", json=payload)).status_code == 403
            user["roles"] = ["ADMIN"]
            assert (
                await api.post("/ingestion/jobs", json={**payload, "data_source_id": 999})
            ).status_code == 404
            responses = await asyncio.gather(
                *(api.post("/ingestion/jobs", json=payload) for _ in range(2))
            )
            assert sorted(r.status_code for r in responses) == [202, 409]
            job_id = next(r.json()["ingestion_job_id"] for r in responses if r.status_code == 202)
            # Worker thật, phiên riêng biệt, thực sự chụp/đọc/ghi/kiểm tra checksum.
            assert sorted(
                await asyncio.gather(ingestion_worker.run_once(), ingestion_worker.run_once())
            ) == [False, True]
            result = (await api.get(f"/ingestion/jobs/{job_id}")).json()
            assert result["status"] == "SUCCESS", result
            assert result["rows_read"] == 1
            assert result["rows_written"] == 1
            assert result["output"]["version_id"]
            key = result["output"]["uri"].split(f"s3://{bucket}/", 1)[1]
            # Kiểm tra metadata thật trên đúng version đã được job công bố.
            stat = bronze_verifier_client().stat_object(
                bucket, key, version_id=result["output"]["version_id"]
            )
            tags = {name.lower(): value for name, value in stat.metadata.items()}
            for name, value in result["output"]["metadata"].items():
                assert tags[f"x-amz-meta-{name}"] == value
            assert tags["x-amz-meta-source-system-id"] == "1"
            assert tags["x-amz-meta-batch-id"] == f"job-{job_id}"
            response = bronze_reader_client().get_object(
                bucket, key, version_id=result["output"]["version_id"]
            )
            try:
                assert response.read() == path.read_bytes()
            finally:
                response.close()
                response.release_conn()
            async with factory() as session:
                source = await session.get(DataSource, 1)
                assert source is not None
                assert source.ingestion_count == 1
                assert source.last_ingested_at is not None
            # Worker kiểm tra lại sự tồn tại/cấu hình nguồn; đầu vào thiếu được ghi nhận lỗi bền vững.
            path.unlink()
            failed_id = (await api.post("/ingestion/jobs", json=payload)).json()["ingestion_job_id"]
            assert await ingestion_worker.run_once()
            failed = (await api.get(f"/ingestion/jobs/{failed_id}")).json()
            assert failed["error_message"] == "INGESTION_READING_FAILED"
            # Giả lập worker dừng đột ngột; job hết hạn không thể công bố thành công hay gửi heartbeat.
            dead_id = (await api.post("/ingestion/jobs", json=payload)).json()["ingestion_job_id"]
            async with factory() as session:
                repo = IngestionRepository(session)
                claimed = await repo.claim()
                assert claimed is not None
                assert claimed.ingestion_job_id == dead_id
                await session.execute(
                    update(IngestionJob)
                    .where(IngestionJob.ingestion_job_id == dead_id)
                    .values(lease_expires_at=utcnow() - timedelta(seconds=1))
                )
                await session.commit()
                assert not await repo.heartbeat(dead_id)
                assert not await repo.finish(dead_id, output={"invalid": True})
                assert await repo.recover_expired() == 1
                assert await repo.claim() is None
            dead = (await api.get(f"/ingestion/jobs/{dead_id}")).json()
            assert dead["error_message"] == "WORKER_LEASE_EXPIRED"
            history = (await api.get("/ingestion/jobs", params={"data_source_id": 1})).json()
            assert len(history) == 4
            assert all("configuration" not in job for job in history)
            async with factory() as session:
                assert await session.scalar(select(DataSource.ingestion_count)) == 1
            path.write_bytes(b"id,name\n002,Another\n")

            def fail_store(*args):
                raise RuntimeError("secret-storage-credential")

            monkeypatch.setattr(ingestion_worker, "store_bronze", fail_store)
            write_id = (await api.post("/ingestion/jobs", json=payload)).json()["ingestion_job_id"]
            assert await ingestion_worker.run_once()
            write_failed = (await api.get(f"/ingestion/jobs/{write_id}")).json()
            assert write_failed["error_message"] == "INGESTION_WRITING_FAILED"
            assert write_failed["rows_read"] == 1
            assert write_failed["rows_written"] == 0
            async with factory() as session:
                await session.execute(
                    update(DataSource).where(DataSource.data_source_id == 1).values(is_active=False)
                )
                await session.commit()
            rejected = await api.post("/ingestion/jobs", json=payload)
            assert rejected.status_code == 422
            rejection_id = rejected.json()["error"]["details"]["ingestion_job_id"]
            assert (await api.get(f"/ingestion/jobs/{rejection_id}")).json()["status"] == "REJECTED"
    finally:
        await engine.dispose()
        await conn.execute(f"DROP SCHEMA IF EXISTS {schema} CASCADE")
        await conn.close()
        # Chỉ admin fixture dọn dữ liệu test trong prefix UUID này, không xóa bucket.
        for obj in storage.list_objects(
            bucket, prefix=partition + "/", recursive=True, include_version=True
        ):
            assert obj.object_name is not None
            storage.remove_object(bucket, obj.object_name, version_id=obj.version_id)
