CREATE TABLE public.scalp_signal_log (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  trade_date DATE NOT NULL,
  symbol TEXT NOT NULL,
  decision TEXT NOT NULL,
  last_price NUMERIC,
  day_open NUMERIC,
  ret_180s NUMERIC,
  last_tick_age_sec INTEGER,
  notes JSONB
);

GRANT SELECT ON public.scalp_signal_log TO anon, authenticated;
GRANT ALL ON public.scalp_signal_log TO service_role;

ALTER TABLE public.scalp_signal_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scalp_signal_log_public_read" ON public.scalp_signal_log
  FOR SELECT USING (true);

CREATE INDEX idx_scalp_signal_log_date ON public.scalp_signal_log (trade_date DESC, ts DESC);
CREATE INDEX idx_scalp_signal_log_symbol_date ON public.scalp_signal_log (symbol, trade_date DESC);
CREATE INDEX idx_scalp_signal_log_decision ON public.scalp_signal_log (decision, trade_date DESC);