
CREATE TABLE public.strategy_settings (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.strategy_settings TO anon, authenticated;
GRANT ALL ON public.strategy_settings TO service_role;
ALTER TABLE public.strategy_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read strategy settings" ON public.strategy_settings FOR SELECT USING (true);
INSERT INTO public.strategy_settings (key, enabled) VALUES ('scalp-mr15', true) ON CONFLICT (key) DO NOTHING;
