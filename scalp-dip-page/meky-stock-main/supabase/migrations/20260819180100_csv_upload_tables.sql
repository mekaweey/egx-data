-- Extra tables and columns to support CSV uploads from D:\files
-- These tables store analytics and reversal data that don't fit existing schemas.

-- 1. Daily trade analytics (from paper_trades_analytics.csv)
-- Per-strategy-per-symbol-per-date summary stats that don't fit paper_trades (individual trades).
create table if not exists public.daily_trade_analytics (
  id              uuid         primary key default gen_random_uuid(),
  trade_date      date         not null,
  strategy        text         not null,
  symbol          text         not null,
  trades          integer,
  total_pnl       numeric,
  avg_pnl         numeric,
  avg_pnl_pct     numeric,
  avg_hold_sec    numeric,
  wins            integer,
  losses          integer,
  win_rate_pct    numeric,
  tp_hits         integer,
  sl_hits         integer,
  trail_exits     integer,
  time_exits      integer,
  eod_exits       integer,
  created_at      timestamp with time zone default now()
);

-- 2. Trade reversal signals (from signal_reversal_check.csv)
-- Individual trade reversal analysis data.
create table if not exists public.trade_reversal_signals (
  id                     uuid primary key default gen_random_uuid(),
  trade_id               text,
  symbol                 text not null,
  strategy               text not null,
  entry_ts               timestamptz,
  exit_price             numeric,
  exit_ts                timestamptz,
  max_price_next_5min    numeric,
  min_price_next_5min    numeric,
  pnl                    numeric,
  reversed_below_exit    boolean,
  created_at             timestamptz default now()
);

-- 3. Strategy symbol rankings (from strategy_symbol_ranking.csv)
-- Per-strategy-per-symbol performance ranking.
create table if not exists public.strategy_symbol_rankings (
  id            uuid primary key default gen_random_uuid(),
  strategy      text not null,
  symbol        text not null,
  total_pnl     numeric,
  avg_pnl       numeric,
  trades        integer,
  win_rate_pct  numeric,
  wins          integer,
  created_at    timestamptz default now()
);

-- Index helper for bulk lookups
create index if not exists idx_daily_trade_analytics_lookup
  on public.daily_trade_analytics(strategy, symbol, trade_date);
create index if not exists idx_trade_reversal_signals_lookup
  on public.trade_reversal_signals(trade_id);
create index if not exists idx_strategy_symbol_rankings_lookup
  on public.strategy_symbol_rankings(strategy, symbol);
