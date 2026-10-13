
CREATE TABLE public.smart_exit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ts timestamptz NOT NULL DEFAULT now(),
  trade_date date NOT NULL,
  symbol text NOT NULL,
  strategy text NOT NULL DEFAULT 'scalp-dip',
  rule text NOT NULL,
  action text NOT NULL,
  shadow boolean NOT NULL DEFAULT false,
  price numeric,
  entry_price numeric,
  pnl_pct numeric,
  seconds_since_entry integer,
  mw_trades_5m integer,
  mw_volume_5m numeric,
  position_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb
);
CREATE INDEX smart_exit_log_ts_idx ON public.smart_exit_log (ts DESC);
CREATE INDEX smart_exit_log_symbol_idx ON public.smart_exit_log (symbol, trade_date);

GRANT SELECT ON public.smart_exit_log TO anon, authenticated;
GRANT ALL ON public.smart_exit_log TO service_role;

ALTER TABLE public.smart_exit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read smart exit log" ON public.smart_exit_log FOR SELECT USING (true);

INSERT INTO public.strategy_settings (key, enabled) VALUES
  ('scalp-dip-smart-exit', true),
  ('scalp-dip-smart-exit-shadow', true),
  ('scalp-dip-prebuy-volume-filter', true)
ON CONFLICT (key) DO NOTHING;

GRANT UPDATE ON public.strategy_settings TO anon, authenticated;
CREATE POLICY "update strategy settings" ON public.strategy_settings FOR UPDATE USING (true) WITH CHECK (true);
