import { createFileRoute } from "@tanstack/react-router";
import {
  runArchive,
  type ProgressEvent,
  type ArchiveSummary,
} from "@/lib/archive-runner.server";
import { isLocalRuntime } from "@/lib/history-export.server";

/**
 * Local-only manual archive trigger endpoint with SSE progress streaming.
 *
 * GET  — checks local runtime and returns readiness status (no work done).
 * POST — triggers a full archive cycle (export CSV + .csv.gz → delete).
 *        Returns an SSE stream so the UI shows live progress.
 *
 * Query params (POST):
 *   dry_run            = "true" | "false"  (default false)
 *   older_than_hours   = number            (default 48)
 *
 * SAFETY: This endpoint is gated by isLocalRuntime() — it only runs on the
 * local dev machine where the Supabase service-role key is present and the
 * D:\1All Data archive root exists. On production Render deployments it is a
 * no-op that returns { ok: false, reason: "PROD" }.
 */

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Convert any payload into a valid SSE `data:` line.
 * Returns a Uint8Array ready to be written to the SSE stream.
 */
function encodeSSE(obj: unknown): Uint8Array {
  const line = `data: ${JSON.stringify(obj)}\n\n`;
  return new TextEncoder().encode(line);
}

export const Route = createFileRoute("/api/public/hooks/archive-trigger")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204 }),

      GET: async () => {
        const local = await isLocalRuntime();
        if (!local) {
          return json({ ok: false, local: false, reason: "PROD" }, 200);
        }
        return json({ ok: true, local: true, reason: "ready", endpoint: "POST" }, 200);
      },

      POST: async ({ request }) => {
        const local = await isLocalRuntime();
        if (!local) {
          return json({ ok: false, local: false, reason: "PROD" }, 200);
        }

        const url = new URL(request.url);
        const dryRun = url.searchParams.get("dry_run") === "true";
        const olderThanHours =
          parseInt(url.searchParams.get("older_than_hours") ?? "48", 10) || 48;

        const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
        const writer = writable.getWriter();

        // Send initial ping so the client knows the connection is live.
        void writer.write(encodeSSE({ type: "connected", dryRun, olderThanHours }));

        // Kick off the archive in the background; the callback pushes SSE events.
        void runArchive({
          dryRun,
          olderThanHours,
          onProgress: (event: ProgressEvent) => {
            void writer.write(encodeSSE(event));
          },
        })
          .then((summary: ArchiveSummary) => {
            void writer.write(encodeSSE({ type: "all_done", summary }));
            void writer.close();
          })
          .catch((err: unknown) => {
            const msg = String((err as Error)?.message || err);
            console.error("[archive-trigger] runArchive threw:", msg);
            void writer.write(
              encodeSSE({ type: "error", error: msg.slice(0, 500) }),
            );
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