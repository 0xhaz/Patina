# Patina

**Onboarding that gets sharper every time.**

Patina is a vendor‑onboarding agent that develops a *patina*: it gets richer and more
accurate the more document packets pass through it. It reads a new supplier's messy
packet (business registration, bank letter, insurance certificate), validates it against
policy, and routes **only genuine, novel exceptions** to a human — then **remembers how
each was resolved**, so the next similar vendor sails through untouched.

Built for the Global AI Hackathon with Qwen Cloud — **Track 1 (MemoryAgent)**.

---

## The problem

Vendor onboarding is universal back‑office pain: a clerk manually validates each
document, cross‑checks consistency (bank holder vs registered entity, expiry dates,
coverage), applies policy, and kicks back genuine issues. It's slow, repetitive, and
error‑prone — and a static tool never gets better at it.

## What makes Patina different

A **custom‑engineered memory layer** — not an off‑the‑shelf memory API and not a
vector‑store wrapper. It is the product, the innovation, and the reason onboarding
*compounds*:

- **Multi‑scoped memory** — format, exception, entity, and episodic scopes, each with
  its own retrieval pattern and decay rate.
- **Hierarchical distillation** — resolved cases are compressed into compact structured
  facts (e.g. *"bank trading‑name mismatch for this entity type → accept"*), not transcripts.
- **Purposeful decay + hard‑invalidation** — relevance fades with time but **resets on
  usefulness** (spaced repetition); expired certs/superseded policies are *retired*, not faded.
- **Multi‑signal hybrid retrieval** — semantic similarity **+** structured match **+** decay
  weight, combined in **one SQL query** over Postgres + pgvector.

## The demo: compounding intelligence

Three scenarios, each showcasing a different memory mechanism. Watch human‑touches fall
to zero as the agent recognizes repeated patterns:

| Scenario | Memory mechanism | Human‑touches per vendor | The beat |
|---|---|---|---|
| **A** — multilingual (Chinese + Japanese) | **Format** | `1, 0, 1, 0` | Learns Chinese 营业执照, then Japanese 履歴事項証明書 — *separately* |
| **B** — trading‑name trap | **Exception** | `1, 0, 0, 0` | Stops crying wolf: repeat holder‑name mismatches become a note, not a flag |
| **C** — expiring insurance | **Decay / invalidation** | `0, 1, 1, 0` | Knows when its own memory has gone stale |

## How the memory works

Patina does **two different jobs** on every packet; only the second is "memory."

**1. Read & check (runs every time, no memory).**
- **Extraction** — Qwen‑VL reads each of the three documents into structured fields *with a
  per‑field confidence*: registration → entity name, tax/credit code, legal rep; bank →
  account holder, account number; insurance → policy no, coverage, expiry.
- **Validation** — deterministic rules cross‑check those fields *across the documents*: bank
  **account holder** vs registered **entity name**, insurance **expiry** vs today, required
  fields. This is what catches inconsistent or incomplete packets — plain rule‑checking.

**2. Memory (the learning layer).** Memory does **not** re‑read the documents, and it does
**not** fingerprint characters or pixels. It answers one question — *"have I seen this pattern
before, and how was it handled?"* — to decide whether a flag is a **genuine novel problem** or
something **already resolved**. Items are keyed on **structured attributes** (`country`,
`doc_type`, `category`) plus a **semantic embedding** of a short description, and stored as
distilled facts across four scopes:

| Scope | Keyed on | What it learns |
|---|---|---|
| **Format** | country + `registration` | which jurisdictions' registration **layouts** it recognizes → a novel layout flags once, then is recognized |
| **Exception** | country + `bank` | how a validation exception was resolved → a repeat trading‑name mismatch becomes a note, not a hard flag |
| **Entity** | vendor identity | known vendors / duplicate detection |
| **Episodic** | raw case | a log of past cases for retrieval |

