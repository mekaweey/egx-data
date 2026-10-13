CREATE OR REPLACE VIEW public.paper_trades_analytics
WITH (security_invoker = on) AS
SELECT
  trade_date,
  strategy,
  symbol,
  COUNT(*)::int AS trades,
  COUNT(*) FILTER (WHERE pnl > 0)::int AS wins,
  COUNT(*) FILTER (WHERE pnl < 0)::int AS losses,
  ROUND((COUNT(*) FILTER (WHERE pnl > 0)::numeric
    / NULLIF(COUNT(pnl), 0) * 100)::numeric, 1) AS win_rate_pct,
  ROUND(AVG(pnl)::numeric, 2) AS avg_pnl,
  ROUND(AVG(pnl_pct)::numeric, 4) AS avg_pnl_pct,
  ROUND(SUM(pnl)::numeric, 2) AS total_pnl,
  ROUND(AVG(EXTRACT(EPOCH FROM (exit_ts - entry_ts)))::numeric, 1) AS avg_hold_sec,
  COUNT(*) FILTER (WHERE exit_reason = 'TP')::int AS tp_hits,
  COUNT(*) FILTER (WHERE exit_reason = 'SL')::int AS sl_hits,
  COUNT(*) FILTER (WHERE exit_reason = 'EOD')::int AS eod_exits,
  COUNT(*) FILTER (WHERE exit_reason = 'TRAIL')::int AS trail_exits,
  COUNT(*) FILTER (WHERE exit_reason = 'TIME')::int AS time_exits
FROM public.paper_trades
WHERE status = 'closed' AND pnl IS NOT NULL
GROUP BY trade_date, strategy, symbol;

GRANT SELECT ON public.paper_trades_analytics TO anon, authenticated;