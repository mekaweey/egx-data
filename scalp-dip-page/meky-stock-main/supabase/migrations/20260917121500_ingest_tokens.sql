-- ingest_tokens: accepted tokens for the ticks endpoint (read by thunder-ticks.ts).
-- Lets the operator align tokens without redeploying. RLS on; service-role only.
CREATE TABLE IF NOT EXISTS public.ingest_tokens (
  token text PRIMARY KEY,
  note text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.ingest_tokens ENABLE ROW LEVEL SECURITY;

-- ingest_diag: TEMPORARY diagnostic capture of offered tokens that failed auth
-- (deleted right after the operator aligns the token).
CREATE TABLE IF NOT EXISTS public.ingest_diag (
  token text PRIMARY KEY,
  hits integer DEFAULT 1,
  first_seen timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now()
);
ALTER TABLE public.ingest_diag ENABLE ROW LEVEL SECURITY;
