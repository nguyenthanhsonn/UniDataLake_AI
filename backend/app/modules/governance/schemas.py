"""Pydantic schemas for governance endpoints."""

from __future__ import annotations

from pydantic import BaseModel

from app.domains.base import DataLayer  # noqa: TC001


class FieldDefinitionSchema(BaseModel):
    """Field metadata schema for governance responses."""

    name: str
    data_type: str
    nullable: bool = True
    description: str = ""


class CatalogEntrySchema(BaseModel):
    """Catalog entry schema for governance responses."""

    domain_id: str
    dataset: str
    layer: DataLayer
    schema_version: str
    description: str
    fields: list[FieldDefinitionSchema]
