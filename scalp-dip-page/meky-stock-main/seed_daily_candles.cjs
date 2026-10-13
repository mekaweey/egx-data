#!/usr/bin/env node
/**
 * seed_daily_candles.cjs — one-time seeding of daily_candles from the
 * verified 10-year Yahoo daily history (bt/ydf_*.csv, 161 PASS symbols,
 * cross-verified 99% vs TradingView minutes). Upsert on (symbol, date).
 * Usage: node seed_daily_candles.cjs [csvDir]
 */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// --- load .env manually ---
const root = __dirname;
const envText = fs.readFileSync(path.join(root, ".env"), "utf8");
const env = {};
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"]*)"?\s*$/);
  if (m) env[m[1]] = m[2];
}
const URL = env.SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) { console.error("missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
const sb = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const csvDir = process.argv[2] || "C:\\Users\\Mekawey\\.zcode\\workspace\\default\\bt";
const files = fs.readdirSync(csvDir).filter((f) => f.startsWith("ydf_") && f.endsWith(".csv"));
console.log(`csv files: ${files.length}`);

(async () => {
  let totalRows = 0, totalBatches = 0, errors = 0;
  const t0 = Date.now();
  for (const f of files) {
    const symbol = f.replace(/^ydf_/, "").replace(/\.csv$/, "").toUpperCase();
    const text = fs.readFileSync(path.join(csvDir, f), "utf8");
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (!lines.length) continue;
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const iDate = header.indexOf("date");
    const iOpen = header.indexOf("open");
    const iHigh = header.indexOf("high");
    const iLow = header.indexOf("low");
    const iClose = header.indexOf("close");
    const iVol = header.indexOf("volume");
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const p = lines[i].split(",");
      const date = (p[iDate] || "").trim();
      const open = parseFloat(p[iOpen]);
      const close = parseFloat(p[iClose]);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !(open > 0) || !(close > 0)) continue;
      const high = iHigh >= 0 ? parseFloat(p[iHigh]) : close;
      const low = iLow >= 0 ? parseFloat(p[iLow]) : open;
      const volume = iVol >= 0 ? parseFloat(p[iVol]) || 0 : 0;
      rows.push({
        symbol, date,
        open, high: high > 0 ? high : close, low: low > 0 ? low : open,
        close, volume,
      });
    }
    // upsert in batches of 1000
    for (let i = 0; i < rows.length; i += 1000) {
      const batch = rows.slice(i, i + 1000);
      const { error } = await sb.from("daily_candles").upsert(batch, { onConflict: "symbol,date" });
      if (error) { console.error(`  ${symbol} batch error: ${error.message}`); errors++; break; }
      totalBatches++;
      totalRows += batch.length;
    }
    process.stdout.write(`\r${symbol}: rows so far ${totalRows}   `);
  }
  console.log(`\nDONE files=${files.length} rows=${totalRows} batches=${totalBatches} errors=${errors} in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
})();
