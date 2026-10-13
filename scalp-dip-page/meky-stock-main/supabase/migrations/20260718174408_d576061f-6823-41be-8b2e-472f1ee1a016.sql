
CREATE TABLE public.trade_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_date DATE NOT NULL,
  symbol TEXT NOT NULL,
  strategy TEXT,
  paper_trade_id UUID,
  position_id UUID,
  pending_order_id UUID,
  event_type TEXT NOT NULL,
  state TEXT,
  price NUMERIC,
  qty NUMERIC,
  reason TEXT,
  source TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trade_events_date_symbol ON public.trade_events (trade_date, symbol, created_at);
CREATE INDEX idx_trade_events_paper_trade ON public.trade_events (paper_trade_id, created_at);
CREATE INDEX idx_trade_events_position ON public.trade_events (position_id, created_at);
CREATE INDEX idx_trade_events_created ON public.trade_events (created_at DESC);

GRANT ALL ON public.trade_events TO service_role;

ALTER TABLE public.trade_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role manages trade_events"
  ON public.trade_events FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
