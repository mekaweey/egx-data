-- 1) Extend marketwatch_snapshots with the remaining raw fields
ALTER TABLE public.marketwatch_snapshots
  ADD COLUMN IF NOT EXISTS open_price     numeric,
  ADD COLUMN IF NOT EXISTS previous_close numeric,
  ADD COLUMN IF NOT EXISTS close_price    numeric,
  ADD COLUMN IF NOT EXISTS high_52_week   numeric,
  ADD COLUMN IF NOT EXISTS low_52_week    numeric,
  ADD COLUMN IF NOT EXISTS listed_shares  numeric,
  ADD COLUMN IF NOT EXISTS avg_180_day    numeric;

-- 2) New table for Thunder X trades-book/v2 (level 3 tape)
CREATE TABLE IF NOT EXISTS public.thunder_tape (
  id           bigserial PRIMARY KEY,
  captured_at  timestamptz NOT NULL DEFAULT now(),
  asset_id     text        NOT NULL,
  symbol       text,
  cursor       bigint      NOT NULL,
  trade_time   timestamptz,
  side         text,        -- 'BUY' | 'SELL'
  price        numeric,
  volume       numeric,
  value        numeric,
  raw          jsonb,
  UNIQUE (asset_id, cursor)
);

GRANT SELECT ON public.thunder_tape TO authenticated;
GRANT ALL    ON public.thunder_tape TO service_role;

ALTER TABLE public.thunder_tape ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated read thunder_tape"
  ON public.thunder_tape FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_thunder_tape_asset_time
  ON public.thunder_tape (asset_id, trade_time DESC);

CREATE INDEX IF NOT EXISTS idx_thunder_tape_captured
  ON public.thunder_tape (captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_thunder_tape_symbol_time
  ON public.thunder_tape (symbol, trade_time DESC);
