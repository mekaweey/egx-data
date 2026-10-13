ALTER TABLE public.marketwatch_snapshots
  ADD COLUMN IF NOT EXISTS highest_bid numeric,
  ADD COLUMN IF NOT EXISTS lowest_ask numeric,
  ADD COLUMN IF NOT EXISTS highest_bid_qty bigint,
  ADD COLUMN IF NOT EXISTS lowest_ask_qty bigint;
CREATE INDEX IF NOT EXISTS idx_mw_snap_symbol_captured ON public.marketwatch_snapshots (symbol, captured_at DESC);