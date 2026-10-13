CREATE TABLE public.scalp_fresh_fetch_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id uuid NULL,
  symbol text NOT NULL,
  cached_price numeric NOT NULL,
  cached_ts timestamptz NULL,
  fresh_price numeric NULL,
  fresh_source text NULL,
  diff_pct numeric NULL,
  fetch_ms integer NULL,
  fetch_error text NULL,
  trigger_still_valid boolean NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX scalp_fresh_fetch_log_created_at_idx
  ON public.scalp_fresh_fetch_log (created_at DESC);

GRANT SELECT ON public.scalp_fresh_fetch_log TO authenticated;
GRANT ALL ON public.scalp_fresh_fetch_log TO service_role;

ALTER TABLE public.scalp_fresh_fetch_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scalp_fresh_fetch_log_authenticated_read"
  ON public.scalp_fresh_fetch_log FOR SELECT
  TO authenticated
  USING (true);