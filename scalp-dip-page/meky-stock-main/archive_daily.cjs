#!/usr/bin/env node
/**
 * archive_daily.cjs — the EOD job (runs via Task Scheduler, or manually):
 * 1) fetch the whole EGX market (one TradingView scanner call)
 * 2) upsert today's candles into daily_candles (Supabase — the strategy's data)
 * 3) write the local archive CSV: egx-archive\YYYY\MM\EGX_DAILY_YYYY-MM-DD.csv
 * PC-off case: GitHub Actions (or any later run of this script with a date arg)
 * refreshes daily_candles; the catch-up (website button) writes missing local
 * CSVs from daily_candles — no data ever needs blob storage.
 * Usage: node archive_daily.cjs [dateYYYY-MM-DD]
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
const ARCHIVE_DIR = path.join(root, "egx-archive");

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
  // 1) Supabase (strategy data)
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await sb.from("daily_candles").upsert(rows.slice(i, i + 500), { onConflict: "symbol,date" });
    if (error) { console.error("supabase upsert error:", error.message); process.exit(1); }
  }
  // 2) local archive CSV (organized YYYY\MM)
  const yyyy = tradeDate.slice(0, 4), mm = tradeDate.slice(5, 7);
  const dir = path.join(ARCHIVE_DIR, yyyy, mm);
  fs.mkdirSync(dir, { recursive: true });
  const header = "symbol,date,open,high,low,close,volume";
  const csv = header + "\n" + rows.map((r) => `${r.symbol},${r.date},${r.open},${r.high},${r.low},${r.close},${r.volume}`).join("\n") + "\n";
  const file = path.join(dir, `EGX_DAILY_${tradeDate}.csv`);
  fs.writeFileSync(file, csv, "utf8");
  console.log(`DONE ${tradeDate}: supabase upserted ${rows.length} | archive file: ${file}`);
})();
