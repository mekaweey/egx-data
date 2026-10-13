// TV LIVE BRIDGE 1s PROTOTYPE (does NOT replace tv_live_bridge.cjs)
// ================================================================
// Same scanner POST as the 5s bridge, but SAMPLE_MS=1000.
// Added for the 1-second experiment:
//   --dry-run : fetch only, no DB writes (safe testing any time)
//   --burst N : N samples 1s apart then exit, bypasses session gate
//   overlap guard: sleep = max(0, 1000 - elapsed) so slow fetches
//     (165-468ms measured) never pile up.
// Normal mode (no flags) keeps the Sun-Thu 09:50->14:36 Cairo gate.
// ASCII ONLY.
const fs = require("fs");
const path = require("path");

const LOCK = path.join(__dirname, "tv_bridge_1s.lock");
const LOG = path.join(__dirname, "tv_bridge_1s.log");
const SCANNER_URL = "https://scanner.tradingview.com/egypt/scan?label-product=screener-stock";
const SAMPLE_MS = 1000;
const JSONL_EVERY = 15;           // snapshot file every ~15s (same volume as before)
const INTERVAL_BACKOFF = 5000;
const INTERVAL_MAX = 60000;
const START_H = 9, START_M = 50;
const END_H = 14, END_M = 36;
const TRADING_DOW = [0, 1, 2, 3, 4];

