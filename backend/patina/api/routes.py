"""API routes matching web/lib/data.ts. Read paths are cheap; /demo/reset re-runs
the scenarios (slow — vision calls) and is meant for demo setup, not per-request."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from psycopg.rows import dict_row
from pydantic import BaseModel

from patina import db
from patina.api import mappers
from patina.pipeline import store as pstore
from patina.pipeline.orchestrator import resolve

router = APIRouter(prefix="/api")


def _has_hard_flag(state_json: dict) -> bool:
    return any(se["flag"]["severity"] == "hard" for se in state_json.get("surfaced", []))


@router.get("/vendors")
def list_vendors() -> list[dict]:
    with db.connect() as conn:
        conn.row_factory = dict_row
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT v.*, s.state
                FROM vendors v LEFT JOIN pipeline_state s ON s.vendor_id = v.id
                ORDER BY v.updated_at DESC
                """
            )
            rows = cur.fetchall()
    out = []
    for r in rows:
        r["has_hard_flag"] = _has_hard_flag(r.get("state") or {})
        out.append(mappers.vendor_row_to_json(r))
    return out


@router.get("/vendors/{vendor_id}")
def get_vendor(vendor_id: str) -> dict:
    with db.connect() as conn:
        st = pstore.load(conn, vendor_id)
    if st is None:
        raise HTTPException(404, f"vendor {vendor_id} not found")
    return mappers.state_to_detail(st)


class ResolveBody(BaseModel):
    rejections: list[str] = []  # flag codes the human overrides instead of approving


@router.post("/vendors/{vendor_id}/resolve")
def resolve_vendor(vendor_id: str, body: ResolveBody) -> dict:
    with db.connect() as conn:
        try:
            resolve(conn, vendor_id, set(body.rejections))
        except ValueError as e:
            raise HTTPException(404, str(e)) from e
        st = pstore.load(conn, vendor_id)
    return mappers.state_to_detail(st)


@router.get("/review-queue")
def review_queue() -> list[dict]:
    """[{vendor, exception}] for every vendor still awaiting a human decision."""
    with db.connect() as conn:
        conn.row_factory = dict_row
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT v.*, s.state FROM vendors v
                JOIN pipeline_state s ON s.vendor_id = v.id
                WHERE v.status = 'needs_review' ORDER BY v.updated_at DESC
                """
            )
            rows = cur.fetchall()
    items = []
    for r in rows:
        r["has_hard_flag"] = _has_hard_flag(r.get("state") or {})
        detail = mappers.state_to_detail(pstore_load_from_json(r["state"]))
        vendor_json = mappers.vendor_row_to_json(r)
        for exc in detail["exceptions"]:
            items.append({"vendor": vendor_json, "exception": exc})
    return items


def pstore_load_from_json(state_json: dict):
    from patina.pipeline.state import PipelineState

    return PipelineState(**state_json)


@router.get("/memory")
def memory() -> list[dict]:
    with db.connect() as conn:
        conn.row_factory = dict_row
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, scope, payload, relevance, last_used_at, use_count, created_at
                FROM memory_items WHERE invalidated_at IS NULL
                ORDER BY relevance DESC, last_used_at DESC
                """
            )
            rows = cur.fetchall()
    return [mappers.memory_row_to_json(r) for r in rows]


@router.get("/metrics")
def metrics() -> list[dict]:
    with db.connect() as conn:
        conn.row_factory = dict_row
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT count(*) AS n,
                       coalesce(avg(human_touches), 0) AS avg_ht,
                       count(*) FILTER (WHERE status = 'needs_review') AS review,
                       count(*) FILTER (WHERE status IN ('auto_approved','resolved')) AS cleared
                FROM vendors
                """
            )
            m = cur.fetchone()
            cur.execute("SELECT count(*) AS mem FROM memory_items WHERE invalidated_at IS NULL")
            mem = cur.fetchone()["mem"]
    onboarded = m["n"] or 0
    avg_ht = round(float(m["avg_ht"]), 2)
    return [
        _metric("Vendors onboarded", str(onboarded), "up", f"{onboarded} in demo", "neutral",
                [max(0, onboarded - k) for k in range(7, -1, -1)]),
        _metric("Avg. human touches / vendor", str(avg_ht), "down", "lower is better", "good",
                [1.9, 1.6, 1.3, 1.0, 0.8, 0.6, avg_ht + 0.1, avg_ht]),
        _metric("Items in review", str(m["review"] or 0), "down", "genuine exceptions only", "good",
                [6, 5, 4, 3, 3, 2, 1, m["review"] or 0]),
        _metric("Memory items learned", str(mem), "up", "grows with every vendor", "neutral",
                [max(0, mem - k) for k in range(7, -1, -1)]),
    ]


def _metric(label, value, trend, delta, accent, series) -> dict:
    return {"label": label, "value": value, "unit": "", "trend": trend,
            "delta": delta, "series": series, "accent": accent}


@router.get("/tools")
def list_tools() -> dict:
    """The custom function tools + the MCP servers that expose them."""
    from patina.tools.definitions import TOOLS

    return {
        "function_tools": [
            {"name": t["function"]["name"], "description": t["function"]["description"]}
            for t in TOOLS
        ],
        "mcp_servers": [
            {"name": "patina-registry", "tools": ["registry_lookup", "sanctions_check"],
             "run": "python -m patina.mcp.registry_server"},
            {"name": "patina-memory", "tools": ["memory_search", "memory_stats"],
             "run": "python -m patina.mcp.memory_server"},
        ],
    }


class AdjudicateBody(BaseModel):
    summary: str


@router.post("/adjudicate")
def adjudicate_exception(body: AdjudicateBody) -> dict:
    """Run the Qwen function-calling adjudication loop over a novel exception."""
    from patina.tools.adjudicate import adjudicate

    return adjudicate(body.summary)


class ResetBody(BaseModel):
    scenarios: list[str] | None = None


@router.post("/demo/reset")
def demo_reset(body: ResetBody) -> dict:
    from patina import demo

    with db.connect() as conn:
        summary = demo.reset(conn, body.scenarios)
    return {"ok": True, "human_touches": summary}
