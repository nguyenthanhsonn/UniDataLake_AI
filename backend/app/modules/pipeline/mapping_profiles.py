"""Construct structural profiles from S1 contracts, without loading global repo files."""

from __future__ import annotations

from collections.abc import Mapping

from app.modules.pipeline.schema_mapping import (
    FieldMapping,
    MappingKey,
    MappingProfile,
    validate_profile,
)


def pointer(name: str) -> str:
    return "/" + name.replace("~", "~0").replace("/", "~1")


def build_profile(
    *,
    key: MappingKey,
    source_type: str,
    source_columns: tuple[str, ...],
    target_fields: tuple[str, ...],
    field_paths: Mapping[str, tuple[str, ...]],
    deferred_fields: tuple[str, ...] = (),
    ignored_sources: tuple[str, ...] = (),
) -> MappingProfile:
    """Explicit paths allow several layouts of the same transport and entity.

    No inferred case conversion/aliases; caller supplies source and target contract fields.
    Values for deferred target fields must be produced by S3/S4/audit, never by defaults.
    """
    profile = MappingProfile(
        key=key,
        source_type=source_type,
        target_fields=target_fields,
        fields=tuple(
            FieldMapping(target, paths, "copy" if len(paths) == 1 else "coalesce")
            for target, paths in field_paths.items()
        ),
        source_fields=source_columns,
        deferred_fields=deferred_fields,
        ignored_sources=ignored_sources,
    )
    validate_profile(profile)
    return profile
