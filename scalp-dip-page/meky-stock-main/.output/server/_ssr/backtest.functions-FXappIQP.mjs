import { c as createServerRpc } from "./createServerRpc-BEwYw6bn.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.mjs";
import { d as detectRegime } from "./levels.server-DPpGzyqT.mjs";
import { s as simulateSymbol, c as computeMetrics } from "./engine.server-K_Mwkd4b.mjs";
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
import "../_libs/technicalindicators.mjs";
import "./strategy.server-BM-ZfGqV.mjs";
import "./tier-i-intelligence.server-Ddugl3s6.mjs";
const STRATEGY_VERSION = "v1-atr-regime";
const runBacktest_createServerFn_handler = createServerRpc({
  id: "00a96a009289aa42bb1ca19f6183c3184794f4d679f7dd48ec17d2b2540741b7",
  name: "runBacktest",
  filename: "src/lib/backtest/backtest.functions.ts"
}, (opts) => runBacktest.__executeServer(opts));
const runBacktest = createServerFn({
  method: "POST"
}).inputValidator((data) => ({
  minConfidence: Math.max(40, Math.min(90, data.minConfidence ?? 60)),
  warmup: Math.max(30, Math.min(60, data.warmup ?? 50)),
  maxHold: Math.max(2, Math.min(10, data.maxHold ?? 7))
})).handler(runBacktest_createServerFn_handler, async ({
  data
}) => {
  const {
    minConfidence,
    warmup,
    maxHold
  } = data;
  const {
    data: stocks,
    error: stockErr
  } = await supabaseAdmin.from("stocks").select("symbol").eq("is_active", true);
  if (stockErr || !stocks?.length) throw new Error(`no active stocks: ${stockErr?.message}`);
  const PAGE = 1e3;
  const allRows = [];
  for (let from = 0; ; from += PAGE) {
    const {
      data: page,
      error: candleErr
    } = await supabaseAdmin.from("daily_candles").select("symbol, date, open, high, low, close, volume").order("symbol", {
      ascending: true
    }).order("date", {
      ascending: true
    }).range(from, from + PAGE - 1);
    if (candleErr) throw new Error(`candles fetch failed: ${candleErr.message}`);
    if (!page || page.length === 0) break;
    allRows.push(...page);
    if (page.length < PAGE) break;
  }
  const bySymbol = /* @__PURE__ */ new Map();
  for (const r of allRows) {
    const arr = bySymbol.get(r.symbol) ?? [];
    arr.push({
      date: r.date,
      open: Number(r.open),
      high: Number(r.high),
      low: Number(r.low),
      close: Number(r.close),
      volume: Number(r.volume)
    });
    bySymbol.set(r.symbol, arr);
  }
  for (const arr of bySymbol.values()) {
    arr.sort((a, b) => a.date.localeCompare(b.date));
  }
  const dates = /* @__PURE__ */ new Set();
  for (const arr of bySymbol.values()) for (const c of arr) dates.add(c.date);
  const sortedDates = [...dates].sort();
  const indexBySymbol = /* @__PURE__ */ new Map();
  for (const [sym, arr] of bySymbol) {
    const m2 = /* @__PURE__ */ new Map();
    for (const c of arr) m2.set(c.date, c);
    indexBySymbol.set(sym, m2);
  }
  const marketCandles = sortedDates.map((d) => {
    let oSum = 0, hSum = 0, lSum = 0, cSum = 0, n = 0;
    let vol = 0;
    for (const m2 of indexBySymbol.values()) {
      const c = m2.get(d);
      if (c) {
        oSum += c.open;
        hSum += c.high;
        lSum += c.low;
        cSum += c.close;
        vol += c.volume;
        n++;
      }
    }
    const k = Math.max(1, n);
    return {
      date: d,
      open: oSum / k,
      high: hSum / k,
      low: lSum / k,
      close: cSum / k,
      volume: vol
    };
  });
  const regimeByDate = /* @__PURE__ */ new Map();
  for (let i = warmup; i < marketCandles.length; i++) {
    const slice = marketCandles.slice(Math.max(0, i - 60), i + 1);
    regimeByDate.set(marketCandles[i].date, detectRegime(slice));
  }
  const fromDate = sortedDates[Math.min(warmup, sortedDates.length - 1)] ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const toDate = sortedDates[sortedDates.length - 1] ?? fromDate;
  const {
    data: btRow,
    error: btErr
  } = await supabaseAdmin.from("backtests").insert({
    status: "running",
    from_date: fromDate,
    to_date: toDate,
    min_confidence: minConfidence,
    strategy_version: STRATEGY_VERSION,
    symbols_count: bySymbol.size
  }).select("id").single();
  if (btErr || !btRow) throw new Error(`backtest insert failed: ${btErr?.message}`);
  const backtestId = btRow.id;
  const allTrades = [];
  let simulatedSymbols = 0;
  let skippedShortHistory = 0;
  for (const s of stocks) {
    const candles = bySymbol.get(s.symbol);
    if (!candles || candles.length < warmup + 3) {
      skippedShortHistory++;
      continue;
    }
    simulatedSymbols++;
    const t = simulateSymbol({
      symbol: s.symbol,
      candles,
      marketRegimeByDate: regimeByDate,
      minConfidence,
      warmup,
      maxHold
    });
    allTrades.push(...t);
  }
  if (allTrades.length > 0) {
    const rows = allTrades.map((t) => ({
      backtest_id: backtestId,
      symbol: t.symbol,
      signal_date: t.signalDate,
      entry_date: t.entryDate,
      entry_price: t.entryPrice,
      exit_date: t.exitDate,
      exit_price: t.exitPrice,
      exit_reason: t.exitReason,
      pnl_pct: t.pnlPct,
      r_multiple: t.rMultiple,
      days_held: t.daysHeld,
      confidence: t.confidence,
      signal: t.signal,
      stop_loss: t.stopLoss,
      target: t.target,
      atr: t.atr,
      market_regime: t.marketRegime
    }));
    const CHUNK = 500;
    for (let i = 0; i < rows.length; i += CHUNK) {
      await supabaseAdmin.from("backtest_trades").insert(rows.slice(i, i + CHUNK));
    }
  }
  const m = computeMetrics(allTrades);
  await supabaseAdmin.from("backtests").update({
    status: "completed",
    finished_at: (/* @__PURE__ */ new Date()).toISOString(),
    total_trades: m.totalTrades,
    wins: m.wins,
    losses: m.losses,
    open_trades: m.openTrades,
    win_rate: m.winRate,
    avg_win_pct: m.avgWinPct,
    avg_loss_pct: m.avgLossPct,
    profit_factor: m.profitFactor,
    expectancy_pct: m.expectancyPct,
    max_drawdown_pct: m.maxDrawdownPct,
    sharpe: m.sharpe,
    total_return_pct: m.totalReturnPct,
    best_trade_pct: m.bestTradePct,
    worst_trade_pct: m.worstTradePct,
    avg_days_held: m.avgDaysHeld
  }).eq("id", backtestId);
  return {
    backtestId,
    metrics: m,
    tradesCount: allTrades.length,
    diagnostics: {
      candlesLoaded: allRows.length,
      symbolsWithCandles: bySymbol.size,
      simulatedSymbols,
      skippedShortHistory,
      dateRange: {
        from: fromDate,
        to: toDate
      }
    }
  };
});
const listBacktests_createServerFn_handler = createServerRpc({
  id: "08c8b1cbfdbd42b293a0423a4f7d51de6d827ba4ab5b7f9507892bca94f465b2",
  name: "listBacktests",
  filename: "src/lib/backtest/backtest.functions.ts"
}, (opts) => listBacktests.__executeServer(opts));
const listBacktests = createServerFn({
  method: "GET"
}).handler(listBacktests_createServerFn_handler, async () => {
  const {
    data
  } = await supabaseAdmin.from("backtests").select("*").order("started_at", {
    ascending: false
  }).limit(20);
  return data ?? [];
});
const getBacktest_createServerFn_handler = createServerRpc({
  id: "5af943b8b32763e0f2bfccac0bb6ec580f791358a27536f4e4a4c81d628fabee",
  name: "getBacktest",
  filename: "src/lib/backtest/backtest.functions.ts"
}, (opts) => getBacktest.__executeServer(opts));
const getBacktest = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getBacktest_createServerFn_handler, async ({
  data
}) => {
  const {
    data: bt
  } = await supabaseAdmin.from("backtests").select("*").eq("id", data.id).maybeSingle();
  if (!bt) return null;
  const {
    data: trades
  } = await supabaseAdmin.from("backtest_trades").select("*").eq("backtest_id", data.id).order("entry_date", {
    ascending: true
  }).limit(2e3);
  const tradeRows = trades ?? [];
  const symbols = Array.from(new Set(tradeRows.map((t) => t.symbol)));
  const sourceBySymbol = /* @__PURE__ */ new Map();
  if (symbols.length) {
    const {
      data: logs
    } = await supabaseAdmin.from("data_source_logs").select("symbol, provider, ts").eq("ok", true).in("symbol", symbols).order("ts", {
      ascending: false
    }).limit(5e3);
    for (const row of logs ?? []) {
      if (row.symbol && !sourceBySymbol.has(row.symbol)) {
        sourceBySymbol.set(row.symbol, row.provider);
      }
    }
  }
  let realTrades = 0;
  let syntheticTrades = 0;
  let unknownTrades = 0;
  for (const t of tradeRows) {
    const p = sourceBySymbol.get(t.symbol);
    if (!p) unknownTrades++;
    else if (p === "synthetic") syntheticTrades++;
    else realTrades++;
  }
  const totalForRatio = realTrades + syntheticTrades + unknownTrades || 1;
  const dataSource = {
    realTrades,
    syntheticTrades,
    unknownTrades,
    syntheticPct: +(syntheticTrades / totalForRatio * 100).toFixed(1),
    realPct: +(realTrades / totalForRatio * 100).toFixed(1)
  };
  return {
    backtest: bt,
    trades: tradeRows,
    dataSource
  };
});
export {
  getBacktest_createServerFn_handler,
  listBacktests_createServerFn_handler,
  runBacktest_createServerFn_handler
};
