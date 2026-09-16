"""MinIO client settings."""

from __future__ import annotations

from dataclasses import dataclass

from app.core.config import settings


@dataclass(frozen=True)
class MinioClientSettings:
    """Connection options for the Bronze object store."""

    endpoint: str = settings.minio_endpoint
    access_key: str = settings.minio_access_key
    secret_key: str = settings.minio_secret_key
    secure: bool = settings.minio_secure
