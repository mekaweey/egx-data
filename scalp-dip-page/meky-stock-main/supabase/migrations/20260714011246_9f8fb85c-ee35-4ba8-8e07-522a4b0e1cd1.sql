CREATE TABLE public.extension_diag (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ts timestamptz NOT NULL DEFAULT now(),
  client_id text,
  symbol text,
  visibility_state text,
  audio_paused boolean,
  audio_muted boolean,
  audio_ready_state int,
  audio_current_time numeric,
  depth_count_30s int,
  last_depth_age_ms bigint,
  extra jsonb
);
CREATE INDEX idx_extension_diag_ts ON public.extension_diag (ts DESC);
GRANT SELECT, INSERT ON public.extension_diag TO anon;
GRANT SELECT, INSERT ON public.extension_diag TO authenticated;
GRANT ALL ON public.extension_diag TO service_role;
ALTER TABLE public.extension_diag ENABLE ROW LEVEL SECURITY;
CREATE POLICY "diag_insert_anon" ON public.extension_diag FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "diag_insert_auth" ON public.extension_diag FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "diag_read_anon" ON public.extension_diag FOR SELECT TO anon USING (true);
CREATE POLICY "diag_read_auth" ON public.extension_diag FOR SELECT TO authenticated USING (true);