
CREATE TABLE public.scalp_feasibility_report (
  id BIGSERIAL PRIMARY KEY,
  signal_id BIGINT NOT NULL,
  trade_date DATE NOT NULL,
  symbol TEXT NOT NULL,
  signal_ts TIMESTAMPTZ NOT NULL,
  entry_price NUMERIC NOT NULL,
  target_price NUMERIC NOT NULL,
  breakeven_price NUMERIC NOT NULL,
  entry_feasible BOOLEAN,
  entry_actual_price NUMERIC,
  entry_delay_sec INTEGER,
  time_to_target_sec INTEGER,
  time_to_breakeven_sec INTEGER,
  prints_at_target_count INTEGER NOT NULL DEFAULT 0,
  prints_at_target_volume NUMERIC NOT NULL DEFAULT 0,
  prints_at_breakeven_count INTEGER NOT NULL DEFAULT 0,
  max_price_60s NUMERIC,
  max_price_180s NUMERIC,
  min_price_180s NUMERIC,
  ticks_in_window INTEGER NOT NULL DEFAULT 0,
  worst_case_loss_pct NUMERIC,
  best_case_gain_pct NUMERIC,
  exit_verdict TEXT NOT NULL,
  l2_at_signal_ts TIMESTAMPTZ,
  l2_best_bid NUMERIC,
  l2_best_ask NUMERIC,
  l2_bid_depth_top5 NUMERIC,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (signal_id)
);

GRANT SELECT ON public.scalp_feasibility_report TO anon, authenticated;
GRANT ALL ON public.scalp_feasibility_report TO service_role;

ALTER TABLE public.scalp_feasibility_report ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read scalp feasibility"
  ON public.scalp_feasibility_report FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "service role write scalp feasibility"
  ON public.scalp_feasibility_report FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_sfr_date ON public.scalp_feasibility_report (trade_date DESC, signal_ts DESC);
CREATE INDEX idx_sfr_verdict ON public.scalp_feasibility_report (exit_verdict, trade_date DESC);
CREATE INDEX idx_sfr_symbol ON public.scalp_feasibility_report (symbol, trade_date DESC);
