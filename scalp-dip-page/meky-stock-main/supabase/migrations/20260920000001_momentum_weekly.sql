-- momentum-weekly tables + settings (2026-09-20)
-- New weekly strategy: Momentum-Protected (see src/lib/scalp-dip/momentum-weekly.server.ts)

create table if not exists daily_candles (
  symbol text not null,
  date date not null,
  open numeric not null,
  high numeric not null,
  low numeric not null,
  close numeric not null,
  volume numeric not null default 0,
  updated_at timestamptz not null default now(),
  primary key (symbol, date)
);
create index if not exists daily_candles_symbol_date_idx on daily_candles (symbol, date desc);

create table if not exists momentum_weekly_signals (
  id bigserial primary key,
  scan_date date not null,          -- session whose close produced the signal
  entry_date date not null,         -- next session (entry at open)
  exit_date date not null,          -- expected exit session (next week open)
  symbol text not null,
  last_close numeric not null,      -- signal-session close
  entry_price numeric,              -- actual open at entry (null until filled)
  mom5 numeric,
  v20_money numeric,
  near_high numeric,
  fresh_high boolean default false,
  position_value numeric,
  shares integer,
  selected boolean default false,   -- in the top-N buy list
  bought boolean default false,
  actual_buy_price numeric,
  buy_timestamp timestamptz,
  sold boolean default false,
  actual_sell_price numeric,
  sell_timestamp timestamptz,
  exit_reason text,
  realized_pnl numeric,
  realized_pnl_pct numeric,
  regime_on boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scan_date, symbol)
);

insert into strategy_settings (key, numeric_value, updated_at)
values ('momentum_weekly_user_capital', 100000, now())
on conflict (key) do nothing;
