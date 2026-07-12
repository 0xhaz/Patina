-- Patina memory store — single table, four logical scopes.
-- Relational metadata + embeddings live together so hybrid retrieval is one query.
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS memory_items (
    id              bigserial PRIMARY KEY,
    scope           text        NOT NULL,          -- format | exception | entity | episodic
    -- structured signal (deterministic, high-precision filter/gate)
    country         text,
    doc_type        text,
    vendor_category text,
    -- the distilled fact (hierarchical extraction — a compact rule, not a transcript)
    payload         jsonb       NOT NULL,
    embedding       vector(1024),                  -- semantic signal (text-embedding-v4)
    -- decay state
    relevance       double precision NOT NULL DEFAULT 0.5,
    last_used_at    timestamptz NOT NULL DEFAULT now(),
    use_count       integer     NOT NULL DEFAULT 0,
    -- hard-invalidation layer (distinct from decay: 'known-wrong', not 'fading')
    invalidated_at  timestamptz,
    used_by         jsonb       NOT NULL DEFAULT '[]'::jsonb,  -- [{id,name}] vendors this memory served
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- Idempotent migration for tables created before used_by existed.
ALTER TABLE memory_items ADD COLUMN IF NOT EXISTS used_by jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS memory_items_scope_idx ON memory_items (scope);
CREATE INDEX IF NOT EXISTS memory_items_struct_idx
    ON memory_items (country, doc_type, vendor_category);

-- Approximate-NN index is unnecessary at demo scale; enable when data grows:
-- CREATE INDEX ON memory_items USING hnsw (embedding vector_cosine_ops);
