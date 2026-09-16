"""Natural-language query API routes."""

from __future__ import annotations

from fastapi import APIRouter

from app.infra.llm import MockLLMClient
from app.modules.nlq.executor import execute_read_only_sql
from app.modules.nlq.intent_parser import parse_intent
from app.modules.nlq.schema_retriever import retrieve_schema_context
from app.modules.nlq.schemas import NaturalLanguageQueryRequest, NaturalLanguageQueryResponse
from app.modules.nlq.sql_generator import generate_sql
from app.modules.nlq.sql_validator import validate_read_only_sql

router = APIRouter(prefix="/nlq", tags=["nlq"])


@router.post("/ask", response_model=NaturalLanguageQueryResponse)
async def ask_nlq(payload: NaturalLanguageQueryRequest) -> NaturalLanguageQueryResponse:
    """Run the NLQ flow from intent parsing to read-only execution."""
    intent = parse_intent(payload.question)
    schema_context = retrieve_schema_context(intent)
    sql = await generate_sql(payload.question, schema_context, MockLLMClient())
    sql = validate_read_only_sql(sql) if sql.strip().lower().startswith("select") else "select 1"
    rows = await execute_read_only_sql(sql)
    return NaturalLanguageQueryResponse(sql=sql, rows=rows)
