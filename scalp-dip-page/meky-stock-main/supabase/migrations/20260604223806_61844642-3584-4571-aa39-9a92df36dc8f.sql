
-- Persistent memory of news impact horizons and their forecasted effect days.
CREATE TABLE IF NOT EXISTS public.news_impact_forecasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID NULL REFERENCES public.news_sentiment(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  headline TEXT NOT NULL,
  headline_hash TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general', -- general | rights_issue | earnings | dividend | management | macro | regulatory
  horizon TEXT NOT NULL DEFAULT 'short',    -- short (<=1 trading day) | medium (~week) | long (>1 week)
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  impact_start_date DATE NOT NULL,          -- first trading day the impact materialises
  impact_end_date DATE NOT NULL,            -- last trading day the impact is expected to hold
  expected_direction TEXT NOT NULL DEFAULT 'neutral', -- up | down | neutral
  expected_magnitude_pct NUMERIC NULL,
  confidence INT NOT NULL DEFAULT 50,
  explanation_ar TEXT NULL,
  baladi_summary TEXT NULL,
  is_rights_related BOOLEAN NOT NULL DEFAULT FALSE,
  notified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '45 days'),
  UNIQUE (symbol, headline_hash)
);

CREATE INDEX IF NOT EXISTS idx_nif_symbol_dates ON public.news_impact_forecasts (symbol, impact_start_date, impact_end_date);
CREATE INDEX IF NOT EXISTS idx_nif_horizon ON public.news_impact_forecasts (horizon, impact_start_date);
CREATE INDEX IF NOT EXISTS idx_nif_rights ON public.news_impact_forecasts (is_rights_related, impact_start_date) WHERE is_rights_related = TRUE;
CREATE INDEX IF NOT EXISTS idx_nif_expires ON public.news_impact_forecasts (expires_at);

GRANT SELECT ON public.news_impact_forecasts TO authenticated;
GRANT ALL ON public.news_impact_forecasts TO service_role;

ALTER TABLE public.news_impact_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read news impact forecasts"
  ON public.news_impact_forecasts FOR SELECT TO authenticated USING (true);
