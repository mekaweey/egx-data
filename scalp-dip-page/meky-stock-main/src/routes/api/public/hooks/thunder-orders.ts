import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { logEvent, type TradeEventType, type TradeState } from "@/lib/trade-ledger.server";

/**
 * Thunder Extension orders endpoint.
 * - GET: returns currently-pending orders (after auto-expiring stale ones).
 * - POST: extension updates an order's status (opened/prepared/confirmed/error/cancelled).
 * Auth: shared x-thunder-token (same secret as ingest).
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-thunder-token",
  "Access-Control-Max-Age": "86400",
} as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function authOK(request: Request): boolean {
  const expected = process.env.THUNDER_INGEST_TOKEN ?? "";
  const provided = request.headers.get("x-thunder-token") ?? "";
  return expected.length > 0 && provided.length === expected.length && provided === expected;
}

const UpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["opened", "prepared", "confirmed", "error", "cancelled", "review_clicked"]),
  error_message: z.string().max(500).optional(),
  signal_to_review_ms: z.number().int().nonnegative().max(24 * 3600 * 1000).optional(),
});

export const Route = createFileRoute("/api/public/hooks/thunder-orders")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),

      GET: async ({ request }) => {
        if (!authOK(request)) return new Response("Unauthorized", { status: 401, headers: CORS_HEADERS });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Auto-expire stale pending/opened orders past expires_at.
        await supabaseAdmin
          .from("pending_orders")
          .update({ status: "expired" })
          .in("status", ["pending", "opened"])
          .lt("expires_at", new Date().toISOString());

        const { data, error } = await supabaseAdmin
          .from("pending_orders")
          .select("id, symbol, side, qty, ref_price, order_type, limit_price, status, signal_source, created_at, expires_at, metadata")
          .in("status", ["pending", "opened", "prepared"])
          .order("created_at", { ascending: true })
          .limit(20);

        if (error) return json({ ok: false, error: error.message }, 500);

        const orders = data ?? [];
        const symbols = Array.from(new Set(orders.map((o) => String(o.symbol || "").toUpperCase()).filter(Boolean)));
        const uuidBySymbol = new Map<string, string>();
        if (symbols.length) {
          const { data: ticks } = await supabaseAdmin
            .from("live_ticks")
            .select("symbol, ts, meta")
            .in("symbol", symbols)
            .eq("source", "thunder_ext")
            .order("ts", { ascending: false })
            .limit(Math.max(200, symbols.length * 20));
          for (const t of ticks ?? []) {
            const sym = String(t.symbol || "").toUpperCase();
            const uuid = String(((t.meta as Record<string, unknown> | null)?.uuid ?? "")).trim();
            if (sym && uuid && !uuidBySymbol.has(sym)) uuidBySymbol.set(sym, uuid);
          }
        }

        return json({ ok: true, orders: orders.map((o) => ({ ...o, uuid: uuidBySymbol.get(String(o.symbol || "").toUpperCase()) ?? null })) });
      },

      POST: async ({ request }) => {
        if (!authOK(request)) return new Response("Unauthorized", { status: 401, headers: CORS_HEADERS });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        let raw: unknown;
        try { raw = await request.json(); } catch { return json({ ok: false, error: "invalid_json" }, 400); }
        const parsed = UpdateSchema.safeParse(raw);
        if (!parsed.success) return json({ ok: false, error: "validation_failed", issues: parsed.error.flatten() }, 400);

        const { id, status, error_message, signal_to_review_ms } = parsed.data;
        const nowIso = new Date().toISOString();

        // "review_clicked" is a metric-only ping — don't overwrite status,
        // just merge the latency into metadata so we can audit reaction time.
        if (status === "review_clicked" || typeof signal_to_review_ms === "number") {
          const { data: row } = await supabaseAdmin
            .from("pending_orders")
            .select("metadata")
            .eq("id", id)
            .maybeSingle();
          const meta = { ...((row?.metadata as Record<string, unknown> | null) ?? {}) };
          if (typeof signal_to_review_ms === "number") {
            meta.signal_to_review_ms = signal_to_review_ms;
            meta.review_clicked_at = nowIso;
          }
          const { error: mErr } = await supabaseAdmin
            .from("pending_orders")
            .update({ metadata: meta as never })
            .eq("id", id);
          if (mErr) return json({ ok: false, error: mErr.message }, 500);
          if (status === "review_clicked") {
            try {
              const { data: po } = await supabaseAdmin
                .from("pending_orders")
                .select("symbol, signal_source, trade_date, side")
                .eq("id", id).maybeSingle();
              if (po) {
                await logEvent({
                  trade_date: (po.trade_date as string) ?? undefined,
                  symbol: String(po.symbol),
                  strategy: String(po.signal_source || ""),
                  pending_order_id: id,
                  event_type: "REVIEW_CLICKED",
                  state: po.side === "buy" ? "BUYING" : "SELLING",
                  source: "thunder-orders",
                  metadata: { signal_to_review_ms },
                });
              }
            } catch (e) { console.error("[ledger] review_clicked log failed:", (e as Error).message); }
            return json({ ok: true, recorded: true });
          }
        }

        const patch =
          status === "prepared"
            ? { status, prepared_at: nowIso, error_message: error_message ?? null }
            : status === "confirmed"
            ? { status, confirmed_at: nowIso, error_message: error_message ?? null }
            : { status, error_message: error_message ?? null };

        const { error } = await supabaseAdmin.from("pending_orders").update(patch).eq("id", id);
        if (error) return json({ ok: false, error: error.message }, 500);

        // Ledger: extension progressed the order through its stages.
        try {
          const { data: po } = await supabaseAdmin
            .from("pending_orders")
            .select("symbol, side, ref_price, qty, signal_source, trade_date, metadata")
            .eq("id", id).maybeSingle();
          if (po) {
            const map: Record<string, { et: TradeEventType; st: TradeState | null }> = {
              opened:    { et: "ORDER_OPENED",    st: po.side === "buy" ? "BUYING" : "SELLING" },
              prepared:  { et: "ORDER_PREPARED",  st: po.side === "buy" ? "BUYING" : "SELLING" },
              confirmed: { et: "ORDER_CONFIRMED", st: po.side === "buy" ? "BUYING" : "SELLING" },
              error:     { et: "ERROR",           st: "ERROR" },
              cancelled: { et: "CANCELLED",       st: "CANCELLED" },
            };
            const m = map[status];
            if (m) {
              await logEvent({
                trade_date: (po.trade_date as string) ?? undefined,
                symbol: String(po.symbol),
                strategy: String(po.signal_source || ""),
                pending_order_id: id,
                event_type: m.et,
                state: m.st,
                price: Number(po.ref_price) || null,
                qty: Number(po.qty) || null,
                reason: error_message ?? null,
                source: "thunder-orders",
                metadata: { side: po.side, po_metadata: po.metadata },
              });
            }
          }
        } catch (e) {
          console.error("[ledger] thunder-orders log failed:", (e as Error).message);
        }

        return json({ ok: true });
      },
    },
  },
});