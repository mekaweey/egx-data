import { isThunderAuthorized } from "@/lib/thunder-auth.server";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Ingest Scalp signal timeline events from the Thunder extension.
 * Fire-and-forget from the extension side; here we validate + insert.
 * Auth: shared THUNDER_INGEST_TOKEN in x-thunder-token header.
 */

const EventName = z.enum([
  "signal_received",
  "tab_opened",
  "l2_modal_opened",
  "l2_snapshot_ready",
  "l2_guard_verdict",
  "buy_started",
  "buy_confirmed",
  "buy_failed",
  "sell_started",
  "sell_price_written",
  "sell_confirmed",
  "sell_failed",
]);

const EventSchema = z.object({
  signal_id: z.string().max(128).optional().nullable(),
  symbol: z.string().trim().min(1).max(32),
  uuid: z.string().max(64).optional().nullable(),
  event: EventName,
  at_ms: z.number().finite().positive(),
  meta: z.record(z.string(), z.unknown()).optional().nullable(),
});

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-thunder-token",
  "Access-Control-Max-Age": "86400",
} as const;

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", ...CORS } });

export const Route = createFileRoute("/api/public/hooks/scalp-timeline")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const expected = process.env.THUNDER_INGEST_TOKEN;
        if (!expected) return json({ ok: false, error: "token_not_configured" }, 500);
        const provided = request.headers.get("x-thunder-token") ?? "";
        if (!(await isThunderAuthorized(provided, expected))) {
          return new Response("Unauthorized", { status: 401, headers: CORS });
        }

        let raw: unknown;
        try { raw = await request.json(); } catch { return json({ ok: false, error: "invalid_json" }, 400); }

        const items: unknown[] = Array.isArray(raw)
          ? raw
          : (raw && typeof raw === "object" && Array.isArray((raw as { events?: unknown[] }).events))
            ? (raw as { events: unknown[] }).events
            : [raw];

        if (items.length < 1 || items.length > 200) {
          return json({ ok: false, error: "invalid_body", reason: "1..200 events" }, 400);
        }

        const valid: Array<z.infer<typeof EventSchema>> = [];
        let invalid = 0;
        for (const item of items) {
          const r = EventSchema.safeParse(item);
          if (r.success) valid.push(r.data);
          else invalid++;
        }
        if (valid.length === 0) return json({ ok: false, error: "all_invalid", invalid }, 400);

        const rows = valid.map((e) => ({
          signal_id: e.signal_id ?? null,
          symbol: e.symbol.toUpperCase(),
          uuid: e.uuid ? e.uuid.toLowerCase() : null,
          event: e.event,
          at_ms: Math.floor(e.at_ms),
          meta: (e.meta ?? {}) as unknown as Record<string, unknown>,
        }));

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("scalp_timeline_events").insert(rows as never);
        if (error) return json({ ok: false, error: error.message }, 500);
        return json({ ok: true, inserted: rows.length, invalid });
      },
    },
  },
});