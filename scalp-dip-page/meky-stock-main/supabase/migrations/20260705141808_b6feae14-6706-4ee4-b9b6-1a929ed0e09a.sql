CREATE OR REPLACE VIEW public.strategy_overview
WITH (security_invoker = on) AS
SELECT
  strategy,
  COUNT(*) AS total_trades,
  COUNT(*) FILTER (WHERE pnl > 0) AS wins,
  COUNT(*) FILTER (WHERE pnl <= 0) AS losses,
  ROUND((COUNT(*) FILTER (WHERE pnl > 0)::numeric / NULLIF(COUNT(*),0) * 100)::numeric, 1) AS win_rate_pct,
  ROUND(SUM(pnl)::numeric, 2) AS total_pnl,
  ROUND(AVG(pnl)::numeric, 2) AS avg_pnl,
  ROUND(AVG(pnl) FILTER (WHERE pnl > 0)::numeric, 2) AS avg_win,
  ROUND(AVG(pnl) FILTER (WHERE pnl <= 0)::numeric, 2) AS avg_loss,
  ROUND(MAX(pnl)::numeric, 2) AS best_trade,
  ROUND(MIN(pnl)::numeric, 2) AS worst_trade,
  ROUND(AVG(EXTRACT(EPOCH FROM (exit_ts - entry_ts)))::numeric, 1) AS avg_hold_sec,
  COUNT(*) FILTER (WHERE exit_reason='TP') AS tp_hits,
  COUNT(*) FILTER (WHERE exit_reason='SL') AS sl_hits,
  COUNT(DISTINCT symbol) AS symbols_traded,
  COUNT(DISTINCT trade_date) AS trading_days,
  MIN(trade_date) AS first_date,
  MAX(trade_date) AS last_date
FROM public.paper_trades
WHERE status='closed' AND pnl IS NOT NULL
GROUP BY strategy;

GRANT SELECT ON public.strategy_overview TO authenticated;

CREATE OR REPLACE VIEW public.strategy_symbol_ranking
WITH (security_invoker = on) AS
SELECT
  strategy,
  symbol,
  COUNT(*) AS trades,
  COUNT(*) FILTER (WHERE pnl > 0) AS wins,
  ROUND((COUNT(*) FILTER (WHERE pnl > 0)::numeric / NULLIF(COUNT(*),0) * 100)::numeric, 1) AS win_rate_pct,
  ROUND(SUM(pnl)::numeric, 2) AS total_pnl,
  ROUND(AVG(pnl)::numeric, 2) AS avg_pnl
FROM public.paper_trades
WHERE status='closed' AND pnl IS NOT NULL
GROUP BY strategy, symbol
HAVING COUNT(*) >= 5
ORDER BY strategy, total_pnl DESC;

GRANT SELECT ON public.strategy_symbol_ranking TO authenticated;