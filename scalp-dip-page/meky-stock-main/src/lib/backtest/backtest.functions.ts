import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { detectRegime, type MarketRegime } from "@/lib/analysis/regime.server";
import type { Candle } from "@/lib/market-data/types";
import { computeMetrics, simulateSymbol, type SimulatedTrade } from "./engine.server";

const STRATEGY_VERSION = "v1-atr-regime";

export const runBacktest = createServerFn({ method: "POST" })
  .inputValidator((data: { minConfidence?: number; warmup?: number; maxHold?: number }) => ({
    minConfidence: Math.max(40, Math.min(90, data.minConfidence ?? 60)),
    warmup: Math.max(30, Math.min(60, data.warmup ?? 50)),
    maxHold: Math.max(2, Math.min(10, data.maxHold ?? 7)),
  }))
  .handler(async ({ data }) => {
    const { minConfidence, warmup, maxHold } = data;

    // 1) Pull every active symbol's full daily candle history we have.
    const { data: stocks, error: stockErr } = await supabaseAdmin
      .from("stocks")
      .select("symbol")
      .eq("is_active", true);
    if (stockErr || !stocks?.length) throw new Error(`no active stocks: ${stockErr?.message}`);

    // Paginate to bypass PostgREST default max-rows (1000). Order by symbol+date
    // for stable grouping. We may have ~15k–60k rows depending on backfill range.
    type Row = { symbol: string; date: string; open: number | string; high: number | string; low: number | string; close: number | string; volume: number | string };
    const PAGE = 1000;
    const allRows: Row[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data: page, error: candleErr } = await supabaseAdmin
        .from("daily_candles")
        .select("symbol, date, open, high, low, close, volume")
        .order("symbol", { ascending: true })
        .order("date", { ascending: true })
        .range(from, from + PAGE - 1);
      if (candleErr) throw new Error(`candles fetch failed: ${candleErr.message}`);
      if (!page || page.length === 0) break;
      allRows.push(...(page as Row[]));
      if (page.length < PAGE) break;
    }

    const bySymbol = new Map<string, Candle[]>();
    for (const r of allRows) {
      const arr = bySymbol.get(r.symbol) ?? [];
      arr.push({
        date: r.date,
        open: Number(r.open),
        high: Number(r.high),
        low: Number(r.low),
        close: Number(r.close),
        volume: Number(r.volume),
      });
      bySymbol.set(r.symbol, arr);
    }
    // Ensure each symbol's candles are chronologically sorted before indicator math.
    for (const arr of bySymbol.values()) {
      arr.sort((a, b) => a.date.localeCompare(b.date));
    }

    // 2) Build market regime by date from EGX30 snapshots' average per day.
    // We don't have EGX30 OHLC in DB; approximate regime per date by aggregating
    // every stock close that day into an "average market" candle.
    const dates = new Set<string>();
    for (const arr of bySymbol.values()) for (const c of arr) dates.add(c.date);
    const sortedDates = [...dates].sort();

    // Build per-symbol date->candle index so the market aggregator is O(N) not O(N²).
    const indexBySymbol = new Map<string, Map<string, Candle>>();
    for (const [sym, arr] of bySymbol) {
      const m = new Map<string, Candle>();
      for (const c of arr) m.set(c.date, c);
      indexBySymbol.set(sym, m);
    }
    const marketCandles: Candle[] = sortedDates.map((d) => {
      let oSum = 0, hSum = 0, lSum = 0, cSum = 0, n = 0;
      let vol = 0;
      for (const m of indexBySymbol.values()) {
        const c = m.get(d);
        if (c) {
          oSum += c.open; hSum += c.high; lSum += c.low; cSum += c.close; vol += c.volume; n++;
        }
      }
      const k = Math.max(1, n);
      return { date: d, open: oSum / k, high: hSum / k, low: lSum / k, close: cSum / k, volume: vol };
    });

    // Rolling regime: at each date use the candles up to that date.
    const regimeByDate = new Map<string, MarketRegime>();
    for (let i = warmup; i < marketCandles.length; i++) {
      const slice = marketCandles.slice(Math.max(0, i - 60), i + 1);
      regimeByDate.set(marketCandles[i].date, detectRegime(slice));
    }

    // 3) Create backtest row.
    const fromDate = sortedDates[Math.min(warmup, sortedDates.length - 1)] ?? new Date().toISOString().slice(0, 10);
    const toDate = sortedDates[sortedDates.length - 1] ?? fromDate;
    const { data: btRow, error: btErr } = await supabaseAdmin
      .from("backtests")
      .insert({
        status: "running",
        from_date: fromDate,
        to_date: toDate,
        min_confidence: minConfidence,
        strategy_version: STRATEGY_VERSION,
        symbols_count: bySymbol.size,
      })
      .select("id")
      .single();
    if (btErr || !btRow) throw new Error(`backtest insert failed: ${btErr?.message}`);
    const backtestId = btRow.id;

    // 4) Simulate every symbol.
    const allTrades: SimulatedTrade[] = [];
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
        maxHold,
      });
      allTrades.push(...t);
    }

    // 5) Persist trades (chunked) and metrics.
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
        market_regime: t.marketRegime,
      }));
      const CHUNK = 500;
      for (let i = 0; i < rows.length; i += CHUNK) {
        await supabaseAdmin.from("backtest_trades").insert(rows.slice(i, i + CHUNK));
      }
    }

    const m = computeMetrics(allTrades);
    await supabaseAdmin
      .from("backtests")
      .update({
        status: "completed",
        finished_at: new Date().toISOString(),
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
        avg_days_held: m.avgDaysHeld,
      })
      .eq("id", backtestId);

    return {
      backtestId,
      metrics: m,
      tradesCount: allTrades.length,
      diagnostics: {
        candlesLoaded: allRows.length,
        symbolsWithCandles: bySymbol.size,
        simulatedSymbols,
        skippedShortHistory,
        dateRange: { from: fromDate, to: toDate },
      },
    };
  });

export const listBacktests = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await supabaseAdmin
    .from("backtests")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(20);
  return data ?? [];
});

export const getBacktest = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { data: bt } = await supabaseAdmin
      .from("backtests")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!bt) return null;
    const { data: trades } = await supabaseAdmin
      .from("backtest_trades")
      .select("*")
      .eq("backtest_id", data.id)
      .order("entry_date", { ascending: true })
      .limit(2000);
    const tradeRows = trades ?? [];

    // Data-source audit: for each symbol that produced trades, find the most
    // recent successful provider in data_source_logs. Synthetic candles are
    // generated locally and don't reflect real EGX behavior — the user needs
    // to know what fraction of the results came from real data.
    const symbols = Array.from(new Set(tradeRows.map((t) => t.symbol)));
    const sourceBySymbol = new Map<string, string>();
    if (symbols.length) {
      const { data: logs } = await supabaseAdmin
        .from("data_source_logs")
        .select("symbol, provider, ts")
        .eq("ok", true)
        .in("symbol", symbols)
        .order("ts", { ascending: false })
        .limit(5000);
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
      syntheticPct: +((syntheticTrades / totalForRatio) * 100).toFixed(1),
      realPct: +((realTrades / totalForRatio) * 100).toFixed(1),
    };
    return { backtest: bt, trades: tradeRows, dataSource };
  });