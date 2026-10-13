CREATE TABLE public.backtests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running',
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  min_confidence INTEGER NOT NULL DEFAULT 55,
  strategy_version TEXT NOT NULL DEFAULT 'v1',
  symbols_count INTEGER NOT NULL DEFAULT 0,
  total_trades INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  open_trades INTEGER NOT NULL DEFAULT 0,
  win_rate NUMERIC,
  avg_win_pct NUMERIC,
  avg_loss_pct NUMERIC,
  profit_factor NUMERIC,
  expectancy_pct NUMERIC,
  max_drawdown_pct NUMERIC,
  sharpe NUMERIC,
  total_return_pct NUMERIC,
  best_trade_pct NUMERIC,
  worst_trade_pct NUMERIC,
  avg_days_held NUMERIC,
  error_message TEXT
);

CREATE TABLE public.backtest_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backtest_id UUID NOT NULL REFERENCES public.backtests(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  signal_date DATE NOT NULL,
  entry_date DATE NOT NULL,
  entry_price NUMERIC NOT NULL,
  exit_date DATE,
  exit_price NUMERIC,
  exit_reason TEXT,
  pnl_pct NUMERIC,
  r_multiple NUMERIC,
  days_held INTEGER,
  confidence INTEGER NOT NULL,
  signal TEXT NOT NULL,
  stop_loss NUMERIC NOT NULL,
  target NUMERIC NOT NULL,
  atr NUMERIC,
  market_trend TEXT,
  market_regime TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bt_trades_backtest ON public.backtest_trades(backtest_id);
CREATE INDEX idx_bt_trades_symbol ON public.backtest_trades(symbol);
CREATE INDEX idx_backtests_started ON public.backtests(started_at DESC);

ALTER TABLE public.backtests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backtest_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backtests_public_read" ON public.backtests FOR SELECT USING (true);
CREATE POLICY "backtest_trades_public_read" ON public.backtest_trades FOR SELECT USING (true);