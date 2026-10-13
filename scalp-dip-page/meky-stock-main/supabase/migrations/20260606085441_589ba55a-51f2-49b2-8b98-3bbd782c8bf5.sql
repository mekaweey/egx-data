CREATE INDEX IF NOT EXISTS idx_news_embeddings_symbol_published_at ON public.news_embeddings (symbol, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_positions_status_created_at ON public.positions (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sniper_picks_created_at ON public.sniper_picks (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_picks_created_at ON public.daily_picks (created_at DESC);