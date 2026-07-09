# Patina — Architecture

> Onboarding that gets sharper every time. Patina onboards a supplier's messy
> document packet, validates it against policy, routes only genuine novel exceptions
> to a human — and **gets measurably better every time** by remembering document
> formats, false‑flag patterns, and how humans resolved prior exceptions.

Everything below is **live**, not aspirational: the full stack runs on Alibaba Cloud
(Function Compute + ApsaraDB RDS) calling Qwen Cloud, with the frontend on Vercel.

---

## 1. System topology (deployment)

```mermaid
flowchart TB
    U["Clerk / Reviewer"]

    subgraph VERCEL["Vercel"]
        FE["Next.js Dashboard<br/>React + Tailwind"]
    end

    subgraph ALI["Alibaba Cloud &mdash; Singapore (ap-southeast-1)"]
        subgraph FC["Function Compute &mdash; custom container"]
            API["FastAPI backend<br/>/api/* + /proof"]
            PIPE["Staged agent pipeline"]
            MEMENG["Memory engine"]
            TOOLS["Function tools + 2 MCP servers"]
        end
        RDS[("ApsaraDB RDS<br/>PostgreSQL 16 + pgvector<br/>memory + vendor master")]
    end

    subgraph QWEN["Qwen Cloud &mdash; Model Studio / DashScope"]
        M1["qwen3.7-plus<br/>vision + reasoning + tools"]
        M2["qwen-vl-ocr<br/>hard-OCR fallback"]
        M3["text-embedding-v4<br/>1024-dim embeddings"]
        M4["qwen-flash<br/>memory distillation"]
    end

    OS["OpenSanctions API<br/>(denied-party screening)"]

    U --> FE
    FE -->|"REST / JSON"| API
    API --> PIPE
    PIPE --> MEMENG
    PIPE --> TOOLS
    MEMENG -->|"SQL + pgvector cosine"| RDS
    API -->|"vendor master"| RDS

    PIPE -.->|"extraction"| M1
    PIPE -.->|"low confidence"| M2
    MEMENG -.->|"embed"| M3
    PIPE -.->|"distill on learn"| M4
    PIPE -.->|"thinking-mode adjudication"| M1
    TOOLS -.->|"sanctions_check"| OS
```

**Cloud service mapping**

| Concern | Service |
|---|---|
| Compute / API | **Function Compute** (custom‑container runtime, HTTP trigger) |
| Model access (vision, reasoning, embeddings, tools) | **Model Studio / DashScope** (Singapore) |
| Memory store + vendor master (relational **and** vectors, one store) | **ApsaraDB RDS PostgreSQL + pgvector** |
| Frontend hosting | **Vercel** (calls the Alibaba backend) |
| Denied‑party screening | **OpenSanctions** public API (with local fallback) |

---

## 2. The agent pipeline

A staged pipeline with **explicit, persisted state** (not one mega‑prompt). Each stage
is a discrete module with its own error handling and fallback. The Human‑Gate guards
every side‑effectful memory write.

```mermaid
flowchart LR
    A["Intake<br/>normalize packet"] --> B["Extraction<br/>Qwen-VL &rarr; fields + per-field confidence"]
    B --> C["Validation<br/>deterministic rules in code"]
    C --> D["Memory-Consult<br/>known format? prior resolution? duplicate?"]
    D --> E{"Genuine novel<br/>exception?"}
    E -->|"no &mdash; recognized"| F["Auto-approve"]
    E -->|"yes"| G["Human-Gate<br/>reasoning + 'how we handled this last time'"]
    G -->|"approve / override"| H["Learn<br/>distill &rarr; write to memory"]
    F --> H
    H -.->|"compounds &mdash; next vendor benefits"| D
```

**Resilience (graceful degradation, demonstrated):** low extraction confidence →
OCR fallback then flag for human; empty memory retrieval → proceed without a
suggestion; external tool failure (e.g. sanctions API) → local fallback + surface.
`tenacity` retries wrap all model/tool calls.

---

## 3. The memory engine (the differentiator)

