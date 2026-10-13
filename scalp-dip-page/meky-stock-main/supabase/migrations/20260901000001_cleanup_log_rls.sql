-- Security fix (Sep 1, 2026): Supabase Advisor flagged _cleanup_log as a
-- public table with RLS disabled. This table is written by the
-- cleanup_if_needed() safety-net function (pg_cron), which runs as
-- postgres/SECURITY DEFINER and bypasses RLS, so enabling RLS does not
-- affect the safety net. service_role keeps full access; everyone else
-- (anon / authenticated) is denied by default (no policies = deny all).

ALTER TABLE public._cleanup_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access" ON public._cleanup_log;
CREATE POLICY "service_role_full_access" ON public._cleanup_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
