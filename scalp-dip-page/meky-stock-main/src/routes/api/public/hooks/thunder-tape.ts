import { isThunderAuthorized } from "@/lib/thunder-auth.server";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Thunder X trades-book/v2 (Level 3 tape) ingest.
 * The extension passively captures Thunder's own trades-book responses
 * (whenever the user opens an asset detail page) and forwards each trade
 * individually with its BUY/SELL side, price, volume, value and cursor.
 * Rows are deduplicated by (asset_id, cursor) at the DB level.
 */

const Num = z.preprocess((v) => {
  if (v === "" || v == null) return null;
  if (typeof v === "string") {
    const n = Number(v.replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : null;
  }
  return v;
}, z.number().finite().nullable().optional());

const TradeSchema = z.object({
  cursor: z.union([z.number(), z.string()]),
  side: z.string().nullish(),
  price: Num,
  volume: Num,
  value: Num,
  time: z.string().nullish(),
});

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-thunder-token",
  "Access-Control-Max-Age": "86400",
} as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

// asset_id -> symbol cache (server-side resolution). Thunder's trades-book
// payload has no symbol, and the extension's UUID->symbol map is populated
// asynchronously, so ~78% of rows arrived with symbol = NULL. marketwatch
// snapshots already carry the authoritative asset_id -> symbol mapping.
const symbolCache = new Map<string, string>();

async function resolveSymbol(assetId: string): Promise<string | null> {
  const cached = symbolCache.get(assetId);
  if (cached) return cached;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("marketwatch_snapshots")
      .select("symbol")
      .eq("asset_id", assetId)
      .order("captured_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const sym = (data as { symbol?: string } | null)?.symbol;
    if (sym) {
      symbolCache.set(assetId, sym.toUpperCase());
      return sym.toUpperCase();
    }
  } catch {
    /* best effort */
  }
  return null;
}

export const Route = createFileRoute("/api/public/hooks/thunder-tape")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const expected = process.env.THUNDER_INGEST_TOKEN;
        if (!expected) return json({ ok: false, error: "ingest_token_not_configured" }, 500);
        const provided = request.headers.get("x-thunder-token") ?? "";
        if (!(await isThunderAuthorized(provided, expected))) {
          return new Response("Unauthorized", { status: 401, headers: CORS });
        }

        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return json({ ok: false, error: "invalid_json" }, 400);
        }

        const body = raw as { asset_id?: unknown; symbol?: unknown; trades?: unknown; captured_at?: string };
        const assetId = typeof body.asset_id === "string" ? body.asset_id.trim() : "";
        if (!assetId || assetId.length > 64) return json({ ok: false, error: "missing_asset_id" }, 400);
        let symbol =
          typeof body.symbol === "string" && body.symbol.trim().length > 0 && body.symbol.length <= 32
            ? body.symbol.trim().toUpperCase()
            : null;
        if (!symbol) symbol = await resolveSymbol(assetId);
        const trades = Array.isArray(body.trades) ? body.trades : null;
        if (!trades || trades.length < 1 || trades.length > 500) {
          return json({ ok: false, error: "invalid_trades" }, 400);
        }

        const capturedAt = (() => {
          if (typeof body.captured_at === "string") {
            const d = new Date(body.captured_at);
            if (Number.isFinite(d.getTime())) return d.toISOString();
          }
          return new Date().toISOString();
        })();

        const rows: any[] = [];
        let invalid = 0;
        for (const t of trades) {
          const v = TradeSchema.safeParse(t);
          if (!v.success) { invalid++; continue; }
          const cursorNum = typeof v.data.cursor === "string" ? Number(v.data.cursor) : v.data.cursor;
          if (!Number.isFinite(cursorNum)) { invalid++; continue; }
          const side = typeof v.data.side === "string" ? v.data.side.toUpperCase() : null;
          const tradeTime = (() => {
            if (!v.data.time) return null;
            const d = new Date(v.data.time);
            return Number.isFinite(d.getTime()) ? d.toISOString() : null;
          })();
          rows.push({
            captured_at: capturedAt,
            asset_id: assetId,
            symbol,
            cursor: Math.round(cursorNum),
            trade_time: tradeTime,
            side: side === "BUY" || side === "SELL" ? side : side,
            price: v.data.price ?? null,
            volume: v.data.volume ?? null,
            value: v.data.value ?? null,
          raw: t as any,
          });
        }
        if (rows.length === 0) return json({ ok: false, error: "all_invalid", invalid }, 400);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        // On-conflict: skip duplicates so re-sending the same trades-book page is a no-op.
        const { error, count } = await supabaseAdmin
          .from("thunder_tape")
          .upsert(rows, { onConflict: "asset_id,cursor", ignoreDuplicates: true, count: "exact" });
        if (error) return json({ ok: false, error: error.message }, 500);

        return json({
          ok: true,
          received: rows.length,
          inserted: count ?? null,
          invalid,
          captured_at: capturedAt,
        });
      },
    },
  },
});