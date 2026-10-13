CREATE TABLE public.daily_picks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pick_date DATE NOT NULL UNIQUE,
  symbol TEXT NOT NULL,
  name_ar TEXT,
  entry_price NUMERIC NOT NULL,
  target_price NUMERIC NOT NULL,
  stop_price NUMERIC NOT NULL,
  target_pct NUMERIC NOT NULL,
  stop_pct NUMERIC NOT NULL,
  max_hold_days INTEGER NOT NULL DEFAULT 5,
  confidence NUMERIC NOT NULL,
  kelly_pct NUMERIC NOT NULL,
  score NUMERIC NOT NULL,
  reasons JSONB,
  status TEXT NOT NULL DEFAULT 'open',
  exit_price NUMERIC,
  exit_date DATE,
  pnl_pct NUMERIC,
  pnl_egp NUMERIC,
  capital_used NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_picks TO authenticated;
GRANT SELECT ON public.daily_picks TO anon;
GRANT ALL ON public.daily_picks TO service_role;
ALTER TABLE public.daily_picks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read picks" ON public.daily_picks FOR SELECT USING (true);
CREATE POLICY "Service role manages picks" ON public.daily_picks FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_daily_picks_date ON public.daily_picks(pick_date DESC);
CREATE INDEX idx_daily_picks_status ON public.daily_picks(status);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_daily_picks_updated_at BEFORE UPDATE ON public.daily_picks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();