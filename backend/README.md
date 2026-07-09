# Patina — Backend

Python 3.12 · FastAPI · Qwen (DashScope, Singapore) · Postgres + pgvector.
See `../workplan.md` for the full plan; this is the Phase 0 scaffold.

## Quick start (local)

```bash
cd backend
cp .env.example .env          # then paste your DASHSCOPE_API_KEY
uv sync                        # create venv + install (writes uv.lock)
docker compose up -d           # local pgvector on :5432
uv run python scripts/smoke_test.py
```

Expect `4/4 checks passed` once the key is set and Docker is up.

## Layout

- `patina/config.py` — env-driven settings (model IDs, base URL, DB).
- `patina/llm.py` — Qwen text / vision / embedding wrappers (OpenAI-compatible + retries).
- `patina/db.py` — Postgres + pgvector connection helper.
- `app.py` — minimal FastAPI **proof** app for Function Compute (`/proof` round-trips Qwen).
- `scripts/smoke_test.py` — Phase 0 exit check (text + vision + embeddings + pgvector).
- `Dockerfile` / `s.yaml` — FC custom-container deploy (Serverless Devs).
- `docker-compose.yml` — local pgvector.

## Deploy the proof app to Function Compute

See `../docs/alibaba-setup.md` for console steps. Once `s` is configured:

```bash
# build + push image to ACR, then:
s deploy
# hit the returned URL:  GET /proof
```
