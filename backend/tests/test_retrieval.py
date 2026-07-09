"""Hybrid retrieval + store behaviour against real pgvector.

These are the tests that prove the engine is more than a vector-store wrapper:
the structured gate corrects a semantically-close-but-wrong-country case, decay
breaks ties, hard-invalidation excludes, and the soft-forget floor hides stale items.
"""

import math

from patina.memory import store
from patina.memory.config import EMBED_DIM
from patina.memory.retrieval import retrieve


def unit_vector(dim: int, components: dict[int, float]) -> list[float]:
    """Build a `dim`-length vector with the given index->value entries (rest 0),
    so tests control cosine similarity precisely without calling the model."""
    v = [0.0] * dim
    for i, val in components.items():
        v[i] = val
    return v


def _cos_vec(sim: float) -> list[float]:
    """Unit vector whose cosine similarity to [1,0,0,...] is exactly `sim`."""
    return unit_vector(EMBED_DIM, {0: sim, 1: math.sqrt(max(0.0, 1 - sim * sim))})


QUERY = unit_vector(EMBED_DIM, {0: 1.0})  # reference direction


def test_structured_gate_corrects_wrong_country(conn):
    # Wrong-country item is a slightly BETTER semantic match, but should lose.
    wrong = store.add_memory(
        conn, "exception", {"rule": "TH mismatch"}, _cos_vec(1.00),
        country="TH", doc_type="bank",
    )
    right = store.add_memory(
        conn, "exception", {"rule": "CN mismatch"}, _cos_vec(0.95),
        country="CN", doc_type="bank",
    )
    results = retrieve(conn, QUERY, "exception", country="CN", doc_type="bank", k=5)
    assert [r.id for r in results][0] == right, "structured match must override raw similarity"
    top = results[0]
    assert top.structured_match == 1.0  # matches both country + doc_type
    # The wrong-country row is still returned (soft signal, not a hard drop in v1)...
    assert wrong in [r.id for r in results]
    # ...but ranks below: it matches doc_type only (1 of 2 provided filters) -> 0.5,
    # and that partial credit isn't enough to beat the full structured match.
    assert next(r for r in results if r.id == wrong).structured_match == 0.5


def test_decay_breaks_ties(conn):
    # Two identical-similarity, identical-metadata items; the recently-used one wins.
    stale = store.add_memory(
        conn, "episodic", {"case": "old"}, _cos_vec(1.0),
        last_used_at=None,
    )
    fresh = store.add_memory(conn, "episodic", {"case": "new"}, _cos_vec(1.0))
    # Backdate `stale` far enough that its decay_weight drops but stays above floor.
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE memory_items SET last_used_at = now() - interval '20 days' WHERE id = %s",
            (stale,),
        )
    conn.commit()
    results = retrieve(conn, QUERY, "episodic", k=5)
    ids = [r.id for r in results]
    assert ids.index(fresh) < ids.index(stale)
    assert next(r for r in results if r.id == fresh).decay_weight > \
        next(r for r in results if r.id == stale).decay_weight


def test_reuse_bump_raises_relevance(conn):
    item = store.add_memory(conn, "format", {"layout": "zh"}, _cos_vec(1.0))
    rel, count = store.mark_used(conn, item, "format")
    assert count == 1
    assert rel == 0.7  # 0.5 default + 0.20 format bump


def test_hard_invalidation_excluded(conn):
    item = store.add_memory(conn, "format", {"layout": "ja"}, _cos_vec(1.0), country="JP")
    assert retrieve(conn, QUERY, "format", country="JP")  # present before
    store.invalidate(conn, item)
    assert retrieve(conn, QUERY, "format", country="JP") == []  # gone after


def test_soft_forget_floor_hides_stale_but_keeps_row(conn):
    item = store.add_memory(conn, "episodic", {"case": "ancient"}, _cos_vec(1.0))
    # Push far past the episodic halflife (14d) so effective score falls under the floor.
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE memory_items SET last_used_at = now() - interval '200 days' WHERE id = %s",
            (item,),
        )
    conn.commit()
    assert retrieve(conn, QUERY, "episodic") == []  # soft-forgotten (skipped)
    with conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM memory_items WHERE id = %s", (item,))
        assert cur.fetchone()[0] == 1  # still in the store — revivable, honest 'growing' visual


def test_scope_isolation(conn):
    store.add_memory(conn, "format", {"x": 1}, _cos_vec(1.0))
    assert retrieve(conn, QUERY, "exception") == []  # different scope, no leakage
    assert len(retrieve(conn, QUERY, "format")) == 1
