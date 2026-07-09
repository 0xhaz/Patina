"""Patina backend — FastAPI app.

Serves the dashboard API (/api/*) plus the Alibaba Cloud Function Compute proof
endpoint (/proof). Locally: `uv run uvicorn app:app --reload --port 9000`.
"""

from __future__ import annotations

import os
import platform

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from patina import llm
from patina.api.routes import router as api_router
from patina.config import settings

app = FastAPI(title="Patina", version="0.1.0")

# Demo/dev CORS — the v0 frontend (Vercel/localhost) calls this backend directly.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/")
def root() -> dict:
    return {"service": "patina", "version": "0.1.0", "ok": True}


@app.get("/health")
def health() -> dict:
    return {"status": "healthy", "key_configured": settings.has_key}


@app.get("/debug/db")
def debug_db() -> dict:
    """Diagnostic: attempt a DB round-trip and surface the real error (temporary)."""
    from patina import db

    host = "?"
    try:
        host = db._conn_kwargs(settings.database_url)["host"]
        with db.connect() as c, c.cursor() as cur:
            cur.execute("SELECT count(*) FROM vendors")
            n = cur.fetchone()[0]
        return {"ok": True, "vendors": n, "host": host}
    except Exception as e:  # noqa: BLE001
        return {"ok": False, "error": f"{type(e).__name__}: {e}"[:300], "host": host}


@app.get("/proof")
def proof() -> dict:
    """Round-trips through Qwen to prove live model access from this host."""
    try:
        reply = llm.chat("Reply with exactly: PATINA_LIVE_ON_ALIBABA")
        qwen_ok = "PATINA_LIVE" in reply
        detail = reply.strip()[:80]
    except Exception as e:  # noqa: BLE001
        qwen_ok, detail = False, f"{type(e).__name__}: {e}"
    return {
        "running_on": "Alibaba Cloud Function Compute",
        "region_hint": settings.dashscope_base_url,
        "model": settings.qwen_backbone_model,
        "qwen_reachable": qwen_ok,
        "qwen_reply": detail,
        "host": platform.node(),
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("FC_SERVER_PORT", os.getenv("PORT", "9000")))
    uvicorn.run(app, host="0.0.0.0", port=port)
