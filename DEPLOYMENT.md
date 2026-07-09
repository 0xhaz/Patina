# Alibaba Cloud Deployment Proof

The Patina backend runs on **Alibaba Cloud** (region **Singapore / ap‑southeast‑1**) and
calls **Qwen Cloud (Model Studio / DashScope)**. This file documents the proof and points
to the exact source files that use Alibaba Cloud services and APIs.

## Live endpoint

Backend on **Function Compute**: `https://patina-full-qjbptfpokf.ap-southeast-1.fcapp.run`

Verify live model access from the deployed function (round‑trips through Qwen):

```bash
curl https://patina-full-qjbptfpokf.ap-southeast-1.fcapp.run/proof
# {"running_on":"Alibaba Cloud Function Compute","model":"qwen3.7-plus","qwen_reachable":true,
#  "qwen_reply":"PATINA_LIVE_ON_ALIBABA", ...}
```

The full API reads live data from ApsaraDB RDS:

```bash
curl https://patina-full-qjbptfpokf.ap-southeast-1.fcapp.run/api/vendors   # 12 vendors from RDS
```

## Alibaba Cloud services used → the code that uses them

| Alibaba Cloud service | What it does here | Source file |
|---|---|---|
| **Function Compute** (custom container) | Hosts the FastAPI backend; HTTP trigger | [`backend/s.full.yaml`](backend/s.full.yaml), [`backend/Dockerfile`](backend/Dockerfile), [`backend/app.py`](backend/app.py) |
| **Model Studio / DashScope** (Qwen Cloud API) | Vision extraction, reasoning, function‑calling, embeddings | [`backend/patina/llm.py`](backend/patina/llm.py) |
| **ApsaraDB RDS PostgreSQL + pgvector** | Memory store + vendor master (relational + vectors) | [`backend/patina/db.py`](backend/patina/db.py), [`backend/patina/memory/schema.sql`](backend/patina/memory/schema.sql) |

### The key API calls

- **Qwen Cloud API** — the OpenAI‑compatible client is pointed at the DashScope Singapore
  endpoint in [`backend/patina/llm.py`](backend/patina/llm.py):
  `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`, using models `qwen3.7-plus`
  (vision + reasoning + tools), `qwen-vl-ocr` (fallback), `text-embedding-v4` (embeddings),
  and `qwen-flash` (memory distillation).
- **Function Compute deploy** — [`backend/s.full.yaml`](backend/s.full.yaml) defines the
  custom‑container function, HTTP trigger, and environment (DashScope key, RDS `DATABASE_URL`).
  Deployed with Serverless Devs (`s deploy`).
- **ApsaraDB RDS** — [`backend/patina/db.py`](backend/patina/db.py) connects to the managed
  PostgreSQL instance; [`schema.sql`](backend/patina/memory/schema.sql) creates the pgvector
  extension and the memory table.

## Architecture

See **[docs/architecture.md](docs/architecture.md)** for the full system diagram (Vercel →
Function Compute → ApsaraDB RDS + Qwen Cloud).
