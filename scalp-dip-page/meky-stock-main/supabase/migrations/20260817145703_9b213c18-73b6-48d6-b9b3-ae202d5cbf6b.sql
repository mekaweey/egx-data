CREATE TABLE public.execution_quality_log (
  id uuid primary key default gen_random_uuid(),
  trade_date date not null default (now() at time zone 'Africa/Cairo')::date,
  strategy text not null default 'scalp-dip',
  symbol text not null,
  paper_trade_id uuid,
  target_price numeric not null,
  bid_value_at_request numeric,
  requested_at timestamptz not null default now(),
  executed_price numeric,
  executed_at timestamptz,
  latency_seconds numeric,
  slippage_pct numeric,
  execution_type text not null default 'pending',
  notes text,
  created_at timestamptz not null default now()
);

GRANT SELECT ON public.execution_quality_log TO anon;
GRANT SELECT ON public.execution_quality_log TO authenticated;
GRANT ALL ON public.execution_quality_log TO service_role;

ALTER TABLE public.execution_quality_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "execution_quality_log public read"
ON public.execution_quality_log FOR SELECT TO anon, authenticated USING (true);

CREATE INDEX idx_eql_date ON public.execution_quality_log (trade_date DESC, requested_at DESC);
CREATE INDEX idx_eql_pending ON public.execution_quality_log (execution_type, symbol);