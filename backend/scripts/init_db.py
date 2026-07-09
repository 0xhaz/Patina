"""Apply the memory schema to the configured DATABASE_URL.

    uv run python scripts/init_db.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from patina import db  # noqa: E402
from patina.memory import store as mem_store  # noqa: E402
from patina.pipeline import store as pstore  # noqa: E402


def main() -> int:
    with db.connect() as conn:
        mem_store.apply_schema(conn)
        pstore.apply_schema(conn)
    print("Schema applied: memory_items + vendors + pipeline_state (+ pgvector extension).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
