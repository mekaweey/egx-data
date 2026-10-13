
CREATE TABLE public.pre_buy_gate_log (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  symbol TEXT NOT NULL,
  entry_price NUMERIC NOT NULL,
  target_price NUMERIC NOT NULL,
  qty NUMERIC NOT NULL,
  tp_pct NUMERIC NOT NULL,
  fee_pct NUMERIC NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('accept','reject')),
  reason TEXT NOT NULL,
  snapshot_ts TIMESTAMPTZ,
  snapshot_age_ms INTEGER,
  best_bid NUMERIC,
  best_ask NUMERIC,
  spread NUMERIC,
  bid_sum_at_target NUMERIC,
  source TEXT NOT NULL DEFAULT 'manual',
  meta JSONB
);
CREATE INDEX idx_pre_buy_gate_log_ts ON public.pre_buy_gate_log (ts DESC);
CREATE INDEX idx_pre_buy_gate_log_symbol_ts ON public.pre_buy_gate_log (symbol, ts DESC);
CREATE INDEX idx_pre_buy_gate_log_decision ON public.pre_buy_gate_log (decision, ts DESC);

GRANT SELECT ON public.pre_buy_gate_log TO authenticated;
GRANT ALL ON public.pre_buy_gate_log TO service_role;

ALTER TABLE public.pre_buy_gate_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read gate log" ON public.pre_buy_gate_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "service write gate log" ON public.pre_buy_gate_log
  TO service_role USING (true) WITH CHECK (true);
