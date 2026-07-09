"""Memory-search tool — lets the agent (or an MCP client) query the learned store."""

from __future__ import annotations

from patina import db, llm
from patina.memory.config import SCOPES, Scope
from patina.memory.retrieval import retrieve


def memory_search(
    query: str,
    scope: Scope = "exception",
    country: str | None = None,
    doc_type: str | None = None,
    k: int = 3,
) -> dict:
    """Search the memory store for prior cases relevant to `query` within a scope."""
    if scope not in SCOPES:
        return {"error": f"scope must be one of {SCOPES}", "results": []}
    emb = llm.embed(query)
    with db.connect() as conn:
        hits = retrieve(conn, emb, scope, country=country, doc_type=doc_type, k=k)
    return {
        "query": query,
        "scope": scope,
        "results": [
            {
                "rule": h.payload.get("rule"),
                "country": h.country,
                "doc_type": h.doc_type,
                "score": round(h.final_score, 3),
                "times_used": h.use_count,
            }
            for h in hits
        ],
    }


def memory_stats() -> dict:
    """Counts of learned items per scope (excludes hard-invalidated)."""
    with db.connect() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT scope, count(*) FROM memory_items WHERE invalidated_at IS NULL GROUP BY scope"
        )
        by_scope = {row[0]: row[1] for row in cur.fetchall()}
    return {"by_scope": by_scope, "total": sum(by_scope.values())}
