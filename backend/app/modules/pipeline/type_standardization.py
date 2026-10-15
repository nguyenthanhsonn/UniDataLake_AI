"""Deterministic S3 converters and S2 handoff; no I/O or identity resolution."""

from __future__ import annotations

import re
import unicodedata
from copy import deepcopy
from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal, InvalidOperation, localcontext
from typing import TYPE_CHECKING, Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

if TYPE_CHECKING:
    from collections.abc import Mapping

    from app.modules.pipeline.schema_mapping import MappingIssue, MappingKey, MappingResult


class ConversionError(ValueError):
    def __init__(self, code: str) -> None:
        self.code = code
        super().__init__(code)


class ConversionConfigurationError(ValueError):
    pass


@dataclass(frozen=True)
class FieldOptions:
    null_tokens: tuple[str, ...] = ()
    trim: bool = False
    decimal_separator: str = "."
    thousands_separator: str | None = None
    date_format: str = "%Y-%m-%d"
    timestamp_format: str = "iso"
    source_timezone: str | None = None
    true_tokens: tuple[str, ...] = ("true",)
    false_tokens: tuple[str, ...] = ("false",)
    excel_epoch: str | None = None  # 1900 or 1904; only when explicitly configured.
    invalid_optional_to_null: bool = False


def _check_options(options: FieldOptions) -> None:
    if options.decimal_separator not in {".", ","}:
        raise ConversionConfigurationError("INVALID_DECIMAL_SEPARATOR")
    if (
        options.thousands_separator not in {None, ".", ",", " "}
        or options.thousands_separator == options.decimal_separator
    ):
        raise ConversionConfigurationError("INVALID_THOUSANDS_SEPARATOR")
    if set(options.true_tokens) & set(options.false_tokens):
        raise ConversionConfigurationError("BOOLEAN_TOKEN_CONFLICT")
    if set(options.null_tokens) & (set(options.true_tokens) | set(options.false_tokens)):
        raise ConversionConfigurationError("NULL_TOKEN_CONFLICT")
    if options.excel_epoch not in {None, "1900", "1904"}:
        raise ConversionConfigurationError("INVALID_EXCEL_EPOCH")
    if options.source_timezone:
        try:
            ZoneInfo(options.source_timezone)
        except ZoneInfoNotFoundError as exc:
            raise ConversionConfigurationError("UNKNOWN_SOURCE_TIMEZONE") from exc


def _nullable(spec: Mapping[str, Any]) -> bool:
    return isinstance(spec.get("type"), list) and "null" in spec["type"]


def _decimal(value: object, spec: Mapping[str, Any], options: FieldOptions) -> Decimal:
    if isinstance(value, (bool, float)):
        raise ConversionError("DECIMAL_PARSE_ERROR")
    if isinstance(value, str):
        point = re.escape(options.decimal_separator)
        group = re.escape(options.thousands_separator) if options.thousands_separator else None
        integer = rf"(?:[0-9]+|[0-9]{{1,3}}(?:{group}[0-9]{{3}})+)" if group else r"[0-9]+"
        if not re.fullmatch(rf"[+-]?{integer}(?:{point}[0-9]+)?", value):
            raise ConversionError("DECIMAL_PARSE_ERROR")
        if options.thousands_separator:
            value = value.replace(options.thousands_separator, "")
        value = value.replace(options.decimal_separator, ".")
    if not isinstance(value, (str, int, Decimal)):
        raise ConversionError("DECIMAL_PARSE_ERROR")
    try:
        number = Decimal(value)
        if not number.is_finite():
            raise ConversionError("DECIMAL_PARSE_ERROR")
        precision, scale = spec["x-precision"], spec["x-scale"]
        if number.as_tuple().exponent < -scale:
            raise ConversionError("DECIMAL_SCALE_ERROR")
        if number.copy_abs() >= Decimal(10) ** (precision - scale):
            raise ConversionError("DECIMAL_OVERFLOW")
        with localcontext() as context:
            context.prec = max(precision + 2, 40)
            return number.quantize(Decimal(1).scaleb(-scale))
    except InvalidOperation as exc:
        raise ConversionError("DECIMAL_PARSE_ERROR") from exc


