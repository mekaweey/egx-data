import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Extension trade journal: every buy/sell fill detected by the extension
 * gets upserted here so the user has a per-trade P&L log synced off-device.
 * Auth: shared x-thunder-token (same as ingest).
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

const UpsertSchema = z.object({
  client_trade_id: z.string().min(3).max(128),
  symbol: z.string().min(1).max(16),
  trade_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source: z.string().max(64).optional(),
  status: z.enum(["open", "closed"]).default("open"),
  opened_at: z.string(),
  buy_qty: z.number().nullable().optional(),
  buy_price: z.number().nullable().optional(),
  buy_value: z.number().nullable().optional(),
  buy_fee: z.number().nullable().optional(),
  buy_total_cost: z.number().nullable().optional(),
  closed_at: z.string().nullable().optional(),
  sell_qty: z.number().nullable().optional(),
  sell_price: z.number().nullable().optional(),
  sell_value: z.number().nullable().optional(),
  sell_fee: z.number().nullable().optional(),
  sell_net_proceeds: z.number().nullable().optional(),
  pnl: z.number().nullable().optional(),
  pnl_pct: z.number().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const Route = createFileRoute("/api/public/hooks/extension-trades")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),

      GET: async ({ request }) => {
        if (!authOK(request)) return new Response("Unauthorized", { status: 401, headers: CORS_HEADERS });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const url = new URL(request.url);
        const date = url.searchParams.get("date");
        let q = supabaseAdmin.from("extension_trades").select("*").order("opened_at", { ascending: false }).limit(200);
        if (date) q = q.eq("trade_date", date);
        const { data, error } = await q;
        if (error) return json({ ok: false, error: error.message }, 500);
        return json({ ok: true, trades: data ?? [] });
      },

      POST: async ({ request }) => {
        if (!authOK(request)) return new Response("Unauthorized", { status: 401, headers: CORS_HEADERS });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        let raw: unknown;
        try { raw = await request.json(); } catch { return json({ ok: false, error: "invalid_json" }, 400); }
        const parsed = UpsertSchema.safeParse(raw);
        if (!parsed.success) return json({ ok: false, error: "validation_failed", issues: parsed.error.flatten() }, 400);

        const payload = {
          ...parsed.data,
          symbol: parsed.data.symbol.toUpperCase(),
          metadata: (parsed.data.metadata ?? {}) as never,
        };
        const { error } = await supabaseAdmin
          .from("extension_trades")
          .upsert(payload, { onConflict: "client_trade_id" });
        if (error) return json({ ok: false, error: error.message }, 500);
        return json({ ok: true });
      },
    },
  },
});