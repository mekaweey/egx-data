CREATE OR REPLACE VIEW public.live_ticks_best AS
SELECT DISTINCT ON (symbol)
  symbol, price, volume, source, ts, meta
FROM public.live_ticks
WHERE ts > now() - interval '10 minutes'
ORDER BY symbol,
  (CASE
    WHEN source = 'thunder_ext' AND ts > now() - interval '60 seconds' THEN 1
    WHEN source = 'tradingview' AND ts > now() - interval '5 minutes' THEN 2
    WHEN source = 'mubasher'    AND ts > now() - interval '5 minutes' THEN 3
    WHEN source = 'investing'   AND ts > now() - interval '5 minutes' THEN 4
    WHEN source = 'egx'         AND ts > now() - interval '5 minutes' THEN 5
    ELSE 9
  END),
  ts DESC;

GRANT SELECT ON public.live_ticks_best TO authenticated, anon, service_role;