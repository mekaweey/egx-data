
-- ============================================================
-- 1. FUNDAMENTALS: per-stock financial metrics
-- ============================================================
CREATE TABLE public.fundamentals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  as_of DATE NOT NULL,
  pe_ratio NUMERIC,
  pb_ratio NUMERIC,
  roe NUMERIC,
  debt_to_equity NUMERIC,
  market_cap_egp NUMERIC,
  dividend_yield NUMERIC,
  earnings_per_share NUMERIC,
  revenue_growth_yoy NUMERIC,
  next_earnings_date DATE,
  source TEXT NOT NULL DEFAULT 'investing',
  raw_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (symbol, as_of)
);

GRANT SELECT ON public.fundamentals TO anon, authenticated;
GRANT ALL ON public.fundamentals TO service_role;

ALTER TABLE public.fundamentals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fundamentals_public_read" ON public.fundamentals FOR SELECT USING (true);

CREATE INDEX idx_fundamentals_symbol_date ON public.fundamentals(symbol, as_of DESC);

-- ============================================================
-- 2. NEWS SENTIMENT: per-stock daily news with AI sentiment
-- ============================================================
CREATE TABLE public.news_sentiment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  headline TEXT NOT NULL,
  summary_ar TEXT,
  source_url TEXT,
  source_name TEXT,
  published_at TIMESTAMPTZ,
  sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  sentiment_score NUMERIC NOT NULL DEFAULT 0,
  impact_level TEXT NOT NULL DEFAULT 'low' CHECK (impact_level IN ('high', 'medium', 'low')),
  ai_model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.news_sentiment TO anon, authenticated;
GRANT ALL ON public.news_sentiment TO service_role;

ALTER TABLE public.news_sentiment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_sentiment_public_read" ON public.news_sentiment FOR SELECT USING (true);

CREATE INDEX idx_news_symbol_date ON public.news_sentiment(symbol, published_at DESC);
CREATE INDEX idx_news_sentiment ON public.news_sentiment(sentiment, published_at DESC);

-- ============================================================
-- 3. MACRO INDICATORS: economy-wide signals
-- ============================================================
CREATE TABLE public.macro_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  as_of DATE NOT NULL,
  usd_egp NUMERIC,
  gold_usd NUMERIC,
  brent_oil_usd NUMERIC,
  cbe_interest_rate NUMERIC,
  inflation_yoy NUMERIC,
  sp500_close NUMERIC,
  sp500_change_pct NUMERIC,
  msci_em_close NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (as_of)
);

GRANT SELECT ON public.macro_indicators TO anon, authenticated;
GRANT ALL ON public.macro_indicators TO service_role;

ALTER TABLE public.macro_indicators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "macro_public_read" ON public.macro_indicators FOR SELECT USING (true);

-- ============================================================
-- 4. SIGNAL FAILURES: learned failure patterns
-- ============================================================
CREATE TABLE public.signal_failures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_name TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  rule_json JSONB NOT NULL,
  failure_count INTEGER NOT NULL DEFAULT 0,
  win_count INTEGER NOT NULL DEFAULT 0,
  total_count INTEGER NOT NULL DEFAULT 0,
  win_rate NUMERIC GENERATED ALWAYS AS (
    CASE WHEN total_count > 0 THEN ROUND((win_count::numeric / total_count) * 100, 2) ELSE 0 END
  ) STORED,
  is_active BOOLEAN NOT NULL DEFAULT true,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.signal_failures TO anon, authenticated;
GRANT ALL ON public.signal_failures TO service_role;

ALTER TABLE public.signal_failures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "signal_failures_public_read" ON public.signal_failures FOR SELECT USING (true);

-- ============================================================
-- 5. ENSEMBLE VOTES: multi-AI agreement tracking
-- ============================================================
CREATE TABLE public.ensemble_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recommendation_id UUID,
  symbol TEXT NOT NULL,
  scan_id UUID NOT NULL,
  model_name TEXT NOT NULL,
  vote TEXT NOT NULL CHECK (vote IN ('strong_buy', 'buy', 'neutral', 'sell', 'strong_sell')),
  confidence INTEGER NOT NULL,
  reasoning_ar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ensemble_votes TO anon, authenticated;
GRANT ALL ON public.ensemble_votes TO service_role;

ALTER TABLE public.ensemble_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ensemble_votes_public_read" ON public.ensemble_votes FOR SELECT USING (true);

CREATE INDEX idx_ensemble_scan_symbol ON public.ensemble_votes(scan_id, symbol);

-- ============================================================
-- 6. EXTEND recommendations: 5-dimension score breakdown
-- ============================================================
ALTER TABLE public.recommendations
  ADD COLUMN IF NOT EXISTS technical_score NUMERIC,
  ADD COLUMN IF NOT EXISTS fundamental_score NUMERIC,
  ADD COLUMN IF NOT EXISTS sentiment_score NUMERIC,
  ADD COLUMN IF NOT EXISTS macro_score NUMERIC,
  ADD COLUMN IF NOT EXISTS sector_score NUMERIC,
  ADD COLUMN IF NOT EXISTS ensemble_agreement INTEGER,
  ADD COLUMN IF NOT EXISTS data_completeness INTEGER;
