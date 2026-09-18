"""Governance API routes."""

from __future__ import annotations

from fastapi import APIRouter

from app.modules.governance.service import CatalogEntry, GovernanceService

router = APIRouter(prefix="/governance", tags=["governance"])


@router.get("/catalog")
def get_catalog(domain_id: str | None = None) -> list[CatalogEntry]:
    """Return catalog entries generated from registered domain metadata."""
    return list(GovernanceService().catalog(domain_id=domain_id))
