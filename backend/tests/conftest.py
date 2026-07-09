"""Shared test fixtures. Tests run against the local pgvector container
(docker compose up -d); each test gets a clean table.
"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from patina import db  # noqa: E402
from patina.memory import store  # noqa: E402


@pytest.fixture
def conn():
    try:
        c = db.connect()
    except Exception as e:  # pragma: no cover - surfaces missing DB clearly
        pytest.skip(f"local Postgres unavailable ({e}); run: docker compose up -d")
    store.apply_schema(c)
    with c.cursor() as cur:
        cur.execute("TRUNCATE memory_items RESTART IDENTITY")
    c.commit()
    yield c
    c.close()
