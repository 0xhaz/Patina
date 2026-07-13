# Patina — 3‑minute demo script (end‑to‑end, live)

**Goal:** land the "it learned in front of you" beat by **uploading documents**, **watching a
vendor move through the pipeline stages**, resolving the exception, and seeing the **memory
compound** — all on live data (Vercel → Alibaba Function Compute → ApsaraDB RDS + Qwen).

Headline **Scenario A** (Chinese — **format memory**; plays to Qwen's CJK strength), then
**Scenario B** (trading-name trap — **exception memory**) to show a *second, different* kind of
learning: not recognizing a layout, but suppressing a false alarm.

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

### 0:20–0:50 — Drop vendor 1's documents (Vendor intake)
Go to **Vendor intake**. Drag vendor_01's three files into the dropzone (they auto‑sort into
Registration / Bank / Insurance). Set **Country = China**. Click **Run onboarding**.

> "First vendor — a Chinese supplier. I just drop the packet and hit run. Qwen‑VL reads it, the
> agent validates and checks its memory, and it opens the run in the pipeline."

On screen: the intake is a simple upload form — on run it shows "Onboarding…", then **auto‑opens
the Pipeline page** for this vendor. (The Review queue badge in the sidebar ticks to 1.)

### 0:50–1:30 — Watch it move through the pipeline (Pipeline)
You land on **Pipeline** with the vendor already selected. *(This is also the one vendor that
reached a human — the **Review queue** badge in the sidebar shows 1; the queue is the human's
inbox, and every item there links straight to its run here.)*

> "Here's that single vendor moving through the stages — Intake, Extraction, Validation, Memory
> check, Exception routing — paused at **Human review**."

On screen: the **stepper** (green through Exception routing, spinner on Human review), the
**Extracted fields** table (entity name, credit code, holder — all **High** confidence CJK), and
the **exception**: *"Novel Chinese registration layout … low confidence."*

**Explain the screen (clears up the apparent contradiction):**
> "It read every field cleanly — all high‑confidence — but it's never seen this Chinese
> registration *layout* before, so it flags the *document* as novel and asks a human to confirm
> once. High confidence on the values; cautious because the format is new."

Click **Approve & teach memory**.

> "A human confirms it — the stepper completes to Decision. And the point: the agent just recorded
> *how* this was resolved."

On screen: stepper goes fully green; status flips to auto‑approved; the exception panel becomes
*"Resolved — written to memory."*

### 1:30–1:45 — The memory is born (Memory explorer)
Go to **Memory explorer**.

> "A brand‑new Format memory: 'Recognized Chinese 营业执照 layout, ID in the header.' Relevance
> 60%, Stable, recalled zero times — learned once, never reused. Watch what the next vendor does to it."

On screen: one **Format memory** card — **60% · Stable · Times recalled 0.**

### 1:45–2:10 — Vendor 2 sails through
Back to **Vendor intake**. Drag vendor_02's three files, **Country = China**, **Run onboarding**.

> "Second Chinese vendor, same format."

On screen: it lands on **Pipeline** with the stepper **all green** and **no exceptions** —
*"Format recognized from memory."*

> "No flag — **auto‑approved, zero human touches** — because it remembered."

### 2:10–2:25 — The payoff: memory reinforced (Memory explorer)
Re‑open **Memory explorer**.

> "And look — recognizing that vendor didn't just save a human touch, it *strengthened the
> memory*. Relevance 60% → 80%, now Reinforced, recall count 0 → 1. The more it's used, the more
> it trusts it. That's the patina."

On screen: the same card — **80% · Reinforced · Times recalled 1.**

### 2:25–2:45 — A different kind of memory: it stops crying wolf (Scenario B)
On **Vendor intake**: upload **B/vendor_01** (**Country = Malaysia**) → it **flags a trading-name
mismatch** → approve on **Pipeline**. Then upload **B/vendor_03** (**Country = Malaysia**) →
**auto-approved** with a suppressed-mismatch note.

> "And it's not just document formats. This vendor banks under a *trading name* that differs from
> its registered entity — a naive validator screams fraud every time. I approve it once as
> legitimate, and the next trading-name mismatch is now just a quiet note, not a false alarm.
> **It stopped crying wolf** — a second, different kind of memory."

Flip to **Dashboard**: vendors and metrics have grown; human-touches tell the story. *(The
**Memory explorer** now holds **two** cards — a **Format** memory and an **Exception** memory —
two distinct things the agent has learned.)*

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
| **Vendor intake** | Drop the three documents + country → run → hands off to the Pipeline page |
| **Pipeline** | The vendor's run: **stage stepper**, extracted fields + confidence, exceptions, Approve/Override |
| **Review queue** | The human's **triage inbox** — only pending exceptions; each row links into its Pipeline run (badge ticks live). Approve/Override happens on the Pipeline |
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
