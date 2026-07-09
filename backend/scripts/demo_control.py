"""Drive the live demo from a terminal — onboard vendors one at a time so the
'human approves → agent learns' beat plays on camera.

Point DATABASE_URL at whichever store the UI reads (local, or RDS for the cloud demo):

    # clean slate
    uv run python scripts/demo_control.py clear
    # onboard one vendor (NO auto-resolve → sits in the review queue if it flags)
    uv run python scripts/demo_control.py onboard A 1
    # (approve in the browser, or from the CLI:)
    uv run python scripts/demo_control.py resolve A-1
    # status snapshot
    uv run python scripts/demo_control.py status

Run the whole scripted arc for one scenario (pauses for you to approve in the UI):
    uv run python scripts/demo_control.py arc A
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from patina import db, demo  # noqa: E402
from patina.memory import store as mem_store  # noqa: E402
from patina.pipeline import store as pstore  # noqa: E402
from patina.pipeline.orchestrator import resolve  # noqa: E402


def _clear(conn) -> None:
    mem_store.apply_schema(conn)
    pstore.apply_schema(conn)
    with conn.cursor() as cur:
        cur.execute("TRUNCATE memory_items RESTART IDENTITY")
        cur.execute("TRUNCATE vendors CASCADE")
        conn.commit()


def _onboard(conn, letter: str, seq: int):
    vendor = next(v for v in demo.vendors_of(letter) if v["seq"] == seq)
    st = demo.run_vendor(conn, letter, vendor, auto_resolve=False)
    tag = "NEEDS REVIEW" if st.status == "needs_review" else st.status.upper()
    print(f"onboarded {st.vendor_id} [{st.entity_name}] -> {tag} (human_touches={st.human_touches})")
    for se in st.surfaced:
        print(f"    FLAG {se.flag.code} ({se.flag.severity}): {se.flag.message}")
    for note in st.notes:
        print(f"    note {note}")
    return st


def _status(conn) -> None:
    with conn.cursor() as cur:
        cur.execute("SELECT id, status, human_touches FROM vendors ORDER BY id")
        rows = cur.fetchall()
        cur.execute("SELECT count(*) FROM memory_items WHERE invalidated_at IS NULL")
        mem = cur.fetchone()[0]
    print(f"vendors: {len(rows)} | memory items: {mem}")
    for r in rows:
        print(f"  {r[0]:5} {r[1]:14} touches {r[2]}")


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    cmd = sys.argv[1]
    with db.connect() as conn:
        if cmd == "clear":
            _clear(conn)
            print("cleared — memory + vendors empty")
        elif cmd == "onboard":
            _onboard(conn, sys.argv[2].upper(), int(sys.argv[3]))
        elif cmd == "resolve":
            resolve(conn, sys.argv[2])
            print(f"resolved {sys.argv[2]} — memory updated")
        elif cmd == "status":
            _status(conn)
        elif cmd == "arc":
            letter = sys.argv[2].upper()
            _clear(conn)
            print(f"--- scenario {letter}: onboarding in order ---")
            for v in demo.vendors_of(letter):
                st = _onboard(conn, letter, v["seq"])
                if st.status == "needs_review":
                    input("    >>> approve in the UI (or press Enter to auto-approve here) ...")
                    resolve(conn, st.vendor_id)
                    print("    approved; memory updated")
            _status(conn)
        else:
            print(f"unknown command: {cmd}")
            return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
