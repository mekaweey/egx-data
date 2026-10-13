CREATE TABLE IF NOT EXISTS public.thunder_tape (
  id BIGSERIAL PRIMARY KEY,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  asset_id TEXT NOT NULL,
  symbol TEXT,
  cursor BIGINT NOT NULL,
  trade_time TIMESTAMPTZ,
  side TEXT,
  price NUMERIC,
  volume NUMERIC,
  value NUMERIC,
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT thunder_tape_asset_cursor_uk UNIQUE (asset_id, cursor)
);

CREATE INDEX IF NOT EXISTS thunder_tape_symbol_time_idx ON public.thunder_tape (symbol, trade_time DESC);
CREATE INDEX IF NOT EXISTS thunder_tape_asset_time_idx ON public.thunder_tape (asset_id, trade_time DESC);
CREATE INDEX IF NOT EXISTS thunder_tape_captured_idx ON public.thunder_tape (captured_at DESC);

GRANT ALL ON public.thunder_tape TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.thunder_tape_id_seq TO service_role;

ALTER TABLE public.thunder_tape ENABLE ROW LEVEL SECURITY;

CREATE POLICY "thunder_tape_service_role_all"
  ON public.thunder_tape
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);