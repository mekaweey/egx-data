#!/usr/bin/env node
/**
 * yahoo_gap_fetch.cjs — slow-paced Yahoo fetch to backfill the Sept 8-18 gap
 * in daily_candles. 6s spacing per request (the fast bulk fetch was IP-blocked;
 * slow pacing usually passes). Range=1mo per symbol, only dates >= 2026-09-08
 * are upserted. Retries each symbol up to 3 passes.
 * Usage: node yahoo_gap_fetch.cjs
 */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const root = process.cwd();
const btDir = "C:\\Users\\Mekawey\\.zcode\\workspace\\default\\bt";
const env = {};
for (const line of fs.readFileSync(path.join(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"]*)"?\s*$/);
  if (m) env[m[1]] = m[2];
}
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const SINCE = "2026-09-08";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const pass = fs.readdirSync(btDir).filter((f) => f.startsWith("ydf_") && f.endsWith(".csv")).map((f) => f.replace(/^ydf_/, "").replace(/\.csv$/, ""));
console.log(`symbols: ${pass.length} | since: ${SINCE}`);

(async () => {
  let ok = 0;
  const failed = new Set(pass);
  for (let p = 1; p <= 4 && failed.size > 0; p++) {
    const list = [...failed];
    failed.clear();
    for (const t of list) {
      try {
        const res = await fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${t}.CA?range=1mo&interval=1d`, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const j = await res.json();
        const r = j.chart?.result?.[0];
        const ts = r?.timestamp;
        const q = r?.indicators?.quote?.[0];
        if (!ts || !q) throw new Error("no data");
        const rows = [];
        for (let i = 0; i < ts.length; i++) {
          const d = new Date(ts[i] * 1000 + 3 * 3600 * 1000).toISOString().slice(0, 10);
          if (d < SINCE) continue;
          const o = q.open[i], c = q.close[i], h = q.high[i], l = q.low[i], v = q.volume[i];
          if (!(o > 0) || !(c > 0)) continue;
          rows.push({ symbol: t, date: d, open: o, high: h > 0 ? h : c, low: l > 0 ? l : o, close: c, volume: v || 0 });
        }
        for (let i = 0; i < rows.length; i += 100) {
          const { error } = await sb.from("daily_candles").upsert(rows.slice(i, i + 100), { onConflict: "symbol,date" });
          if (error) throw new Error(error.message);
        }
        ok++;
        process.stdout.write(`\r${t}: +${rows.length} rows   (ok=${ok})          `);
      } catch (e) {
        failed.add(t);
        process.stdout.write(`\r${t}: FAIL (${e.message})  ok=${ok}   `);
      }
      await sleep(6000); // slow pacing — the key to passing the rate limit
    }
    console.log(`\n-- pass ${p} done | ok=${ok} | failed=${failed.size}`);
    if (failed.size > 0 && p < 4) { console.log("cooling down 90s..."); await sleep(90000); }
  }
  console.log(`\nFINAL: ok=${ok} | failed=${failed.size} -> ${[...failed].slice(0, 20).join(",")}`);
})();
