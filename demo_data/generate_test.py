"""Generate a few EXTRA practice vendor packets (distinct from the curated 12) for
testing the upload flow before recording. Reuses the renderers in generate.py.

    python3 demo_data/generate_test.py

Writes to demo_data/_test/vendor_0N/ (gitignored). Each covers a different behaviour:
  1. Chinese registration      → format memory (flags when novel, recognized once learned)
  2. Malaysian trading-name     → exception memory (bank holder != entity)
  3. Singapore expired policy   → decay / hard-invalidation (insurance already expired)
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import generate as g  # noqa: E402

OUT = g.ROOT / "demo_data" / "_test"

VENDORS = [
    {
        "seq": 1,
        "language": "zh",
        "entity_name": "广州新材料科技有限公司",
        "country_hint": "CN",
        "ground_truth": {
            "tax_id": "91440101MA9XY7Z2K3",
            "account_holder": "广州新材料科技有限公司",  # matches → no bank flag
            "account_no": "6225 8802 1177 903",
            "policy_no": "ZH-CGL-88021",
            "coverage": "CNY 8,000,000",
            "policy_expiry": "01 Apr 2027",  # valid
            "rep_native_script": "王强",
        },
    },
    {
        "seq": 2,
        "entity_name": "Meridian Components Sdn Bhd",
        "country_hint": "MY",
        "ground_truth": {
            "tax_id": "C20551007733",
            "account_holder": "Meridian Parts",  # trading-name mismatch → exception
            "account_no": "3-88102-77410",
            "policy_no": "AZ-CGL-50880",
            "coverage": "USD 2,000,000",
            "policy_expiry": "01 Apr 2027",
        },
    },
    {
        "seq": 3,
        "entity_name": "Tanjong Marine Pte Ltd",
        "country_hint": "SG",
        "ground_truth": {
            "tax_id": "201655789E",
            "account_holder": "Tanjong Marine Pte Ltd",  # matches
            "account_no": "072-901-33418",
            "policy_no": "MG-CGL-90455",
            "coverage": "SGD 1,500,000",
            "policy_expiry": "15 Mar 2026",  # EXPIRED (before pinned today 20 Jun 2026)
        },
    },
]


def main() -> int:
    for v in VENDORS:
        folder = OUT / f"vendor_{v['seq']:02d}"
        folder.mkdir(parents=True, exist_ok=True)
        g.save_doc(g.registration_for(v), folder, "business_registration.png")
        g.save_doc(g.bank_letter(v), folder, "bank_letter.png")
        g.save_doc(g.insurance(v), folder, "insurance_certificate.png")
        print(f"  {folder.relative_to(g.ROOT)}  [{v['entity_name']}]  country={v['country_hint']}")
    print(f"Generated {len(VENDORS)} test vendors under {OUT.relative_to(g.ROOT)}/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