function log(msg) {
  const line = new Date().toISOString() + " " + msg;
  try { fs.appendFileSync(LOG, line + "\n"); } catch (e) {}
  console.log(line);
}
function cairoParts(d) {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d);
  const g = (t) => p.find(x => x.type === t)?.value ?? "";
  const wdMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { dow: wdMap[g("weekday")] ?? 0, hh: parseInt(g("hour"), 10) || 0, mm: parseInt(g("minute"), 10) || 0 };
}
function minutesOfDay(d) { const c = cairoParts(d); return c.hh * 60 + c.mm; }
function isTradingDay(d) { return TRADING_DOW.includes(cairoParts(d).dow); }
function cairoDate(d) { return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(d); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function loadEnv() {
  const env = { DATABASE_URL: process.env.DATABASE_URL || "" };
  try {
    for (const l of fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8").split("\n")) {
      const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/"/g, "");
    }
  } catch (e) {}
  return env;
}

async function fetchTv() {
  const res = await fetch(SCANNER_URL, {
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
  if (!res.ok) throw new Error("scanner HTTP " + res.status);
  const j = await res.json();
  const q = {}, v = {};
  for (const item of j.data ?? []) {
    const d = item.d;
    const sym = String(item.s || "").replace("EGX:", "").toUpperCase();
    const open = Number(d && d[1]);
    const close = Number(d && d[4]);
    if (!(close > 0) || !(open > 0)) continue;
    q[sym] = close;
    v[sym] = Number(d && d[5]) || 0;
  }
  return { q, v, total: j.totalCount || Object.keys(q).length };
}

(async () => {
  const dryRun = process.argv.includes("--dry-run");
  const burstIdx = process.argv.indexOf("--burst");
  const burstN = burstIdx >= 0 ? parseInt(process.argv[burstIdx + 1], 10) || 10 : 0;

  // TEST MODE: burst with dry-run, no session gate, no lock, no DB
  if (burstN > 0) {
    log("1s BURST TEST: " + burstN + " samples" + (dryRun ? " (dry-run, no DB)" : ""));
    let prevQ = null, ok = 0, fail = 0;
    const lats = [];
    const tStart = Date.now();
    for (let i = 1; i <= burstN; i++) {
      const t0 = Date.now();
      try {
        const { q, total } = await fetchTv();
        const ms = Date.now() - t0;
        lats.push(ms); ok++;
        let diff = 0;
        if (prevQ) for (const s of Object.keys(q)) if (prevQ[s] !== q[s]) diff++;
        prevQ = q;
        log("sample " + i + "/" + burstN + ": " + Object.keys(q).length + " sym (total=" + total + ") in " + ms + "ms diff=" + diff);
      } catch (e) { fail++; log("sample " + i + " FAIL: " + e.message); }
      const elapsed = Date.now() - t0;
      await sleep(Math.max(0, SAMPLE_MS - elapsed));
    }
    lats.sort((a, b) => a - b);
    const wall = ((Date.now() - tStart) / 1000).toFixed(1);
    log("BURST DONE: ok=" + ok + " fail=" + fail + " wall=" + wall + "s med=" + (lats[Math.floor(lats.length / 2)] || 0) + "ms max=" + (Math.max(...lats, 0)) + "ms");
    return;
  }

  const env = loadEnv();
  const { Pool } = require("pg");
  const pool = new Pool({ connectionString: env.DATABASE_URL });

  try {
    const st = fs.statSync(LOCK);
    if (Date.now() - st.mtimeMs < 12 * 3600e3) { log("already running, exit"); return; }
    fs.unlinkSync(LOCK);
  } catch (e) {}
  fs.writeFileSync(LOCK, String(process.pid));

  try {
    let d0 = new Date();
    if (!isTradingDay(d0)) { log("not a trading day, exit"); return; }
    if (minutesOfDay(d0) > END_H * 60 + END_M) { log("session over, exit"); return; }
    const dateTag = cairoDate(d0);
    const outFile = path.join(__dirname, "tv_lag_snapshots_1s_" + dateTag + ".jsonl");
    if (minutesOfDay(d0) < START_H * 60 + START_M) {
      const waitMs = (START_H * 60 + START_M - minutesOfDay(d0)) * 60e3 - d0.getSeconds() * 1e3;
      log("armed: waiting " + Math.round(waitMs / 60000) + " min until 09:50");
      await sleep(Math.max(0, waitMs));
    }
    if (!dryRun) {
      try { await pool.query("DELETE FROM tv_ticks WHERE ts < now() - interval '3 days'"); log("pruned old tv_ticks"); }
      catch (e) { log("prune failed: " + e.message); }
    }
    let interval = SAMPLE_MS, fails = 0, ok = 0, writes = 0, sampleNo = 0;
    let prevQ = null;
    log("1s session started" + (dryRun ? " (dry-run)" : ""));
    while (true) {
      const loopT0 = Date.now();
      const d = new Date();
      if (!isTradingDay(d) || minutesOfDay(d) > END_H * 60 + END_M) break;
      try {
        const { q, v } = await fetchTv();
        ok++; fails = 0; interval = SAMPLE_MS;
        sampleNo++;
        if (sampleNo % JSONL_EVERY === 1) {
          const rec = { iso: d.toISOString(), ms: d.getTime(), n: Object.keys(q).length, q };
          fs.appendFileSync(outFile, JSON.stringify(rec) + "\n");
        }
        if (!dryRun) {
          const batch = [];
          for (const s of Object.keys(q)) {
            if (prevQ && prevQ[s] === q[s]) continue;
            batch.push([s, q[s], v[s]]);
          }
          for (let i = 0; i < batch.length; i += 500) {
            const chunk = batch.slice(i, i + 500);
            const values = [];
            const params = [];
            chunk.forEach((row, ri) => {
              const base = ri * 4;
              values.push("($" + (base + 1) + ",$" + (base + 2) + ",$" + (base + 3) + ",$" + (base + 4) + ")");
              params.push(row[0], row[1], row[2], d.toISOString());
            });
            await pool.query("INSERT INTO tv_ticks (symbol, price, volume, ts) VALUES " + values.join(","), params);
            writes += chunk.length;
          }
        }
        prevQ = q;
        if (ok % 300 === 1) log("samples=" + ok + " dbWrites=" + writes);
      } catch (e) {
        fails++;
        interval = Math.min(INTERVAL_MAX, SAMPLE_MS * 2);
        log("fail #" + fails + ": " + e.message + " -> backoff " + interval / 1000 + "s");
      }
      const elapsed = Date.now() - loopT0;
      await sleep(Math.max(0, interval - elapsed));
    }
    log("DONE: samples=" + ok + " dbWrites=" + writes);
  } finally {
    try { fs.unlinkSync(LOCK); } catch (e) {}
    try { await pool.end(); } catch (e) {}
  }
})().catch(e => { log("FATAL: " + e.message); process.exit(1); });
