CREATE TABLE public.decision_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  category text NOT NULL,
  target_key text,
  current_value text,
  suggested_value text,
  action_type text NOT NULL DEFAULT 'advisory',
  rationale text NOT NULL,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  evidence_days integer NOT NULL DEFAULT 14,
  confidence numeric,
  status text NOT NULL DEFAULT 'pending',
  applied_at timestamptz,
  rejected_at timestamptz
);
CREATE INDEX idx_decision_suggestions_status ON public.decision_suggestions(status, created_at DESC);
CREATE UNIQUE INDEX uq_decision_suggestions_open ON public.decision_suggestions(category, coalesce(target_key,'')) WHERE status = 'pending';

GRANT SELECT ON public.decision_suggestions TO anon, authenticated;
GRANT ALL ON public.decision_suggestions TO service_role;
ALTER TABLE public.decision_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read decision suggestions" ON public.decision_suggestions FOR SELECT USING (true);

CREATE TRIGGER trg_decision_suggestions_updated_at
BEFORE UPDATE ON public.decision_suggestions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();