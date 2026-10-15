"""Generic Bronze-to-Silver-to-Gold pipeline module."""

from __future__ import annotations

from app.modules.pipeline.service import PipelineOrchestrator
from app.modules.pipeline.silver_pipeline import NormalizationTask, SilverPipeline

__all__ = ["NormalizationTask", "PipelineOrchestrator", "SilverPipeline"]
