"""Resolve file S3/MinIO thành file local tạm cho ingestion reader."""

from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import replace
from pathlib import Path, PurePosixPath
from tempfile import TemporaryDirectory
from typing import TYPE_CHECKING
from urllib.parse import SplitResult, urlsplit

from minio import Minio

from app.infra.minio.client import MinioClientSettings

if TYPE_CHECKING:
    from .contract import ReadRequest


FILE_SOURCE_TYPES = {"CSV", "EXCEL"}
S3_SCHEME = "s3"
TEMP_DIR_PREFIX = "ingestion_source_"


@contextmanager
def resolve_file_request(
    request: ReadRequest,
) -> Iterator[ReadRequest]:
    """Tải file S3/MinIO về file tạm để CSV/Excel reader đọc như file local.

    CSVReader và ExcelReader hiện chỉ xử lý file local. Hàm này đứng giữa
    source_loader và reader: nếu location là `s3://bucket/path/file.csv`,
    resolver tải object đó về thư mục tạm, đổi `request.location` sang đường
    dẫn local, rồi tự xóa file tạm sau khi reader đọc xong.
    """

    location = request.location

    # 1. Chỉ CSV/Excel có file cần tải. PostgreSQL hoặc local path thì giữ nguyên request.
    if (
        request.source_type.upper() not in FILE_SOURCE_TYPES
        or not isinstance(location, str)
        or not _is_s3_location(location)
    ):
        yield request
        return

    # 2. Parse `s3://bucket/object/key` thành bucket và object key.
    parsed = urlsplit(location)
    bucket, object_key = _parse_s3_location(parsed)

    filename = PurePosixPath(object_key).name

    if filename in {"", ".", ".."}:
        raise ValueError("Tên file S3 không hợp lệ")

    # 3. source_table phải có và phải khớp tên file trong S3 location.
    # Điều này tránh caller yêu cầu đọc nhầm object khác với metadata DataSource.
    if not request.source_table:
        raise ValueError("Thiếu source_table")

    if request.source_table != filename:
        raise ValueError("source_table không khớp với tên file trong S3 location")

    # 4. Tạo MinIO client từ settings chung của app.
    client = _create_minio_client()

    # 5. File tạm chỉ sống trong phạm vi context manager này.
    # Khi reader đọc xong hoặc ném lỗi, TemporaryDirectory vẫn được dọn.
    with TemporaryDirectory(prefix=TEMP_DIR_PREFIX) as temp_dir:
        local_path = Path(temp_dir) / filename

        _download_object(
            client=client,
            bucket=bucket,
            object_key=object_key,
            local_path=local_path,
        )

        local_request = replace(
            request,
            location=str(local_path),
        )

        yield local_request


def _is_s3_location(location: str) -> bool:
    """Kiểm tra location có phải URI S3/MinIO không."""

    return urlsplit(location).scheme.lower() == S3_SCHEME


def _parse_s3_location(parsed_url: SplitResult) -> tuple[str, str]:
    """Validate và tách S3 URI thành bucket, object_key."""

    bucket = parsed_url.netloc
    object_key = parsed_url.path.lstrip("/")

    if not bucket or not object_key or parsed_url.query or parsed_url.fragment:
        raise ValueError("Đường dẫn S3 không hợp lệ")

    return bucket, object_key


def _create_minio_client() -> Minio:
    """Tạo MinIO client từ cấu hình môi trường của ứng dụng."""

    config = MinioClientSettings()

    return Minio(
        endpoint=config.endpoint,
        access_key=config.access_key,
        secret_key=config.secret_key,
        secure=config.secure,
    )


def _download_object(
    *,
    client: Minio,
    bucket: str,
    object_key: str,
    local_path: Path,
) -> None:
    """Tải một object từ MinIO xuống đường dẫn local tạm."""

    client.fget_object(
        bucket_name=bucket,
        object_name=object_key,
        file_path=str(local_path),
    )
