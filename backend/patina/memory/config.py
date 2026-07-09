"""Tunable memory-engine constants. Mechanism matters more than exact values
(architecture-patina.md §3.2); tune on demo_data later.
"""

from __future__ import annotations

from typing import Literal

# text-embedding-v4 returns 1024-dim vectors (confirmed in Phase 0 smoke test).
EMBED_DIM = 1024

Scope = Literal["format", "exception", "entity", "episodic"]
SCOPES: tuple[Scope, ...] = ("format", "exception", "entity", "episodic")

# Per-scope decay: different scopes forget at different rates.
#   halflife_days — larger = slower forgetting (format layouts persist; episodic fades fast)
#   bump          — relevance added on successful reuse (usefulness reset)
#   floor         — effective score below this is soft-forgotten (skipped, not deleted)
SCOPE_CONFIG: dict[Scope, dict[str, float]] = {
    "format": {"halflife_days": 180.0, "bump": 0.20, "floor": 0.10},
    "exception": {"halflife_days": 90.0, "bump": 0.25, "floor": 0.10},
    "entity": {"halflife_days": 365.0, "bump": 0.15, "floor": 0.05},
    "episodic": {"halflife_days": 14.0, "bump": 0.10, "floor": 0.15},
}

# Hybrid retrieval weights (start ~0.5 / 0.3 / 0.2; tune on demo_data).
WEIGHTS = {"semantic": 0.5, "structured": 0.3, "decay": 0.2}

# Relevance a freshly distilled item starts at (before any reuse bumps).
DEFAULT_RELEVANCE = 0.5


def halflife_seconds(scope: Scope) -> float:
    return SCOPE_CONFIG[scope]["halflife_days"] * 86400.0
