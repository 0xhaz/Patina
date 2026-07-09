"""Explicit pipeline state — Pydantic, persisted per vendor (pause/resume + audit)."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from patina.extraction.schemas import ExtractedDoc
from patina.validation.rules import Flag, PacketFacts

Status = Literal["processing", "needs_review", "auto_approved", "resolved"]


class MemoryNote(BaseModel):
    """A memory-backed suggestion attached to a flag or surfaced as a soft note."""

    text: str
    seen_count: int = 1
    memory_id: int | None = None


class SurfacedException(BaseModel):
    """A flag that survived Memory-Consult and needs a human decision."""

    flag: Flag
    suggestion: MemoryNote | None = None  # "here's how we handled this last time"


class Submission(BaseModel):
    vendor_id: str
    doc_paths: dict[str, str]  # 'registration'|'bank'|'insurance' -> image path
    country: str | None = None
    language: str | None = None  # 'zh'|'ja'|None (drives the format-novelty check)
    category: str | None = None
    doc_format: str | None = None
    latin_name: str | None = None  # display only (romanized entity name)


class PipelineState(BaseModel):
    vendor_id: str
    country: str | None = None
    language: str | None = None
    category: str | None = None
    doc_format: str | None = None
    latin_name: str | None = None
    doc_paths: dict[str, str] = Field(default_factory=dict)

    extracted: dict[str, ExtractedDoc] = Field(default_factory=dict)
    facts: PacketFacts | None = None
    candidate_flags: list[Flag] = Field(default_factory=list)

    format_recognized: bool | None = None
    surfaced: list[SurfacedException] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)  # soft, memory-suppressed observations

    stage: str = "intake"
    status: Status = "processing"
    human_touches: int = 0

    @property
    def entity_name(self) -> str | None:
        return self.facts.entity_name if self.facts else None
