"""Memory-Consult + Learn — the novel stage that produces compounding behaviour.

Consult: before flagging, ask memory — is this document format known? has this
exception been resolved before? Recognized patterns are suppressed (format hit → no
low-confidence flag; known trading-name mismatch → soft note, not a hard flag).

Learn: after a human resolves a surfaced exception, distil it back into memory so the
next vendor benefits. Structured filters (country/doc_type) are the primary gate, so
retrieval is robust even if embeddings drift.
"""

from __future__ import annotations

import psycopg

from patina import llm
from patina.memory import store as mem_store
from patina.memory.retrieval import retrieve
from patina.pipeline.state import MemoryNote, PipelineState, SurfacedException
from patina.validation.rules import Flag

FORMAT_HIT_THRESHOLD = 0.35
EXCEPTION_HIT_THRESHOLD = 0.35


def _format_desc(st: PipelineState) -> str:
    return (
        f"business registration document layout for country {st.country}, "
        f"{st.language} script, official ID code located in the header band"
    )


def _exception_desc() -> str:
    return (
        "bank account holder name differs from the registered entity name; "
        "legitimate trading or DBA name for the same entity, not fraud"
    )


# --- Consult ----------------------------------------------------------------

def _format_recognized(conn: psycopg.Connection, st: PipelineState) -> bool:
    # A document format is country-specific (Chinese 营业执照 != Japanese 履歴事項証明書),
    # so recognition requires a SAME-COUNTRY hit. v1 retrieval scores country only softly,
    # so we apply the structured match as a hard gate here (the consult layer's call) —
    # this is what keeps the two scripts learned separately in scenario A.
    hits = retrieve(
        conn, llm.embed(_format_desc(st)), "format",
        country=st.country, doc_type="registration", k=5,
    )
    match = next(
        (h for h in hits if h.country == st.country and h.final_score >= FORMAT_HIT_THRESHOLD),
        None,
    )
    if match is not None:
        mem_store.mark_used(conn, match.id, "format", used_by_vendor=_vendor_ref(st))
        return True
    return False


def _vendor_ref(st: PipelineState) -> dict:
    return {"id": st.vendor_id, "name": st.latin_name or st.entity_name or st.vendor_id}


def _exception_recognized(conn: psycopg.Connection, st: PipelineState) -> MemoryNote | None:
    hits = retrieve(
        conn, llm.embed(_exception_desc()), "exception",
        country=st.country, doc_type="bank", k=1,
    )
    if hits and hits[0].final_score >= EXCEPTION_HIT_THRESHOLD:
        hit = hits[0]
        rel, count = mem_store.mark_used(conn, hit.id, "exception", used_by_vendor=_vendor_ref(st))
        return MemoryNote(
            text=f"Known trading-name pattern — {hit.payload.get('rule', 'resolved as legitimate before')}",
            seen_count=count,
            memory_id=hit.id,
        )
    return None


def memory_consult(conn: psycopg.Connection, st: PipelineState) -> PipelineState:
    st.surfaced = []
    st.notes = []

    # 1) Format memory — only novel non-Roman layouts must be learned (Latin is known).
    if st.language in ("zh", "ja"):
        st.format_recognized = _format_recognized(conn, st)
        if not st.format_recognized:
            st.candidate_flags.insert(0, Flag(
                code="low_confidence_extraction",
                severity="hard",
                field="business_registration",
                message=f"Novel {st.language} registration layout (non-Roman, ID in header) — low confidence.",
            ))

    # 2) Route each candidate flag: memory-recognized -> soft note; else -> surface.
    for flag in st.candidate_flags:
        if flag.code == "bank_holder_mismatch":
            note = _exception_recognized(conn, st)
            if note is not None:
                st.notes.append(f"{flag.message} (suppressed: seen {note.seen_count}×)")
                continue
            st.surfaced.append(SurfacedException(flag=flag))
        else:
            st.surfaced.append(SurfacedException(flag=flag))
    return st


# --- Learn (write-back on human resolution) ---------------------------------

def learn_format(conn: psycopg.Connection, st: PipelineState) -> int:
    label = {"zh": "营业执照", "ja": "履歴事項全部証明書"}.get(st.language or "", "registration")
    return mem_store.add_memory(
        conn, "format",
        payload={"rule": f"Recognized {st.language} {label} layout; ID code in header band",
                 "source": "human_confirmation"},
        embedding=llm.embed(_format_desc(st)),
        country=st.country, doc_type="registration", relevance=0.6,
        used_by=[_vendor_ref(st)],
    )


def learn_exception(conn: psycopg.Connection, st: PipelineState) -> int:
    return mem_store.add_memory(
        conn, "exception",
        payload={"rule": "Bank account holder differing from entity is an acceptable trading/DBA name",
                 "source": "human_resolution"},
        embedding=llm.embed(_exception_desc()),
        country=st.country, doc_type="bank", relevance=0.6,
        used_by=[_vendor_ref(st)],
    )
