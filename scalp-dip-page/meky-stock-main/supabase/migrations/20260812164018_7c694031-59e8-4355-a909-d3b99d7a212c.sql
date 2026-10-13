INSERT INTO public.strategy_settings (key, enabled)
VALUES 
  ('scalp-dip-smart-exit-shadow', false)
ON CONFLICT (key) DO UPDATE SET enabled = false;

UPDATE public.strategy_settings SET enabled = true WHERE key IN ('scalp-dip-smart-exit', 'scalp-dip-prebuy-volume-filter');