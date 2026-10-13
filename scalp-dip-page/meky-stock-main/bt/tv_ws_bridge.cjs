// TV WS BRIDGE — TradingView websocket streamer (replaces 5s scanner polling)
// ===========================================================================
// One persistent wss connection to data.tradingview.com (anonymous session,
// no auth needed — proven 2026-10-03). Subscribes the whole EGX market
// (296 symbols over 3 quote sessions) and pushes every price change into
// tv_ticks (diff-only, same row shape as tv_live_bridge.cjs) + a JSONL
// snapshot every ~15s in the same record format so tv_lag_analyze.cjs works.
//
// Why: scanner POST every 5s = ~3456 HTTP/day + up to 5s sampling delay and
// no bid/ask. WS = 1 connection, server-push ticks, plus bid/ask quoted.
// Same source feed (TV), so the ~minutes source delay (if any) is unchanged
// — this removes transport delay, not source delay.
//
// Scope (minimal blast radius): writes ONLY tv_ticks + JSONL. daily_candles
// stays with the Supabase fn + morning/EOD tasks. Run side-by-side with
// tv_live_bridge.cjs on Sundays for comparison, then retire the loser.
//
// Usage:
//   node tv_ws_bridge.cjs                      (session gate Sun-Thu 09:50->14:36 Cairo)
//   node tv_ws_bridge.cjs --dry-run            (same, but no DB writes)
//   node tv_ws_bridge.cjs --dry-run --burst 20 (20s streaming test now, bypasses gate)
//
// ASCII ONLY.
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const LOCK = path.join(__dirname, "tv_ws_bridge.lock");
const LOG = path.join(__dirname, "tv_ws_bridge.log");
const WS_URL = "wss://data.tradingview.com/socket.io/websocket";
const SCANNER_URL = "https://scanner.tradingview.com/egypt/scan?label-product=screener-stock";
const SESSIONS = ["qs_wsa", "qs_wsb", "qs_wsc"];
const FIELDS = ["lp", "open", "high", "low", "volume", "bid", "ask", "change"];
const FLUSH_MS = 1000;
const JSONL_EVERY_MS = 15000;
const RECONNECT_BASE_MS = 5000;
const RECONNECT_MAX_MS = 60000;
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
function send(ws, o) { const m = JSON.stringify(o); ws.send("~m~" + m.length + "~m~" + m); }

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

async function fetchSymbolList() {
  const res = await fetch(SCANNER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    body: JSON.stringify({
      filter: [{ left: "type", operation: "equal", right: "stock" }],
      options: { lang: "en" },
      markets: ["egypt"],
      symbols: { query: { types: [] }, tickers: [] },
      columns: ["name"],
      sort: { sortBy: "name", sortOrder: "asc" },
    }),
  });
  if (!res.ok) throw new Error("scanner HTTP " + res.status);
  const j = await res.json();
  const syms = [];
  for (const item of j.data ?? []) {
    const s = String(item.s || "").replace("EGX:", "").toUpperCase();
    if (s) syms.push("EGX:" + s);
  }
  if (!syms.length) throw new Error("empty symbol list");
  return syms;
}

