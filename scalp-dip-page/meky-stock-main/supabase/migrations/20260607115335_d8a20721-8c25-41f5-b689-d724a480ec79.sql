ALTER TABLE public.daily_picks DROP CONSTRAINT IF EXISTS daily_picks_pick_date_key;

CREATE INDEX IF NOT EXISTS idx_daily_picks_pick_date_symbol_created
ON public.daily_picks (pick_date DESC, symbol, created_at DESC);