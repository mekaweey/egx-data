create or replace function public.top_active_day_tradable_today(p_limit int default 15)
returns table(symbol text)
language sql
stable
security definer
set search_path = public
as $$
  select lt.symbol
  from public.live_ticks lt
  join public.stocks s on s.symbol = lt.symbol
  where s.day_tradable = true
    and lt.ts >= (now() at time zone 'Africa/Cairo')::date
  group by lt.symbol
  order by count(*) desc
  limit greatest(1, least(coalesce(p_limit, 15), 50))
$$;

grant execute on function public.top_active_day_tradable_today(int) to anon, authenticated, service_role;