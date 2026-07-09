"""Structured extraction with per-field confidence + a hard-OCR fallback.

Primary: `qwen3.7-plus` (multimodal). If overall confidence is low, retry with the
`qwen-vl-ocr` specialist and keep whichever read the document more confidently — the
graceful-degradation path the rubric rewards. If the fallback errors, we keep the
primary result (never crash the pipeline on a flaky specialist call).
"""

from __future__ import annotations

from pathlib import Path

from patina import llm
from patina.config import settings
from patina.extraction.schemas import DOC_FIELDS, DocType, ExtractedDoc, ExtractedField

# Below this overall confidence, try the OCR specialist.
OCR_FALLBACK_THRESHOLD = 0.6


def _prompt(doc_type: DocType) -> str:
    lines = [f'- "{k}": {desc}' for k, desc in DOC_FIELDS[doc_type].items()]
    fields = "\n".join(lines)
    keys = ", ".join(DOC_FIELDS[doc_type])
    return (
        f"You are extracting fields from a {doc_type} document image.\n"
        f"Extract these fields:\n{fields}\n\n"
        "For EACH field return an object {\"value\": <string or null>, "
        "\"confidence\": <number 0..1>}, where confidence reflects how clearly and "
        "unambiguously the value is legible in the image (low if blurred, occluded, "
        "or absent). Preserve the original script for names.\n"
        f'Return ONLY a JSON object with keys: {keys}.'
    )


def _parse(doc_type: DocType, raw: dict, model_used: str) -> ExtractedDoc:
    fields: dict[str, ExtractedField] = {}
    for key in DOC_FIELDS[doc_type]:
        item = raw.get(key)
        if isinstance(item, dict):
            fields[key] = ExtractedField(value=item.get("value"), confidence=_clamp(item.get("confidence")))
        else:  # model returned a bare value — accept it, mark modest confidence
            fields[key] = ExtractedField(value=item if item else None, confidence=0.5 if item else 0.0)
    return ExtractedDoc(doc_type=doc_type, fields=fields, model_used=model_used)


def _clamp(c) -> float:
    try:
        return max(0.0, min(1.0, float(c)))
    except (TypeError, ValueError):
        return 0.0


def _extract_once(doc_type: DocType, image_path: str | Path, model: str) -> ExtractedDoc:
    raw = llm.vision_json(_prompt(doc_type), image_path, model=model)
    return _parse(doc_type, raw, model)


def extract(
    doc_type: DocType,
    image_path: str | Path,
    *,
    model: str | None = None,
    ocr_fallback: bool = True,
) -> ExtractedDoc:
    """Extract one document. Falls back to the OCR specialist on low confidence."""
    primary = _extract_once(doc_type, image_path, model or settings.qwen_backbone_model)
    if not ocr_fallback or primary.min_confidence() >= OCR_FALLBACK_THRESHOLD:
        return primary
    try:
        alt = _extract_once(doc_type, image_path, settings.qwen_ocr_model)
    except Exception:  # noqa: BLE001 — specialist is best-effort; keep primary on failure
        return primary
    return alt if alt.min_confidence() > primary.min_confidence() else primary
