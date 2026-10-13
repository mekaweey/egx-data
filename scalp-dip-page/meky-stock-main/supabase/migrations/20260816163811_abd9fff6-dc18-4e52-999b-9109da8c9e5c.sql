CREATE OR REPLACE FUNCTION public.gap_liquidity_scores(lookback_days int DEFAULT 10, min_sessions int DEFAULT 5)
RETURNS TABLE(symbol text, sessions int, avg_distinct_prices numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH per_day AS (
    SELECT lt.symbol AS sym,
           (lt.ts AT TIME ZONE 'Africa/Cairo')::date AS d,
           COUNT(DISTINCT lt.price) AS distinct_prices
    FROM public.live_ticks lt
    WHERE lt.ts >= (now() - make_interval(days => lookback_days))
      AND (lt.ts AT TIME ZONE 'Africa/Cairo')::date < (now() AT TIME ZONE 'Africa/Cairo')::date
    GROUP BY 1, 2
  )
  SELECT sym::text,
         COUNT(*)::int,
         ROUND(AVG(distinct_prices), 2)
  FROM per_day
  GROUP BY sym
  HAVING COUNT(*) >= LEAST(min_sessions, 1)
$$;

GRANT EXECUTE ON FUNCTION public.gap_liquidity_scores(int, int) TO service_role;