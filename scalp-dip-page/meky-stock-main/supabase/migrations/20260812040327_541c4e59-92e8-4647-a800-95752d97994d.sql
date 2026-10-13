CREATE OR REPLACE FUNCTION public.compress_marketwatch_snapshots(retention_days integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.marketwatch_snapshots
  WHERE id IN (
    SELECT id
    FROM (
      SELECT id,
             ROW_NUMBER() OVER (
               PARTITION BY symbol, date_trunc('hour', captured_at)
               ORDER BY captured_at ASC
             ) as rn
      FROM public.marketwatch_snapshots
      WHERE captured_at < (now() - (retention_days || ' days')::interval)
    ) t
    WHERE t.rn > 1
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.compress_marketwatch_snapshots(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.compress_marketwatch_snapshots(integer) TO authenticated;