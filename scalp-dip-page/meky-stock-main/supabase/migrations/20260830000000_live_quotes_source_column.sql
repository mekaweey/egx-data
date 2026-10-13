-- Add `source` column to live_quotes so we can see whether each row came
-- from the legacy Firebase wire-format path, the new REST-endpoint path,
-- or any future source we add. NULLABLE for full backward compatibility:
-- existing rows simply have source = NULL, and the backend route accepts
-- (and ignores) payloads that don't include the field.
ALTER TABLE public.live_quotes ADD COLUMN IF NOT EXISTS source TEXT;

-- Index for quick "show me the rows from this source" queries.
CREATE INDEX IF NOT EXISTS live_quotes_source_ts_idx
  ON public.live_quotes (source, ts DESC);
