CREATE TABLE public.live_ticks (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL REFERENCES public.stocks(symbol) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  volume BIGINT,
  source TEXT NOT NULL,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX live_ticks_symbol_ts_idx ON public.live_ticks(symbol, ts DESC);
CREATE INDEX live_ticks_ts_idx ON public.live_ticks(ts DESC);

GRANT SELECT ON public.live_ticks TO anon, authenticated;
GRANT ALL ON public.live_ticks TO service_role;

ALTER TABLE public.live_ticks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "live_ticks_public_read" ON public.live_ticks FOR SELECT USING (true);

CREATE TABLE public.sniper_picks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pick_date DATE NOT NULL UNIQUE,
  symbol TEXT NOT NULL REFERENCES public.stocks(symbol),
  name_ar TEXT,
  v3_score NUMERIC NOT NULL,
  reasons TEXT[],
  prev_close NUMERIC,
  orb_high NUMERIC,
  orb_low NUMERIC,
  orb_decision TEXT,
  orb_confidence INT,
  entry_price NUMERIC,
  target_price NUMERIC,
  stop_price NUMERIC,
  position_pct NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending',
  exit_price NUMERIC,
  pnl_pct NUMERIC,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX sniper_picks_date_idx ON public.sniper_picks(pick_date DESC);

GRANT SELECT ON public.sniper_picks TO anon, authenticated;
GRANT ALL ON public.sniper_picks TO service_role;

ALTER TABLE public.sniper_picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sniper_picks_public_read" ON public.sniper_picks FOR SELECT USING (true);

CREATE TRIGGER update_sniper_picks_updated_at BEFORE UPDATE ON public.sniper_picks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();