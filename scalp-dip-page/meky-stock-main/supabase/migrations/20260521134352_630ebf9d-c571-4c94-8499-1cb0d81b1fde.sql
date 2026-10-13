CREATE OR REPLACE FUNCTION public.candles_stats()
RETURNS TABLE(total_candles bigint, distinct_symbols bigint, min_date date, max_date date)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT COUNT(*)::bigint, COUNT(DISTINCT symbol)::bigint, MIN(date), MAX(date)
  FROM public.daily_candles
$$;