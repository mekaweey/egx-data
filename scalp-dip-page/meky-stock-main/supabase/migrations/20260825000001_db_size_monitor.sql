-- =====================================================================
-- Storage Size Monitor & Safety Net
-- =====================================================================
-- 1. Internal log table: `_cleanup_log` -- stores timestamped records of
--    cleanup operations (when the safety net triggers).
--
-- 2. PostgreSQL function `get_db_size()` -- returns the current total
--    database size in both raw bytes and human-readable format using:
--      SELECT pg_size_pretty(pg_database_size(current_database()))
--      SELECT pg_database_size(current_database())
--
-- 3. PostgreSQL function `cleanup_if_needed()` -- safety net that runs
--    daily via pg_cron. Only acts when size exceeds 495MB (very high
--    threshold). Deletes OLDEST rows from LARGEST tables (by size) until
--    back under 400MB. Logs each deletion to `_cleanup_log`.
--
-- 4. Scheduled cron job `storage-cleanup-safety-net` -- runs once daily
--    at 03:00 UTC (06:00 Cairo, before market open).
-- =====================================================================

-- ------------------------------------------------------------------
-- 1. Cleanup log table
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS _cleanup_log (
    id              BIGSERIAL PRIMARY KEY,
    run_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    table_name      TEXT NOT NULL,
    rows_deleted    BIGINT NOT NULL,
    size_before_mb  BIGINT NOT NULL,
    size_after_mb   BIGINT NOT NULL,
    details         JSONB
);

CREATE INDEX IF NOT EXISTS idx_cleanup_log_run_at
    ON _cleanup_log (run_at DESC);

