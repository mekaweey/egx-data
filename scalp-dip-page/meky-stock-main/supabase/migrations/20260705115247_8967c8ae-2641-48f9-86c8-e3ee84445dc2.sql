CREATE TABLE public.scalp_timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id text,
  symbol text NOT NULL,
  uuid text,
  event text NOT NULL,
  at_ms bigint NOT NULL,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.scalp_timeline_events TO authenticated;
GRANT ALL ON public.scalp_timeline_events TO service_role;

ALTER TABLE public.scalp_timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated can read timeline"
  ON public.scalp_timeline_events FOR SELECT
  TO authenticated USING (true);

CREATE INDEX idx_scalp_timeline_signal ON public.scalp_timeline_events (signal_id, at_ms);
CREATE INDEX idx_scalp_timeline_symbol_ts ON public.scalp_timeline_events (symbol, at_ms DESC);
CREATE INDEX idx_scalp_timeline_created ON public.scalp_timeline_events (created_at DESC);