CREATE TABLE public.market_regimes (
  date DATE PRIMARY KEY,
  regime TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.market_regimes TO authenticated;
GRANT ALL ON public.market_regimes TO service_role;
ALTER TABLE public.market_regimes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read market regimes" ON public.market_regimes FOR SELECT TO authenticated USING (true);
CREATE TRIGGER update_market_regimes_updated_at BEFORE UPDATE ON public.market_regimes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();