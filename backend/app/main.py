from __future__ import annotations

from fastapi import FastAPI

from app.core.exceptions import AppException, app_exception_handler
from app.core.logging import request_id_middleware
from app.modules.auth.router import router as auth_router
from app.modules.dashboard.router import router as dashboard_router
from app.modules.datasources.router import router as datasources_router
from app.modules.governance.router import router as governance_router
from app.modules.ingestion.router import router as ingestion_router
from app.modules.nlq.router import router as nlq_router
from app.modules.query_history.router import router as query_history_router
from app.modules.users.router import router as users_router


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    application = FastAPI(
        title="UniLake AI API",
        description="UniLake AI - Multi-source Data Lake Platform API",
        version="1.0.0",
    )

    application.middleware("http")(request_id_middleware)
    application.add_exception_handler(AppException, app_exception_handler)

    api_prefix = "/api/v1"
    application.include_router(auth_router, prefix=api_prefix)
    application.include_router(users_router, prefix=api_prefix)
    application.include_router(datasources_router, prefix=api_prefix)
    application.include_router(ingestion_router, prefix=api_prefix)
    application.include_router(governance_router, prefix=api_prefix)
    application.include_router(nlq_router, prefix=api_prefix)
    application.include_router(dashboard_router, prefix=api_prefix)
    application.include_router(query_history_router, prefix=api_prefix)
    return application


app = create_app()


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "Welcome to UniLake AI API"}


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
