REVOKE ALL ON FUNCTION public.compress_marketwatch_snapshots(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.compress_marketwatch_snapshots(integer) FROM anon;

ALTER FUNCTION public.compress_marketwatch_snapshots(integer) SET search_path = public;

GRANT EXECUTE ON FUNCTION public.compress_marketwatch_snapshots(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.compress_marketwatch_snapshots(integer) TO authenticated;