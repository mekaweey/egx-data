CREATE TABLE public.thunder_auth_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  kind TEXT NOT NULL,
  url TEXT,
  message TEXT,
  client_id TEXT,
  extras JSONB
);
CREATE INDEX thunder_auth_events_ts_idx ON public.thunder_auth_events (ts DESC);
GRANT SELECT, INSERT ON public.thunder_auth_events TO anon, authenticated;
GRANT ALL ON public.thunder_auth_events TO service_role;
ALTER TABLE public.thunder_auth_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read auth events" ON public.thunder_auth_events FOR SELECT USING (true);
CREATE POLICY "public insert auth events" ON public.thunder_auth_events FOR INSERT WITH CHECK (true);