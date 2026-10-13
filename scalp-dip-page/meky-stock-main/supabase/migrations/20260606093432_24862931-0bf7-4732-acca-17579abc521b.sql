ALTER TABLE public.daily_picks
  ADD COLUMN IF NOT EXISTS is_news_elite BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS news_elite_score NUMERIC,
  ADD COLUMN IF NOT EXISTS news_elite_reasons JSONB;

CREATE INDEX IF NOT EXISTS idx_daily_picks_news_elite
  ON public.daily_picks(pick_date DESC) WHERE is_news_elite = true;