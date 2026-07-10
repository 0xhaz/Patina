# Patina — 3‑minute demo script (end‑to‑end, live)

**Goal:** land the "it learned in front of you" beat by **uploading documents**, **watching a
vendor move through the pipeline stages**, resolving the exception, and seeing the **memory
compound** — all on live data (Vercel → Alibaba Function Compute → ApsaraDB RDS + Qwen).

Headline **Scenario A** (CJK — plays to Qwen's strength and shows the agent learning two
writing systems *separately*), with a fast Scenario B counter if time allows.

The demo files live in `demo_data/<scenario>/vendor_0N/` (each folder has
`business_registration.png`, `bank_letter.png`, `insurance_certificate.png`). Drag all three
at once — the intake page auto‑sorts them by filename. PNG or PDF both work.

## Setup (off camera)

- App open at **/dashboard** (Vercel URL, or local `pnpm dev` with `NEXT_PUBLIC_API_BASE` =
  the Function Compute URL). It talks to the live Alibaba backend.
- **Reset to an empty store** so everything visibly grows on camera:
  ```bash
  cd backend && set -a && . ./.env && set +a && \
    DATABASE_URL="$RDS_DATABASE_URL" uv run python scripts/demo_control.py clear
  ```
- Tabs/pages to move between: **Dashboard · Vendor intake · Pipeline · Review queue · Memory explorer.**
- **Pre‑warm once** (cold start + first vision calls are slower): run the arc, then `clear` again.

---

## Timeline

### 0:00–0:20 — The pain (on the empty Dashboard)
> "Before a company can pay a new supplier, someone reads a messy document packet —
> registration, bank letter, insurance — validates every field, cross‑checks it against policy,
> and flags the real problems. It's slow, and a static tool never gets better at it."

On screen: the empty dashboard — all counters at 0. Tagline: *"Onboarding that gets sharper every time."*

### 0:20–0:50 — Ingest vendor 1 (Vendor intake)
Go to **Vendor intake**. Drag vendor_01's three files into the dropzone (they auto‑sort into
Registration / Bank / Insurance). Set **Country = China**. Click **Run onboarding**.

> "First vendor — a Chinese supplier. Watch Qwen‑VL read every field, in Chinese, and score its
> own confidence."

On screen: the "Onboarding…" spinner, then the extracted fields fill in (all **High**
confidence) and it comes back **Flagged**. The **Review queue badge in the sidebar ticks to 1.**

**Explain the screen (the one line that clears up the apparent contradiction):**
> "It read every field cleanly — all high‑confidence — but it's never seen this Chinese
> registration *layout* before, so it flags the *document* as novel and asks a human to confirm
> it once. High confidence on the values; cautious because the format is new. Let's watch that run."

### 0:50–1:30 — Watch it move through the pipeline (Pipeline)
Go to **Pipeline**. The flagged vendor is already selected in the picker.

> "Here's that single vendor moving through the stages — Intake, Extraction, Validation, Memory
> check, Exception routing — and it's paused at **Human review**."

On screen: the **stepper** (green through Exception routing, spinner on Human review), the
**Extracted fields** table (entity name, credit code, holder — all high‑confidence CJK), and the
**exception**: *"Novel Chinese registration layout … low confidence."*

Click **Approve & teach memory**.

> "A human confirms it — and the stepper completes to Decision. But here's the point: the agent
> just recorded *how* this was resolved."

On screen: stepper goes fully green; status flips to auto‑approved.

### 1:30–1:45 — The memory is born (Memory explorer)
Go to **Memory explorer**.

> "A brand‑new Format memory: 'Recognized Chinese 营业执照 layout, ID in the header.' Relevance
> 60%, Stable, recalled zero times — learned once, never reused. Watch what the next vendor does to it."

On screen: one **Format memory** card — **60% · Stable · Times recalled 0.**

