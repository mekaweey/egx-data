
-- Restrict public SELECT on sensitive tables to authenticated only
DROP POLICY IF EXISTS "backtests_public_read" ON public.backtests;
CREATE POLICY "backtests_authenticated_read" ON public.backtests FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "backtest_trades_public_read" ON public.backtest_trades;
CREATE POLICY "backtest_trades_authenticated_read" ON public.backtest_trades FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "read decision suggestions" ON public.decision_suggestions;
CREATE POLICY "decision_suggestions_authenticated_read" ON public.decision_suggestions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "paper_trades_public_read" ON public.paper_trades;
CREATE POLICY "paper_trades_authenticated_read" ON public.paper_trades FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "positions_public_read" ON public.positions;
CREATE POLICY "positions_authenticated_read" ON public.positions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "sell_alerts_public_read" ON public.sell_alerts;
CREATE POLICY "sell_alerts_authenticated_read" ON public.sell_alerts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "signal_failures_public_read" ON public.signal_failures;
CREATE POLICY "signal_failures_authenticated_read" ON public.signal_failures FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "read smart exit log" ON public.smart_exit_log;
CREATE POLICY "smart_exit_log_authenticated_read" ON public.smart_exit_log FOR SELECT TO authenticated USING (true);

-- extension_diag: remove anon SELECT, keep anon INSERT for extension telemetry
DROP POLICY IF EXISTS "diag_read_anon" ON public.extension_diag;

-- Revoke anon SELECT grants where present
REVOKE SELECT ON public.backtests FROM anon;
REVOKE SELECT ON public.backtest_trades FROM anon;
REVOKE SELECT ON public.decision_suggestions FROM anon;
REVOKE SELECT ON public.paper_trades FROM anon;
REVOKE SELECT ON public.positions FROM anon;
REVOKE SELECT ON public.sell_alerts FROM anon;
REVOKE SELECT ON public.signal_failures FROM anon;
REVOKE SELECT ON public.smart_exit_log FROM anon;
REVOKE SELECT ON public.extension_diag FROM anon;