Custom‑built — **not** an off‑the‑shelf memory API. Four scopes with different
retrieval patterns and decay rates, hierarchical distillation (compact facts, not
transcripts), a multi‑signal hybrid ranker, and a separate hard‑invalidation layer.

```mermaid
flowchart TB
    subgraph STORE["Multi-scope store &mdash; one table in RDS + pgvector"]
        SF["Format<br/>halflife 180d"]
        SX["Exception<br/>halflife 90d"]
        SN["Entity<br/>halflife 365d"]
        SE["Episodic<br/>halflife 14d"]
    end

    Q["Consult query<br/>(embedding + country + doc_type)"] --> R{{"Hybrid ranker &mdash; one SQL query"}}
    STORE --> R
    R --> S1["Semantic similarity<br/>pgvector cosine over Qwen embeddings"]
    R --> S2["Structured match<br/>country / doc_type / category gate"]
    R --> S3["Decay weight<br/>relevance &times; 2^(-&Delta;t / halflife)"]
    S1 --> SCORE["final = w1&middot;sem + w2&middot;struct + w3&middot;decay<br/>(0.5 / 0.3 / 0.2)"]
    S2 --> SCORE
    S3 --> SCORE
    SCORE --> TOPK["Top-k, above soft-forget floor"]

    INV["Hard-invalidation<br/>expired cert / superseded policy"] -.->|"retired, not decayed"| STORE
    LEARN["Learn stage<br/>qwen-flash distillation"] -.->|"reinforce on reuse / write new"| STORE
```

**Why each piece is non‑trivial (the anti‑'vector‑store wrapper' argument):**

- **Multi‑scoped**, because format layouts, exception resolutions, known entities and
  raw cases have genuinely different retrieval patterns and decay rates.
- **Decay = time × usefulness**, not pure time (would forget rare‑but‑critical rules)
  nor pure frequency (would keep stale‑but‑common ones). Relevance fades with time but
  **resets on successful reuse** (spaced‑repetition analogy). True half‑life curve.
- **Hard‑invalidation is separate from decay**: decay handles *fading relevance*;
  invalidation handles *known‑wrong* (an expired cert is retired immediately, not faded).
- **Hybrid retrieval** combines three signals in one SQL query, because pure vector
  similarity over‑retrieves semantically‑close‑but‑structurally‑wrong cases (a Chinese
  and a Japanese registration sit close in embedding space, but the rules differ) — the
  structured match is a corrective gate; decay breaks ties toward what's currently trusted.

---

## 4. The compounding demo (what the memory buys)

Three scenarios, each targeting a different memory mechanism. Human‑touches fall to
zero as the agent recognizes repeated patterns:

| Scenario | Memory mechanism | Human‑touches per vendor | Beat |
|---|---|---|---|
| **A** — multilingual (CJK) | **Format** | `1, 0, 1, 0` | Learns Chinese 营业执照, then Japanese 履歴事項証明書 — *separately* |
| **B** — trading‑name trap | **Exception** | `1, 0, 0, 0` | Stops crying wolf: repeat holder‑name mismatches suppressed to a note |
| **C** — expiring insurance | **Decay / invalidation** | `0, 1, 1, 0` | Knows when its own memory has gone stale (expiring‑soon + expired) |

---

## 5. Model selection (per stage)

Deliberate per‑task selection — an engineering‑judgment and cost signal.

| Stage | Model | Mode |
|---|---|---|
| Extraction (primary) | `qwen3.7-plus` | Multimodal, structured JSON + confidence |
| Extraction (fallback) | `qwen-vl-ocr` | Specialist OCR when confidence is low |
| Validation reasoning (fuzzy) | code first; `qwen3.7-plus` only where needed | Arithmetic/dates stay in Python |
| Novel‑exception adjudication | `qwen3.7-plus` | Native function‑calling over the tools, used sparingly |
| Memory distillation | `qwen-flash` | Compress a resolved case → one memory item |
| Retrieval embeddings | `text-embedding-v4` | 1024‑dim semantic signal |
