-- PART 2: configurable capital for scalp-dip (Gap-Down Fade 3-Day Hold).
-- Adds a nullable numeric_value column to strategy_settings so a setting row can
-- carry a number (user capital in EGP). Fully backward compatible: existing
-- rows keep working (numeric_value stays NULL = default 100,000 EGP).
ALTER TABLE public.strategy_settings
  ADD COLUMN IF NOT EXISTS numeric_value NUMERIC;

-- Default row: unset value means "use tested default 100,000 EGP".
INSERT INTO public.strategy_settings (key, enabled, numeric_value)
VALUES ('scalp_dip_user_capital', true, NULL)
ON CONFLICT (key) DO NOTHING;
