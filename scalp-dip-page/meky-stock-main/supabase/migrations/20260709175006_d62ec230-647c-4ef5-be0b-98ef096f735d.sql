DROP POLICY IF EXISTS "public insert session ingest audit" ON public.session_ingest_audit;
REVOKE INSERT ON public.session_ingest_audit FROM anon, authenticated;
GRANT SELECT ON public.session_ingest_audit TO anon, authenticated;
GRANT ALL ON public.session_ingest_audit TO service_role;