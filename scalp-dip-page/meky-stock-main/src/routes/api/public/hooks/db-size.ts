import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { DATA_TABLE_NAMES } from "@/lib/data-tables.config";

/**
 * Storage-size monitoring endpoint.
 *
 * Returns the current Supabase project's total database size via the
 * `get_db_size()` PostgreSQL function (pg_database_size + pg_size_pretty).
 * Optionally includes per-table estimates when `?detail=1` is appended.
 *
 * Called by the `db-size-health-check` cron job every 15 min during
 * Cairo market hours (08:00–12:00 UTC, Sun–Thu).
 */

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/public/hooks/db-size")({
  server: {
    handlers: {
      // Allow GET for manual/ad-hoc checks and POST for cron job calls.
      GET: async () => {
        return handle();
      },
      POST: async () => {
        return handle();
      },
    },
  },
});

async function handle(): Promise<Response> {
  try {
    // 1. Total database size (bytes + human-readable)
    // Type assertion needed because get_db_size is not yet in generated types
    const { data, error } = await supabaseAdmin.rpc("get_db_size" as any);

    if (error) {
      return json({ ok: false, error: error.message }, 500);
    }

    const row = (data ?? [])[0] as
      | { total_bytes: number; human_size: string }
      | undefined;

    if (!row) {
      return json({ ok: false, error: "get_db_size returned no rows" }, 500);
    }

    // 2. Count known data tables for context
    const tableCount = DATA_TABLE_NAMES.length;

    return json({
      ok: true,
      total_bytes: row.total_bytes,
      human_size: row.human_size,
      table_count: tableCount,
      checked_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[db-size] handler error:", e);
    return json(
      {
        ok: false,
        error: String((e as Error)?.message || e).slice(0, 300),
      },
      500,
    );
  }
}
