"""Deterministic validation against the manifest contract (no model calls).

Asserts the RAW candidate flags — i.e. before Memory-Consult suppression. Note the
manifest's `expected_flags` for scenario B vendors 3-4 are empty because MEMORY
downgrades the repeat trading-name mismatch to a soft note; raw validation still
detects the mismatch here (seq 1, 3, 4). Scenario C's expiry flags are pure
deterministic and match `expected_flags` directly.
"""

import json
from pathlib import Path

import pytest

from patina.validation.rules import (
    PacketFacts,
    normalize_name,
    parse_coverage,
    validate_packet,
)

MANIFEST = json.loads((Path(__file__).resolve().parents[2] / "manifest.json").read_text())


def _facts(vendor: dict) -> PacketFacts:
    gt = vendor["ground_truth"]
    return PacketFacts(
        entity_name=vendor["entity_name"],
        account_holder=gt.get("account_holder"),
        coverage=gt.get("coverage"),
        policy_expiry=gt.get("policy_expiry"),
    )


def _codes(vendor: dict) -> set[str]:
    return {f.code for f in validate_packet(_facts(vendor))}


def _vendors(scenario_name: str) -> list[dict]:
    return next(s for s in MANIFEST["scenarios"] if s["scenario"] == scenario_name)["vendors"]


# --- Scenario A: CJK cluster — holder==entity, expiry 2027 => no validation flags ---
@pytest.mark.parametrize("vendor", _vendors("A_multilingual_cluster"))
def test_scenario_a_has_no_validation_flags(vendor):
    # A's flags are low-confidence/format (extraction+memory), not deterministic validation.
    assert _codes(vendor) == set()


# --- Scenario B: trading-name mismatch detected for seq 1,3,4; clean control seq 2 ---
@pytest.mark.parametrize("vendor", _vendors("B_trading_name_trap"))
def test_scenario_b_mismatch_detection(vendor):
    codes = _codes(vendor)
    expected_mismatch = vendor["seq"] in {1, 3, 4}
    assert ("bank_holder_mismatch" in codes) is expected_mismatch


def test_scenario_b_control_vendor_is_clean():
    summit = next(v for v in _vendors("B_trading_name_trap") if v["seq"] == 2)
    assert _codes(summit) == set()  # holder == entity, proves it's not blindly flagging


# --- Scenario C: expiry logic relative to pinned today (20 Jun 2026) ---
C_EXPECTED = {1: set(), 2: {"insurance_expiring_soon"}, 3: {"insurance_expired"}, 4: set()}


@pytest.mark.parametrize("vendor", _vendors("C_expiring_insurance"))
def test_scenario_c_expiry_flags(vendor):
    assert _codes(vendor) == C_EXPECTED[vendor["seq"]]


# --- Unit checks on the helpers ---
def test_normalize_name_strips_suffixes_but_keeps_trading_distinction():
    assert normalize_name("Summit Tools & Hardware Sdn Bhd") == normalize_name("Summit Tools & Hardware")
    assert normalize_name("BrightPath Supplies") != normalize_name("Brightpath Industrial Sdn Bhd")
    # CJK identical holder/entity normalize equal (scenario A)
    assert normalize_name("上海精密机械有限公司") == normalize_name("上海精密机械有限公司")


def test_parse_coverage():
    assert parse_coverage("USD 2,000,000") == ("USD", 2_000_000.0)
    assert parse_coverage("JPY 200,000,000") == ("JPY", 200_000_000.0)
    assert parse_coverage("nonsense") is None
