"""Postgres + pgvector connection helper (local mirrors ApsaraDB RDS)."""

from __future__ import annotations

import psycopg

from patina.config import settings


def _conn_kwargs(url: str) -> dict:
    """Parse a postgres URL into keyword args, robust to special characters
    (e.g. '@' or ':') in a RAW password — libpq/urlparse choke on those, so we split
    on the LAST '@' (host/dbname never contain one) and the FIRST ':' of the creds.
    Values are used literally (the URL carries a raw, un-encoded password)."""
    after = url.split("://", 1)[1]
    creds, hostpart = after.rsplit("@", 1)
    user, _, password = creds.partition(":")
    hostport, _, dbname = hostpart.partition("/")
    dbname = dbname.split("?", 1)[0]
    host, _, port = hostport.partition(":")
    return {
        "host": host,
        "port": int(port) if port else 5432,
        "user": user,
        "password": password,
        "dbname": dbname,
    }


def connect() -> psycopg.Connection:
    """Open a connection. Caller manages the lifecycle (use as a context manager)."""
    return psycopg.connect(**_conn_kwargs(settings.database_url))


def ensure_pgvector() -> None:
    """Create the vector extension if missing. Safe to call repeatedly."""
    with connect() as conn, conn.cursor() as cur:
        cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        conn.commit()
