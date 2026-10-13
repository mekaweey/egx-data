// TV LAG EXPERIMENT - COLLECTOR
// ============================
// Measures TradingView EGX scanner freshness vs the Thunder extension (source
// of truth for "now"). Samples the scanner every 15s during the EGX session
// (Sun-Thu 09:50 -> 14:36 Cairo, machine timezone) into a JSONL file:
//   {"iso":"...","ms":...,"q":{"COMI":25.1,...}}
// Analysis (tv_lag_analyze.cjs) joins these snapshots against live_ticks
// written by the extension -> median lag in seconds.
//
// Usage:
//   node tv_lag_snap.cjs            (waits for session, samples, exits 14:36)
//   node tv_lag_snap.cjs --once     (one snapshot right now, for testing)
//
// ASCII ONLY.
const fs = require("fs");
const path = require("path");

const LOCK = path.join(__dirname, "tv_lag_snap.lock");
const SCANNER_URL = "https://scanner.tradingview.com/egypt/scan?label-product=screener-stock";
const INTERVAL_OK = 15000;      // 15s sampling
const INTERVAL_BACKOFF = 45000; // on failure
const INTERVAL_MAX = 120000;
const START_H = 9, START_M = 50;
const END_H = 14, END_M = 36;
const TRADING_DOW = [0, 1, 2, 3, 4]; // Sun..Thu

function nowLocal() { return new Date(); }
function isTradingDay(d) { return TRADING_DOW.includes(d.getDay()); }
function minutesOfDay(d) { return d.getHours() * 60 + d.getMinutes(); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

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
  const q = {};
  for (const item of j.data ?? []) {
    const d = item.d;
    const sym = String(item.s || "").replace("EGX:", "").toUpperCase();
    const open = Number(d && d[1]);
    const close = Number(d && d[4]);
    if (!(close > 0) || !(open > 0)) continue;
    q[sym] = close;
  }
  return q;
}

async function sampleOnce(outFile) {
  const q = await fetchTv();
  const rec = { iso: new Date().toISOString(), ms: Date.now(), n: Object.keys(q).length, q };
  fs.appendFileSync(outFile, JSON.stringify(rec) + "\n");
  return rec;
}

(async () => {
  const once = process.argv.includes("--once");
  const dateTag = nowLocal().toISOString().slice(0, 10);
  const outFile = path.join(__dirname, "tv_lag_snapshots_" + dateTag + ".jsonl");

  if (once) {
    try {
      const rec = await sampleOnce(outFile);
      console.log("ONCE OK: " + rec.n + " symbols -> " + outFile);
    } catch (e) {
      console.log("ONCE FAILED: " + e.message);
      process.exit(1);
    }
    return;
  }

  // single-instance lock (ignore stale lock older than 6h)
  try {
    const st = fs.statSync(LOCK);
    if (Date.now() - st.mtimeMs < 6 * 3600e3) { console.log("already running"); return; }
    fs.unlinkSync(LOCK);
  } catch (e) { /* no lock */ }
  fs.writeFileSync(LOCK, String(process.pid));

  try {
    const d0 = nowLocal();
    if (!isTradingDay(d0)) { console.log("not a trading day, exit"); return; }
    if (minutesOfDay(d0) > END_H * 60 + END_M) { console.log("session over, exit"); return; }
    if (minutesOfDay(d0) < START_H * 60 + START_M) {
      const waitMs = (START_H * 60 + START_M - minutesOfDay(d0)) * 60e3 - d0.getSeconds() * 1e3;
      console.log("waiting " + Math.round(waitMs / 60000) + " min for session start");
      await sleep(Math.max(0, waitMs));
    }

    let interval = INTERVAL_OK, fails = 0, ok = 0;
    while (true) {
      const d = nowLocal();
      if (!isTradingDay(d) || minutesOfDay(d) > END_H * 60 + END_M) break;
      try {
        const rec = await sampleOnce(outFile);
        ok++; fails = 0; interval = INTERVAL_OK;
        if (ok % 20 === 1) console.log("sample " + ok + ": " + rec.n + " symbols at " + rec.iso);
      } catch (e) {
        fails++;
        interval = Math.min(INTERVAL_MAX, interval * 2);
        if (fails <= 3 || fails % 10 === 0) console.log("sample fail #" + fails + ": " + e.message + " -> backoff " + interval / 1000 + "s");
      }
      await sleep(interval);
    }
    fs.writeFileSync(path.join(__dirname, "tv_lag_DONE_" + dateTag + ".txt"), "samples=" + ok + " at " + new Date().toISOString() + "\n");
    console.log("DONE: " + ok + " samples -> " + outFile);
  } finally {
    try { fs.unlinkSync(LOCK); } catch (e) {}
  }
})().catch(e => { console.log("FATAL: " + e.message); process.exit(1); });