(async () => {
  const dryRun = process.argv.includes("--dry-run");
  const burstIdx = process.argv.indexOf("--burst");
  const burstN = burstIdx >= 0 ? parseInt(process.argv[burstIdx + 1], 10) || 20 : 0;
  const env = loadEnv();
  const { Pool } = require("pg");
  const pool = new Pool({ connectionString: env.DATABASE_URL });

  const q = {};   // sym -> last lp
  const v = {};   // sym -> last volume
  const dirty = new Set();
  let ticksIn = 0, dbWrites = 0, reconnects = 0, snapshots = 0;
  let outFile = null;

  async function flush() {
    if (!dirty.size) return;
    const now = new Date();
    const batch = [];
    for (const s of dirty) {
      const sym = s.replace("EGX:", "");
      if (q[s] > 0) batch.push([sym, q[s], v[s] || 0]);
    }
    dirty.clear();
    if (!batch.length || dryRun) return;
    for (let i = 0; i < batch.length; i += 500) {
      const chunk = batch.slice(i, i + 500);
      const values = [];
      const params = [];
      chunk.forEach((row, ri) => {
        const base = ri * 4;
        values.push("($" + (base + 1) + ",$" + (base + 2) + ",$" + (base + 3) + ",$" + (base + 4) + ")");
        params.push(row[0], row[1], row[2], now.toISOString());
      });
      await pool.query("INSERT INTO tv_ticks (symbol, price, volume, ts) VALUES " + values.join(","), params);
      dbWrites += chunk.length;
    }
  }

  function snapshot() {
    if (!outFile) return;
    const plain = {};
    for (const s of Object.keys(q)) plain[s.replace("EGX:", "")] = q[s];
    const now = new Date();
    fs.appendFileSync(outFile, JSON.stringify({ iso: now.toISOString(), ms: now.getTime(), n: Object.keys(plain).length, q: plain }) + "\n");
    snapshots++;
  }

  function onQuote(sym, vals) {
    if (vals.lp !== undefined && Number(vals.lp) > 0) {
      const prev = q[sym];
      q[sym] = Number(vals.lp);
      if (vals.volume !== undefined) v[sym] = Number(vals.volume) || 0;
      ticksIn++;
      if (prev !== q[sym]) dirty.add(sym);
    }
  }

  function handleMessage(data) {
    const s = data.toString();
    const parts = s.split(/~m~\d+~m~/).filter(Boolean);
    for (const p of parts) {
      let o;
      try { o = JSON.parse(p); } catch (e) { continue; }
      if (o.m === "qsd" && o.p && o.p[1]) {
        const sym = o.p[1].n;
        const vals = o.p[1].v || {};
        onQuote(sym, vals);
      }
    }
  }

  function connect(syms) {
    return new Promise((resolve) => {
      const ws = new WebSocket(WS_URL, {
        origin: "https://www.tradingview.com",
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", Origin: "https://www.tradingview.com" },
      });
      let opened = false;
      const failTimer = setTimeout(() => { if (!opened) { try { ws.close(); } catch (e) {} resolve(null); } }, 15000);
      ws.on("open", () => {
        opened = true;
        clearTimeout(failTimer);
        SESSIONS.forEach((sess) => {
          send(ws, { m: "quote_create_session", p: [sess] });
          send(ws, { m: "quote_set_fields", p: [sess].concat(FIELDS) });
        });
        syms.forEach((sym, i) => send(ws, { m: "quote_add_symbols", p: [SESSIONS[i % SESSIONS.length], sym] }));
        resolve(ws);
      });
      ws.on("message", handleMessage);
      ws.on("error", () => {});
      ws.on("close", () => resolve(null));
    });
  }

  // ---- BURST TEST MODE (bypasses session gate) ----
  if (burstN > 0) {
    log("WS BURST TEST: ~" + burstN + "s streaming" + (dryRun ? " (dry-run, no DB)" : ""));
    let syms;
    try { syms = await fetchSymbolList(); }
    catch (e) { log("symbol list FAILED: " + e.message); await pool.end(); return; }
    log("symbols: " + syms.length);
    const t0 = Date.now();
    const ws = await connect(syms);
    if (!ws) { log("WS CONNECT FAILED"); await pool.end(); return; }
    log("WS CONNECTED, streaming...");
    const flusher = setInterval(() => { flush().catch((e) => log("flush err: " + e.message)); }, FLUSH_MS);
    await sleep(burstN * 1000);
    clearInterval(flusher);
    try { ws.close(); } catch (e) {}
    await flush().catch(() => {});
    const wall = ((Date.now() - t0) / 1000).toFixed(1);
    log("BURST DONE: wall=" + wall + "s symbols=" + Object.keys(q).length + " ticksIn=" + ticksIn + " dbWrites=" + dbWrites + " snapshots=" + snapshots);
    await pool.end();
    return;
  }

  // ---- SESSION MODE ----
  try {
    const st = fs.statSync(LOCK);
    if (Date.now() - st.mtimeMs < 12 * 3600e3) { log("already running, exit"); await pool.end(); return; }
    fs.unlinkSync(LOCK);
  } catch (e) {}
  fs.writeFileSync(LOCK, String(process.pid));

  try {
    let d0 = new Date();
    if (!isTradingDay(d0)) { log("not a trading day, exit"); return; }
    if (minutesOfDay(d0) > END_H * 60 + END_M) { log("session over, exit"); return; }
    const dateTag = cairoDate(d0);
    outFile = path.join(__dirname, "tv_lag_snapshots_WS_" + dateTag + ".jsonl");
    if (minutesOfDay(d0) < START_H * 60 + START_M) {
      const waitMs = (START_H * 60 + START_M - minutesOfDay(d0)) * 60e3 - d0.getSeconds() * 1e3;
      log("armed: waiting " + Math.round(waitMs / 60000) + " min until 09:50");
      await sleep(Math.max(0, waitMs));
    }
    if (!dryRun) {
      try { await pool.query("DELETE FROM tv_ticks WHERE ts < now() - interval '3 days'"); log("pruned old tv_ticks"); }
      catch (e) { log("prune failed: " + e.message); }
    }
    const syms = await fetchSymbolList();
    log("WS SESSION started: " + syms.length + " symbols" + (dryRun ? " (dry-run)" : ""));
    let backoff = RECONNECT_BASE_MS;
    const flusher = setInterval(() => { flush().catch((e) => log("flush err: " + e.message)); }, FLUSH_MS);
    let lastSnap = Date.now();
    while (true) {
      const d = new Date();
      if (!isTradingDay(d) || minutesOfDay(d) > END_H * 60 + END_M) break;
      const ws = await connect(syms);
      if (!ws) {
        reconnects++;
        log("connect failed #" + reconnects + " -> retry in " + backoff / 1000 + "s");
        await sleep(backoff);
        backoff = Math.min(RECONNECT_MAX_MS, backoff * 2);
        continue;
      }
      backoff = RECONNECT_BASE_MS;
      log("WS connected (reconnects=" + reconnects + ")");
      await new Promise((resolve) => {
        const check = setInterval(() => {
          const dd = new Date();
          if (!isTradingDay(dd) || minutesOfDay(dd) > END_H * 60 + END_M) { clearInterval(check); try { ws.close(); } catch (e) {} resolve(); }
          if (Date.now() - lastSnap >= JSONL_EVERY_MS) { lastSnap = Date.now(); snapshot(); }
        }, 1000);
        ws.on("close", () => { clearInterval(check); resolve(); });
        ws.on("error", () => { try { ws.close(); } catch (e) {} });
      });
      reconnects++;
      log("WS dropped (reconnects=" + reconnects + ") ticksIn=" + ticksIn + " dbWrites=" + dbWrites);
    }
    clearInterval(flusher);
    await flush().catch(() => {});
    log("DONE: ticksIn=" + ticksIn + " dbWrites=" + dbWrites + " snapshots=" + snapshots + " reconnects=" + reconnects);
  } finally {
    try { fs.unlinkSync(LOCK); } catch (e) {}
    try { await pool.end(); } catch (e) {}
  }
})().catch(e => { log("FATAL: " + e.message); process.exit(1); });
