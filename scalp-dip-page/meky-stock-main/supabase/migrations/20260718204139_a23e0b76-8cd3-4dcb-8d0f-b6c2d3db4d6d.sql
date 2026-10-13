create table if not exists public.missed_signals (
  id uuid primary key default gen_random_uuid(),
  trade_date date not null,
  symbol text not null,
  strategy text not null default 'scalp-dip',
  ts timestamptz not null default now(),
  reason text not null,
  candidate_price numeric,
  day_open numeric,
  drop_pct numeric,
  tp_price numeric,
  sl_price numeric,
  rank integer,
  metadata jsonb not null default '{}'::jsonb,
  unique (trade_date, symbol, strategy)
);
grant select, insert, update on public.missed_signals to authenticated;
grant all on public.missed_signals to service_role;
alter table public.missed_signals enable row level security;
create policy "read_missed_signals" on public.missed_signals for select to authenticated using (true);
create index if not exists idx_missed_signals_date on public.missed_signals(trade_date, ts desc);