def _date(value: object, options: FieldOptions) -> date:
    if isinstance(value, datetime):
        raise ConversionError("DATE_TIME_LOSS")
    if isinstance(value, date):
        return value
    if isinstance(value, (int, float, Decimal)) and not isinstance(value, bool):
        if not options.excel_epoch:
            raise ConversionError("EXCEL_EPOCH_REQUIRED")
        serial = Decimal(str(value))
        if not serial.is_finite() or serial != serial.to_integral_value() or serial < 0:
            raise ConversionError("EXCEL_DATE_ERROR")
        if options.excel_epoch == "1900" and serial == 60:
            raise ConversionError("EXCEL_FICTITIOUS_DATE")
        epoch = date(1899, 12, 31) if options.excel_epoch == "1900" else date(1904, 1, 1)
        days = int(serial) - (1 if options.excel_epoch == "1900" and serial > 60 else 0)
        try:
            return epoch + timedelta(days=days)
        except (OverflowError, ValueError) as exc:
            raise ConversionError("EXCEL_DATE_ERROR") from exc
    if not isinstance(value, str):
        raise ConversionError("DATE_PARSE_ERROR")
    try:
        result = datetime.strptime(value, options.date_format).date()
        if result.strftime(options.date_format) != value:
            raise ValueError("noncanonical source format")
        return result
    except ValueError as exc:
        raise ConversionError("DATE_PARSE_ERROR") from exc


def _timestamp(value: object, options: FieldOptions) -> datetime:
    if isinstance(value, str):
        # Python silently truncates extra fractional digits; S3 must reject instead.
        if re.search(r"[.,][0-9]{7,}", value):
            raise ConversionError("TIMESTAMP_PRECISION_ERROR")
        try:
            if options.timestamp_format == "iso":
                if not re.fullmatch(
                    r"[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]{1,6})?(?:Z|[+-][0-9]{2}:[0-9]{2})?",
                    value,
                ):
                    raise ValueError("invalid ISO timestamp")
                value = datetime.fromisoformat(value.replace("Z", "+00:00"))
            else:
                value = datetime.strptime(value, options.timestamp_format)
        except ValueError as exc:
            raise ConversionError("TIMESTAMP_PARSE_ERROR") from exc
    if not isinstance(value, datetime):
        raise ConversionError("TIMESTAMP_PARSE_ERROR")
    if value.tzinfo is None:
        if not options.source_timezone:
            raise ConversionError("TIMEZONE_REQUIRED")
        zone = ZoneInfo(options.source_timezone)
        candidates = [value.replace(tzinfo=zone, fold=i) for i in (0, 1)]
        valid = [
            dt
            for dt in candidates
            if dt.astimezone(UTC).astimezone(zone).replace(tzinfo=None) == value
        ]
        if not valid:
            raise ConversionError("NONEXISTENT_LOCAL_TIME")
        if len({dt.utcoffset() for dt in valid}) > 1:
            raise ConversionError("AMBIGUOUS_LOCAL_TIME")
        value = valid[0]
    try:
        return value.astimezone(UTC)
    except (OverflowError, ValueError) as exc:
        raise ConversionError("TIMESTAMP_PARSE_ERROR") from exc


