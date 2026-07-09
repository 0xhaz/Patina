"""The staged pipeline: run() to the Human-Gate, resolve() to Learn.

run() is idempotent per vendor and stops at the Human-Gate when genuine novel
exceptions remain. resolve() applies the human decision and writes learnings back to
memory (closing the compounding loop). Side-effectful memory writes happen only via
resolve() (after the gate) or as reinforcement on recognized reuse.
"""

from __future__ import annotations

import psycopg

from patina.extraction.extract import extract
from patina.pipeline import consult
from patina.pipeline import store as pstore
from patina.pipeline.state import PipelineState, Submission
from patina.validation.rules import PacketFacts, validate_packet

# doc_type in doc_paths -> extraction schema doc type
_DOC_TYPES = {"registration": "registration", "bank": "bank", "insurance": "insurance"}


def _intake(sub: Submission) -> PipelineState:
    return PipelineState(
        vendor_id=sub.vendor_id, country=sub.country, language=sub.language,
        category=sub.category, doc_format=sub.doc_format, latin_name=sub.latin_name,
        doc_paths=dict(sub.doc_paths), stage="extraction", status="processing",
    )


def _extract_all(st: PipelineState) -> PipelineState:
    for key, path in st.doc_paths.items():
        st.extracted[key] = extract(_DOC_TYPES[key], path)
    st.stage = "validation"
    return st


def _validate(st: PipelineState) -> PipelineState:
    reg = st.extracted.get("registration")
    bank = st.extracted.get("bank")
    ins = st.extracted.get("insurance")
    st.facts = PacketFacts(
        entity_name=(reg.value("entity_name") if reg else st.vendor_id) or st.vendor_id,
        account_holder=bank.value("account_holder") if bank else None,
        coverage=ins.value("coverage") if ins else None,
        policy_expiry=ins.value("policy_expiry") if ins else None,
    )
    st.candidate_flags = validate_packet(st.facts)
    st.stage = "memory_consult"
    return st


def _route_and_gate(st: PipelineState) -> PipelineState:
    st.human_touches = len(st.surfaced)
    if st.surfaced:
        st.status = "needs_review"
        st.stage = "human_gate"
    else:
        st.status = "auto_approved"
        st.stage = "learned"
    return st


def run(conn: psycopg.Connection, sub: Submission) -> PipelineState:
    """Intake → Extraction → Validation → Memory-Consult → Exception-Route → Human-Gate."""
    st = _intake(sub)
    st = _extract_all(st)
    st = _validate(st)
    st = consult.memory_consult(conn, st)
    st = _route_and_gate(st)
    pstore.save(conn, st)
    return st


def resolve(
    conn: psycopg.Connection,
    vendor_id: str,
    rejections: set[str] | None = None,
) -> PipelineState:
    """Human-Gate decision → Learn. Approves every surfaced exception except codes in
    `rejections`; writes the corresponding learnings back to memory."""
    rejections = rejections or set()
    st = pstore.load(conn, vendor_id)
    if st is None:
        raise ValueError(f"no pipeline state for vendor {vendor_id!r}")

    for se in st.surfaced:
        code = se.flag.code
        if code in rejections:
            continue  # human rejected — nothing learned as acceptable
        if code == "low_confidence_extraction":
            consult.learn_format(conn, st)
        elif code == "bank_holder_mismatch":
            consult.learn_exception(conn, st)
        # insurance_expired / expiring_soon: genuine issue — no suppression is learned,
        # so it always re-flags (the hard-invalidation guarantee).

    st.status = "resolved"
    st.stage = "learned"
    pstore.save(conn, st)
    return st
