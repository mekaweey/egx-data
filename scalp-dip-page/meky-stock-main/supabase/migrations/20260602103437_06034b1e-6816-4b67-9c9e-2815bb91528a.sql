-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Tier K.1: News embeddings for semantic RAG
CREATE TABLE IF NOT EXISTS public.news_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  headline text NOT NULL,
  embedding vector(1536) NOT NULL,
  sentiment_score numeric NOT NULL DEFAULT 0,
  published_at timestamptz,
  outcome_5d_pct numeric,
  outcome_recorded_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.news_embeddings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_embeddings TO authenticated;
GRANT ALL ON public.news_embeddings TO service_role;

ALTER TABLE public.news_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "news_embeddings_public_read" ON public.news_embeddings
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS news_embeddings_symbol_idx ON public.news_embeddings(symbol);
CREATE INDEX IF NOT EXISTS news_embeddings_vec_idx 
  ON public.news_embeddings USING hnsw (embedding vector_cosine_ops);

-- Similarity search function
CREATE OR REPLACE FUNCTION public.match_news_history(
  query_embedding vector(1536),
  match_symbol text DEFAULT NULL,
  match_count int DEFAULT 5,
  min_similarity float DEFAULT 0.7
)
RETURNS TABLE (
  id uuid,
  symbol text,
  headline text,
  sentiment_score numeric,
  outcome_5d_pct numeric,
  published_at timestamptz,
  similarity float
)
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT n.id, n.symbol, n.headline, n.sentiment_score, n.outcome_5d_pct, n.published_at,
         1 - (n.embedding <=> query_embedding) AS similarity
  FROM public.news_embeddings n
  WHERE n.outcome_5d_pct IS NOT NULL
    AND (match_symbol IS NULL OR n.symbol = match_symbol)
    AND 1 - (n.embedding <=> query_embedding) >= min_similarity
  ORDER BY n.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Tier K.2: Online learning state (streaming feature weights)
CREATE TABLE IF NOT EXISTS public.online_learning_state (
  feature_name text PRIMARY KEY,
  weight numeric NOT NULL DEFAULT 0,
  n_updates integer NOT NULL DEFAULT 0,
  last_gradient numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.online_learning_state TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.online_learning_state TO authenticated;
GRANT ALL ON public.online_learning_state TO service_role;

ALTER TABLE public.online_learning_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "online_learning_state_public_read" ON public.online_learning_state
  FOR SELECT USING (true);

-- Tier K.3: Counterfactual analysis log
CREATE TABLE IF NOT EXISTS public.counterfactual_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id uuid,
  symbol text NOT NULL,
  feature_name text NOT NULL,
  actual_value numeric NOT NULL,
  counterfactual_value numeric NOT NULL,
  predicted_outcome_change numeric NOT NULL,
  insight_ar text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.counterfactual_insights TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.counterfactual_insights TO authenticated;
GRANT ALL ON public.counterfactual_insights TO service_role;

ALTER TABLE public.counterfactual_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "counterfactual_insights_public_read" ON public.counterfactual_insights
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS counterfactual_symbol_idx ON public.counterfactual_insights(symbol, created_at DESC);