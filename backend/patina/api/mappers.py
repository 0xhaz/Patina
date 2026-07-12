"""Map backend models → the frontend's TypeScript shapes (web/lib/data.ts)."""

from __future__ import annotations

from datetime import datetime, timezone

from patina.memory.config import SCOPE_CONFIG
from patina.memory.decay import effective_score
from patina.pipeline.state import PipelineState

# country code -> (flag emoji, display name)
_COUNTRY = {
    "CN": ("🇨🇳", "China"),
    "JP": ("🇯🇵", "Japan"),
    "MY": ("🇲🇾", "Malaysia"),
    "SG": ("🇸🇬", "Singapore"),
}

_FIELD_LABELS = {
    "entity_name": "Legal entity name",
    "tax_id": "Registration / credit code",
    "legal_rep": "Legal representative",
    "account_holder": "Bank account holder",
    "account_no": "Bank account number",
    "policy_no": "Insurance policy no.",
    "coverage": "Coverage limit",
    "policy_expiry": "Policy expiry",
    "insured": "Insured entity",
}
_FIELD_SOURCE = {  # doc_type in extracted -> frontend DocType
    "registration": "registration",
    "bank": "bank",
    "insurance": "insurance",
}


def flag_emoji(country: str | None) -> str:
    return _COUNTRY.get(country or "", ("🏳️", ""))[0]


def country_name(country: str | None) -> str:
    return _COUNTRY.get(country or "", ("", country or "—"))[1]


def confidence_band(c: float) -> str:
    return "high" if c >= 0.85 else "medium" if c >= 0.6 else "low"


def vendor_status(row_status: str, has_hard_flag: bool) -> str:
    """DB status -> frontend VendorStatus ('auto-approved'|'needs-review'|'flagged')."""
    if row_status == "auto_approved" or row_status == "resolved":
        return "auto-approved"
    if row_status == "needs_review":
        return "flagged" if has_hard_flag else "needs-review"
    return "needs-review"


def vendor_row_to_json(row: dict) -> dict:
    """A `vendors` table row (joined w/ its state for hard-flag detection) -> Vendor."""
    has_hard = row.get("has_hard_flag", False)
    return {
        "id": row["id"],
        "name": row.get("name") or row["id"],
        "latinName": row.get("latin_name") or row.get("name") or row["id"],
        "country": country_name(row.get("country")),
        "flag": flag_emoji(row.get("country")),
        "status": vendor_status(row["status"], has_hard),
        "submitted": _ago(row.get("updated_at")),
        "humanTouches": row.get("human_touches", 0),
        "docFormat": row.get("doc_format") or "",
    }


def state_to_detail(st: PipelineState) -> dict:
    """Full PipelineState -> vendor detail (fields + confidence, exceptions + memory)."""
    fields = []
    for doc_type, doc in st.extracted.items():
        for key, f in doc.fields.items():
            if f.value is None:
                continue
            fields.append({
                "label": _FIELD_LABELS.get(key, key),
                "value": f.value,
                "confidence": confidence_band(f.confidence),
                "source": _FIELD_SOURCE.get(doc_type, "registration"),
            })
    exceptions = []
    for i, se in enumerate(st.surfaced):
        exc = {
            "id": f"{st.vendor_id}-e{i}",
            "code": se.flag.code,
            "field": se.flag.field,
            "severity": "flagged" if se.flag.severity == "hard" else "needs-review",
            "reasoning": se.flag.message,
        }
        if se.suggestion:
            exc["memory"] = {
                "summary": "Similar case resolved before",
                "detail": se.suggestion.text,
                "seenCount": se.suggestion.seen_count,
            }
        exceptions.append(exc)
    return {
        "vendor": vendor_row_to_json({
            "id": st.vendor_id, "name": st.entity_name, "latin_name": st.latin_name,
            "country": st.country, "status": st.status, "human_touches": st.human_touches,
            "doc_format": st.doc_format, "updated_at": None,
            "has_hard_flag": any(se.flag.severity == "hard" for se in st.surfaced),
        }),
        "fields": fields,
        "exceptions": exceptions,
        "notes": st.notes,
        "stage": st.stage,
        "formatRecognized": st.format_recognized,
    }


def memory_row_to_json(row: dict) -> dict:
    """A `memory_items` row -> MemoryItem (relevance %, decay state, recall count)."""
    scope = row["scope"]
    hl = SCOPE_CONFIG[scope]["halflife_days"] * 86400.0
    dt = (datetime.now(timezone.utc) - row["last_used_at"]).total_seconds()
    eff = effective_score(row["relevance"], dt, hl)
    floor = SCOPE_CONFIG[scope]["floor"]
    if eff >= 0.7:
        state = "reinforced"
    elif eff >= floor:
        state = "stable"
    else:
        state = "decaying"
    rule = (row.get("payload") or {}).get("rule", "")
    used_by = row.get("used_by") or []
    return {
        "id": str(row["id"]),
        "type": scope if scope in ("format", "exception", "entity") else "exception",
        "title": rule[:60] or f"{scope} memory",
        "description": rule,
        "relevance": round(eff * 100),
        "state": state,
        "lastUsed": _ago(row["last_used_at"]),
        "learned": _ago(row.get("created_at")),
        "recalled": row.get("use_count", 0),
        "usedBy": used_by,  # [{id, name}] vendors this memory served
    }


def _ago(ts: datetime | None) -> str:
    if ts is None:
        return "just now"
    now = datetime.now(timezone.utc)
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    secs = max(0, (now - ts).total_seconds())
    if secs < 60:
        return "just now"
    if secs < 3600:
        return f"{int(secs // 60)} min ago"
    if secs < 86400:
        return f"{int(secs // 3600)}h ago"
    return f"{int(secs // 86400)}d ago"
