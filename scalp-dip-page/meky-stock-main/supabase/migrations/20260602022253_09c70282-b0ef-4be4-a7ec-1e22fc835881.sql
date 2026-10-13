CREATE TABLE public.walk_forward_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'running',
  from_date date,
  to_date date,
  total_days integer NOT NULL DEFAULT 0,
  correct_days integer NOT NULL DEFAULT 0,
  wrong_days integer NOT NULL DEFAULT 0,
  no_pick_days integer NOT NULL DEFAULT 0,
  accuracy_pct numeric,
  avg_next_day_return_pct numeric,
  top_pick_win_rate numeric,
  min_confidence integer NOT NULL DEFAULT 60,
  picks_per_day integer NOT NULL DEFAULT 3,
  strategy_version text NOT NULL DEFAULT 'v1',
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

GRANT SELECT ON public.walk_forward_runs TO anon, authenticated;
GRANT ALL ON public.walk_forward_runs TO service_role;
ALTER TABLE public.walk_forward_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY walk_forward_runs_public_read ON public.walk_forward_runs FOR SELECT USING (true);

CREATE TABLE public.walk_forward_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.walk_forward_runs(id) ON DELETE CASCADE,
  prediction_date date NOT NULL,
  next_trading_date date,
  picks jsonb NOT NULL DEFAULT '[]'::jsonb,
  top_pick_symbol text,
  top_pick_confidence integer,
  top_pick_return_pct numeric,
  avg_picks_return_pct numeric,
  was_correct boolean,
  market_regime text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.walk_forward_days TO anon, authenticated;
GRANT ALL ON public.walk_forward_days TO service_role;
ALTER TABLE public.walk_forward_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY walk_forward_days_public_read ON public.walk_forward_days FOR SELECT USING (true);

CREATE INDEX idx_wfd_run_date ON public.walk_forward_days(run_id, prediction_date);