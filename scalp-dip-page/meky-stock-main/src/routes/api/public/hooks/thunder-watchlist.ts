import { isThunderAuthorized } from "@/lib/thunder-auth.server";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Passive ingest of Thunder's own /watchlist response (metadata per asset).
 * The extension NEVER triggers this request — it reads what Thunder itself
 * already fetched. Zero detection surface.
 */

const N = z.preprocess((v) => {
  if (typeof v === "string") { const n = Number(v.replace(/,/g, "").trim()); return Number.isFinite(n) ? n : v; }
  return v;
}, z.number().finite()).nullable().optional();

const Item = z.object({
  symbol: z.string().trim().min(1).max(32),
  uuid: z.string().max(64).nullable().optional(),
  name: z.string().max(200).nullable().optional(),
  day_tradable: z.boolean().nullable().optional(),
  feed_price: N,
  previous_close: N,
  min_price_limit: N,
  max_price_limit: N,
  day_trade_limit: N,
  round_digits: z.number().int().nullable().optional(),
  market_id: z.string().max(32).nullable().optional(),
});

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-thunder-token",
  "Access-Control-Max-Age": "86400",
} as const;
const j = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", ...CORS } });

export const Route = createFileRoute("/api/public/hooks/thunder-watchlist")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const expected = process.env.THUNDER_INGEST_TOKEN;
        if (!expected) return j({ ok: false, error: "token_not_configured" }, 500);
        const provided = request.headers.get("x-thunder-token") ?? "";
        if (!(await isThunderAuthorized(provided, expected))) {
          return new Response("Unauthorized", { status: 401, headers: CORS });
        }
        let raw: unknown;
        try { raw = await request.json(); } catch { return j({ ok: false, error: "invalid_json" }, 400); }
        const items: unknown[] = Array.isArray(raw)
          ? raw
          : (raw && typeof raw === "object" && Array.isArray((raw as { items?: unknown[] }).items))
            ? (raw as { items: unknown[] }).items
            : [raw];
        if (items.length < 1 || items.length > 500) return j({ ok: false, error: "invalid_body" }, 400);

        const valid: Array<z.infer<typeof Item>> = [];
        let invalid = 0;
        for (const it of items) { const r = Item.safeParse(it); if (r.success) valid.push(r.data); else invalid++; }
        if (!valid.length) return j({ ok: false, error: "all_invalid", invalid }, 400);

        const rows = valid.map((v) => ({
          symbol: v.symbol.toUpperCase(),
          uuid: v.uuid ?? null,
          name: v.name ?? null,
          day_tradable: v.day_tradable ?? null,
          feed_price: v.feed_price ?? null,
          previous_close: v.previous_close ?? null,
          min_price_limit: v.min_price_limit ?? null,
          max_price_limit: v.max_price_limit ?? null,
          day_trade_limit: v.day_trade_limit ?? null,
          round_digits: v.round_digits ?? null,
          market_id: v.market_id ?? null,
          source: "thunder_ext",
        }));

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("thunder_watchlist_snapshots").insert(rows as never);
        if (error) return j({ ok: false, error: error.message }, 500);
        return j({ ok: true, inserted: rows.length, invalid });
      },
    },
  },
});