def convert_value(
    value: object, spec: Mapping[str, Any], options: FieldOptions = FieldOptions()
) -> object:
    """Return native typed value; never apply optional-error-to-null silently here."""
    _check_options(options)
    if isinstance(value, str) and options.trim:
        value = value.strip()
    if value is None or (isinstance(value, str) and value in options.null_tokens):
        if not _nullable(spec):
            raise ConversionError("REQUIRED_VALUE_MISSING")
        return None
    physical = spec["x-physical-type"]
    if physical in {"bigint", "int", "int32", "int64"}:
        if isinstance(value, bool) or not isinstance(value, (str, int)):
            raise ConversionError("INTEGER_PARSE_ERROR")
        if isinstance(value, str) and not re.fullmatch(r"[+-]?[0-9]+", value):
            raise ConversionError("INTEGER_PARSE_ERROR")
        try:
            value = int(value)
        except ValueError as exc:
            raise ConversionError("INTEGER_OVERFLOW") from exc
        bits = 64 if physical in {"bigint", "int64"} else 32
        if not -(2 ** (bits - 1)) <= value < 2 ** (bits - 1):
            raise ConversionError("INTEGER_OVERFLOW")
    elif physical.startswith("decimal"):
        value = _decimal(value, spec, options)
    elif physical == "date32":
        value = _date(value, options)
    elif physical == "timestamp[us,UTC]":
        try:
            value = _timestamp(value, options)
        except ConversionError:
            raise
        except (OverflowError, ValueError) as exc:
            raise ConversionError("TIMESTAMP_PARSE_ERROR") from exc
    elif physical in {"boolean", "bool"}:
        if not isinstance(value, bool):
            if isinstance(value, str) and value in options.true_tokens:
                value = True
            elif isinstance(value, str) and value in options.false_tokens:
                value = False
            else:
                raise ConversionError("INVALID_BOOLEAN")
    elif physical.startswith("varchar") or physical in {"utf8", "text"}:
        if not isinstance(value, str):
            raise ConversionError("STRING_TYPE_ERROR")
        value = unicodedata.normalize("NFC", value)
        if len(value) > spec.get("maxLength", len(value)):
            raise ConversionError("STRING_LENGTH_ERROR")
        if "pattern" in spec and re.search(spec["pattern"], value) is None:
            raise ConversionError("PATTERN_ERROR")
    else:
        raise ConversionConfigurationError("UNSUPPORTED_PHYSICAL_TYPE")
    if isinstance(value, (int, Decimal)) and not isinstance(value, bool):
        low, high = (
            spec.get("minimum", spec.get("x-minimum")),
            spec.get("maximum", spec.get("x-maximum")),
        )
        if (low is not None and value < Decimal(str(low))) or (
            high is not None and value > Decimal(str(high))
        ):
            raise ConversionError("VALUE_RANGE_ERROR")
    return value


@dataclass(frozen=True)
class TypeIssue:
    locator: str
    field: str
    code: str
    severity: str
    rule_version: str


@dataclass(frozen=True)
class TypedRow:
    locator: str
    values: dict[str, object]
    pending_s4: dict[str, object]


@dataclass(frozen=True)
class TypeResult:
    key: MappingKey
    batch_id: str
    input_version: str
    conversion_version: str
    accepted: tuple[TypedRow, ...]
    rejected_locators: tuple[str, ...]
    issues: tuple[TypeIssue, ...]
    mapping_issues: tuple[MappingIssue, ...]
    preview: bool
    inspected_count: int
    total_count: int
    silver_ready: bool = False


