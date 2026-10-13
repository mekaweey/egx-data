DROP POLICY IF EXISTS "public insert messages" ON public.session_messages;
DROP POLICY IF EXISTS "public insert edits" ON public.session_edits;
DROP POLICY IF EXISTS "public insert reads" ON public.session_reads;

REVOKE INSERT ON public.session_messages FROM anon, authenticated;
REVOKE INSERT ON public.session_edits FROM anon, authenticated;
REVOKE INSERT ON public.session_reads FROM anon, authenticated;

GRANT SELECT ON public.session_messages TO anon, authenticated;
GRANT SELECT ON public.session_edits TO anon, authenticated;
GRANT SELECT ON public.session_reads TO anon, authenticated;
GRANT ALL ON public.session_messages TO service_role;
GRANT ALL ON public.session_edits TO service_role;
GRANT ALL ON public.session_reads TO service_role;