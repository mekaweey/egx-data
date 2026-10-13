CREATE TABLE IF NOT EXISTS public.pick_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pick_date DATE NOT NULL,
  symbol TEXT NOT NULL,
  kind TEXT NOT NULL,
  payload JSONB,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pick_date, symbol, kind)
);
GRANT SELECT ON public.pick_notifications TO authenticated;
GRANT ALL ON public.pick_notifications TO service_role;
ALTER TABLE public.pick_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pick_notifications_public_read" ON public.pick_notifications FOR SELECT USING (true);

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;