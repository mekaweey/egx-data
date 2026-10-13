CREATE TABLE IF NOT EXISTS public.daily_intelligence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_date date NOT NULL,
  symbol text NOT NULL,
  name_ar text,

  -- Daily candle (EOD official)
  open numeric,
  high numeric,
  low numeric,
  close numeric,
  volume bigint,
  change_pct numeric,
  prev_close numeric,

  -- Intraday from live_ticks
  intraday_first numeric,
  intraday_last numeric,
  intraday_high numeric,
  intraday_low numeric,
  intraday_tick_count integer,
  intraday_max_drawup_pct numeric,
  intraday_max_drawdown_pct numeric,
  intraday_volume bigint,

  -- Technicals (from latest stock_snapshot)
  rsi14 numeric,
  macd numeric,
  macd_hist numeric,
  ema9 numeric,
  ema21 numeric,
  sma50 numeric,
  atr14 numeric,
  vol_ratio numeric,
  composite_score numeric,

  -- Market context that day
  breadth_pct numeric,
  market_trend text,
  market_regime text,
  egx30_change_pct numeric,

  -- News
  news_count integer DEFAULT 0,
  news_sentiment_avg numeric,
  news_high_impact_count integer DEFAULT 0,

  -- Pick / outcome
  was_picked boolean DEFAULT false,
  was_candidate boolean DEFAULT false,
  pick_confidence numeric,
  pick_reasons jsonb,
  pick_outcome text,
  pick_pnl_pct numeric,

  -- Supervised learning label (filled NEXT day)
  next_day_return_pct numeric,
  next_5d_return_pct numeric,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(trade_date, symbol)
);

GRANT SELECT ON public.daily_intelligence TO anon, authenticated;
GRANT ALL ON public.daily_intelligence TO service_role;

ALTER TABLE public.daily_intelligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_intelligence_public_read" ON public.daily_intelligence
  FOR SELECT USING (true);

CREATE POLICY "daily_intelligence_service_write" ON public.daily_intelligence
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_daily_intel_date ON public.daily_intelligence(trade_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_intel_symbol_date ON public.daily_intelligence(symbol, trade_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_intel_picked ON public.daily_intelligence(trade_date DESC) WHERE was_picked = true;

CREATE TRIGGER trg_daily_intel_updated_at
  BEFORE UPDATE ON public.daily_intelligence
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();