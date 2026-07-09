"""Deterministic validation rules → candidate flags.

`today` is pinned to 20 Jun 2026 (manifest contract) so scenario C's expiry logic is
reproducible and independent of the wall clock.
"""

from __future__ import annotations

import re
from datetime import date, datetime, timedelta
from typing import Literal

from pydantic import BaseModel

# Pinned demo date — matches manifest.json "today". Do NOT read the system clock:
# expiry flags must be reproducible for the demo.
TODAY = date(2026, 6, 20)
EXPIRING_SOON_DAYS = 14

# Company-form suffixes stripped before comparing holder vs entity names.
_SUFFIXES = [
    "sdn bhd", "pte ltd", "co ltd", "ltd", "llc", "inc", "plc", "gmbh",
    "有限责任公司", "有限公司", "株式会社", "（副本）",
]


class Flag(BaseModel):
    code: str
    severity: Literal["hard", "soft"]
    field: str
    message: str


class PacketFacts(BaseModel):
    """The cross-document facts validation reasons over (assembled from extraction)."""

    entity_name: str
    account_holder: str | None = None
    coverage: str | None = None
    policy_expiry: str | None = None


def normalize_name(name: str) -> str:
    """Lowercase, strip company-form suffixes and punctuation/space — so that
    'Summit Tools & Hardware Sdn Bhd' == 'Summit Tools & Hardware', but a genuine
    trading name ('BrightPath Supplies' vs 'Brightpath Industrial') stays different."""
    s = name.lower().strip()
    for suf in _SUFFIXES:
        s = s.replace(suf, " ")
    return re.sub(r"[^0-9a-z一-鿿぀-ヿ]", "", s)


def check_bank_holder(facts: PacketFacts) -> Flag | None:
    if not facts.account_holder:
        return None
    if normalize_name(facts.account_holder) != normalize_name(facts.entity_name):
        return Flag(
            code="bank_holder_mismatch",
            severity="hard",
            field="account_holder",
            message=(
                f"Bank account holder '{facts.account_holder}' does not match registered "
                f"entity '{facts.entity_name}'."
            ),
        )
    return None


def _parse_date(s: str) -> date | None:
    for fmt in ("%d %b %Y", "%d %B %Y", "%Y-%m-%d", "%d/%m/%Y"):
        try:
            return datetime.strptime(s.strip(), fmt).date()
        except ValueError:
            continue
    return None


def check_insurance_expiry(facts: PacketFacts) -> Flag | None:
    if not facts.policy_expiry:
        return None
    expiry = _parse_date(facts.policy_expiry)
    if expiry is None:
        return Flag(
            code="insurance_expiry_unparseable",
            severity="soft",
            field="policy_expiry",
            message=f"Could not parse insurance expiry '{facts.policy_expiry}'.",
        )
    if expiry < TODAY:
        return Flag(
            code="insurance_expired",
            severity="hard",
            field="policy_expiry",
            message=f"Insurance policy expired {facts.policy_expiry} (before {TODAY:%d %b %Y}).",
        )
    if expiry <= TODAY + timedelta(days=EXPIRING_SOON_DAYS):
        return Flag(
            code="insurance_expiring_soon",
            severity="soft",
            field="policy_expiry",
            message=(
                f"Insurance policy expires {facts.policy_expiry} "
                f"(within {EXPIRING_SOON_DAYS} days of {TODAY:%d %b %Y})."
            ),
        )
    return None


def parse_coverage(coverage: str) -> tuple[str, float] | None:
    """'USD 2,000,000' -> ('USD', 2000000.0). Enables coverage arithmetic in code;
    no minimum is enforced by default (the demo defines none)."""
    m = re.match(r"\s*([A-Za-z]{3})\s*([\d,]+(?:\.\d+)?)", coverage or "")
    if not m:
        return None
    return m.group(1).upper(), float(m.group(2).replace(",", ""))


def validate_packet(facts: PacketFacts) -> list[Flag]:
    """Run all deterministic checks; return the candidate flags (order: hard first)."""
    flags = [check_bank_holder(facts), check_insurance_expiry(facts)]
    real = [f for f in flags if f is not None]
    real.sort(key=lambda f: 0 if f.severity == "hard" else 1)
    return real
