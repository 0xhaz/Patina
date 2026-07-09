"""Persistence for vendor master + pipeline state (enables Human-Gate pause/resume)."""

from __future__ import annotations

from pathlib import Path

import psycopg
from psycopg.types.json import Json

from patina.pipeline.state import PipelineState

_SCHEMA = Path(__file__).with_name("schema.sql")


def apply_schema(conn: psycopg.Connection) -> None:
    with conn.cursor() as cur:
        cur.execute(_SCHEMA.read_text())
    conn.commit()


def save(conn: psycopg.Connection, st: PipelineState) -> None:
    """Upsert the vendor master row and the full pipeline state."""
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO vendors (id, name, latin_name, country, doc_format, status, human_touches, updated_at)
            VALUES (%(id)s, %(name)s, %(latin)s, %(country)s, %(doc_format)s, %(status)s, %(ht)s, now())
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name, latin_name = EXCLUDED.latin_name, country = EXCLUDED.country,
                doc_format = EXCLUDED.doc_format, status = EXCLUDED.status,
                human_touches = EXCLUDED.human_touches, updated_at = now()
            """,
            {
                "id": st.vendor_id, "name": st.entity_name, "latin": st.latin_name,
                "country": st.country, "doc_format": st.doc_format, "status": st.status,
                "ht": st.human_touches,
            },
        )
        cur.execute(
            """
            INSERT INTO pipeline_state (vendor_id, state, stage, status, updated_at)
            VALUES (%(id)s, %(state)s, %(stage)s, %(status)s, now())
            ON CONFLICT (vendor_id) DO UPDATE SET
                state = EXCLUDED.state, stage = EXCLUDED.stage,
                status = EXCLUDED.status, updated_at = now()
            """,
            {
                "id": st.vendor_id, "state": Json(st.model_dump(mode="json")),
                "stage": st.stage, "status": st.status,
            },
        )
    conn.commit()


def load(conn: psycopg.Connection, vendor_id: str) -> PipelineState | None:
    with conn.cursor() as cur:
        cur.execute("SELECT state FROM pipeline_state WHERE vendor_id = %s", (vendor_id,))
        row = cur.fetchone()
    return PipelineState(**row[0]) if row else None
