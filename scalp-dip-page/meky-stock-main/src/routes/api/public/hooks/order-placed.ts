import { isThunderAuthorized } from "@/lib/thunder-auth.server";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Record a new order being placed on Thunder. Creates order_lifecycle + execution_context.
 * Returns the generated order_id — extension stores it and sends it back on updates.
 */

const NumLike = z.preprocess((v) => {
  if (typeof v === "string") { const n = Number(v.replace(/,/g, "").trim()); return Number.isFinite(n) ? n : v; }
  return v;
}, z.number().finite());

const Schema = z.object({
  symbol: z.string().trim().min(1).max(32),
  side: z.enum(["buy", "sell"]),
  order_type: z.enum(["limit", "market"]),
  requested_price: NumLike.optional().nullable(),
  requested_qty: NumLike.refine((n) => n > 0, "qty>0"),
  session_id: z.string().uuid().optional().nullable(),
  thunder_order_id: z.string().max(128).optional().nullable(),
  signal_source: z.string().max(128).optional().nullable(),
  strategy: z.string().max(64).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  // Execution context
  best_bid: NumLike.optional().nullable(),
  best_ask: NumLike.optional().nullable(),
  last_price: NumLike.optional().nullable(),
  safe_floor: NumLike.optional().nullable(),
  break_even: NumLike.optional().nullable(),
  decision_reason: z.string().max(256).optional().nullable(),
  snapshot_before: z.record(z.string(), z.unknown()).optional().nullable(),
});

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-thunder-token",
  "Access-Control-Max-Age": "86400",
} as const;
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", ...CORS } });

export const Route = createFileRoute("/api/public/hooks/order-placed")({
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
        const parsed = Schema.safeParse(raw);
        if (!parsed.success) return json({ ok: false, error: "invalid_body", issues: parsed.error.issues }, 400);
        const d = parsed.data;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const insertRow = {
          symbol: d.symbol.toUpperCase(),
          side: d.side,
          order_type: d.order_type,
          requested_price: d.requested_price ?? null,
          requested_qty: d.requested_qty,
          remaining_qty: d.requested_qty,
          session_id: d.session_id ?? null,
          thunder_order_id: d.thunder_order_id ?? null,
          signal_source: d.signal_source ?? null,
          strategy: d.strategy ?? null,
          metadata: (d.metadata ?? {}) as unknown as Record<string, unknown>,
        };
        const { data: created, error } = await supabaseAdmin
          .from("order_lifecycle")
          .insert(insertRow as never)
          .select("id")
          .single();
        if (error || !created) return json({ ok: false, error: error?.message ?? "insert_failed" }, 500);

        const ctxRow = {
          order_lifecycle_id: created.id,
          best_bid_at_placement: d.best_bid ?? null,
          best_ask_at_placement: d.best_ask ?? null,
          spread_at_placement: d.best_bid != null && d.best_ask != null ? d.best_ask - d.best_bid : null,
          last_price_at_placement: d.last_price ?? null,
          safe_floor: d.safe_floor ?? null,
          break_even: d.break_even ?? null,
          decision_reason: d.decision_reason ?? null,
          snapshot_before: (d.snapshot_before ?? null) as unknown as Record<string, unknown> | null,
        };
        await supabaseAdmin.from("execution_context").insert(ctxRow as never);

        return json({ ok: true, order_id: created.id });
      },
    },
  },
});