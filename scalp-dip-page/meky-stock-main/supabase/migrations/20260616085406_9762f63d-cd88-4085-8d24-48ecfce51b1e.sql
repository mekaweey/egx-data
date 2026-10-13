CREATE TABLE public.pending_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  side text NOT NULL CHECK (side IN ('buy','sell')),
  qty integer,
  ref_price numeric,
  order_type text NOT NULL DEFAULT 'market' CHECK (order_type IN ('market','limit')),
  limit_price numeric,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','opened','prepared','confirmed','expired','cancelled','error')),
  signal_source text,
  trade_date date NOT NULL DEFAULT (now() AT TIME ZONE 'Africa/Cairo')::date,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '60 seconds'),
  prepared_at timestamptz,
  confirmed_at timestamptz,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX idx_pending_orders_status_created ON public.pending_orders (status, created_at DESC);
CREATE UNIQUE INDEX idx_pending_orders_dedupe ON public.pending_orders (symbol, trade_date, signal_source)
  WHERE status IN ('pending','opened','prepared','confirmed');

GRANT ALL ON public.pending_orders TO service_role;

ALTER TABLE public.pending_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role full access" ON public.pending_orders
  FOR ALL TO service_role USING (true) WITH CHECK (true);