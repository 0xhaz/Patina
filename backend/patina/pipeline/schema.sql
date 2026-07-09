-- Vendor master (list view) + full pipeline state (pause/resume + audit trail).
CREATE TABLE IF NOT EXISTS vendors (
    id            text PRIMARY KEY,
    name          text,
    latin_name    text,
    country       text,
    doc_format    text,
    status        text NOT NULL DEFAULT 'processing',
    human_touches integer NOT NULL DEFAULT 0,
    updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Idempotent migration for tables created before latin_name existed.
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS latin_name text;

CREATE TABLE IF NOT EXISTS pipeline_state (
    vendor_id  text PRIMARY KEY REFERENCES vendors(id) ON DELETE CASCADE,
    state      jsonb NOT NULL,
    stage      text  NOT NULL,
    status     text  NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
);
