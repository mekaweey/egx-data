-- =====================================================================
-- VACUUM FULL for data tables (reclaim disk space after archival-delete)
-- =====================================================================
-- After archive-runner deletes old rows (>48h), PostgreSQL marks dead
-- tuples for reuse but does NOT shrink the physical file. VACUUM FULL
-- rewrites each table to a fresh file and reclaims the freed pages.
--
-- This function is called via supabaseAdmin.rpc("vacuum_full_data_tables")
-- from archive-runner.server.ts after the deletion loop completes.
-- It uses EXECUTE inside PL/pgSQL to bypass the "VACUUM cannot run in a
-- transaction block" restriction that applies to plain SQL.
-- =====================================================================

CREATE OR REPLACE FUNCTION vacuum_full_data_tables()
RETURNS TABLE(
    table_name TEXT,
    vacuumed   BOOLEAN,
    message    TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN
        SELECT unnest(ARRAY[
            'live_ticks',
            'marketwatch_snapshots',
            'orderbook_snapshots',
            'live_quotes',
            'smart_exit_log',
            'thunder_auth_events'
        ])
    LOOP
        BEGIN
            -- VACUUM FULL ANALYZE rewrites the table and updates statistics
            EXECUTE format('VACUUM FULL ANALYZE %I', tbl);
            table_name := tbl;
            vacuumed   := TRUE;
            message    := NULL;
            RETURN NEXT;
        EXCEPTION
            WHEN OTHERS THEN
                table_name := tbl;
                vacuumed   := FALSE;
                message    := SQLERRM;
                RETURN NEXT;
        END;
    END LOOP;
    RETURN;
END;
$$;

REVOKE ALL ON FUNCTION vacuum_full_data_tables() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION vacuum_full_data_tables() TO service_role;
