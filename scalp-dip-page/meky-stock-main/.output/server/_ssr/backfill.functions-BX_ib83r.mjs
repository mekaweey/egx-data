import { c as createServerRpc } from "./createServerRpc-BEwYw6bn.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.mjs";
import { fetchOHLCV } from "./index.server-dCC-yXdp.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import "../_libs/mendable__firecrawl-js.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:http";
import "node:stream";
import "node:stream/promises";
import "node:https";
import "node:http2";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "async_hooks";
import "stream";
import "crypto";
import "../_libs/isbot.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "./yahoo.server-Coiq-pQ8.mjs";
import "../_libs/axios.mjs";
import "../_libs/form-data.mjs";
import "../_libs/combined-stream.mjs";
import "../_libs/delayed-stream.mjs";
import "path";
import "http";
import "https";
import "url";
import "fs";
import "../_libs/mime-types.mjs";
import "../_libs/mime-db.mjs";
import "../_libs/asynckit.mjs";
import "../_libs/es-set-tostringtag.mjs";
import "../_libs/get-intrinsic.mjs";
import "../_libs/es-object-atoms.mjs";
import "../_libs/es-errors.mjs";
import "../_libs/math-intrinsics.mjs";
import "../_libs/gopd.mjs";
import "../_libs/es-define-property.mjs";
import "../_libs/has-symbols.mjs";
import "../_libs/get-proto.mjs";
import "../_libs/dunder-proto.mjs";
import "../_libs/call-bind-apply-helpers.mjs";
import "../_libs/function-bind.mjs";
import "../_libs/hasown.mjs";
import "../_libs/has-tostringtag.mjs";
import "../_libs/proxy-from-env.mjs";
import "http2";
import "../_libs/follow-redirects.mjs";
import "assert";
import "../_libs/debug.mjs";
import "../_libs/ms.mjs";
import "tty";
import "../_libs/supports-color.mjs";
import "os";
import "../_libs/has-flag.mjs";
import "zlib";
import "events";
import "../_libs/zod-to-json-schema.mjs";
import "../_libs/zod.mjs";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function fetchWithRetry(yahooSymbol, days) {
  let lastErr = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await fetchOHLCV(yahooSymbol, days);
    } catch (e) {
      lastErr = e;
      await sleep(1e3);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
const backfillHistory_createServerFn_handler = createServerRpc({
  id: "1f75c18c43fd28bd74efbba404efd867f3259ecd3f053417930575bb5e3795e2",
  name: "backfillHistory",
  filename: "src/lib/backtest/backfill.functions.ts"
}, (opts) => backfillHistory.__executeServer(opts));
const backfillHistory = createServerFn({
  method: "POST"
}).inputValidator((data) => ({
  days: Math.max(90, Math.min(1825, data.days ?? 500)),
  offset: Math.max(0, data.offset ?? 0),
  limit: Math.max(1, Math.min(50, data.limit ?? 8))
})).handler(backfillHistory_createServerFn_handler, async ({
  data
}) => {
  const {
    days,
    offset,
    limit
  } = data;
  const {
    data: stocksData,
    error: stocksErr
  } = await supabaseAdmin.from("stocks").select("symbol, yahoo_symbol").eq("is_active", true);
  if (stocksErr || !stocksData?.length) {
    throw new Error(`no active stocks: ${stocksErr?.message ?? "empty"}`);
  }
  const allStocks = stocksData;
  const stocks = allStocks.slice(offset, offset + limit);
  const startedAt = Date.now();
  const failed = [];
  const providerCounts = {};
  const rows = [];
  const CONCURRENCY = 5;
  let cursor = 0;
  async function worker() {
    while (cursor < stocks.length) {
      const s = stocks[cursor++];
      try {
        const result = await fetchWithRetry(s.yahoo_symbol, days);
        providerCounts[result.provider] = (providerCounts[result.provider] ?? 0) + 1;
        for (const c of result.candles) {
          rows.push({
            symbol: s.symbol.toUpperCase(),
            date: c.date.slice(0, 10),
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
            volume: Math.round(c.volume)
          });
        }
      } catch {
        failed.push(s.symbol);
      }
    }
  }
  await Promise.all(Array.from({
    length: Math.min(CONCURRENCY, stocks.length)
  }, worker));
  let candlesInserted = 0;
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const {
      error
    } = await supabaseAdmin.from("daily_candles").upsert(rows.slice(i, i + CHUNK), {
      onConflict: "symbol,date"
    });
    if (error) throw new Error(`upsert failed at chunk ${i}: ${error.message}`);
    candlesInserted += rows.slice(i, i + CHUNK).length;
  }
  const providerSummary = Object.entries(providerCounts).map(([p, n]) => `${p}:${n}`).join(", ");
  await supabaseAdmin.from("data_source_logs").insert({
    provider: "yahoo-backfill",
    ok: failed.length < stocks.length,
    candles_count: candlesInserted,
    latency_ms: Date.now() - startedAt,
    error: (failed.length ? `failed for: ${failed.join(", ")}` : null) ?? (providerSummary ? `providers: ${providerSummary}` : null)
  });
  const nextOffset = offset + stocks.length;
  return {
    symbolsTotal: allStocks.length,
    symbolsProcessed: stocks.length - failed.length,
    candlesInserted,
    failed,
    daysRequested: days,
    providerBreakdown: providerCounts,
    nextOffset,
    done: nextOffset >= allStocks.length
  };
});
const getCandlesStats_createServerFn_handler = createServerRpc({
  id: "7a97a910bb1aec56b156c1156917563a3616faef409a2a5be91477bf1d4f9f83",
  name: "getCandlesStats",
  filename: "src/lib/backtest/backfill.functions.ts"
}, (opts) => getCandlesStats.__executeServer(opts));
const getCandlesStats = createServerFn({
  method: "GET"
}).handler(getCandlesStats_createServerFn_handler, async () => {
  const {
    data,
    error
  } = await supabaseAdmin.rpc("candles_stats");
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  return {
    totalCandles: Number(row?.total_candles ?? 0),
    distinctSymbols: Number(row?.distinct_symbols ?? 0),
    minDate: row?.min_date ?? null,
    maxDate: row?.max_date ?? null
  };
});
export {
  backfillHistory_createServerFn_handler,
  getCandlesStats_createServerFn_handler
};
