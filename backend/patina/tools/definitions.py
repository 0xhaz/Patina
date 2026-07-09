"""Qwen native function-calling definitions + dispatch for the custom tools."""

from __future__ import annotations

from typing import Callable

from patina.tools.memory_tool import memory_search
from patina.tools.registry import registry_lookup, sanctions_check


def policy_lookup(doc_type: str) -> dict:
    """Return the onboarding policy requirements for a document type."""
    policies = {
        "registration": {"required_fields": ["entity_name", "tax_id"],
                          "note": "Registration/credit code must be present and legible."},
        "bank": {"required_fields": ["account_holder", "account_no"],
                 "note": "Account holder may differ from entity if a legitimate trading name."},
        "insurance": {"required_fields": ["policy_no", "coverage", "policy_expiry"],
                      "note": "Policy must be unexpired as of the onboarding date."},
    }
    return policies.get(doc_type, {"error": f"unknown doc_type {doc_type}"})


# OpenAI/Qwen-compatible tool schemas.
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "registry_lookup",
            "description": "Look up a company in the business registry; returns registration status.",
            "parameters": {
                "type": "object",
                "properties": {
                    "entity_name": {"type": "string"},
                    "country": {"type": "string", "description": "ISO-ish country code, e.g. MY"},
                },
                "required": ["entity_name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "sanctions_check",
            "description": "Screen a name against denied-party / sanctions lists.",
            "parameters": {
                "type": "object",
                "properties": {"name": {"type": "string"}},
                "required": ["name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "memory_search",
            "description": "Search the learned memory store for prior resolved cases.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                    "scope": {"type": "string", "enum": ["format", "exception", "entity", "episodic"]},
                    "country": {"type": "string"},
                    "doc_type": {"type": "string"},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "policy_lookup",
            "description": "Get the onboarding policy requirements for a document type.",
            "parameters": {
                "type": "object",
                "properties": {"doc_type": {"type": "string", "enum": ["registration", "bank", "insurance"]}},
                "required": ["doc_type"],
            },
        },
    },
]

DISPATCH: dict[str, Callable[..., dict]] = {
    "registry_lookup": registry_lookup,
    "sanctions_check": sanctions_check,
    "memory_search": memory_search,
    "policy_lookup": policy_lookup,
}
