"""Dependency tokens exposed by the NLQ delivery adapter."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends

from app.modules.nlq.service import NLQService


def get_nlq_service() -> NLQService:
    """Require the composition root to provide the NLQ application service."""
    raise RuntimeError("NLQ service provider is not configured")


NLQServiceDependency = Annotated[NLQService, Depends(get_nlq_service)]
