CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE public.session_messages
SET content_hash = encode(digest('message|' || role || '|' || coalesce(turn_id, '') || '|' || content, 'sha256'), 'hex')
WHERE content_hash IS NULL;

UPDATE public.session_edits
SET content_hash = encode(digest('edit|' || coalesce(turn_id, '') || '|' || summary || '|' || array_to_string(files_changed, ',') || '|' || array_to_string(migrations, ',') || '|' || coalesce(version, ''), 'sha256'), 'hex')
WHERE content_hash IS NULL;

UPDATE public.session_reads
SET content_hash = encode(digest('read|' || coalesce(turn_id, '') || '|' || file_path || '|' || coalesce(purpose, '') || '|' || coalesce(key_findings, ''), 'sha256'), 'hex')
WHERE content_hash IS NULL;