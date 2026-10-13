
CREATE TABLE public.marketwatch_snapshots (
  id BIGSERIAL PRIMARY KEY,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  symbol TEXT NOT NULL,
  asset_id TEXT,
  ref_price NUMERIC,
  last_price NUMERIC,
  avg_change_prc NUMERIC,
  total_volume BIGINT,
  total_trades INTEGER,
  total_value NUMERIC,
  total_bids BIGINT,
  total_asks BIGINT,
  total_buy BIGINT,
  total_sell BIGINT,
  high_price_limit NUMERIC,
  low_price_limit NUMERIC,
  avg_5_day NUMERIC,
  avg_30_day NUMERIC,
  avg_90_day NUMERIC,
  is_same_day BOOLEAN,
  raw JSONB
);

CREATE INDEX idx_marketwatch_captured_at ON public.marketwatch_snapshots (captured_at DESC);
CREATE INDEX idx_marketwatch_symbol_captured ON public.marketwatch_snapshots (symbol, captured_at DESC);

GRANT SELECT, INSERT ON public.marketwatch_snapshots TO authenticated;
GRANT ALL ON public.marketwatch_snapshots TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.marketwatch_snapshots_id_seq TO authenticated, service_role;

ALTER TABLE public.marketwatch_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated read marketwatch" ON public.marketwatch_snapshots
  FOR SELECT TO authenticated USING (true);