**Example (Chinese vendor).** Extraction reads the fields; validation passes (holder == entity,
policy in date); Memory‑Consult finds **no CN registration format** → *novel* → flags for a
human. On **approve**, the Learn stage writes a Format memory keyed *country=CN,
doc_type=registration*. The **next** Chinese vendor matches that key → recognized →
auto‑approved, and the memory is **reinforced** (relevance 60% → 80%). Expired insurance is the
exception that *never* gets suppressed — hard‑invalidation always re‑flags it.

**In one line:** Patina isn't matching characters or hunting for missing pages via memory — it
**learns, per country and document type, which layouts it recognizes and which flagged
exceptions a human already blessed**, so the same question is never asked twice.

## Architecture

Full detail + diagrams (system topology, agent pipeline, memory engine) in
**[docs/architecture.md](docs/architecture.md)**. The whole stack is live:

```
Vercel (Next.js)  →  Alibaba Function Compute (FastAPI)  →  ApsaraDB RDS + pgvector
                                    ↓
                        Qwen Cloud (Model Studio / DashScope)
```

The pipeline is a staged, explicit‑state flow — not a mega‑prompt:

`Intake → Extraction → Validation → Memory‑Consult → Exception‑Route → Human‑Gate → Learn`

Extraction uses `qwen3.7-plus` (multimodal, per‑field confidence) with a `qwen-vl-ocr`
fallback; validation is deterministic Python; novel exceptions are adjudicated by Qwen
**native function‑calling** over custom tools + **two MCP servers** (registry / denied‑party
lookup and memory search).

## Tech stack

| Layer | Choice |
|---|---|
| Backend | Python 3.12, FastAPI, custom staged pipeline (no agent framework) |
| Models | Qwen via Model Studio (DashScope, Singapore) — `qwen3.7-plus`, `qwen-vl-ocr`, `qwen-flash`, `text-embedding-v4` |
| Memory store | ApsaraDB RDS PostgreSQL 16 + pgvector (single store: relational + vectors) |
| Tools / MCP | Custom function tools + 2 MCP servers (`patina-registry`, `patina-memory`) |
| Compute | Alibaba Cloud Function Compute (custom container) |
| Frontend | Next.js + Tailwind, on Vercel |

## Repository layout

```
backend/        FastAPI app + the agent (patina/ package) + tests
  patina/memory/       memory engine (schema, decay, retrieval, distillation)
  patina/pipeline/     staged orchestrator + Human-Gate + Memory-Consult
  patina/extraction/   Qwen-VL extraction with per-field confidence
  patina/validation/   deterministic policy + consistency rules
  patina/tools/        function tools + Qwen function-calling adjudication
  patina/mcp/          two MCP servers
web/            Next.js dashboard (vendor list, pipeline, review, memory explorer)
demo_data/      generated demo packets (3 scenarios × 4 vendors) + generator
manifest.json   ground-truth contract for the demo set
docs/           architecture + diagrams
```

## Run it locally

```bash
# 1) Backend
cd backend
cp .env.example .env          # add your DASHSCOPE_API_KEY (Model Studio, Singapore)
uv sync
docker compose up -d           # local Postgres + pgvector
uv run python scripts/init_db.py
uv run python scripts/run_demo.py    # seed the 3 scenarios, watch the counters fall
uv run uvicorn app:app --port 9000   # API at :9000 (/docs for the OpenAPI UI)
uv run pytest                        # unit tests (memory, validation, tools)

# 2) Frontend
cd ../web
pnpm install
NEXT_PUBLIC_API_BASE=http://localhost:9000 pnpm dev   # dashboard at :3000
```

## Deployment

- **Backend** on Alibaba Cloud Function Compute (custom container) + **ApsaraDB RDS
  PostgreSQL/pgvector**, region Singapore. A minimal `/proof` endpoint round‑trips Qwen
  to demonstrate live model access from the deployed function.
- **Frontend** on Vercel, with `NEXT_PUBLIC_API_BASE` pointed at the Function Compute URL.

## License

[MIT](LICENSE). All demo data is synthetic — entity names, IDs, and documents are invented.
