-- Separate seed tables for each CSV file from D:\files
-- These hold static analytics/seed data, keeping the core live-data tables clean.

-- 1) depth_imbalance.csv -> seed_depth_imbalance
CREATE TABLE IF NOT EXISTS public.seed_depth_imbalance (
  id              BIGSERIAL PRIMARY KEY,
  symbol          TEXT NOT NULL,
  ts              TIMESTAMPTZ NOT NULL,
  best_bid        NUMERIC,
  best_bid_qty    NUMERIC,
  best_ask        NUMERIC,
  best_ask_qty    NUMERIC,
  spread          NUMERIC,
  last_price      NUMERIC,
  bids_depth      JSONB,
  asks_depth      JSONB,
  source          TEXT,
  session_id      UUID,
  created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_seed_depth_symbol_ts ON public.seed_depth_imbalance(symbol, ts DESC);

-- 2) news_near_signal.csv -> seed_news_sentiment
CREATE TABLE IF NOT EXISTS public.seed_news_sentiment (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol          TEXT NOT NULL,
  headline        TEXT NOT NULL,
  summary_ar      TEXT,
  source_url      TEXT,
  source_name     TEXT,
  published_at    TIMESTAMPTZ,
  sentiment       TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  sentiment_score NUMERIC,
  impact_level    TEXT CHECK (impact_level IN ('high', 'medium', 'low')),
    ai_model        TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 3) opening_range.csv -> seed_opening_range
CREATE TABLE IF NOT EXISTS public.seed_opening_range (
  symbol          TEXT NOT NULL,
  trade_date      DATE NOT NULL,
  bucket_ts       TIMESTAMPTZ NOT NULL,
  interval_min    INT NOT NULL DEFAULT 1,
  open            NUMERIC NOT NULL,
  high            NUMERIC NOT NULL,
  low             NUMERIC NOT NULL,
  close           NUMERIC NOT NULL,
  volume          BIGINT,
  tick_count      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (symbol, bucket_ts, interval_min)
);
CREATE INDEX IF NOT EXISTS idx_seed_opening_range_symbol_date ON public.seed_opening_range(symbol, trade_date);

-- 4) paper_trades_analytics.csv -> seed_paper_trades_analytics
CREATE TABLE IF NOT EXISTS public.seed_paper_trades_analytics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_date      DATE NOT NULL,
  strategy        TEXT NOT NULL,
  symbol          TEXT NOT NULL,
  trades          INTEGER,
  total_pnl       NUMERIC,
  avg_pnl         NUMERIC,
  avg_pnl_pct     NUMERIC,
  avg_hold_sec    NUMERIC,
  wins            INTEGER,
  losses          INTEGER,
  win_rate_pct    NUMERIC,
  tp_hits         INTEGER,
  sl_hits         INTEGER,
  trail_exits     INTEGER,
  time_exits      INTEGER,
    eod_exits       INTEGER,
  created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_seed_pta_lookup ON public.seed_paper_trades_analytics(strategy, symbol, trade_date);

-- 5) signal_reversal_check.csv -> seed_signal_reversal_check
CREATE TABLE IF NOT EXISTS public.seed_signal_reversal_check (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id                TEXT,
  symbol                  TEXT NOT NULL,
  strategy                TEXT NOT NULL,
  entry_ts                TIMESTAMPTZ,
  exit_price              NUMERIC,
  exit_ts                TIMESTAMPTZ,
  max_price_next_5min     NUMERIC,
  min_price_next_5min     NUMERIC,
  pnl                     NUMERIC,
  reversed_below_exit     BOOLEAN,
  created_at              TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_seed_rev_trade_id ON public.seed_signal_reversal_check(trade_id);

-- 6) strategy_overview.csv -> seed_strategy_overview
CREATE TABLE IF NOT EXISTS public.seed_strategy_overview (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_version TEXT NOT NULL,
  from_date       DATE NOT NULL,
  to_date         DATE NOT NULL,
  min_confidence  INTEGER DEFAULT 55,
  symbols_count   INTEGER DEFAULT 0,
  total_trades    INTEGER DEFAULT 0,
  wins            INTEGER DEFAULT 0,
  losses          INTEGER DEFAULT 0,
  open_trades     INTEGER DEFAULT 0,
  win_rate        NUMERIC,
  avg_win_pct     NUMERIC,
  avg_loss_pct    NUMERIC,
  profit_factor   NUMERIC,
  expectancy_pct  NUMERIC,
  max_drawdown_pct NUMERIC,
  sharpe          NUMERIC,
  total_return_pct NUMERIC,
  best_trade_pct  NUMERIC,
  worst_trade_pct NUMERIC,
  avg_days_held   NUMERIC,
    error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (strategy_version, from_date)
);

