"""Decay curve + usefulness-reset + per-scope divergence. Pure math, no DB."""

import pytest

from patina.memory import decay
from patina.memory.config import halflife_seconds


def test_decay_monotonically_decreases_with_time():
    hl = halflife_seconds("format")
    scores = [decay.effective_score(1.0, dt, hl) for dt in (0, hl, 2 * hl, 4 * hl)]
    assert scores == sorted(scores, reverse=True)
    assert all(a > b for a, b in zip(scores, scores[1:]))


def test_one_halflife_halves_the_score():
    hl = halflife_seconds("exception")
    assert decay.effective_score(1.0, hl, hl) == pytest.approx(0.5, abs=1e-9)


def test_fresh_item_scores_full_relevance():
    assert decay.effective_score(0.7, 0.0, halflife_seconds("entity")) == pytest.approx(0.7)


def test_bump_resets_usefulness_and_caps_at_one():
    assert decay.bump(0.5, 0.2) == pytest.approx(0.7)
    assert decay.bump(0.95, 0.2) == 1.0  # capped
    assert decay.bump(1.0, 0.2) == 1.0


def test_per_scope_halflife_diverges():
    # Same relevance and elapsed time; format (slow) must retain more than episodic (fast).
    dt = 30 * 86400  # 30 days
    fast = decay.effective_score(1.0, dt, halflife_seconds("episodic"))  # 14-day halflife
    slow = decay.effective_score(1.0, dt, halflife_seconds("format"))  # 180-day halflife
    assert slow > fast
    assert fast < 0.3 and slow > 0.85  # episodic nearly forgotten; format barely faded
