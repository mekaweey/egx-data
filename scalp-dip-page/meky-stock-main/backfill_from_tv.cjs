#!/usr/bin/env node
/**
 * backfill_from_tv.cjs — backfill daily_candles from a fresh TradingView
 * minute-data export (EGX_DLY_*.csv). Aggregates minutes to daily candles
 * (Cairo time) and upserts every session >= --since (default 2026-09-01).
 * Usage: node backfill_from_tv.cjs "C:\path\to\export folder" [sinceDate]
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

const folder = process.argv[2];
const since = process.argv[3] || "2026-09-01";
if (!folder || !fs.existsSync(folder)) { console.error("usage: node backfill_from_tv.cjs <exportFolder> [since=2026-09-01]"); process.exit(1); }
const epoch = new Date("1970-01-01T00:00:00Z");

const files = fs.readdirSync(folder).filter((f) => f.startsWith("EGX_DLY_") && f.endsWith(".csv"));
console.log(`files: ${files.length} | since: ${since}`);

(async () => {
  let totalRows = 0, errors = 0;
  for (const f of files) {
    const symbol = f.replace(/^EGX_DLY_/, "").replace(/\.csv$/, "").split(",")[0].trim().toUpperCase();
    const byDay = new Map();
    const text = fs.readFileSync(path.join(folder, f), "utf8");
    const lines = text.split(/\r?\n/).filter(Boolean);
    for (let i = 1; i < lines.length; i++) {
      const p = lines[i].split(",");
      if (p.length < 6) continue;
      const ts = parseFloat(p[0]);
      if (!Number.isFinite(ts)) continue;
      const d = new Date(epoch.getTime() + ts * 1000 + 3 * 3600 * 1000).toISOString().slice(0, 10);
      if (d < since) continue;
      const close = parseFloat(p[4]);
      const open = parseFloat(p[1]);
      if (!(close > 0) || !(open > 0)) continue;
      const vol = parseFloat(p[5]) || 0;
      const cur = byDay.get(d);
      if (!cur) byDay.set(d, { open, close, high: parseFloat(p[2]) || close, low: parseFloat(p[3]) || open, volume: vol, lastClose: close });
      else {
        cur.high = Math.max(cur.high, parseFloat(p[2]) || close);
        cur.low = Math.min(cur.low, parseFloat(p[3]) || open);
        cur.close = close; // last minute's close of the day
        cur.lastClose = close;
        cur.volume += vol;
      }
    }
    const rows = [...byDay.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ symbol, date, open: v.open, high: v.high, low: v.low, close: v.lastClose, volume: v.volume }));
    for (let i = 0; i < rows.length; i += 500) {
      const batch = rows.slice(i, i + 500);
      const { error } = await sb.from("daily_candles").upsert(batch, { onConflict: "symbol,date" });
      if (error) { console.error(`  ${symbol}: ${error.message}`); errors++; break; }
      totalRows += batch.length;
    }
  }
  console.log(`DONE backfilled rows=${totalRows} errors=${errors}`);
})();
