
-- 1) orderbook_snapshots: raw L2 top-of-book (+ optional depth)
CREATE TABLE public.orderbook_snapshots (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  best_bid NUMERIC,
  best_bid_qty NUMERIC,
  best_ask NUMERIC,
  best_ask_qty NUMERIC,
  spread NUMERIC GENERATED ALWAYS AS (best_ask - best_bid) STORED,
  last_price NUMERIC,
  bids_depth JSONB,
  asks_depth JSONB,
  source TEXT NOT NULL DEFAULT 'thunder_l2',
  session_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ob_snap_symbol_ts ON public.orderbook_snapshots (symbol, ts DESC);
CREATE INDEX idx_ob_snap_session ON public.orderbook_snapshots (session_id) WHERE session_id IS NOT NULL;
GRANT SELECT, INSERT ON public.orderbook_snapshots TO authenticated;
GRANT USAGE ON SEQUENCE public.orderbook_snapshots_id_seq TO authenticated;
GRANT ALL ON public.orderbook_snapshots TO service_role;
GRANT ALL ON SEQUENCE public.orderbook_snapshots_id_seq TO service_role;
ALTER TABLE public.orderbook_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read snapshots" ON public.orderbook_snapshots FOR SELECT TO authenticated USING (true);
CREATE POLICY "service write snapshots" ON public.orderbook_snapshots FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2) order_lifecycle: every order from placement to final state
CREATE TABLE public.order_lifecycle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy','sell')),
  order_type TEXT NOT NULL CHECK (order_type IN ('limit','market')),
  requested_price NUMERIC,
  requested_qty NUMERIC NOT NULL,
  placed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  first_fill_at TIMESTAMPTZ,
  fully_filled_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  fill_price_avg NUMERIC,
  filled_qty NUMERIC DEFAULT 0,
  remaining_qty NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','partial','filled','cancelled','expired','failed')),
  thunder_order_id TEXT,
  signal_source TEXT,
  strategy TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ol_symbol_placed ON public.order_lifecycle (symbol, placed_at DESC);
CREATE INDEX idx_ol_status ON public.order_lifecycle (status) WHERE status IN ('pending','partial');
CREATE INDEX idx_ol_session ON public.order_lifecycle (session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_ol_thunder_id ON public.order_lifecycle (thunder_order_id) WHERE thunder_order_id IS NOT NULL;
GRANT SELECT, INSERT, UPDATE ON public.order_lifecycle TO authenticated;
GRANT ALL ON public.order_lifecycle TO service_role;
ALTER TABLE public.order_lifecycle ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read lifecycle" ON public.order_lifecycle FOR SELECT TO authenticated USING (true);
CREATE POLICY "service manage lifecycle" ON public.order_lifecycle FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER trg_order_lifecycle_updated_at
  BEFORE UPDATE ON public.order_lifecycle
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) execution_context: market state at decision time
CREATE TABLE public.execution_context (
  id BIGSERIAL PRIMARY KEY,
  order_lifecycle_id UUID NOT NULL REFERENCES public.order_lifecycle(id) ON DELETE CASCADE,
  best_bid_at_placement NUMERIC,
  best_ask_at_placement NUMERIC,
  spread_at_placement NUMERIC,
  last_price_at_placement NUMERIC,
  safe_floor NUMERIC,
  break_even NUMERIC,
  decision_reason TEXT,
  snapshot_before JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ec_order ON public.execution_context (order_lifecycle_id);
GRANT SELECT, INSERT ON public.execution_context TO authenticated;
GRANT USAGE ON SEQUENCE public.execution_context_id_seq TO authenticated;
GRANT ALL ON public.execution_context TO service_role;
GRANT ALL ON SEQUENCE public.execution_context_id_seq TO service_role;
ALTER TABLE public.execution_context ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read ctx" ON public.execution_context FOR SELECT TO authenticated USING (true);
CREATE POLICY "service write ctx" ON public.execution_context FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 4) fill_analysis view: computed metrics
CREATE OR REPLACE VIEW public.fill_analysis_v AS
SELECT
  ol.id AS order_id,
  ol.symbol,
  ol.side,
  ol.order_type,
  ol.strategy,
  ol.signal_source,
  ol.requested_price,
  ol.requested_qty,
  ol.fill_price_avg,
  ol.filled_qty,
  ol.status,
  ol.placed_at,
  ol.first_fill_at,
  ol.fully_filled_at,
  EXTRACT(EPOCH FROM (ol.first_fill_at - ol.placed_at)) * 1000 AS time_to_first_fill_ms,
  EXTRACT(EPOCH FROM (ol.fully_filled_at - ol.placed_at)) * 1000 AS time_to_full_fill_ms,
  ec.best_bid_at_placement,
  ec.best_ask_at_placement,
  ec.spread_at_placement,
  ec.safe_floor,
  ec.break_even,
  CASE
    WHEN ol.side = 'sell' AND ol.fill_price_avg IS NOT NULL AND ec.best_bid_at_placement IS NOT NULL
      THEN ol.fill_price_avg - ec.best_bid_at_placement
    WHEN ol.side = 'buy' AND ol.fill_price_avg IS NOT NULL AND ec.best_ask_at_placement IS NOT NULL
      THEN ec.best_ask_at_placement - ol.fill_price_avg
  END AS slippage_vs_touch,
  CASE
    WHEN ol.side = 'sell' AND ol.fill_price_avg IS NOT NULL AND ol.requested_price IS NOT NULL
      THEN ol.fill_price_avg - ol.requested_price
    WHEN ol.side = 'buy' AND ol.fill_price_avg IS NOT NULL AND ol.requested_price IS NOT NULL
      THEN ol.requested_price - ol.fill_price_avg
  END AS slippage_vs_requested
FROM public.order_lifecycle ol
LEFT JOIN public.execution_context ec ON ec.order_lifecycle_id = ol.id;

GRANT SELECT ON public.fill_analysis_v TO authenticated, service_role;
