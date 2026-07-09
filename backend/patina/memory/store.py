"""Memory store — writes (distilled facts in), reuse bumps, hard-invalidation.

Vectors are bound as text literals cast with `::vector`, which is robust across
environments (no pgvector type registration needed). Reads never select the raw
embedding, so nothing has to parse vector output.
"""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Sequence

import psycopg
from psycopg.types.json import Json

from patina.memory.config import DEFAULT_RELEVANCE, SCOPE_CONFIG, Scope

_SCHEMA = Path(__file__).with_name("schema.sql")


def apply_schema(conn: psycopg.Connection) -> None:
    """Create the extension + table + indexes. Idempotent."""
    with conn.cursor() as cur:
        cur.execute(_SCHEMA.read_text())
    conn.commit()


def to_vector_literal(vec: Sequence[float]) -> str:
    """pgvector text format: '[0.1,0.2,...]'."""
    return "[" + ",".join(repr(float(x)) for x in vec) + "]"


def add_memory(
    conn: psycopg.Connection,
    scope: Scope,
    payload: dict,
    embedding: Sequence[float],
    *,
    country: str | None = None,
    doc_type: str | None = None,
    vendor_category: str | None = None,
    relevance: float = DEFAULT_RELEVANCE,
    last_used_at: datetime | None = None,  # override for tests / backdating
) -> int:
    """Insert a distilled memory item; returns its id."""
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO memory_items
                (scope, country, doc_type, vendor_category, payload, embedding,
                 relevance, last_used_at, use_count, created_at)
            VALUES
                (%(scope)s, %(country)s, %(doc_type)s, %(vendor_category)s,
                 %(payload)s, %(embedding)s::vector,
                 %(relevance)s, COALESCE(%(last_used_at)s, now()), 0, now())
            RETURNING id
            """,
            {
                "scope": scope,
                "country": country,
                "doc_type": doc_type,
                "vendor_category": vendor_category,
                "payload": Json(payload),
                "embedding": to_vector_literal(embedding),
                "relevance": relevance,
                "last_used_at": last_used_at,
            },
        )
        item_id = cur.fetchone()[0]
    conn.commit()
    return item_id


def mark_used(conn: psycopg.Connection, item_id: int, scope: Scope) -> tuple[float, int]:
    """Successful reuse: bump relevance (usefulness reset), refresh recency, count++.
    Returns (new_relevance, new_use_count)."""
    bump = SCOPE_CONFIG[scope]["bump"]
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE memory_items
               SET relevance    = LEAST(1.0, relevance + %(bump)s),
                   last_used_at = now(),
                   use_count    = use_count + 1
             WHERE id = %(id)s
         RETURNING relevance, use_count
            """,
            {"bump": bump, "id": item_id},
        )
        row = cur.fetchone()
    conn.commit()
    return (row[0], row[1])


def invalidate(conn: psycopg.Connection, item_id: int) -> None:
    """Hard-invalidate (expired cert / superseded policy): retired, not decayed.
    Excluded from all future retrieval, but kept for the audit trail."""
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE memory_items SET invalidated_at = now() WHERE id = %(id)s",
            {"id": item_id},
        )
    conn.commit()
