import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { isLocalRuntime, runExport, type ExportResult } from "@/lib/history-export.server";
import { DATA_TABLE_NAMES } from "@/lib/data-tables.config";

/**
 * Local-only historical export hook used by the marketwatch-health page.
 * All Supabase access inside runExport() is read-only SELECT; the only writes
 * are new cache partition files (never overwrite) and the browser-side save.
 */

const ALLOWED = DATA_TABLE_NAMES;

const BodySchema = z.object({
  tables: z.array(z.string().trim().min(1)).min(1).max(10),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),

  mode: z.union([z.literal("separate"), z.literal("unified")]).default("separate"),
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/public/hooks/export-history")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204 }),
      GET: async () => {
        const local = await isLocalRuntime();
        return json({ local, reason: local ? null : "PROD" });
      },
      POST: async ({ request }) => {
        try {
          // Tell the client clearly if this is running on production (not local).
          const local = await isLocalRuntime();
          if (!local) {
            return json({ ok: false, local: false, reason: "PROD" }, 200);
          }

          let raw: unknown;
          try {
            raw = await request.json();
          } catch {
            return json({ ok: false, local: true, reason: "BAD_JSON" }, 400);
          }

          const parsed = BodySchema.safeParse(raw);
          if (!parsed.success) {
            return json({ ok: false, local: true, reason: "BAD_BODY" }, 400);
          }

          // Resolve "all" (expand) before running, keeping only allowed tables.
          const set = new Set<string>();
          for (const t of parsed.data.tables) {
            if (t.toLowerCase() === "all") {
              for (const a of ALLOWED) set.add(a);
            } else if (ALLOWED.includes(t)) {
              set.add(t);
            }
          }
          const tables = ALLOWED.filter((t) => set.has(t));
          if (tables.length === 0) {
            return json({ ok: false, local: true, reason: "NO_TABLE" }, 400);
          }

          const result = await runExport(
            { tables, start: parsed.data.start, end: parsed.data.end, mode: parsed.data.mode },
            undefined,
          );
          return json(result, 200);
        } catch (e) {
          // NEVER let an unhandled exception bubble up into an HTML error page.
          // Always return valid JSON with a readable message.
          console.error("[export-history] handler error:", e);
          return json(
            {
              ok: false,
              local: true,

              reason: "INTERNAL",
              errorMessage: String((e as Error)?.message || e).slice(0, 300),
            },
            200,
          );
        }
      },
    },
  },
});
