"""Application settings loaded from environment variables."""

from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "UniLake AI"
    app_env: str = Field(default="development", alias="ENVIRONMENT")
    debug: bool = Field(default=False, alias="DEBUG")
    api_v1_prefix: str = Field(default="/api/v1", alias="API_V1_PREFIX")  # NEW
    cors_origins: str = Field(default="http://localhost:3000", alias="CORS_ORIGINS")  # NEW

    db_host: str = Field(default="localhost", alias="DB_HOST")
    db_port: int = Field(default=5432, alias="DB_PORT")
    db_user: str = Field(default="unilake", alias="DB_USER")
    db_password: str = Field(default="unilake", alias="DB_PASSWORD")
    db_name: str = Field(default="unilake", alias="DB_NAME")
    db_echo: bool = Field(default=False, alias="DB_ECHO")
    # NEW: role chỉ đọc schema gold, database nguồn giả lập
    db_readonly_user: str = Field(default="unilake_reader", alias="DB_READONLY_USER")
    db_readonly_password: str = Field(default="unilake_reader", alias="DB_READONLY_PASSWORD")
    db_statement_timeout_ms: int = Field(default=5000, alias="DB_STATEMENT_TIMEOUT_MS")
    db_source_name: str = Field(default="unilake_source", alias="DB_SOURCE_NAME")

    minio_endpoint: str = Field(default="localhost:9000", alias="MINIO_ENDPOINT")
    minio_access_key: str = Field(default="minioadmin", alias="MINIO_ACCESS_KEY")
    minio_secret_key: str = Field(default="minioadmin", alias="MINIO_SECRET_KEY")
    minio_secure: bool = Field(default=False, alias="MINIO_SECURE")
    # NEW: region và bucket cho Bronze / Silver / Gold
    minio_region: str = Field(default="us-east-1", alias="MINIO_REGION")
    minio_bucket_bronze: str = Field(default="bronze", alias="MINIO_BUCKET_BRONZE")
    minio_bucket_silver: str = Field(default="silver", alias="MINIO_BUCKET_SILVER")
    minio_bucket_gold: str = Field(default="gold", alias="MINIO_BUCKET_GOLD")

    # NEW: DuckDB
    duckdb_path: str = Field(default=":memory:", alias="DUCKDB_PATH")
    duckdb_threads: int = Field(default=4, alias="DUCKDB_THREADS")
    duckdb_memory_limit: str = Field(default="2GB", alias="DUCKDB_MEMORY_LIMIT")

    jwt_secret_key: str = Field(
        default="change-me-in-production-use-openssl-rand-hex-32",
        alias="JWT_SECRET_KEY",
    )
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_access_token_expire_minutes: int = Field(
        default=60 * 24,
        alias="JWT_ACCESS_TOKEN_EXPIRE_MINUTES",
    )

    llm_provider: str = Field(default="mock", alias="LLM_PROVIDER")  # đổi default openai -> mock
    llm_api_key: str = Field(default="", alias="LLM_API_KEY")
    llm_model: str = Field(default="", alias="LLM_MODEL")
    llm_timeout_seconds: int = Field(default=30, alias="LLM_TIMEOUT_SECONDS")  # NEW

    @property
    def database_url(self) -> str:
        """Build async PostgreSQL connection URL."""
        return (
            f"postgresql+asyncpg://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    @property
    def sync_database_url(self) -> str:
        """Build sync PostgreSQL connection URL."""
        return (
            f"postgresql://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    @property
    def readonly_database_url(self) -> str:  # NEW
        """Build async URL for the read-only Gold role used by NLQ and Dashboard."""
        return (
            f"postgresql+asyncpg://{self.db_readonly_user}:{self.db_readonly_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    @property
    def duckdb_postgres_dsn(self) -> str:  # NEW
        """Build libpq DSN for DuckDB `ATTACH ... (TYPE postgres)` to write Gold."""
        return (
            f"host={self.db_host} port={self.db_port} dbname={self.db_name} "
            f"user={self.db_user} password={self.db_password}"
        )

    @property
    def minio_endpoint_url(self) -> str:  # NEW
        """Build full MinIO URL (with scheme) for deltalake storage options."""
        scheme = "https" if self.minio_secure else "http"
        return f"{scheme}://{self.minio_endpoint}"

    @property
    def cors_origin_list(self) -> list[str]:  # NEW
        """Split comma-separated CORS_ORIGINS into a list."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
