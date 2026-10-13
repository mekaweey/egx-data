ALTER TABLE public.marketwatch_snapshots
  ADD COLUMN IF NOT EXISTS high_price numeric,
  ADD COLUMN IF NOT EXISTS low_price numeric,
  ADD COLUMN IF NOT EXISTS last_trade_volume numeric,
  ADD COLUMN IF NOT EXISTS last_change_prc numeric,
  ADD COLUMN IF NOT EXISTS symbol_state text,
  ADD COLUMN IF NOT EXISTS trade_rec_serial bigint,
  ADD COLUMN IF NOT EXISTS last_trade_date timestamptz;