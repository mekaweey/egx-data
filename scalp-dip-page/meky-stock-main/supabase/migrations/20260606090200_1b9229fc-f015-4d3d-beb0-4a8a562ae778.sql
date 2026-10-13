
-- Indexes
CREATE INDEX IF NOT EXISTS idx_backtest_trades_backtest_id ON public.backtest_trades(backtest_id);
CREATE INDEX IF NOT EXISTS idx_sell_alerts_symbol_created_at ON public.sell_alerts(symbol, created_at DESC);

-- service_role only policies for internal tables (silences RLS-no-policy linter)
CREATE POLICY "service_role manages online_learning_state" ON public.online_learning_state FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role manages data_source_logs" ON public.data_source_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role manages counterfactual_insights" ON public.counterfactual_insights FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role manages news_embeddings" ON public.news_embeddings FOR ALL TO service_role USING (true) WITH CHECK (true);
