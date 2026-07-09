"""Extraction schemas — per-field value + confidence.

A generic ExtractedField/ExtractedDoc pair (rather than a rigid model per doc type)
keeps extraction flexible while still giving Pydantic validation and a clean
`min_confidence()` for the low-confidence → human / OCR-fallback gate.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

DocType = Literal["registration", "bank", "insurance"]

# field key -> natural-language description handed to the vision model
DOC_FIELDS: dict[DocType, dict[str, str]] = {
    "registration": {
        "entity_name": "the registered company/entity name, in its original script",
        "tax_id": "the official registration number / unified social credit code / corporate number",
        "legal_rep": "the legal representative or director name (null if absent)",
    },
    "bank": {
        "account_holder": "the bank account holder name, exactly as written",
        "account_no": "the bank account number",
    },
    "insurance": {
        "policy_no": "the insurance policy number",
        "coverage": "the coverage limit including currency, e.g. 'USD 2,000,000'",
        "policy_expiry": "the policy expiry/expiration date, normalized to 'DD Mon YYYY'",
        "insured": "the insured entity name (null if absent)",
    },
}


class ExtractedField(BaseModel):
    value: str | None = None
    confidence: float = Field(0.0, ge=0.0, le=1.0)


class ExtractedDoc(BaseModel):
    doc_type: DocType
    fields: dict[str, ExtractedField]
    model_used: str

    def value(self, key: str) -> str | None:
        f = self.fields.get(key)
        return f.value if f else None

    def min_confidence(self) -> float:
        return min((f.confidence for f in self.fields.values()), default=0.0)
