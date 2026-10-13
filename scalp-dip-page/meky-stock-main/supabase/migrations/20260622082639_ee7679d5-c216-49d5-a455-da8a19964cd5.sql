
CREATE TABLE IF NOT EXISTS public.thunder_tick_archive (
  symbol TEXT NOT NULL,
  ts TIMESTAMPTZ NOT NULL,
  price NUMERIC NOT NULL,
  volume BIGINT,
  bid NUMERIC,
  ask NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (symbol, ts)
);

GRANT SELECT ON public.thunder_tick_archive TO authenticated;
GRANT ALL ON public.thunder_tick_archive TO service_role;

ALTER TABLE public.thunder_tick_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_thunder_archive"
  ON public.thunder_tick_archive
  FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS thunder_tick_archive_symbol_ts_idx
  ON public.thunder_tick_archive (symbol, ts DESC);

CREATE INDEX IF NOT EXISTS thunder_tick_archive_ts_idx
  ON public.thunder_tick_archive (ts DESC);

-- Backfill all existing thunder ticks
INSERT INTO public.thunder_tick_archive (symbol, ts, price, volume)
SELECT symbol, ts, price, NULL::bigint
FROM public.live_ticks
WHERE source = 'thunder_ext'
ON CONFLICT (symbol, ts) DO NOTHING;
