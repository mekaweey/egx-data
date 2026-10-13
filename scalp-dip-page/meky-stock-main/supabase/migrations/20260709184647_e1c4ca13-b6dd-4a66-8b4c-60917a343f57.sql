CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

UPDATE public.session_messages
SET content_hash = encode(extensions.digest('message|' || role || '|' || coalesce(turn_id, '') || '|' || content, 'sha256'), 'hex')
WHERE content_hash IS NULL OR content_hash = '';

UPDATE public.session_edits
SET content_hash = encode(extensions.digest('edit|' || coalesce(turn_id, '') || '|' || summary || '|' || array_to_string(files_changed, ',') || '|' || array_to_string(migrations, ',') || '|' || coalesce(version, ''), 'sha256'), 'hex')
WHERE content_hash IS NULL OR content_hash = '';

UPDATE public.session_reads
SET content_hash = encode(extensions.digest('read|' || coalesce(turn_id, '') || '|' || file_path || '|' || coalesce(purpose, '') || '|' || coalesce(key_findings, ''), 'sha256'), 'hex')
WHERE content_hash IS NULL OR content_hash = '';

WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY content_hash ORDER BY created_at ASC, id ASC) AS rn
  FROM public.session_messages
  WHERE content_hash IS NOT NULL
)
DELETE FROM public.session_messages m
USING ranked r
WHERE m.id = r.id AND r.rn > 1;

WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY content_hash ORDER BY created_at ASC, id ASC) AS rn
  FROM public.session_edits
  WHERE content_hash IS NOT NULL
)
DELETE FROM public.session_edits e
USING ranked r
WHERE e.id = r.id AND r.rn > 1;

WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY content_hash ORDER BY created_at ASC, id ASC) AS rn
  FROM public.session_reads
  WHERE content_hash IS NOT NULL
)
DELETE FROM public.session_reads r0
USING ranked r
WHERE r0.id = r.id AND r.rn > 1;

ALTER TABLE public.session_messages
  ALTER COLUMN content_hash SET NOT NULL;

ALTER TABLE public.session_edits
  ALTER COLUMN content_hash SET NOT NULL;

ALTER TABLE public.session_reads
  ALTER COLUMN content_hash SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS session_messages_content_hash_uidx ON public.session_messages(content_hash);
CREATE UNIQUE INDEX IF NOT EXISTS session_edits_content_hash_uidx ON public.session_edits(content_hash);
CREATE UNIQUE INDEX IF NOT EXISTS session_reads_content_hash_uidx ON public.session_reads(content_hash);

CREATE INDEX IF NOT EXISTS session_messages_turn_created_idx ON public.session_messages(turn_id, created_at DESC);
CREATE INDEX IF NOT EXISTS session_edits_turn_created_idx ON public.session_edits(turn_id, created_at DESC);
CREATE INDEX IF NOT EXISTS session_reads_turn_created_idx ON public.session_reads(turn_id, created_at DESC);
CREATE INDEX IF NOT EXISTS session_ingest_audit_turn_created_idx ON public.session_ingest_audit(turn_id, created_at DESC);