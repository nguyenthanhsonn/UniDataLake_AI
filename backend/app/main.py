from __future__ import annotations

from fastapi import FastAPI

app = FastAPI(
    title="UniLake AI API",
    description="UniLake AI - Multi-source Data Lake Platform API",
    version="1.0.0",
)


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "Welcome to UniLake AI API"}


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