### 1:45–2:10 — Vendor 2 sails through (Intake → Pipeline)
Back to **Vendor intake**. Drag vendor_02's three files, **Country = China**, **Run onboarding**.

> "Second Chinese vendor, same format. No flag — **auto‑approved, zero human touches.**"

On screen: green **Auto‑approved**, "Format recognized from memory." (Optionally open **Pipeline**,
select vendor 2 → the stepper is **all green**, no exceptions.)

### 2:10–2:25 — The payoff: memory reinforced (Memory explorer)
Re‑open **Memory explorer**.

> "And look — recognizing that vendor didn't just save a human touch, it *strengthened the
> memory*. Relevance 60% → 80%, now Reinforced, recall count 0 → 1. The more it's used, the more
> it trusts it. That's the patina."

On screen: the same card — **80% · Reinforced · Times recalled 1.**

### 2:25–2:45 — It learned Japanese *separately* (fast)
On **Vendor intake**: upload vendor_03 (**Country = Japan**) → **flags again** → approve on
**Pipeline**. Upload vendor_04 (**Country = Japan**) → **auto‑approved.**

> "New writing system — Japanese. It flags once, learns the 履歴事項証明書 format, and the next
> Japanese vendor sails through. It learned Chinese, then Japanese — *separately*."

Flip to **Dashboard**: vendors and metrics have grown; human‑touches tell the story.

*(Optional Scenario B, ~10s: upload B/vendor_01 [Malaysia] → flags a trading‑name mismatch →
approve → upload B/vendor_03 → auto‑approved with a suppressed‑mismatch note. "It stopped
crying wolf.")*

### 2:45–3:00 — Close
> "Under the hood: a custom memory engine — multi‑scoped, with purposeful decay and a hybrid
> retriever — running on Alibaba Cloud: Function Compute, ApsaraDB with pgvector, and Qwen for
> vision and reasoning. False flags fall to zero. Human touches fall to zero. Patina develops a
> patina — it gets sharper every time. Track 1: MemoryAgent."

Optional: flash the architecture diagram (`docs/architecture.md`).

---

## How the pages map to the story

| Page | What it shows live |
|---|---|
| **Dashboard** | Counters + recent activity — the "before" (all zero) and the growth |
| **Vendor intake** | Drop documents → pipeline runs → fields + confidence + flag/auto‑approve |
| **Pipeline** | A selected vendor's run: **stage stepper**, extracted fields, exceptions, Approve/Override |
| **Review queue** | Only genuine novel exceptions; the sidebar badge ticks live |
| **Memory explorer** | The learned store; a card is **created** (60%) then **reinforced** (80%, recalled 1) |

## Practice packets (test before recording)

```bash
python3 demo_data/generate_test.py        # writes demo_data/_test/vendor_01..03
```

| Packet | Country | Behaviour |
|---|---|---|
| `_test/vendor_01` | China | novel if memory empty → flags; recognized once CN format learned |
| `_test/vendor_02` | Malaysia | bank‑holder mismatch → flags (unless MY exception already learned → note) |
| `_test/vendor_03` | Singapore | insurance **expired** → **always flags**, regardless of memory |

`vendor_03` is the reliable "always flags" test. To rehearse the full **flag → approve →
next‑one‑recognized** loop, `demo_control clear` first.

## Tips / fallbacks
- Behaviour depends on memory state: with memory seeded, same‑country vendors auto‑approve;
  **clear memory to show the learning moment live.**
- If an upload is slow on camera, the "Onboarding…" spinner covers it — keep narrating.
- The **Pipeline picker** lets you re‑show any vendor's run (flagged vs recognized) at any time.
- Restore the full 12‑vendor steady state for a "before" shot:
  `DATABASE_URL="$RDS_DATABASE_URL" uv run python scripts/run_demo.py`.
- Terminal‑only alternative (no UI): `demo_control.py onboard A 1` / `resolve A-1` / `onboard A 2`.
- Keep the "running on Alibaba" proof clip separate: `curl <FC-url>/proof`.
