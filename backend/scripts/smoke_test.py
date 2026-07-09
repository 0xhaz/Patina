"""Phase 0 exit criterion: prove Qwen (text + vision + embeddings) and local pgvector work.

Run from backend/:  uv run python scripts/smoke_test.py
Each step prints PASS/FAIL independently so a partial setup still gives a useful signal.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Allow running as a loose script from backend/.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from patina import db, llm  # noqa: E402
from patina.config import settings  # noqa: E402

# The repo-root registration PNG is a convenient vision target.
SAMPLE_IMAGE = Path(__file__).resolve().parents[2] / "business_registration.png"


def step(name: str, fn) -> bool:
    try:
        result = fn()
        print(f"  PASS  {name}: {result}")
        return True
    except Exception as e:  # noqa: BLE001 — smoke test wants the message, not a trace
        print(f"  FAIL  {name}: {type(e).__name__}: {e}")
        return False


def t_text() -> str:
    out = llm.chat("Reply with exactly: PATINA_OK")
    return out.strip()[:60]


def t_vision() -> str:
    if not SAMPLE_IMAGE.exists():
        raise FileNotFoundError(f"sample image not found at {SAMPLE_IMAGE}")
    out = llm.vision("In 8 words or fewer, what kind of document is this?", SAMPLE_IMAGE)
    return out.strip()[:80]


def t_embed() -> str:
    vec = llm.embed("Shanghai Precision Machinery business license")
    return f"dim={len(vec)}"


def t_pgvector() -> str:
    db.ensure_pgvector()
    with db.connect() as conn, conn.cursor() as cur:
        cur.execute("DROP TABLE IF EXISTS _smoke_vec;")
        cur.execute("CREATE TABLE _smoke_vec (id int, v vector(3));")
        cur.execute("INSERT INTO _smoke_vec VALUES (1, '[1,2,3]'), (2, '[9,9,9]');")
        cur.execute("SELECT id FROM _smoke_vec ORDER BY v <-> '[1,2,3]' LIMIT 1;")
        nearest = cur.fetchone()[0]
        cur.execute("DROP TABLE _smoke_vec;")
        conn.commit()
    return f"nearest-neighbour id={nearest} (expect 1)"


def main() -> int:
    print(f"\nPatina smoke test  (base_url={settings.dashscope_base_url})")
    print(f"DASHSCOPE_API_KEY set: {settings.has_key}\n")

    results = [
        step("Qwen text", t_text),
        step("Qwen vision", t_vision),
        step("Qwen embeddings", t_embed),
        step("local pgvector", t_pgvector),
    ]
    ok = sum(results)
    print(f"\n{ok}/{len(results)} checks passed.\n")
    return 0 if ok == len(results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
