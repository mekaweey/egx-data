CREATE TABLE public.learning_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id uuid NOT NULL UNIQUE,
  symbol text NOT NULL,
  label text NOT NULL CHECK (label IN ('win','loss')),
  realized_pct numeric NOT NULL,
  confidence numeric NOT NULL,
  uncertainty numeric NOT NULL,
  label_weight numeric NOT NULL DEFAULT 1,
  labeled_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.learning_labels TO authenticated;
GRANT ALL ON public.learning_labels TO service_role;

ALTER TABLE public.learning_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view learning labels"
ON public.learning_labels FOR SELECT
TO authenticated
USING (true);

CREATE INDEX idx_learning_labels_symbol ON public.learning_labels(symbol);
CREATE INDEX idx_learning_labels_labeled_at ON public.learning_labels(labeled_at DESC);