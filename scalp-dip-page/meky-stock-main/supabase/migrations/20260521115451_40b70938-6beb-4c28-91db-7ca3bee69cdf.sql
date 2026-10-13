
CREATE TABLE public.daily_candles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  date date NOT NULL,
  open numeric NOT NULL,
  high numeric NOT NULL,
  low numeric NOT NULL,
  close numeric NOT NULL,
  volume bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (symbol, date)
);
CREATE INDEX idx_daily_candles_symbol_date ON public.daily_candles (symbol, date DESC);
ALTER TABLE public.daily_candles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_candles_public_read" ON public.daily_candles FOR SELECT USING (true);

CREATE TABLE public.market_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  index_symbol text NOT NULL,
  date date NOT NULL,
  close numeric NOT NULL,
  change_pct numeric,
  change_5d_pct numeric,
  rsi14 numeric,
  ema20 numeric,
  trend text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (index_symbol, date)
);
ALTER TABLE public.market_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "market_snapshots_public_read" ON public.market_snapshots FOR SELECT USING (true);

ALTER TABLE public.recommendations
  ADD COLUMN IF NOT EXISTS expected_next_day_pct numeric,
  ADD COLUMN IF NOT EXISTS market_trend text;
