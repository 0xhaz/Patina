# Demo Dataset — Memory-Enabled Vendor Onboarding Agent

Synthetic vendor onboarding packets for demo testing. Three scenarios, each
engineered around **one repeated pattern** so the agent visibly improves across
vendors — the "it learned in front of you" demo beat. Each scenario targets a
**different memory mechanism**.

All data is synthetic. Entity names, IDs, and documents are invented.

---

## What's here

```
demo_data/
├── manifest.json                  <- GROUND TRUTH (extraction answers + expected flags + what memory should learn)
├── A_multilingual_cluster/        <- FORMAT memory (CJK: Chinese + Japanese)
├── B_trading_name_trap/           <- EXCEPTION memory
├── C_expiring_insurance/          <- DECAY / HARD INVALIDATION
└── _archived/A_vietnamese_cluster <- original Vietnamese scenario (superseded, kept for reference)
    └── vendor_0N/
        ├── business_registration.png (.pdf for Roman-script docs)
        ├── bank_letter.pdf / .png
        ├── insurance_certificate.pdf / .png
        └── business_registration_PHOTO.jpg   (vendor_01 only — messy phone-photo intake)
```

- **PDF** = clean digital document (the easy case).
- **PNG** = 150 dpi page render of each PDF (feed these to the vision model — your real pipeline takes images).
- **_PHOTO.jpg** = vendor_01 registration only, with rotation / vignette / warm cast / soft blur to simulate a phone photo. This is the "hard first contact" that makes vendor #1 genuinely difficult *before* memory kicks in.

`today` is pinned to **20 Jun 2026** in the manifest — scenario C's expiry logic is relative to that date.

---

## The three scenarios and their demo beats

### A — Multilingual cluster  ·  FORMAT memory  ·  CJK (Chinese + Japanese)
Four vendors in **two script clusters**, so each writing system repeats
(the learning beat needs a repeat within the scenario):
- **Vendors 1–2: Chinese** business licenses (营业执照). Unified Social Credit Code
  (统一社会信用代码) sits in a **header band** — the novel position the agent must learn.
- **Vendors 3–4: Japanese** registration certificates (履歴事項全部証明書). Corporate
  number (会社法人等番号) in a header block; Reiwa-era dates (令和8年) add real format quirk.

Flow:
- **Vendor 1 (Chinese):** novel non-Roman layout → low-confidence extraction → flagged. Human confirms. *Memory learns the Chinese 营业执照 format.*
- **Vendor 2 (Chinese):** format recognised → confident extraction → no flag.
- **Vendor 3 (Japanese):** new script → flagged again. *Memory learns the Japanese format.*
- **Vendor 4 (Japanese):** recognised → no flag.
- **Beat:** "It learned to read Chinese business licenses, then learned Japanese ones — separately." Showcases Qwen's CJK strength (its single biggest edge) AND format-memory generalisation across writing systems.

**Why this replaced the Vietnamese scenario:** it plays to Qwen's best-in-class CJK
handling — a feature + tech-choice that reinforce each other — and upgrades the beat
from "diacritics" to "different writing systems." Note for the demo: keep the extracted
**English-normalised fields** prominent on screen so judges who don't read CJK can still
see the before/after improvement. The bank + insurance docs stay in English (realistic for
cross-border onboarding) so the packet isn't wall-to-wall characters.

### B — Trading-name trap  ·  EXCEPTION memory
Bank account holder name **differs from the registered entity name** because the
vendor banks under a trading/DBA name. A naive validator flags this as fraud every time.
- **Vendor 1 (Brightpath Industrial → "BrightPath Supplies"):** flagged. Human approves as legitimate trading name. *Memory learns the exception.*
- **Vendor 2 (Summit):** clean control — holder matches, no flag (proves it's not blindly suppressing).
- **Vendors 3–4 (Cascade, Ironwood):** same mismatch pattern → recognised → surfaced as a low-confidence note, not a hard fraud flag.
- **Beat:** "It stopped crying wolf." Best business-credible metric (false-flag reduction).

### C — Expiring insurance  ·  DECAY / HARD INVALIDATION
Insurance certs with explicit expiry dates, relative to today (20 Jun 2026).
- **Vendor 1 (Keppel):** expires 01 Sep 2026 — valid, baseline accept.
- **Vendor 2 (Jurong):** expires **25 Jun 2026** — valid now but **expires within the demo window** → should surface for renewal (decay).
- **Vendor 3 (Sentosa):** expired **01 Feb 2026** — looks complete but is **already expired** → must be re-flagged (hard invalidation).
- **Vendor 4 (Changi):** expires 01 Mar 2027 — valid renewal, accept.
- **Beat:** "It knows when its own memory has gone stale." Most technically impressive — proves the invalidation layer most teams never build.

---

## How to use it for testing

1. **Extraction accuracy:** run each vendor's PNGs through the vision model, compare to `manifest.json → ground_truth` (tax_id, account_no, account_holder, policy_no, coverage, policy_expiry).
2. **Flag correctness:** compare your agent's flags to `expected_flags`. These are the genuine, novel issues a human should see.
3. **Memory behaviour:** `memory_should_learn` lists, per vendor, what the memory engine should store (vendor 1) or recall (vendors 2–4). This is how you verify the *compounding* behaviour — the core of the demo.
4. **Vision stress test:** start vendor_01 with the `_PHOTO.jpg` to make first contact realistically hard, then use clean PNGs for 2–4 so the improvement reads cleanly on camera.
5. **Pick the demo:** run all three, see which gives the cleanest "it learned" moment in rehearsal, lead with that one. A is safest, B is most business-credible, C is most technically impressive.

---

## Regenerating / extending

`generate.py` (in the working dir, not shipped here) builds everything deterministically
(seeded). To add vendors or scenarios, extend the `scenario_*()` functions and the
`expected_flags()` logic, then re-run. Fonts use DejaVu Sans for full Vietnamese coverage.

Note the manifest is the contract: if you change a document, update its ground-truth entry.
