
CREATE TABLE IF NOT EXISTS public.premarket_shortlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pick_date date NOT NULL UNIQUE,
  symbols text[] NOT NULL DEFAULT '{}',
  reasons jsonb,
  breadth_pct numeric,
  notes text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.premarket_shortlist TO authenticated;
GRANT ALL ON public.premarket_shortlist TO service_role;

ALTER TABLE public.premarket_shortlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "premarket_shortlist read" ON public.premarket_shortlist
  FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_live_ticks_symbol_ts_desc
  ON public.live_ticks (symbol, ts DESC);

ALTER TABLE public.daily_picks REPLICA IDENTITY FULL;
DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='daily_picks';
  IF NOT FOUND THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_picks';
  END IF;
END $$;
