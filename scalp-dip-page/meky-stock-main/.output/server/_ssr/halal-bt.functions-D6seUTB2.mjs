import { c as createServerRpc } from "./createServerRpc-BEwYw6bn.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:http";
import "node:stream";
import "node:stream/promises";
import "node:https";
import "node:http2";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "async_hooks";
import "stream";
import "crypto";
import "../_libs/isbot.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
const HALAL = ["MFPC", "TMGH", "SWDY", "OCDI", "ETEL", "HRHO", "FAIT", "PHDC", "AMOC", "MASR", "ORAS", "POUL", "ARCC", "SCEM", "MBSC", "AXPH", "KZPC", "INFI", "ISMA", "SVCE"];
const SCORE_MIN = 50;
const MARKET_DOWN_MAX = 0.7;
const TARGET = 0.03;
const STOP = 8e-3;
const WEIGHTS = [0.4, 0.35, 0.25];
const WEEKLY_HALT = -0.03;
async function loadAll(fromDate) {
  const out = {};
  for (const s of HALAL) {
    const {
      data
    } = await supabaseAdmin.from("daily_candles").select("date,open,high,low,close,volume").eq("symbol", s).gte("date", fromDate).order("date");
    out[s] = (data ?? []).map((r) => ({
      date: r.date,
      open: +r.open,
      high: +r.high,
      low: +r.low,
      close: +r.close,
      volume: +r.volume
    }));
  }
  return out;
}
function rsi(closes, p = 14) {
  if (closes.length < p + 1) return null;
  let g = 0, l = 0;
  for (let i = closes.length - p; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) g += d;
    else l -= d;
  }
  const ag = g / p, al = l / p;
  if (al === 0) return 100;
  return 100 - 100 / (1 + ag / al);
}
const sma = (a, n) => a.slice(-n).reduce((x, y) => x + y, 0) / n;
function score(hist) {
  if (hist.length < 21) return 0;
  const y = hist[hist.length - 1];
  const closes = hist.map((c) => c.close);
  const vols = hist.map((c) => c.volume);
  let s = 0;
  const valEGP = y.close * y.volume;
  if (valEGP < 1e6) return 0;
  s += valEGP > 2e6 ? 20 : 10;
  const ma5 = sma(closes, 5), ma20 = sma(closes, 20);
  if (y.close > ma5 && ma5 > ma20) s += 25;
  else if (y.close > ma20) s += 12;
  const r = rsi(closes, 14);
  if (r == null || r >= 70 || r < 35) return 0;
  if (r >= 50 && r <= 65) s += 25;
  else if (r >= 40 && r < 50) s += 15;
  else if (r > 65) s += 10;
  const avgVol10 = sma(vols, 10);
  const vr = y.volume / avgVol10;
  if (vr > 2) s += 20;
  else if (vr > 1.5) s += 12;
  else if (vr > 1) s += 6;
  const n = closes.length;
  if (n >= 3) {
    if (closes[n - 1] > closes[n - 2] && closes[n - 2] > closes[n - 3]) s += 8;
    else if (closes[n - 1] > closes[n - 2]) s += 3;
  }
  s += 5;
  return s;
}
function startOfWeek(d) {
  const dt = new Date(d);
  dt.setDate(dt.getDate() - dt.getDay());
  return dt.toISOString().slice(0, 10);
}
function compute(data, startDate) {
  const ref = data.ETEL?.length ? data.ETEL : Object.values(data).find((a) => a.length) ?? [];
  const dates = ref.map((c) => c.date).filter((d) => d >= startDate);
  let cap = 1e5;
  const startCap = cap;
  let wins = 0, losses = 0, noTrade = 0, totalDays = 0;
  let weekStart = cap, weekKey = "", weeklyHalt = false;
  let lossStreak = 0, maxLossStreak = 0, winStreak = 0, maxWinStreak = 0;
  let peak = cap, maxDD = 0;
  const dailyRet = [];
  const equity = [];
  const monthlyMap = {};
  const daily = [];
  const bhBase = {};
  for (const s of HALAL) {
    const first = data[s]?.find((c) => c.date >= dates[0]);
    if (first) bhBase[s] = first.open;
  }
  const bhSymbols = Object.keys(bhBase);
  for (let i = 0; i < dates.length; i++) {
    const today = dates[i];
    const wk = startOfWeek(today);
    if (wk !== weekKey) {
      weekKey = wk;
      weekStart = cap;
      weeklyHalt = false;
    }
    let down = 0, up = 0;
    for (const s of HALAL) {
      const arr = data[s];
      if (!arr) continue;
      const yIdx = arr.findIndex((c) => c.date === today) - 1;
      if (yIdx < 1) continue;
      const ch = arr[yIdx].close - arr[yIdx - 1].close;
      if (ch < 0) down++;
      else if (ch > 0) up++;
    }
    const totMov = down + up;
    const marketDown = totMov > 0 ? down / totMov : 0;
    let bhSum = 0, bhCount = 0;
    for (const s of bhSymbols) {
      const c = data[s]?.find((x) => x.date === today);
      if (c) {
        bhSum += c.close / bhBase[s];
        bhCount++;
      }
    }
    const bhEquity = bhCount > 0 ? startCap * (bhSum / bhCount) : startCap;
    if (totMov > 0 && marketDown > MARKET_DOWN_MAX || weeklyHalt) {
      noTrade++;
      equity.push({
        date: today,
        cap,
        bh: bhEquity
      });
      continue;
    }
    const scored = [];
    for (const s of HALAL) {
      const arr = data[s];
      if (!arr) continue;
      const tIdx = arr.findIndex((c) => c.date === today);
      if (tIdx < 21) continue;
      const hist = arr.slice(0, tIdx);
      const sc = score(hist);
      if (sc < SCORE_MIN) continue;
      const t = arr[tIdx];
      scored.push({
        sym: s,
        sc,
        entry: t.open,
        high: t.high,
        low: t.low,
        close: t.close
      });
    }
    scored.sort((a, b) => b.sc - a.sc);
    const top = scored.slice(0, 3);
    if (top.length === 0) {
      noTrade++;
      equity.push({
        date: today,
        cap,
        bh: bhEquity
      });
      continue;
    }
    let dayPnl = 0;
    const picks = [];
    for (let k = 0; k < top.length; k++) {
      const p = top[k];
      const target = p.entry * (1 + TARGET);
      const stop = p.entry * (1 - STOP);
      let exit = p.close;
      if (p.low <= stop && p.high >= target) exit = stop;
      else if (p.high >= target) exit = target;
      else if (p.low <= stop) exit = stop;
      const pctNet = exit / p.entry - 1;
      const alloc = cap * WEIGHTS[k];
      const pnl = alloc * pctNet;
      dayPnl += pnl;
      picks.push({
        symbol: p.sym,
        score: p.sc,
        pnlPct: pctNet * 100
      });
    }
    const capBefore = cap;
    cap += dayPnl;
    totalDays++;
    dailyRet.push(dayPnl / capBefore);
    if (dayPnl > 0) {
      wins++;
      winStreak++;
      lossStreak = 0;
      maxWinStreak = Math.max(maxWinStreak, winStreak);
    } else {
      losses++;
      lossStreak++;
      winStreak = 0;
      maxLossStreak = Math.max(maxLossStreak, lossStreak);
    }
    if (cap > peak) peak = cap;
    const dd = (peak - cap) / peak;
    if (dd > maxDD) maxDD = dd;
    if ((cap - weekStart) / weekStart < WEEKLY_HALT) weeklyHalt = true;
    const mo = today.slice(0, 7);
    monthlyMap[mo] = (monthlyMap[mo] ?? 0) + dayPnl;
    equity.push({
      date: today,
      cap,
      bh: bhEquity
    });
    daily.push({
      date: today,
      cap,
      pnl: dayPnl,
      picks
    });
  }
  const mean = dailyRet.reduce((a, b) => a + b, 0) / (dailyRet.length || 1);
  const variance = dailyRet.reduce((a, b) => a + (b - mean) ** 2, 0) / (dailyRet.length || 1);
  const sd = Math.sqrt(variance);
  const sharpe = sd > 0 ? mean / sd * Math.sqrt(252) : 0;
  const bhEnd = equity[equity.length - 1]?.bh ?? startCap;
  return {
    startDate: dates[0] ?? startDate,
    endDate: dates[dates.length - 1] ?? startDate,
    daysTotal: dates.length,
    startCap,
    endCap: cap,
    totalReturnPct: (cap / startCap - 1) * 100,
    winRate: totalDays ? wins / totalDays * 100 : 0,
    wins,
    losses,
    noTradeDays: noTrade,
    maxDrawdownPct: maxDD * 100,
    sharpe,
    maxWinStreak,
    maxLossStreak,
    buyHoldEndCap: bhEnd,
    buyHoldReturnPct: (bhEnd / startCap - 1) * 100,
    equity,
    monthly: Object.entries(monthlyMap).sort().map(([month, pnl]) => ({
      month,
      pnl
    })),
    daily,
    symbolsUsed: HALAL.filter((s) => (data[s]?.length ?? 0) > 21)
  };
}
function buildToday(data) {
  let latest = "";
  for (const s of HALAL) {
    const arr = data[s];
    if (!arr || !arr.length) continue;
    const d = arr[arr.length - 1].date;
    if (d > latest) latest = d;
  }
  if (!latest) return {
    asOfDate: null,
    marketDownPct: 0,
    marketWarning: false,
    picks: []
  };
  let down = 0, up = 0;
  for (const s of HALAL) {
    const arr = data[s];
    if (!arr || arr.length < 2) continue;
    const a = arr[arr.length - 1].close;
    const b = arr[arr.length - 2].close;
    if (a < b) down++;
    else if (a > b) up++;
  }
  const total = down + up;
  const marketDown = total > 0 ? down / total : 0;
  const scored = [];
  for (const s of HALAL) {
    const arr = data[s];
    if (!arr) continue;
    const sc = score(arr);
    if (sc < SCORE_MIN) continue;
    scored.push({
      sym: s,
      sc,
      close: arr[arr.length - 1].close
    });
  }
  scored.sort((a, b) => b.sc - a.sc);
  const top = scored.slice(0, 3);
  const picks = top.map((p, i) => ({
    symbol: p.sym,
    score: p.sc,
    lastClose: p.close,
    entry: p.close,
    target: p.close * (1 + TARGET),
    stop: p.close * (1 - STOP),
    weightPct: WEIGHTS[i] * 100
  }));
  return {
    asOfDate: latest,
    marketDownPct: marketDown * 100,
    marketWarning: marketDown > MARKET_DOWN_MAX,
    picks
  };
}
const runHalalBacktest_createServerFn_handler = createServerRpc({
  id: "4b2f6acd783618fb91f9a8bcdac6337dbc636522da1f16dd3806cf6eb92edd25",
  name: "runHalalBacktest",
  filename: "src/lib/halal/halal-bt.functions.ts"
}, (opts) => runHalalBacktest.__executeServer(opts));
const runHalalBacktest = createServerFn({
  method: "GET"
}).handler(runHalalBacktest_createServerFn_handler, async () => {
  const data = await loadAll("2025-06-01");
  const result = compute(data, "2025-12-01");
  const today = buildToday(data);
  return {
    result,
    today
  };
});
export {
  runHalalBacktest_createServerFn_handler
};
