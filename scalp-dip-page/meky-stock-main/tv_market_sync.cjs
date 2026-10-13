#!/usr/bin/env node
/**
 * tv_market_sync.cjs — ONE HTTP call fetches the WHOLE EGX market snapshot
 * (open/high/low/close/volume for all ~296 symbols) from TradingView's
 * public screener endpoint and upserts TODAY's candles into daily_candles.
 *
 * Why this beats watching: the session OPEN is recorded by the exchange —
 * fetching any time during/after the session still yields the true open,
 * so the weekly entry-gap rule works even if the machine was off at 10:00.
 *
 * Usage: node tv_market_sync.cjs [dateYYYY-MM-DD]   (default: today Cairo)
 * Schedule (free): Windows Task Scheduler locally, or GitHub Actions cron
 * for full PC-off coverage. Run once after ~14:35 Cairo on Sun-Thu,
 * and once ~10:05 on Sunday for the live open snapshot.
 */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const root = __dirname;
const env = {};
for (const line of fs.readFileSync(path.join(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"]*)"?\s*$/);
  if (m) env[m[1]] = m[2];
}
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const cairoToday = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" })).toISOString().slice(0, 10);
const tradeDate = process.argv[2] || cairoToday;

const BODY = JSON.stringify({
  filter: [{ left: "type", operation: "equal", right: "stock" }],
  options: { lang: "en" },
  markets: ["egypt"],
  symbols: { query: { types: [] }, tickers: [] },
  columns: ["name", "open", "high", "low", "close", "volume", "change"],
  sort: { sortBy: "name", sortOrder: "asc" },
});

(async () => {
  const res = await fetch("https://scanner.tradingview.com/egypt/scan?label-product=screener-stock", {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    body: BODY,
  });
  if (!res.ok) { console.error("scanner HTTP", res.status, await res.text()); process.exit(1); }
  const j = await res.json();
  console.log(`scanner totalCount: ${j.totalCount}`);
  const rows = [];
  for (const item of j.data ?? []) {
    const d = item.d;
    const symbol = String(item.s || "").replace("EGX:", "").toUpperCase();
    const open = Number(d[1]), high = Number(d[2]), low = Number(d[3]), close = Number(d[4]), volume = Number(d[5]) || 0;
    if (!(close > 0) || !(open > 0)) continue;
    rows.push({ symbol, date: tradeDate, open, high: high > 0 ? high : close, low: low > 0 ? low : open, close, volume });
  }
  console.log(`parsed rows for ${tradeDate}: ${rows.length}`);
  let written = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const { error } = await sb.from("daily_candles").upsert(batch, { onConflict: "symbol,date" });
    if (error) { console.error("upsert error:", error.message); process.exit(1); }
    written += batch.length;
  }
  console.log(`DONE upserted ${written} candles for ${tradeDate}`);
})();
