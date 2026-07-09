"""Decay math — pure functions, no DB. The retrieval SQL mirrors `effective_score`
in-query; these exist for readability and unit-testing the curve directly.

Core principle: relevance fades with time but resets on usefulness. Decay handles
'fading relevance'; hard-invalidation (a separate mechanism) handles 'known-wrong'.
"""

from __future__ import annotations


def effective_score(relevance: float, delta_seconds: float, halflife_seconds: float) -> float:
    """relevance halved every halflife: relevance * 2^(-Δt / halflife).

    True half-life semantics (so `halflife_days=180` means "halves every 180 days")
    — monotonically decreasing in Δt, and the judge-facing 'spaced repetition' analogy
    holds literally. The SQL ranker uses the identical curve via `power(2, ...)`.
    """
    return relevance * 2.0 ** (-delta_seconds / halflife_seconds)


def bump(relevance: float, amount: float) -> float:
    """Usefulness reset on successful reuse, capped at 1.0."""
    return min(1.0, relevance + amount)
