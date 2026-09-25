"""Natural-language query API routes."""

from __future__ import annotations

from fastapi import APIRouter

from app.modules.nlq.dependencies import NLQServiceDependency  # noqa: TC001
from app.modules.nlq.schemas import NaturalLanguageQueryRequest, NaturalLanguageQueryResponse

router = APIRouter(prefix="/nlq", tags=["nlq"])


@router.post("/ask", response_model=NaturalLanguageQueryResponse)
async def ask_nlq(
    payload: NaturalLanguageQueryRequest,
    service: NLQServiceDependency,
) -> NaturalLanguageQueryResponse:
    """Run the NLQ flow from intent parsing to read-only execution."""
    result = await service.ask(payload.question)
    return NaturalLanguageQueryResponse(sql=result.sql, rows=list(result.rows))
