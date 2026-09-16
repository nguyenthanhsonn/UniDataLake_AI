"""Intent parsing for natural-language questions."""

from __future__ import annotations


def parse_intent(question: str) -> str:
    """Return a coarse intent label for a question."""
    normalized = question.strip().lower()
    if any(token in normalized for token in ("bao nhiêu", "count", "total", "tổng")):
        return "aggregate"
    return "lookup"
