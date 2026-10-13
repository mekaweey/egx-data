import { isThunderAuthorized } from "@/lib/thunder-auth.server";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Marketwatch ingest endpoint. The Thunder extension forwards marketwatch
 * snapshots captured passively from Thunder network responses (page hook/CDP),
 * without initiating extra Thunder marketwatch requests.
 * We store into public.marketwatch_snapshots (append-only) for live volume,
 * trades and Bid/Ask tracking without opening 107 tabs.
 */

const Num = z.preprocess((v) => {
  if (v === "" || v == null) return null;
  if (typeof v === "string") {
    const n = Number(v.replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : null;
  }
  return v;
}, z.number().finite().nullable().optional());

const AssetSchema = z.object({
  symbol: z.string().trim().min(1).max(32),
  asset_id: z.string().nullish(),
  ref_price: Num,
  last_price: Num,
  avg_change_prc: Num,
  total_volume: Num,
  total_trades: Num,
  total_value: Num,
  total_bids: Num,
  total_asks: Num,
  total_buy: Num,
  total_sell: Num,
  high_price_limit: Num,
  low_price_limit: Num,
  avg_5_day: Num,
  avg_30_day: Num,
  avg_90_day: Num,
  is_same_day: z.boolean().nullish(),
  highest_bid: Num,
  lowest_ask: Num,
  highest_bid_qty: Num,
  lowest_ask_qty: Num,
  high_price: Num,
  low_price: Num,
  last_trade_volume: Num,
  last_change_prc: Num,
  symbol_state: z.string().nullish(),
  trade_rec_serial: Num,
  last_trade_date: z.string().nullish(),
  open_price: Num,
  previous_close: Num,
  close_price: Num,
  high_52_week: Num,
  low_52_week: Num,
  listed_shares: Num,
  avg_180_day: Num,
  raw: z.any().optional(),
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

type MarketwatchAsset = z.infer<typeof AssetSchema>;

function normalizeNumber(v: unknown): number | null {
  if (v === "" || v == null) return null;
  if (typeof v === "string") {
    const n = Number(v.replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function rawObject(a: MarketwatchAsset): Record<string, unknown> | null {
  return a.raw && typeof a.raw === "object" && !Array.isArray(a.raw)
    ? (a.raw as Record<string, unknown>)
    : null;
}

function firstRawNumber(a: MarketwatchAsset, keys: string[]): number | null {
  const raw = rawObject(a);
  if (!raw) return null;
  for (const key of keys) {
    const n = normalizeNumber(raw[key]);
    if (n != null) return n;
  }
  return null;
}

function firstRawString(a: MarketwatchAsset, keys: string[]): string | null {
  const raw = rawObject(a);
  if (!raw) return null;
  for (const key of keys) {
    const value = raw[key];
    if (value != null && String(value).trim()) return String(value);
  }
  return null;
}

function numWithRawFallback(value: number | null | undefined, a: MarketwatchAsset, keys: string[]): number | null {
  return value ?? firstRawNumber(a, keys);
}

// Thunder X never calls the legacy /watchlist endpoint, so
// thunder_watchlist_snapshots stopped receiving rows. The marketwatch payload
// carries the same metadata (asset_id, previous_close, price limits), so we
// derive an hourly snapshot from it instead. Best-effort: never blocks ingest.
let lastWatchlistDerivedAt = 0;

async function deriveWatchlistSnapshot(rows: Array<Record<string, unknown>>) {
  const now = Date.now();
  if (now - lastWatchlistDerivedAt < 60 * 60 * 1000) return;
  lastWatchlistDerivedAt = now;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: last } = await supabaseAdmin
      .from("thunder_watchlist_snapshots")
      .select("ts")
      .order("ts", { ascending: false })
      .limit(1)
      .maybeSingle();
    const lastTs = (last as { ts?: string } | null)?.ts;
    if (lastTs && now - new Date(lastTs).getTime() < 60 * 60 * 1000) return;

    const seen = new Set<string>();
    const wl = rows
      .filter((r) => {
        const s = String(r.symbol ?? "");
        if (!s || seen.has(s)) return false;
        seen.add(s);
        return true;
      })
      .map((r) => ({
        symbol: String(r.symbol),
        uuid: (r.asset_id as string | null) ?? null,
        previous_close: (r.previous_close as number | null) ?? null,
        min_price_limit: (r.low_price_limit as number | null) ?? null,
        max_price_limit: (r.high_price_limit as number | null) ?? null,
        feed_price: (r.last_price as number | null) ?? null,
        source: "thunder_x_marketwatch",
      }));
    if (wl.length) await supabaseAdmin.from("thunder_watchlist_snapshots").insert(wl as never);
  } catch {
    /* best effort */
  }
}

// Daily compression helper
async function runCompression() {
  try {
    const { cleanupMarketwatchSnapshots } = await import("@/lib/marketwatch-cleanup.server");
    await cleanupMarketwatchSnapshots();
  } catch (e) {
    console.error("marketwatch compression call failed", e);
  }
}

export const Route = createFileRoute("/api/public/hooks/thunder-marketwatch")({
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

        const body = raw as { assets?: unknown; captured_at?: string };
        const assets = Array.isArray(body?.assets) ? body.assets : null;
        if (!assets || assets.length < 1 || assets.length > 500) {
          return json({ ok: false, error: "invalid_body" }, 400);
        }

        const capturedAt = (() => {
          if (typeof body.captured_at === "string") {
            const d = new Date(body.captured_at);
            if (Number.isFinite(d.getTime())) return d.toISOString();
          }
          return new Date().toISOString();
        })();

        const validated: Array<z.infer<typeof AssetSchema>> = [];
        let invalid = 0;
        for (const a of assets) {
          const v = AssetSchema.safeParse(a);
          if (v.success) validated.push(v.data);
          else invalid++;
        }
        if (validated.length === 0) return json({ ok: false, error: "all_invalid", invalid }, 400);

        const toInt = (v: number | null | undefined): number | null =>
          v == null || !Number.isFinite(v) ? null : Math.round(v);

        const rows = validated.map((a) => ({
          captured_at: capturedAt,
          symbol: a.symbol.toUpperCase(),
          asset_id: a.asset_id ?? null,
          ref_price: numWithRawFallback(a.ref_price, a, ["ref_price", "refPrice", "reference_price", "referencePrice"]),
          last_price: numWithRawFallback(a.last_price, a, ["last_trade_price", "lastTradePrice", "last_price", "lastPrice", "price", "ltp"]),
          avg_change_prc: numWithRawFallback(a.avg_change_prc, a, ["avg_change_prc", "avgChangePrc", "avg_change", "change_percent", "changePercent"]),
          total_volume: toInt(numWithRawFallback(a.total_volume, a, ["total_volume", "totalVolume", "volume", "traded_volume", "tradedVolume", "cumVolume"])),
          total_trades: toInt(numWithRawFallback(a.total_trades, a, ["total_trades", "totalTrades", "trades", "trade_count", "tradeCount"])),
          total_value: numWithRawFallback(a.total_value, a, ["total_value", "totalValue", "value", "traded_value", "tradedValue"]),
          total_bids: toInt(numWithRawFallback(a.total_bids, a, ["total_bids", "totalBids"])),
          total_asks: toInt(numWithRawFallback(a.total_asks, a, ["total_asks", "totalAsks"])),
          total_buy: toInt(numWithRawFallback(a.total_buy, a, ["total_buy", "totalBuy"])),
          total_sell: toInt(numWithRawFallback(a.total_sell, a, ["total_sell", "totalSell"])),
          high_price_limit: numWithRawFallback(a.high_price_limit, a, ["high_price_limit", "highPriceLimit", "max_limit", "maxLimit"]),
          low_price_limit: numWithRawFallback(a.low_price_limit, a, ["low_price_limit", "lowPriceLimit", "min_limit", "minLimit"]),
          avg_5_day: numWithRawFallback(a.avg_5_day, a, ["avg_5_day", "avg5Day"]),
          avg_30_day: numWithRawFallback(a.avg_30_day, a, ["avg_30_day", "avg30Day"]),
          avg_90_day: numWithRawFallback(a.avg_90_day, a, ["avg_90_day", "avg90Day"]),
          is_same_day: a.is_same_day ?? null,
          highest_bid: numWithRawFallback(a.highest_bid, a, ["highest_bid", "highestBid", "best_bid", "bestBid", "bid_price", "bidPrice", "bid"]),
          lowest_ask: numWithRawFallback(a.lowest_ask, a, ["lowest_ask", "lowestAsk", "best_ask", "bestAsk", "ask_price", "askPrice", "ask", "offer_price", "offerPrice"]),
          highest_bid_qty: toInt(numWithRawFallback(a.highest_bid_qty, a, ["highest_bid_qty", "highestBidQty", "bid_qty", "bidQty", "bid_size", "bidSize", "bid_volume", "bidVolume"])),
          lowest_ask_qty: toInt(numWithRawFallback(a.lowest_ask_qty, a, ["lowest_ask_qty", "lowestAskQty", "ask_qty", "askQty", "ask_size", "askSize", "offer_qty", "offerQty", "ask_volume", "askVolume"])),
          high_price: numWithRawFallback(a.high_price, a, ["high_price", "highPrice", "day_high", "dayHigh"]),
          low_price: numWithRawFallback(a.low_price, a, ["low_price", "lowPrice", "day_low", "dayLow"]),
          last_trade_volume: numWithRawFallback(a.last_trade_volume, a, ["last_trade_volume", "lastTradeVolume"]),
          last_change_prc: numWithRawFallback(a.last_change_prc, a, ["last_change_prc", "lastChangePrc", "last_change", "change_prc", "changePrc"]),
          symbol_state: a.symbol_state ?? firstRawString(a, ["symbol_state", "symbolState"]),
          trade_rec_serial: toInt(numWithRawFallback(a.trade_rec_serial, a, ["trade_rec_serial", "tradeRecSerial", "symbols_rec_serial", "symbolsRecSerial"])),
          last_trade_date: (() => {
            const value = a.last_trade_date ?? firstRawString(a, ["last_trade_date", "lastTradeDate"]);
            if (!value) return null;
            const d = new Date(value);
            return Number.isFinite(d.getTime()) ? d.toISOString() : null;
          })(),
          open_price: numWithRawFallback(a.open_price, a, ["open_price", "openPrice"]),
          previous_close: numWithRawFallback(a.previous_close, a, ["previous_close", "previousClose", "prev_close", "prevClose"]),
          close_price: numWithRawFallback(a.close_price, a, ["close_price", "closePrice"]),
          high_52_week: numWithRawFallback(a.high_52_week, a, ["high_52_week", "high52Week", "week_52_high", "yearHigh"]),
          low_52_week: numWithRawFallback(a.low_52_week, a, ["low_52_week", "low52Week", "week_52_low", "yearLow"]),
          listed_shares: numWithRawFallback(a.listed_shares, a, ["listed_shares", "listedShares", "outstanding_shares", "outstandingShares"]),
          avg_180_day: numWithRawFallback(a.avg_180_day, a, ["avg_180_day", "avg180Day"]),
          raw: a.raw ?? null,
        }));

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // ── DEDUP (rebuilt 2026-08-27, matches Step 1 comparison semantics) ──
        // Step 1 measured that ~76.5% of incoming rows are bit-identical to the
        // previous row for that symbol on the 5 fields below. We use the exact
        // same Number(x) === Number(x) comparison here, so behavior at the DB
        // level matches what we measured.
        const DEDUP_KEYS = [
          "last_price",
          "total_volume",
          "total_trades",
          "highest_bid",
          "lowest_ask",
        ] as const;

        // Helper: true if two values represent the same number.
        // - null/undefined on either side is "unknown" → not a dedup hit.
        // - string or number both coerce through Number(); NaN never matches.
        // - This mirrors _step1_dedup.cjs exactly.
        function sameNumericValue(
          a: unknown,
          b: unknown,
        ): boolean {
          if (a == null || b == null) return false;
          const na = Number(a);
          const nb = Number(b);
          if (!Number.isFinite(na) || !Number.isFinite(nb)) return false;
          return na === nb;
        }

        // 1) De-dup within the incoming batch first (same symbol twice → keep last)
        const incomingBySymbol = new Map<
          string,
          (typeof rows)[number]
        >();
        for (const r of rows) {
          incomingBySymbol.set(r.symbol as string, r);
        }
        const dedupedIncoming = Array.from(incomingBySymbol.values());

        // 2) One round-trip: latest row per symbol from the DB.
        //    Uses the public.dedup_latest_for_symbols(text[]) RPC, which
        //    is a Postgres-side DISTINCT ON (one row per symbol, by symbol
        //    then captured_at DESC). Avoids the .order().in() approach
        //    that fetches every row for every symbol.
        const symbols = Array.from(incomingBySymbol.keys());
        const lastRowsBySymbol = new Map<
          string,
          { last_price: unknown; total_volume: unknown; total_trades: unknown; highest_bid: unknown; lowest_ask: unknown }
        >();
        if (symbols.length > 0) {
          const { data: rpcRows, error: rpcErr } = await supabaseAdmin.rpc(
            "dedup_latest_for_symbols",
            { p_symbols: symbols },
          );
          if (rpcErr) {
            // Don't fail the request — just log and treat as "no prior row".
            console.error("[thunder-marketwatch] dedup RPC failed, skipping dedup:", rpcErr.message);
          } else if (Array.isArray(rpcRows)) {
            for (const r of rpcRows as Array<{ symbol: string } & Record<string, unknown>>) {
              lastRowsBySymbol.set(r.symbol, {
                last_price: r.last_price,
                total_volume: r.total_volume,
                total_trades: r.total_trades,
                highest_bid: r.highest_bid,
                lowest_ask: r.lowest_ask,
              });
            }
          }
        }

        // 3) Compare. Skip incoming rows that match the latest DB row on all 5 keys.
        const skipped: string[] = [];
        const uniqueRows: typeof rows = [];
        for (const r of dedupedIncoming) {
          const sym = r.symbol as string;
          const prev = lastRowsBySymbol.get(sym);
          if (
            prev &&
            DEDUP_KEYS.every((k) =>
              sameNumericValue((r as Record<string, unknown>)[k], prev[k]),
            )
          ) {
            skipped.push(sym);
            continue;
          }
          uniqueRows.push(r);
        }

        if (skipped.length > 0) {
          console.log(
            `[thunder-marketwatch] dedup skipped ${skipped.length}/${dedupedIncoming.length} unchanged assets: ${[...new Set(skipped)].slice(0, 5).join(", ")}${skipped.length > 5 ? " ..." : ""}`,
          );
        }

        // ── INSERT only changed rows ──
        const { error } = uniqueRows.length > 0
          ? await supabaseAdmin.from("marketwatch_snapshots").insert(uniqueRows)
          : { error: null };
        if (error) return json({ ok: false, error: error.message }, 500);

        // ── Derive watchlist from only the newly inserted (changed) rows ──
        if (uniqueRows.length > 0) {
          await deriveWatchlistSnapshot(uniqueRows as Array<Record<string, unknown>>);
        }
        
        // Trigger background cleanup roughly once every 1000 requests (or ~once a day at typical frequency)
        if (Math.random() < 0.001) {
          void runCompression();
        }

        return json({ ok: true, inserted: uniqueRows.length, skipped: skipped.length, invalid, captured_at: capturedAt });
      },
    },
  },
});