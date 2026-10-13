CREATE TABLE public.live_quotes (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  uuid TEXT,
  bid NUMERIC,
  ask NUMERIC,
  spread NUMERIC,
  ts TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX live_quotes_symbol_ts_idx ON public.live_quotes (symbol, ts DESC);
CREATE INDEX live_quotes_received_at_idx ON public.live_quotes (received_at DESC);
GRANT SELECT ON public.live_quotes TO authenticated;
GRANT ALL ON public.live_quotes TO service_role;
ALTER TABLE public.live_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_can_read_live_quotes" ON public.live_quotes FOR SELECT TO authenticated USING (true);