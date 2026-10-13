ALTER TABLE public.recommendations
  ADD COLUMN IF NOT EXISTS entry_timing_ar text,
  ADD COLUMN IF NOT EXISTS expected_gain_pct numeric,
  ADD COLUMN IF NOT EXISTS partial_exit_pct numeric,
  ADD COLUMN IF NOT EXISTS max_hold_days integer;