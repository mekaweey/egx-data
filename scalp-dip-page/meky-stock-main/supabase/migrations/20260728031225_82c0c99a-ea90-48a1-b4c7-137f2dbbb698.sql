
DROP POLICY IF EXISTS "public read messages" ON public.session_messages;
DROP POLICY IF EXISTS "public read edits" ON public.session_edits;
DROP POLICY IF EXISTS "public read reads" ON public.session_reads;
DROP POLICY IF EXISTS "public read session ingest audit" ON public.session_ingest_audit;
DROP POLICY IF EXISTS "public read auth events" ON public.thunder_auth_events;

REVOKE SELECT ON public.session_messages, public.session_edits, public.session_reads, public.session_ingest_audit, public.thunder_auth_events FROM anon;

CREATE POLICY "auth read messages" ON public.session_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read edits" ON public.session_edits FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read reads" ON public.session_reads FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read session ingest audit" ON public.session_ingest_audit FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read thunder auth events" ON public.thunder_auth_events FOR SELECT TO authenticated USING (true);
