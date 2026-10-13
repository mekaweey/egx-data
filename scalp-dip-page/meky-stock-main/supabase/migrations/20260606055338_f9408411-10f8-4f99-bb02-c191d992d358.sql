ALTER TABLE public.sniper_picks
  ADD COLUMN IF NOT EXISTS confidence integer,
  ADD COLUMN IF NOT EXISTS negative_reasons text[];