-- 7) strategy_symbol_ranking.csv -> seed_strategy_symbol_ranking
CREATE TABLE IF NOT EXISTS public.seed_strategy_symbol_ranking (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy      TEXT NOT NULL,
  symbol        TEXT NOT NULL,
  total_pnl     NUMERIC,
  avg_pnl       NUMERIC,
  trades        INTEGER,
  win_rate_pct  NUMERIC,
  wins          INTEGER,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (strategy, symbol)
);
CREATE INDEX IF NOT EXISTS idx_seed_ranking_lookup ON public.seed_strategy_symbol_ranking(strategy, symbol);

-- 8) symbol_vwap_daily.csv -> seed_symbol_vwap_daily
CREATE TABLE IF NOT EXISTS public.seed_symbol_vwap_daily (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol      TEXT NOT NULL,
  date        DATE NOT NULL,
  open        NUMERIC NOT NULL,
  high        NUMERIC NOT NULL,
  low         NUMERIC NOT NULL,
  close       NUMERIC NOT NULL,
  volume      BIGINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (symbol, date)
);
CREATE INDEX IF NOT EXISTS idx_seed_vwap_symbol_date ON public.seed_symbol_vwap_daily(symbol, date DESC);

-- Row-level security and permissions for all seed tables
-- Tables 1-2
GRANT SELECT, INSERT, UPDATE ON public.seed_depth_imbalance TO authenticated;
GRANT ALL ON public.seed_depth_imbalance TO service_role;
ALTER TABLE public.seed_depth_imbalance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seed read depth" ON public.seed_depth_imbalance FOR SELECT TO authenticated USING (true);
CREATE POLICY "service write depth" ON public.seed_depth_imbalance FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.seed_news_sentiment TO authenticated;
GRANT ALL ON public.seed_news_sentiment TO service_role;
ALTER TABLE public.seed_news_sentiment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seed read news" ON public.seed_news_sentiment FOR SELECT TO authenticated USING (true);
CREATE POLICY "service write news" ON public.seed_news_sentiment FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Tables 3-8
GRANT SELECT, INSERT, UPDATE ON public.seed_opening_range TO authenticated;
GRANT ALL ON public.seed_opening_range TO service_role;
ALTER TABLE public.seed_opening_range ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seed read opening_range" ON public.seed_opening_range FOR SELECT TO authenticated USING (true);
CREATE POLICY "service write opening_range" ON public.seed_opening_range FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.seed_paper_trades_analytics TO authenticated;
GRANT ALL ON public.seed_paper_trades_analytics TO service_role;
ALTER TABLE public.seed_paper_trades_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seed read pta" ON public.seed_paper_trades_analytics FOR SELECT TO authenticated USING (true);
CREATE POLICY "service write pta" ON public.seed_paper_trades_analytics FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.seed_signal_reversal_check TO authenticated;
GRANT ALL ON public.seed_signal_reversal_check TO service_role;
ALTER TABLE public.seed_signal_reversal_check ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seed read rev" ON public.seed_signal_reversal_check FOR SELECT TO authenticated USING (true);
CREATE POLICY "service write rev" ON public.seed_signal_reversal_check FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.seed_strategy_overview TO authenticated;
GRANT ALL ON public.seed_strategy_overview TO service_role;
ALTER TABLE public.seed_strategy_overview ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seed read strategy_overview" ON public.seed_strategy_overview FOR SELECT TO authenticated USING (true);
CREATE POLICY "service write strategy_overview" ON public.seed_strategy_overview FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.seed_strategy_symbol_ranking TO authenticated;
GRANT ALL ON public.seed_strategy_symbol_ranking TO service_role;
ALTER TABLE public.seed_strategy_symbol_ranking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seed read ranking" ON public.seed_strategy_symbol_ranking FOR SELECT TO authenticated USING (true);
CREATE POLICY "service write ranking" ON public.seed_strategy_symbol_ranking FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.seed_symbol_vwap_daily TO authenticated;
GRANT ALL ON public.seed_symbol_vwap_daily TO service_role;
ALTER TABLE public.seed_symbol_vwap_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seed read vwap" ON public.seed_symbol_vwap_daily FOR SELECT TO authenticated USING (true);
CREATE POLICY "service write vwap" ON public.seed_symbol_vwap_daily FOR ALL TO service_role USING (true) WITH CHECK (true);
