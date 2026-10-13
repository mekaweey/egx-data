
CREATE TYPE public.position_status AS ENUM ('open', 'closed');
CREATE TYPE public.exit_reason AS ENUM ('target_hit', 'stop_loss', 'trailing_stop', 'time_exit', 'manual', 'news_shock');

CREATE TABLE public.positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  entry_price NUMERIC NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity NUMERIC NOT NULL DEFAULT 1,
  stop_loss NUMERIC,
  target_price NUMERIC,
  trailing_stop NUMERIC,
  max_hold_days INTEGER DEFAULT 30,
  current_price NUMERIC,
  current_price_at TIMESTAMPTZ,
  highest_price NUMERIC,
  pnl_pct NUMERIC,
  status public.position_status NOT NULL DEFAULT 'open',
  exit_price NUMERIC,
  exit_date DATE,
  exit_reason public.exit_reason,
  recommendation_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_positions_status ON public.positions(status);
CREATE INDEX idx_positions_symbol ON public.positions(symbol);

GRANT SELECT ON public.positions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.positions TO authenticated;
GRANT ALL ON public.positions TO service_role;

ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY positions_public_read ON public.positions FOR SELECT USING (true);

CREATE TRIGGER update_positions_updated_at
BEFORE UPDATE ON public.positions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.sell_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  position_id UUID NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  alert_type public.exit_reason NOT NULL,
  message_ar TEXT NOT NULL,
  suggested_exit_price NUMERIC,
  pnl_pct NUMERIC,
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sell_alerts_unack ON public.sell_alerts(acknowledged, created_at DESC);

GRANT SELECT ON public.sell_alerts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sell_alerts TO authenticated;
GRANT ALL ON public.sell_alerts TO service_role;

ALTER TABLE public.sell_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY sell_alerts_public_read ON public.sell_alerts FOR SELECT USING (true);