-- ------------------------------------------------------------------
-- 2. get_db_size() -- scalar function returning current DB size
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_db_size()
RETURNS TABLE(
    total_bytes  BIGINT,
    human_size   TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT
        pg_database_size(current_database())::bigint  AS total_bytes,
        pg_size_pretty(pg_database_size(current_database())) AS human_size;
$$;

REVOKE ALL ON FUNCTION get_db_size() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_db_size() TO service_role;
GRANT SELECT, INSERT ON _cleanup_log TO service_role;
-- ------------------------------------------------------------------
-- 3. cleanup_if_needed() -- safety net function
-- ------------------------------------------------------------------
-- This function checks if DB size exceeds 495MB. If so, it identifies
-- the largest tables and deletes oldest rows until size drops below 400MB.
-- Only affects the 6 data tables defined in DATA_TABLES config.
CREATE OR REPLACE FUNCTION cleanup_if_needed()
RETURNS TABLE(
    action          TEXT,
    table_name      TEXT,
    rows_deleted    BIGINT,
    size_before_mb  BIGINT,
    size_after_mb   BIGINT,
    message         TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_bytes   BIGINT;
    v_total_mb      BIGINT;
    v_limit_mb      BIGINT := 495;   -- trigger threshold
    v_target_mb     BIGINT := 400;   -- target after cleanup
    v_table         RECORD;
    v_rows_deleted  BIGINT;
    v_before_mb     BIGINT;
    v_after_mb      BIGINT;
    v_sql           TEXT;
BEGIN
    -- Disable statement timeout for cleanup operations (may delete
    -- large batches of rows from tables with hundreds of thousands of records)
    PERFORM set_config('statement_timeout', '0', true);

    -- Get current database size
    SELECT total_bytes INTO v_total_bytes FROM get_db_size();
    v_total_mb := v_total_bytes / 1024 / 1024;

    -- Only act if over the high threshold
    IF v_total_mb < v_limit_mb THEN
        RETURN QUERY SELECT
            'no_action'::text,
            ''::text,
            0::bigint,
            v_total_mb::bigint,
            v_total_mb::bigint,
            'Database size (' || v_total_mb || ' MB) is below cleanup threshold (' || v_limit_mb || ' MB)'::text;
        RETURN;
    END IF;

    -- Log initial size
    v_before_mb := v_total_mb;

    -- Iterate through tables ordered by size (largest first)
    -- Only consider our 6 data tables
    FOR v_table IN
        SELECT
            c.relname AS table_name,
            pg_total_relation_size(c.oid) AS table_size_bytes,
            CASE c.relname
                WHEN 'live_ticks' THEN 'ts'
                WHEN 'marketwatch_snapshots' THEN 'captured_at'
                WHEN 'orderbook_snapshots' THEN 'ts'
                WHEN 'live_quotes' THEN 'ts'
                WHEN 'smart_exit_log' THEN 'ts'
                WHEN 'thunder_auth_events' THEN 'ts'
            END AS timestamp_col
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname IN ('live_ticks', 'marketwatch_snapshots', 'orderbook_snapshots', 'live_quotes', 'smart_exit_log', 'thunder_auth_events')
        ORDER BY pg_total_relation_size(c.oid) DESC
    LOOP
        -- Check if we've reached target
        SELECT total_bytes INTO v_total_bytes FROM get_db_size();
        v_total_mb := v_total_bytes / 1024 / 1024;
        
        IF v_total_mb <= v_target_mb THEN
            EXIT;
        END IF;

        -- Delete oldest 10% of rows from this table (batch size)
        v_sql := format(
            'WITH to_delete AS (
                SELECT id FROM %I
                ORDER BY %I ASC
                LIMIT GREATEST(1, (SELECT COUNT(*) FROM %I) / 10)
            )
            DELETE FROM %I
            WHERE id IN (SELECT id FROM to_delete)
            RETURNING 1',
            v_table.table_name, v_table.timestamp_col, v_table.table_name, v_table.table_name
        );
        
        EXECUTE v_sql;
        GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;

        -- Log the cleanup
        SELECT total_bytes INTO v_total_bytes FROM get_db_size();
        v_after_mb := v_total_bytes / 1024 / 1024;

        INSERT INTO _cleanup_log (run_at, table_name, rows_deleted, size_before_mb, size_after_mb, details)
        VALUES (
            now(),
            v_table.table_name,
            v_rows_deleted,
            v_before_mb,
            v_after_mb,
            jsonb_build_object(
                'timestamp_col', v_table.timestamp_col,
                'table_size_before_mb', pg_total_relation_size(v_table.table_name::regclass) / 1024 / 1024
            )
        );

        v_before_mb := v_after_mb;

        RETURN QUERY SELECT
            'cleaned'::text,
            v_table.table_name,
            v_rows_deleted,
            v_before_mb::bigint,
            v_after_mb::bigint,
            'Deleted ' || v_rows_deleted || ' oldest rows from ' || v_table.table_name || ' (size: ' || v_after_mb || ' MB)'::text;

        -- Check again if we're under target
        SELECT total_bytes INTO v_total_bytes FROM get_db_size();
        v_total_mb := v_total_bytes / 1024 / 1024;
        IF v_total_mb <= v_target_mb THEN
            EXIT;
        END IF;
    END LOOP;

    -- Final check
    SELECT total_bytes INTO v_total_bytes FROM get_db_size();
    v_total_mb := v_total_bytes / 1024 / 1024;
    
    IF v_total_mb > v_target_mb THEN
        RETURN QUERY SELECT
            'warning'::text,
            ''::text,
            0::bigint,
            v_before_mb::bigint,
            v_total_mb::bigint,
            'Cleanup completed but size (' || v_total_mb || ' MB) still above target (' || v_target_mb || ' MB). Manual intervention required.'::text;
    ELSE
        RETURN QUERY SELECT
            'completed'::text,
            ''::text,
            0::bigint,
            v_before_mb::bigint,
            v_total_mb::bigint,
            'Cleanup completed. Size reduced from ' || v_before_mb || ' MB to ' || v_total_mb || ' MB'::text;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION cleanup_if_needed() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cleanup_if_needed() TO service_role;
-- ------------------------------------------------------------------
-- 4. Cron job: run cleanup_if_needed() once daily at 03:00 UTC
--    (06:00 Cairo, before market open)
-- ------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'storage-cleanup-safety-net') THEN
    PERFORM cron.unschedule('storage-cleanup-safety-net');
  END IF;
END $$;

SELECT cron.schedule(
    'storage-cleanup-safety-net',
    '0 3 * * *',  -- 03:00 UTC daily (06:00 Cairo)
    $$ SELECT cleanup_if_needed() $$
);

-- Grant usage on cron schema to service_role
GRANT USAGE ON SCHEMA cron TO service_role;
GRANT SELECT ON cron.job TO service_role;
GRANT SELECT ON cron.job_run_details TO service_role;