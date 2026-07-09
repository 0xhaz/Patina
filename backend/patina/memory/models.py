"""Pydantic models for memory items and retrieval results."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from patina.memory.config import Scope


class RetrievalResult(BaseModel):
    """A retrieved memory item with its full score breakdown — the breakdown is
    what makes the hybrid ranker explainable to judges (not a black box)."""

    id: int
    scope: Scope
    country: str | None
    doc_type: str | None
    vendor_category: str | None
    payload: dict
    relevance: float
    use_count: int
    last_used_at: datetime
    # score components
    semantic_sim: float
    structured_match: float
    decay_weight: float
    final_score: float
