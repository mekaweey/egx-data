ALTER TABLE public.extension_tab_telemetry
  ADD COLUMN IF NOT EXISTS panel_reason text,
  ADD COLUMN IF NOT EXISTS ac_state text,
  ADD COLUMN IF NOT EXISTS ac_resume_attempts integer,
  ADD COLUMN IF NOT EXISTS ac_resume_ok integer,
  ADD COLUMN IF NOT EXISTS depth_total integer,
  ADD COLUMN IF NOT EXISTS l2_soft_resets integer;