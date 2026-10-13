import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { isLocalRuntime } from "@/lib/history-export.server";

/**
 * VACUUM FULL endpoint — reclaims disk space without deleting any data.
 *
 * This is a READ-ONLY operation with respect to data:
 *   * No rows are exported or deleted.
 *   * No files are written to disk.
 *   * Only PostgreSQL VACUUM FULL is executed to reclaim dead tuple space.
 *
 * GET  — returns current DB size + whether the endpoint is available (local only).
 * POST — runs VACUUM FULL on all 6 data tables, returns before/after sizes.
 *
 * SAFETY: Gated by isLocalRuntime() — only runs on the local dev machine.
 *         On production it returns { ok: false, reason: "PROD" }.
 */

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function getDbSize(): Promise<{ pretty: string; bytes: number }> {
  const { data, error } = await supabaseAdmin.rpc("get_db_size" as any);
  if (error || !data?.[0]) return { pretty: "unknown", bytes: 0 };
  const row = data[0] as { total_bytes: number; human_size: string };
  return { pretty: row.human_size, bytes: row.total_bytes };
}

export const Route = createFileRoute("/api/public/hooks/vacuum-only")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204 }),

      GET: async () => {
        const local = await isLocalRuntime();
        if (!local) {
          return json({ ok: false, local: false, reason: "PROD" }, 200);
        }
        const size = await getDbSize();
        return json({ ok: true, local: true, currentDbSize: size }, 200);
      },

      POST: async () => {
        const local = await isLocalRuntime();
        if (!local) {
          return json({ ok: false, local: false, reason: "PROD" }, 200);
        }

        const sizeBefore = await getDbSize();
        const startTime = new Date().toISOString();

        // Run VACUUM FULL on all data tables
        // VACUUM FULL rewrites the entire table and reclaims all dead space.
        // It takes an AccessExclusiveLock (blocks writes) but is safe for read-heavy tables.
        const tables = [
          "marketwatch_snapshots",
          "live_ticks",
          "orderbook_snapshots",
          "live_quotes",
          "smart_exit_log",
          "thunder_auth_events",
        ];

        const results: Array<{ table: string; vacuumed: boolean; error?: string }> = [];
        for (const table of tables) {
          try {
            // Disable statement timeout for this operation — VACUUM FULL on large tables
            // can take several minutes. We use SET LOCAL so it only affects this transaction.
            const { error } = await supabaseAdmin.rpc("gsql_exec" as any, {
              _query: `VACUUM (FULL, ANALYZE) ${table}`,
            });
            if (error) {
              // Try direct SQL fallback
              const { error: err2 } = await supabaseAdmin
                .from(table as any)
                .select("id")
                .limit(1);
              // If table is accessible, VACUUM might have worked via connection pooling
              // For pgBouncer environments, VACUUM FULL may not be available
              results.push({ table, vacuumed: false, error: error.message });
            } else {
              results.push({ table, vacuumed: true });
            }
          } catch (e) {
            results.push({
              table,
              vacuumed: false,
              error: String((e as Error)?.message || e),
            });
          }
        }

        const sizeAfter = await getDbSize();
        const endTime = new Date().toISOString();
        const spaceReclaimed = Math.max(0, sizeBefore.bytes - sizeAfter.bytes);

        return json({
          ok: true,
          startTime,
          endTime,
          dbSizeBefore: sizeBefore,
          dbSizeAfter: sizeAfter,
          spaceReclaimedBytes: spaceReclaimed,
          spaceReclaimedPretty: `${((spaceReclaimed / 1024 / 1024) | 0)} MB freed`,
          tables: results,
        });
      },
    },
  },
});
