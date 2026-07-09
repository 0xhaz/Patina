"""Run the compounding-intelligence demo end-to-end and print the counters.

    uv run python scripts/run_demo.py            # all scenarios
    uv run python scripts/run_demo.py A          # one scenario

For each vendor: run the pipeline to the Human-Gate; if it needs review, print the
surfaced exceptions, then auto-approve (the 'human') so memory learns. Watch
human-touches fall to zero as the agent recognizes repeated patterns.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from patina import db, demo  # noqa: E402
from patina.memory import store as mem_store  # noqa: E402
from patina.pipeline import store as pstore  # noqa: E402


def run_scenario(conn, letter: str) -> None:
    print(f"\n{'=' * 70}\nSCENARIO {letter} — {demo.SCEN[letter]}\n{'=' * 70}")
    touches = []
    for v in demo.vendors_of(letter):
        st = demo.run_vendor(conn, letter, v, auto_resolve=False)
        print(f"  vendor {st.vendor_id}  [{st.entity_name}]  -> {st.status.upper()}")
        for se in st.surfaced:
            print(f"      FLAG  {se.flag.code} ({se.flag.severity}): {se.flag.message}")
        for note in st.notes:
            print(f"      note  {note}")
        if st.status == "needs_review":
            from patina.pipeline.orchestrator import resolve

            resolve(conn, st.vendor_id)
            print("      -> human approved; memory updated")
        touches.append(st.human_touches)
    print(f"\n  human touches per vendor: {touches}   (total {sum(touches)})")
    if touches and touches[0] > 0 and sum(touches[1:]) < touches[0] * (len(touches) - 1):
        print("  ✔ compounding: repeated patterns recognized — touches fall after vendor 1")


def main() -> int:
    which = [a.upper() for a in sys.argv[1:]] or list(demo.SCEN)
    with db.connect() as conn:
        mem_store.apply_schema(conn)
        pstore.apply_schema(conn)
        with conn.cursor() as cur:
            cur.execute("TRUNCATE memory_items RESTART IDENTITY")
            cur.execute("TRUNCATE vendors CASCADE")
            conn.commit()
        for letter in which:
            run_scenario(conn, letter)
    print()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
