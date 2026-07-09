"""Tool-layer tests (deterministic parts; no model calls)."""

from patina.tools.definitions import DISPATCH, TOOLS, policy_lookup
from patina.tools.registry import registry_lookup, sanctions_check


def test_registry_lookup_known_entity():
    r = registry_lookup("Keppel Logistics Pte Ltd", "SG")
    assert r["found"] is True
    assert r["status"] == "active"
    assert r["registry_id"] and r["registry_id"].startswith("REG-")


def test_registry_lookup_unknown_entity():
    r = registry_lookup("Totally Unknown Widgets XYZ", "US")
    assert r["found"] is False
    assert r["registry_id"] is None


def test_policy_lookup():
    assert "account_holder" in policy_lookup("bank")["required_fields"]
    assert "error" in policy_lookup("passport")


def test_sanctions_check_shape_clean_name():
    # Network may hit OpenSanctions or fall back locally — either way the shape holds
    # and a clean demo entity must not be flagged.
    r = sanctions_check("Keppel Logistics Pte Ltd")
    assert isinstance(r["hit"], bool)
    assert r["hit"] is False
    assert r["source"] in ("opensanctions", "local_fallback")


def test_local_fallback_flags_planted_name(monkeypatch):
    # Force the API path to fail so we exercise the local denied-party fallback.
    import patina.tools.registry as reg

    def boom(*a, **k):
        raise OSError("no network")

    monkeypatch.setattr(reg.urllib.request, "urlopen", boom)
    r = reg.sanctions_check("ACME Sanctioned Corp")
    assert r["source"] == "local_fallback"
    assert r["hit"] is True


def test_tool_definitions_consistent():
    names = {t["function"]["name"] for t in TOOLS}
    assert names == set(DISPATCH)
    assert len(TOOLS) == 4
