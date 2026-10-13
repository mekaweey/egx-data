// TV LAG EXPERIMENT - ANALYZER
// ============================
// Joins the collector's TradingView snapshots (tv_lag_snapshots_*.jsonl)
// against Thunder extension ticks in live_ticks (near-real-time reference).
//
// Method: for every snapshot (time T, symbol S, TV price P) we look at
// Thunder's tick history for S in [T-30min, T] and find the tick whose price
// is closest to P (tolerance 0.5%, min 0.01 EGP). lag = T - tickTime.
// Median over all matches = TradingView's lag behind "now".
// Also reports TV's own price-change cadence (works even without ticks).
//
// Usage:
//   node tv_lag_analyze.cjs tv_lag_snapshots_2026-09-29.jsonl [date]
//   (date defaults to the file's date; live_ticks are filtered to that day)
//
// ASCII ONLY.
const fs = require("fs");
const path = require("path");

function loadEnv() {
  const env = {};
  const p = path.join(__dirname, "..", ".env");
  for (const l of fs.readFileSync(p, "utf8").split("\n")) {
    const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/"/g, "");
  }
  return env;
}

function median(xs) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
function pct(xs, p) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
}

(async () => {
  const FROM_DB = process.argv.includes("--from-db");
  let file = process.argv[2];
  if (!FROM_DB && (!file || !fs.existsSync(file))) { console.log("usage: node tv_lag_analyze.cjs <snapshots.jsonl> [date] | --from-db [date]"); process.exit(1); }
  const dateTag = path.basename(file).match(/(\d{4}-\d{2}-\d{2})/);
  const day = process.argv[3] || (dateTag ? dateTag[1] : null);
  if (!day) { console.log("cannot infer date from filename; pass date as 2nd arg"); process.exit(1); }

  // 1) load snapshots — from the DB (tv_ticks) or a JSONL file
  const snaps = [];
  if (FROM_DB) {
    const env2 = loadEnv();
    const { Pool } = require("pg");
    const pool = new Pool({ connectionString: env2.DATABASE_URL });
    const { rows } = await pool.query(
      "SELECT symbol, price, ts FROM tv_ticks WHERE source='tv' AND ts::date = $1 ORDER BY ts", [day]);
    await pool.end();
    const byTs = new Map();
    for (const r of rows) {
      const key = new Date(r.ts).getTime();
      if (!byTs.has(key)) byTs.set(key, { iso: new Date(r.ts).toISOString(), ms: key, n: 0, q: {} });
      const snap = byTs.get(key);
      snap.q[String(r.symbol).toUpperCase()] = Number(r.price);
    }
    for (const [, s] of byTs) { s.n = Object.keys(s.q).length; snaps.push(s); }
    snaps.sort((a, b) => a.ms - b.ms);
    console.log("source: tv_ticks (database)");
  } else {
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      if (!line.trim()) continue;
      try { snaps.push(JSON.parse(line)); } catch (e) {}
    }
    console.log("source: jsonl file");
  }
  if (!snaps.length) { console.log("no snapshots in file"); process.exit(1); }
  console.log("snapshots: " + snaps.length + " from " + snaps[0].iso + " to " + snaps[snaps.length - 1].iso + " | symbols/snap ~" + snaps[0].n);

  // 2) load Thunder ticks for the day
  let ticks = new Map(); // sym -> [{t, p}]
  let ticksAvailable = false;
  try {
    const env = loadEnv();
    const { Pool } = require("pg");
    const pool = new Pool({ connectionString: env.DATABASE_URL });
    const { rows } = await pool.query(
      "SELECT symbol, price, ts FROM live_ticks WHERE ts::date = $1 ORDER BY ts", [day]);
    await pool.end();
    for (const r of rows) {
      const sym = String(r.symbol).toUpperCase();
      if (!ticks.has(sym)) ticks.set(sym, []);
      ticks.get(sym).push({ t: new Date(r.ts).getTime(), p: Number(r.price) });
    }
    const totalTicks = rows.length;
    ticksAvailable = totalTicks > 20;
    console.log("thunder ticks for " + day + ": " + totalTicks + " across " + ticks.size + " symbols");
  } catch (e) {
    console.log("live_ticks load failed (" + e.message + ") -> cadence-only mode");
  }

  // 3) lag: match each TV price to nearest Thunder tick price within window
  const WIN = 30 * 60e3; // look back up to 30 min
  const lagsAll = [];
  const lagsBySym = new Map();
  if (ticksAvailable) {
    for (const snap of snaps) {
      const T = snap.ms;
      for (const [sym, P] of Object.entries(snap.q)) {
        const hist = ticks.get(sym);
        if (!hist || hist.length < 5) continue;
        const tol = Math.max(0.01, 0.005 * P);
        let best = null, bestDiff = Infinity;
        for (let i = hist.length - 1; i >= 0; i--) {
          const tk = hist[i];
          if (T - tk.t > WIN) break;
          if (tk.t > T) continue;
          const diff = Math.abs(tk.p - P);
          if (diff < bestDiff) { bestDiff = diff; best = tk; }
          if (diff === 0) break;
        }
        if (best && bestDiff <= tol) {
          const lag = (T - best.t) / 1000;
          if (lag >= 0 && lag <= WIN / 1000) {
            lagsAll.push(lag);
            if (!lagsBySym.has(sym)) lagsBySym.set(sym, []);
            lagsBySym.get(sym).push(lag);
          }
        }
      }
    }
  }

  console.log("");
  if (lagsAll.length >= 3) {
    console.log("=== TV LAG vs THUNDER (the real answer) ===");
    console.log("matches: " + lagsAll.length);
    console.log("lag median: " + median(lagsAll).toFixed(0) + "s | p25: " + pct(lagsAll, 0.25).toFixed(0) + "s | p75: " + pct(lagsAll, 0.75).toFixed(0) + "s | p90: " + pct(lagsAll, 0.90).toFixed(0) + "s");
    const top = [...lagsBySym.entries()].filter(([, v]) => v.length >= 20)
      .sort((a, b) => b[1].length - a[1].length).slice(0, 12);
    console.log("per-symbol medians (top by sample count):");
    for (const [sym, v] of top) console.log("  " + sym + ": " + median(v).toFixed(0) + "s (n=" + v.length + ")");
  } else {
    console.log("lag measurement needs Thunder ticks (install thunder-extension-v4 and keep the Thunder page open next session). matches=" + lagsAll.length);
  }

  // 4) TV cadence: how often does TV actually CHANGE a price (needs no ticks)
  const changeGaps = [];
  const prev = new Map(); // sym -> {ms, p}
  for (const snap of snaps) {
    for (const [sym, p] of Object.entries(snap.q)) {
      const pr = prev.get(sym);
      if (pr && p !== pr.p) changeGaps.push((snap.ms - pr.ms) / 1000);
      prev.set(sym, { ms: snap.ms, p });
    }
  }
  console.log("");
  console.log("=== TV PRICE-CHANGE CADENCE (independent of ticks) ===");
  console.log("price changes observed: " + changeGaps.length);
  if (changeGaps.length >= 20) {
    console.log("gap median: " + median(changeGaps).toFixed(0) + "s | p75: " + pct(changeGaps, 0.75).toFixed(0) + "s | p90: " + pct(changeGaps, 0.90).toFixed(0) + "s");
    console.log("(small gaps = TV updates almost continuously; big gaps = TV itself is batch-updating)");
  } else {
    console.log("not enough price movement to measure cadence");
  }
  console.log("");
  console.log("DONE");
})().catch(e => { console.log("FATAL: " + e.message); process.exit(1); });
