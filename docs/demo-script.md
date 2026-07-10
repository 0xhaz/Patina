# Patina — 3‑minute demo script (UI upload version)

**Goal:** land the "it learned in front of you" beat by **uploading documents on screen** and
watching the pipeline run. Headline **Scenario A** (CJK — plays to Qwen's strength and shows
the agent learning two writing systems *separately*), then a fast Scenario B counter.

The demo files live in `demo_data/<scenario>/vendor_0N/` — each vendor folder has
`business_registration.png`, `bank_letter.png`, `insurance_certificate.png`. Drag all three
in at once; the intake page auto-sorts them by filename.

## Setup (off camera)

- App open at **/dashboard** (Vercel URL, or local `pnpm dev` with
  `NEXT_PUBLIC_API_BASE` = the Function Compute URL). The app talks to the live Alibaba backend.
- **Reset memory to empty** so the store visibly grows on camera. One terminal command,
  pointed at RDS (the cloud DB the UI reads):
  ```bash
  cd backend && set -a && . ./.env && set +a && \
    DATABASE_URL="$RDS_DATABASE_URL" uv run python scripts/demo_control.py clear
  ```
  (Everything after this is done in the browser — no terminal on camera.)
- Have a file-picker or two Finder windows ready at the vendor folders.

## Timeline

### 0:00–0:25 — The pain
> "Before a company can pay a new supplier, someone reads a messy document packet —
> registration, bank letter, insurance — validates every field, cross-checks it against
> policy, and flags problems. It's slow, and a static tool never gets better at it."

On screen: the (empty) dashboard. Tagline: *"Onboarding that gets sharper every time."*

### 0:25–1:10 — Upload vendor 1, and it flags (honest first contact)
Go to **Intake**. Drag vendor_01's three files into the dropzone (they auto-sort into
Registration / Bank / Insurance). Set **Country = China**. Click **Run onboarding**.

> "First vendor — a Chinese supplier. Watch it extract the fields with Qwen-VL — including the
> credit code from the header band, in Chinese. But it's never seen this 营业执照 layout, so it
> flags it, low confidence, and routes it to a human."

On screen: the fields table fills in (entity name, credit code, holder — all high-confidence
CJK), and a **Flagged** exception appears: *"Novel Chinese registration layout … low confidence."*

Click **Approve & teach memory**.
> "A human confirms it — and here's the point: the agent records how this was resolved."

(Optionally flip to **Memory explorer** → a new **Format** memory item has appeared.)

### 1:10–1:45 — Upload vendor 2, one pass, zero touches (the reveal)
Back to **Intake**. Drag vendor_02's three files. **Country = China**. **Run onboarding**.

> "Second Chinese vendor, same format. No flag. Extracted confidently and **auto-approved —
> zero human touches** — because it remembered."

On screen: green **Auto-approved**, "Format recognized from memory."

### 1:45–2:15 — It learned Japanese *separately*
Upload vendor_03 (**Country = Japan**) → it **flags again** (new writing system) → Approve.
Upload vendor_04 (**Country = Japan**) → **auto-approved.**

> "New script — Japanese. It flags once, learns the 履歴事項証明書 format, and the next Japanese
> vendor sails through. It learned Chinese, then Japanese — separately."

Flip to **Dashboard**: the vendor list and metrics have grown; human touches read the story.

### 2:15–2:40 — Business credibility (Scenario B, fast)
Switch scenarios (optionally `demo_control clear` again off-camera). Upload B/vendor_01
(**Country = Malaysia**):
> "This vendor banks under a trading name that differs from its registered entity — a naive
> validator screams fraud every time. It flags, I approve it as legitimate…"

Then upload B/vendor_03 (Malaysia):
> "…and the next trading-name mismatch is now just a quiet note, not a false alarm. It stopped
> crying wolf."

On screen: B/vendor_03 **auto-approved** with a suppressed-mismatch note.

### 2:40–3:00 — Close
> "Under the hood: a custom memory engine — multi-scoped, with purposeful decay and a hybrid
> retriever — running on Alibaba Cloud: Function Compute, ApsaraDB with pgvector, and Qwen for
> vision and reasoning. False flags fall to zero. Human touches fall to zero. Patina develops a
> patina — it gets sharper every time. Track 1: MemoryAgent."

Optional: flash the architecture diagram.

---

## Practice packets (test before recording)

Generate three extra vendors (distinct from the curated 12) to rehearse the upload flow:

```bash
python3 demo_data/generate_test.py        # writes demo_data/_test/vendor_01..03
```

| Packet | Country | Tests | Behaviour |
|---|---|---|---|
| `_test/vendor_01` | China | Format memory | novel if memory empty → flags; recognized once CN format learned |
| `_test/vendor_02` | Malaysia | Exception memory | bank-holder mismatch → flags (unless MY exception already learned → note) |
| `_test/vendor_03` | Singapore | Decay / invalidation | insurance **expired** → **always flags**, regardless of memory |

`vendor_03` is the reliable "always flags" test (no reset needed). To rehearse the full
**flag → approve → next-one-recognized** loop on format/exception, `demo_control clear` first.

## Tips / fallbacks
- **Pre-warm** once before recording (cold starts + first vision calls are slower): run the
  whole arc, then `demo_control clear` right before the take.
- If an upload is slow on camera, the "Onboarding…" spinner covers it; keep narrating.
- Behaviour depends on memory state: with memory seeded, same-country vendors auto-approve;
  clear memory to show the learning moment live.
- To restore the full 12-vendor steady state for a "before" shot:
  `DATABASE_URL="$RDS_DATABASE_URL" uv run python scripts/run_demo.py`.
- Terminal-only alternative (no UI): `demo_control.py onboard A 1` / `resolve A-1` / `onboard A 2`.
- Keep the "running on Alibaba" proof clip separate: `curl <FC-url>/proof`.
