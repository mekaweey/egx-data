#!/usr/bin/env node
/**
 * Standalone market sync for GitHub Actions / any cloud cron.
 * Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from process.env (Secrets).
 * Fetches the whole EGX market (one TradingView scanner call) and upserts
 * today's (Cairo) candles into daily_candles. PC-independent, free.
 */
const { createClient } = require("@supabase/supabase-js");

const URL_ = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) { console.error("missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
const sb = createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const cairoToday = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" })).toISOString().slice(0, 10);
const tradeDate = process.argv[2] || cairoToday;

(async () => {
  const res = await fetch("https://scanner.tradingview.com/egypt/scan?label-product=screener-stock", {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    body: JSON.stringify({
      filter: [{ left: "type", operation: "equal", right: "stock" }],
      options: { lang: "en" },
      markets: ["egypt"],
      symbols: { query: { types: [] }, tickers: [] },
      columns: ["name", "open", "high", "low", "close", "volume", "change"],
      sort: { sortBy: "name", sortOrder: "asc" },
    }),
  });
  if (!res.ok) { console.error("scanner HTTP", res.status); process.exit(1); }
  const j = await res.json();
  const rows = [];
  for (const item of j.data ?? []) {
    const d = item.d;
    const symbol = String(item.s || "").replace("EGX:", "").toUpperCase();
    const open = Number(d[1]), high = Number(d[2]), low = Number(d[3]), close = Number(d[4]), volume = Number(d[5]) || 0;
    if (!(close > 0) || !(open > 0)) continue;
    rows.push({ symbol, date: tradeDate, open, high: high > 0 ? high : close, low: low > 0 ? low : open, close, volume });
  }
  let written = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await sb.from("daily_candles").upsert(rows.slice(i, i + 500), { onConflict: "symbol,date" });
    if (error) { console.error("upsert error:", error.message); process.exit(1); }
    written += rows.slice(i, i + 500).length;
  }
  console.log(`DONE ${tradeDate}: ${written} candles upserted (scanner total ${j.totalCount})`);
})();
