"""Hierarchical extraction — distill a resolved case into ONE compact memory item.

We store distilled facts (e.g. `rule: bank trading-name mismatch for entity-type Y
-> accept`), not raw transcripts — mirroring how funded memory players work and
signalling field awareness (architecture-patina.md §3.2). This is the memory-write
half of the pipeline's Learn stage.
"""

from __future__ import annotations

import json

import psycopg

from patina import llm
from patina.memory import store
from patina.memory.config import DEFAULT_RELEVANCE, Scope

_PROMPT = """You compress a RESOLVED vendor-onboarding case into one compact memory item \
that will help handle similar future vendors. Return a JSON object with exactly these keys:

- "scope": one of "format" | "exception" | "entity" | "episodic"
    format = a learned document layout (improves extraction)
    exception = how a validation exception was resolved (reduces false flags)
    entity = a known vendor / duplicate-detection fact
    episodic = a raw case record for later retrieval
- "country": ISO-ish country code the fact applies to, or null
- "doc_type": "registration" | "bank" | "insurance" | null
- "vendor_category": short category string, or null
- "rule": ONE imperative sentence (<=140 chars) stating the reusable fact/decision
- "embed_text": a concise natural-language description (<=200 chars) to embed for \
future similarity matching — describe the situation, not the resolution

Case:
{case}

Return ONLY the JSON object."""


def distill_case(case: dict, model: str | None = None) -> dict:
    """Turn a resolved-case dict into a distilled memory record (not yet stored)."""
    data = llm.chat_json(_PROMPT.format(case=json.dumps(case, ensure_ascii=False)), model=model)
    scope = data.get("scope")
    if scope not in ("format", "exception", "entity", "episodic"):
        scope = "episodic"  # graceful fallback — never lose the write
        data["scope"] = scope
    return data


def learn(
    conn: psycopg.Connection,
    case: dict,
    *,
    relevance: float = DEFAULT_RELEVANCE,
    model: str | None = None,
) -> int:
    """Distill -> embed -> store. Returns the new memory item's id.

    Called from the pipeline's Learn stage after a human resolves an exception,
    closing the compounding loop (vendor #1's resolution helps vendor #2).
    """
    d = distill_case(case, model=model)
    embedding = llm.embed(d["embed_text"])
    scope: Scope = d["scope"]
    return store.add_memory(
        conn,
        scope,
        payload={"rule": d["rule"], "source": "human_resolution"},
        embedding=embedding,
        country=d.get("country"),
        doc_type=d.get("doc_type"),
        vendor_category=d.get("vendor_category"),
        relevance=relevance,
    )
