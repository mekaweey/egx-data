
REVOKE EXECUTE ON FUNCTION public.get_cron_jobs() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_cron_runs(int) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_cron_jobs() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_cron_runs(int) TO service_role;
