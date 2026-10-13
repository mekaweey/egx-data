import { createFileRoute } from "@tanstack/react-router";
import { runFullArchive, type FullArchiveSummary } from "@/lib/archive-runner.server";
import { isLocalRuntime } from "@/lib/history-export.server";

/**
 * Local-only full cleanup + archive endpoint with SSE progress streaming.
 *
 * POST — Exports ALL data from Supabase → D:\1All Data\ (with deduplication),
 *         then runs VACUUM FULL on all tables to reclaim disk space.
 *         Returns SSE stream so the UI shows live progress.
 *
 * SAFETY:
 *   * Only works on local dev machine (isLocalRuntime() check).
 *   * Defaults to dryRun=true (export only, no DELETE, no VACUUM).
 *   * Pass ?dryRun=false to actually DELETE old rows + run VACUUM FULL.
 *   * On production Render: returns { ok: false, reason: "PROD" }.
 */

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function encodeSSE(obj: unknown): Uint8Array {
  const line = `data: ${JSON.stringify(obj)}\n\n`;
  return new TextEncoder().encode(line);
}

export const Route = createFileRoute("/api/public/hooks/vacuum-cleanup")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204 }),

      GET: async () => {
        const local = await isLocalRuntime();
        if (!local) return json({ ok: false, local: false, reason: "PROD" }, 200);
        return json({ ok: true, local: true, reason: "ready", description: "POST to trigger full cleanup + archive + VACUUM FULL" }, 200);
      },

      POST: async ({ request }) => {
        const local = await isLocalRuntime();
        if (!local) return json({ ok: false, local: false, reason: "PROD" }, 200);

        const url = new URL(request.url);
        const dryRun = url.searchParams.get("dryRun") !== "false"; // default: true (safe)

        const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
        const writer = writable.getWriter();

        void writer.write(encodeSSE({ type: "connected", description: `Starting full cleanup + VACUUM FULL (dryRun=${dryRun})...` }));

        void runFullArchive({
          dryRun,
          onProgress: (event: unknown) => {
            void writer.write(encodeSSE(event));
          },
        })
          .then((summary: FullArchiveSummary) => {
            void writer.write(encodeSSE({ type: "all_done", summary }));
            void writer.close();
          })
          .catch((err: unknown) => {
            const msg = String((err as Error)?.message || err);
            console.error("[vacuum-cleanup] runFullArchive threw:", msg);
            void writer.write(encodeSSE({ type: "error", error: msg.slice(0, 500) }));
            void writer.close();
          });

        return new Response(readable, {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
          },
        });
      },
    },
  },
});
