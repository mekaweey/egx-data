ALTER TABLE public.recommendations
  ADD COLUMN IF NOT EXISTS rejected_by_rules boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS verifier_approved boolean,
  ADD COLUMN IF NOT EXISTS verifier_reason text,
  ADD COLUMN IF NOT EXISTS original_signal text;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;