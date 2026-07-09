"""Shared demo harness — builds submissions from the manifest and runs scenarios.

Used by both `scripts/run_demo.py` (CLI) and the API's /api/demo/reset endpoint so
there is a single source of truth for the demo arc.
"""

from __future__ import annotations

import json
from pathlib import Path

import psycopg

from patina.memory import store as mem_store
from patina.pipeline import store as pstore
from patina.pipeline.orchestrator import resolve, run
from patina.pipeline.state import PipelineState, Submission

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = json.loads((ROOT / "manifest.json").read_text())
DEMO_DIR = ROOT / "demo_data"

SCEN = {
    "A": "A_multilingual_cluster",
    "B": "B_trading_name_trap",
    "C": "C_expiring_insurance",
}
_COUNTRY = {"zh": "CN", "ja": "JP", "A": None, "B": "MY", "C": "SG"}
_DOC_FORMAT = {
    "zh": "CN — 营业执照", "ja": "JP — 履歴事項全部証明書",
    "MY": "MY — SSM registration", "SG": "SG — ACRA bizfile",
}
# Romanized display names for the CJK entities (the rest are already Latin).
_LATIN = {
    "上海精密机械有限公司": "Shanghai Precision Machinery",
    "深圳电子科技有限公司": "Shenzhen Electronics Technology",
    "東京精密工業株式会社": "Tokyo Precision Industries",
    "大阪海運サービス株式会社": "Osaka Shipping Services",
}


def submission_for(letter: str, scenario: str, vendor: dict) -> Submission:
    lang = vendor.get("language")
    country = _COUNTRY.get(lang) or _COUNTRY[letter]
    folder = DEMO_DIR / scenario / f"vendor_{vendor['seq']:02d}"
    entity = vendor["entity_name"]
    return Submission(
        vendor_id=f"{letter}-{vendor['seq']}",
        doc_paths={
            "registration": str(folder / "business_registration.png"),
            "bank": str(folder / "bank_letter.png"),
            "insurance": str(folder / "insurance_certificate.png"),
        },
        country=country,
        language=lang,
        doc_format=_DOC_FORMAT.get(lang) or _DOC_FORMAT.get(country or "", ""),
        latin_name=_LATIN.get(entity, entity),
    )


def vendors_of(letter: str) -> list[dict]:
    return next(s for s in MANIFEST["scenarios"] if s["scenario"] == SCEN[letter])["vendors"]


def run_vendor(conn: psycopg.Connection, letter: str, vendor: dict, auto_resolve: bool = True) -> PipelineState:
    st = run(conn, submission_for(letter, SCEN[letter], vendor))
    if auto_resolve and st.status == "needs_review":
        st = resolve(conn, st.vendor_id)  # the human approves → memory learns
    return st


def reset(conn: psycopg.Connection, letters: list[str] | None = None) -> dict:
    """Wipe memory + vendors and re-run the chosen scenarios in order."""
    letters = letters or list(SCEN)
    mem_store.apply_schema(conn)
    pstore.apply_schema(conn)
    with conn.cursor() as cur:
        cur.execute("TRUNCATE memory_items RESTART IDENTITY")
        cur.execute("TRUNCATE vendors CASCADE")
        conn.commit()
    summary = {}
    for letter in letters:
        touches = []
        for v in vendors_of(letter):
            st = run_vendor(conn, letter, v)
            touches.append(st.human_touches)
        summary[letter] = touches
    return summary
