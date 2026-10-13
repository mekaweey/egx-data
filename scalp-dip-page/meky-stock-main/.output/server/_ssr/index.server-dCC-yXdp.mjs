import { supabaseAdmin } from "./client.server-D5ro3rAQ.mjs";
import { i as index_default } from "../_libs/mendable__firecrawl-js.mjs";
import { y as yahooProvider } from "./yahoo.server-Coiq-pQ8.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/axios.mjs";
import "../_libs/form-data.mjs";
import "../_libs/react.mjs";
import "../_libs/combined-stream.mjs";
import "util";
import "stream";
import "../_libs/delayed-stream.mjs";
import "path";
import "http";
import "https";
import "url";
import "fs";
import "crypto";
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
let _client = null;
function getClient() {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY is not configured");
  if (!_client) _client = new index_default({ apiKey });
  return _client;
}
function pickRange(days) {
  if (days <= 30) return "1mo";
  if (days <= 90) return "3mo";
  if (days <= 180) return "6mo";
  if (days <= 365) return "1y";
  if (days <= 730) return "2y";
  return "5y";
}
function yahooJsonToCandles(json) {
  const result = json.chart?.result?.[0];
  if (!result) return [];
  const ts = result.timestamp ?? [];
  const q = result.indicators?.quote?.[0];
  if (!q || ts.length === 0) return [];
  const out = [];
  for (let i = 0; i < ts.length; i++) {
    const o = q.open?.[i], h = q.high?.[i], l = q.low?.[i], c = q.close?.[i], v = q.volume?.[i];
    if (o == null || h == null || l == null || c == null) continue;
    out.push({
      date: new Date(ts[i] * 1e3).toISOString(),
      open: o,
      high: h,
      low: l,
      close: c,
      volume: v ?? 0
    });
  }
  return out;
}
const firecrawlProvider = {
  name: "firecrawl-yahoo",
  async fetchOHLCV(yahooSymbol, days) {
    const client = getClient();
    const range = pickRange(days);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      yahooSymbol
    )}?interval=1d&range=${range}`;
    const result = await client.scrape(url, {
      formats: ["rawHtml"],
      onlyMainContent: false,
      waitFor: 300
    });
    const body = result.rawHtml ?? result.data?.rawHtml ?? "";
    if (!body) throw new Error("Firecrawl returned empty body");
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch (e) {
      throw new Error(
        `Firecrawl JSON parse failed for ${yahooSymbol}: ${e.message}; body[0..120]=${body.slice(0, 120)}`
      );
    }
    if (parsed.chart?.error) {
      throw new Error(`Yahoo (via Firecrawl) error: ${parsed.chart.error.description ?? "unknown"}`);
    }
    const candles = yahooJsonToCandles(parsed);
    if (candles.length === 0) {
      throw new Error(`Firecrawl: no candles parsed for ${yahooSymbol}`);
    }
    return candles;
  }
};
const ANCHOR_PRICES = {
  COMI: 133.51,
  HRHO: 26.92,
  EKHO: 0.67,
  EKHOA: 24.13,
  SWDY: 88.51,
  ETEL: 95.75,
  EAST: 40,
  TMGH: 98.99,
  PHDC: 13.69,
  HELI: 6.52,
  ORAS: 71.05,
  ORWE: 22.05,
  JUFO: 27.94,
  EFIH: 21.75,
  FWRY: 19.43,
  CIEB: 23.82,
  ADIB: 47.5,
  FAIT: 38.3,
  HDBK: 143.47,
  SKPC: 17.69,
  AMOC: 8.7,
  ABUK: 88.99,
  MFPC: 44.51,
  OCDI: 21.48,
  EGCH: 14.32,
  CCAP: 5.34,
  ISPH: 11.8
};
async function getDbAnchor(base) {
  try {
    const { data } = await supabaseAdmin.from("stock_snapshots").select("close, data_provider, ts").eq("symbol", base).in("data_provider", ["yahoo", "cached:yahoo", "alphavantage"]).order("ts", { ascending: false }).limit(1).maybeSingle();
    if (data && data.close != null) return Number(data.close);
  } catch {
  }
  return null;
}
function seededRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = s * 1664525 + 1013904223 >>> 0;
    return s / 4294967296;
  };
}
function hashSymbol(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
const syntheticProvider = {
  name: "synthetic",
  async fetchOHLCV(yahooSymbol, days) {
    const base = yahooSymbol.replace(/\.CA$/i, "").toUpperCase();
    const dbAnchor = await getDbAnchor(base);
    const anchor = dbAnchor ?? ANCHOR_PRICES[base] ?? 20;
    const rnd = seededRng(hashSymbol(base));
    const total = Math.max(days, 120);
    const volatility = 0.018;
    const meanReversion = 0.04;
    let price = anchor * (0.9 + rnd() * 0.2);
    const candles = [];
    const today = /* @__PURE__ */ new Date();
    today.setUTCHours(0, 0, 0, 0);
    for (let i = total - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setUTCDate(date.getUTCDate() - i);
      const dow = date.getUTCDay();
      if (dow === 5 || dow === 6) continue;
      const shock = (rnd() - 0.5) * 2 * volatility;
      const pull = (anchor - price) / anchor * meanReversion;
      const ret = shock + pull;
      const open = price;
      const close = Math.max(0.01, price * (1 + ret));
      const high = Math.max(open, close) * (1 + rnd() * 8e-3);
      const low = Math.min(open, close) * (1 - rnd() * 8e-3);
      const volume = Math.round(5e5 + rnd() * 4e6);
      candles.push({
        date: date.toISOString(),
        open: round(open),
        high: round(high),
        low: round(low),
        close: round(close),
        volume
      });
      price = close;
    }
    return candles;
  }
};
function round(n) {
  return Math.round(n * 100) / 100;
}
const PROVIDERS = [firecrawlProvider, yahooProvider, syntheticProvider];
const MIN_CANDLES = 60;
async function logAttempt(provider, symbol, ok, latencyMs, candlesCount, error) {
  try {
    await supabaseAdmin.from("data_source_logs").insert({
      provider,
      symbol,
      ok,
      latency_ms: latencyMs,
      candles_count: candlesCount,
      error: error ?? null
    });
  } catch {
  }
}
async function fetchOHLCV(yahooSymbol, days = 120) {
  let lastError = "no provider";
  for (const provider of PROVIDERS) {
    const start = Date.now();
    try {
      const candles = await provider.fetchOHLCV(yahooSymbol, days);
      const latency = Date.now() - start;
      if (candles.length < MIN_CANDLES) {
        await logAttempt(
          provider.name,
          yahooSymbol,
          false,
          latency,
          candles.length,
          `insufficient candles: ${candles.length}`
        );
        lastError = `insufficient candles (${candles.length})`;
        continue;
      }
      await logAttempt(provider.name, yahooSymbol, true, latency, candles.length);
      return { symbol: yahooSymbol, candles, provider: provider.name };
    } catch (e) {
      const latency = Date.now() - start;
      const msg = e instanceof Error ? e.message : String(e);
      lastError = msg;
      await logAttempt(provider.name, yahooSymbol, false, latency, 0, msg);
    }
  }
  throw new Error(`All providers failed for ${yahooSymbol}: ${lastError}`);
}
export {
  fetchOHLCV
};
