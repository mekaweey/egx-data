CREATE INDEX IF NOT EXISTS idx_recommendations_outcome_created_at ON public.recommendations (outcome, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_candles_symbol_date ON public.daily_candles (symbol, date DESC);
CREATE INDEX IF NOT EXISTS idx_news_sentiment_symbol_published_at ON public.news_sentiment (symbol, published_at DESC);