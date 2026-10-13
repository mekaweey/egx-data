ALTER TABLE public.session_messages
  ADD COLUMN IF NOT EXISTS content_hash TEXT;

ALTER TABLE public.session_edits
  ADD COLUMN IF NOT EXISTS content_hash TEXT;

ALTER TABLE public.session_reads
  ADD COLUMN IF NOT EXISTS content_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_session_messages_content_hash ON public.session_messages (content_hash) WHERE content_hash IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_session_edits_content_hash ON public.session_edits (content_hash) WHERE content_hash IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_session_reads_content_hash ON public.session_reads (content_hash) WHERE content_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.session_ingest_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  turn_id TEXT,
  client_batch_id TEXT,
  source TEXT NOT NULL DEFAULT 'unknown',
  items_total INTEGER NOT NULL DEFAULT 0,
  messages_count INTEGER NOT NULL DEFAULT 0,
  edits_count INTEGER NOT NULL DEFAULT 0,
  reads_count INTEGER NOT NULL DEFAULT 0,
  duplicate_count INTEGER NOT NULL DEFAULT 0,
  ok BOOLEAN NOT NULL DEFAULT false,
  error_stage TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.session_ingest_audit TO anon, authenticated;
GRANT ALL ON public.session_ingest_audit TO service_role;
ALTER TABLE public.session_ingest_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read session ingest audit" ON public.session_ingest_audit FOR SELECT USING (true);
CREATE POLICY "public insert session ingest audit" ON public.session_ingest_audit FOR INSERT WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_session_ingest_audit_created ON public.session_ingest_audit (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_ingest_audit_turn ON public.session_ingest_audit (turn_id);
CREATE INDEX IF NOT EXISTS idx_session_ingest_audit_client_batch ON public.session_ingest_audit (client_batch_id);