class TypeStandardizationService:
    def __init__(
        self,
        *,
        key: MappingKey,
        conversion_version: str,
        contract: Mapping[str, Any],
        options: Mapping[str, FieldOptions] | None = None,
    ) -> None:
        if not conversion_version.strip() or contract["x-version"] != key.target_schema_version:
            raise ConversionConfigurationError("CONVERSION_VERSION_MISMATCH")
        if key.entity not in contract["$defs"]:
            raise ConversionConfigurationError("ENTITY_NOT_FOUND")
        self.key = key
        self.version = conversion_version
        self.spec = deepcopy(contract["$defs"][key.entity])
        if self.spec["x-owner"] != key.domain_id:
            raise ConversionConfigurationError("DOMAIN_MISMATCH")
        self.options = dict(options or {})
        if set(self.options) - set(self.spec["properties"]):
            raise ConversionConfigurationError("UNKNOWN_FIELD_OPTIONS")
        for name, option in self.options.items():
            _check_options(option)
            if option.invalid_optional_to_null and not _nullable(self.spec["properties"][name]):
                raise ConversionConfigurationError("REQUIRED_FIELD_CANNOT_NULL_ON_ERROR")
            if option.invalid_optional_to_null and (
                name in self.spec["x-primary-key"]
                or "x-references" in self.spec["properties"][name]
            ):
                raise ConversionConfigurationError("IDENTITY_CANNOT_NULL_ON_ERROR")

    def standardize(
        self,
        mapped: MappingResult,
        *,
        derivation_inputs: Mapping[str, Mapping[str, object]] | None = None,
        derivation_input_version: str | None = None,
    ) -> TypeResult:
        if mapped.key != self.key:
            raise ConversionConfigurationError("MAPPING_KEY_MISMATCH")
        if derivation_inputs is not None and derivation_input_version != mapped.input_version:
            raise ConversionConfigurationError("DERIVATION_VERSION_MISMATCH")
        accepted: list[TypedRow] = []
        rejected: list[str] = list(mapped.rejected_locators)
        issues: list[TypeIssue] = []
        properties = self.spec["properties"]
        for row in mapped.accepted:
            values: dict[str, object] = {}
            pending: dict[str, object] = {}
            failed = False
            if set(row.values) - set(properties):
                raise ConversionConfigurationError("UNDECLARED_TARGET_FIELD")
            for name, spec in properties.items():
                if name.startswith("_"):
                    continue  # Run/audit enrichment belongs to P5.
                option = self.options.get(name, FieldOptions())
                raw: object
                try:
                    derived = spec.get("x-derived-from")
                    if derived:
                        inputs = (derivation_inputs or {}).get(row.locator, {})
                        if derived not in inputs:
                            raise ConversionError("DERIVATION_INPUT_REQUIRED")
                        birth = convert_value(
                            inputs[derived],
                            {"type": ["string", "null"], "x-physical-type": "date32"},
                            option,
                        )
                        raw = birth.year if isinstance(birth, date) else None
                    else:
                        if name not in row.values:
                            raise ConversionError("REQUIRED_SOURCE_FIELD_MISSING")
                        raw = row.values[name]
                    if (
                        name in self.spec["x-primary-key"]
                        or "x-references" in spec
                        or "enum" in spec
                    ):
                        # Preserve source identity and unrecognized labels until S4.
                        if raw is None and not _nullable(spec):
                            raise ConversionError("REQUIRED_VALUE_MISSING")
                        if "enum" in spec:
                            pending[name] = convert_value(raw, spec, option)
                        else:
                            if isinstance(raw, str) and raw in option.null_tokens:
                                raw = None
                            if raw is None and not _nullable(spec):
                                raise ConversionError("REQUIRED_VALUE_MISSING")
                            if raw is not None and (
                                isinstance(raw, bool) or not isinstance(raw, (str, int))
                            ):
                                raise ConversionError("SOURCE_ID_TYPE_ERROR")
                            pending[name] = deepcopy(raw)
                        continue
                    values[name] = convert_value(raw, spec, option)
                except ConversionError as exc:
                    allow_null = (
                        option.invalid_optional_to_null
                        and _nullable(spec)
                        and exc.code
                        not in {"REQUIRED_SOURCE_FIELD_MISSING", "DERIVATION_INPUT_REQUIRED"}
                    )
                    issues.append(
                        TypeIssue(
                            row.locator,
                            name,
                            exc.code,
                            "warning" if allow_null else "error",
                            self.version,
                        )
                    )
                    if allow_null:
                        if "enum" in spec:
                            pending[name] = None
                        else:
                            values[name] = None
                    else:
                        failed = True
            if failed:
                rejected.append(row.locator)
            else:
                accepted.append(TypedRow(row.locator, values, pending))
        return TypeResult(
            mapped.key,
            mapped.batch_id,
            mapped.input_version,
            self.version,
            tuple(accepted),
            tuple(rejected),
            tuple(issues),
            mapped.issues,
            mapped.preview,
            mapped.inspected_count,
            mapped.total_count,
        )
