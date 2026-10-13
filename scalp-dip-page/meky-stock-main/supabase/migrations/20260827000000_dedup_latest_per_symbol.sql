-- Dedup helper: returns the latest marketwatch_snapshots row for each symbol
-- in the given list. Uses DISTINCT ON for an exact, Postgres-side "latest per
-- symbol" with no JS ordering ambiguity. Returns the 5 dedup-key fields plus
-- captured_at, so the caller can also do time-based comparisons.
create or replace function public.dedup_latest_for_symbols(p_symbols text[])
returns table (
  symbol text,
  last_price numeric,
  total_volume numeric,
  total_trades numeric,
  highest_bid numeric,
  lowest_ask numeric,
  captured_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select distinct on (symbol)
    symbol::text,
    last_price,
    total_volume,
    total_trades,
    highest_bid,
    lowest_ask,
    captured_at
  from marketwatch_snapshots
  where symbol = any(p_symbols)
  order by symbol, captured_at desc;
$$;

revoke all on function public.dedup_latest_for_symbols(text[]) from public;
grant execute on function public.dedup_latest_for_symbols(text[]) to service_role;
