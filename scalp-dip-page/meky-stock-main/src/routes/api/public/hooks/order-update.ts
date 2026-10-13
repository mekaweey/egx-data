import { isThunderAuthorized } from "@/lib/thunder-auth.server";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { logEvent, type TradeEventType } from "@/lib/trade-ledger.server";

/**
 * Update an existing order_lifecycle row as its state on Thunder changes.
 * Called by the extension when it polls the orders page.
 */

const NumLike = z.preprocess((v) => {
  if (typeof v === "string") { const n = Number(v.replace(/,/g, "").trim()); return Number.isFinite(n) ? n : v; }
  return v;
}, z.number().finite());

const Schema = z.object({
  order_id: z.string().uuid().optional().nullable(),
  thunder_order_id: z.string().max(128).optional().nullable(),
  status: z.enum(["pending", "partial", "filled", "cancelled", "expired", "failed"]).optional(),
  fill_price_avg: NumLike.optional().nullable(),
  filled_qty: NumLike.optional().nullable(),
  remaining_qty: NumLike.optional().nullable(),
  confirmed_at: z.string().optional().nullable(),
  first_fill_at: z.string().optional().nullable(),
  fully_filled_at: z.string().optional().nullable(),
  cancelled_at: z.string().optional().nullable(),
  set_thunder_order_id: z.string().max(128).optional().nullable(),
  metadata_patch: z.record(z.string(), z.unknown()).optional().nullable(),
}).refine((d) => !!(d.order_id || d.thunder_order_id), { message: "order_id or thunder_order_id required" });

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-thunder-token",
  "Access-Control-Max-Age": "86400",
} as const;
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", ...CORS } });

export const Route = createFileRoute("/api/public/hooks/order-update")({
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

        const patch: Record<string, unknown> = {};
        if (d.status) patch.status = d.status;
        if (d.fill_price_avg != null) patch.fill_price_avg = d.fill_price_avg;
        if (d.filled_qty != null) patch.filled_qty = d.filled_qty;
        if (d.remaining_qty != null) patch.remaining_qty = d.remaining_qty;
        if (d.confirmed_at) patch.confirmed_at = d.confirmed_at;
        if (d.first_fill_at) patch.first_fill_at = d.first_fill_at;
        if (d.fully_filled_at) patch.fully_filled_at = d.fully_filled_at;
        if (d.cancelled_at) patch.cancelled_at = d.cancelled_at;
        if (d.set_thunder_order_id) patch.thunder_order_id = d.set_thunder_order_id;

        if (Object.keys(patch).length === 0 && !d.metadata_patch) {
          return json({ ok: false, error: "empty_patch" }, 400);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        // Merge metadata by fetching existing row first (small cost, keeps history)
        let target = d.order_id ? { by: "id", val: d.order_id } : { by: "thunder_order_id", val: d.thunder_order_id! };
        if (d.metadata_patch) {
          const q = supabaseAdmin.from("order_lifecycle").select("id, metadata").eq(target.by, target.val).limit(1).maybeSingle();
          const existing = await q;
          if (existing.data) {
            const merged = { ...(existing.data.metadata as Record<string, unknown> | null ?? {}), ...d.metadata_patch };
            patch.metadata = merged;
            target = { by: "id", val: existing.data.id };
          }
        }

        const { data, error } = await supabaseAdmin
          .from("order_lifecycle")
          .update(patch as never)
          .eq(target.by, target.val)
          .select("id, status, symbol, side, filled_qty, fill_price_avg, metadata")
          .maybeSingle();
        if (error) return json({ ok: false, error: error.message }, 500);
        if (!data) return json({ ok: false, error: "order_not_found" }, 404);

        // Ledger: fill/cancellation on a live order.
        try {
          if (d.status === "filled" || d.status === "partial" || d.status === "cancelled" || d.status === "failed" || d.status === "expired") {
            const side = String((data as { side?: string }).side || "").toLowerCase();
            const et: TradeEventType =
              d.status === "cancelled" || d.status === "failed" || d.status === "expired" ? "CANCELLED"
              : side === "sell" ? "SELL_FILLED" : "BUY_FILLED";
            await logEvent({
              symbol: String((data as { symbol?: string }).symbol || ""),
              event_type: et,
              price: d.fill_price_avg != null ? Number(d.fill_price_avg) : null,
              qty: d.filled_qty != null ? Number(d.filled_qty) : null,
              reason: d.status,
              source: "order-update",
              metadata: { order_lifecycle_id: data.id, side, partial: d.status === "partial" },
            });
          }
        } catch (e) {
          console.error("[ledger] order-update log failed:", (e as Error).message);
        }

        return json({ ok: true, order_id: data.id, status: data.status });
      },
    },
  },
});