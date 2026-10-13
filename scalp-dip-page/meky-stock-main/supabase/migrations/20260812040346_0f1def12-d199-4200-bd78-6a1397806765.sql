REVOKE EXECUTE ON FUNCTION public.compress_marketwatch_snapshots(integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.compress_marketwatch_snapshots(integer) TO service_role;