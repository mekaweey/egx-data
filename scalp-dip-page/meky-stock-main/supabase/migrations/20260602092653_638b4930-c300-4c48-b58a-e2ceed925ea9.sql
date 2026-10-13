CREATE TABLE public.model_state (
  key text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.model_state TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.model_state TO authenticated;
GRANT ALL ON public.model_state TO service_role;

ALTER TABLE public.model_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "model_state_public_read"
ON public.model_state FOR SELECT
TO public USING (true);

CREATE INDEX idx_model_state_updated ON public.model_state(updated_at DESC);