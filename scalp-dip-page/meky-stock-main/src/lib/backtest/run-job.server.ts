import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { detectRegime, type MarketRegime } from "@/lib/analysis/regime.server";
import type { Candle } from "@/lib/market-data/types";
import { computeMetrics, simulateSymbol, type SimulatedTrade } from "@/lib/backtest/engine.server";
import { withSupabaseRetry } from "@/lib/supabase/retry.server";

export interface BacktestJobParams {
  minConfidence?: number;
  warmup?: number;
  maxHold?: number;
  requireNews?: boolean;
  newsLookbackDays?: number;
  /** Limit candles to those on/after this date (YYYY-MM-DD). Lets you run on a recent window. */
  fromDateFilter?: string;
  /** When provided, skip creating a new backtest row and reuse this id. */
  backtestId?: string;
  /** If set, simulate only these symbols (subset of active stocks). */
  symbols?: string[];
  /** init: create row + return symbol list, no simulation. */
  init?: boolean;
  /** finalize: compute metrics from already-inserted trades and mark completed. */
  finalize?: boolean;
}

export async function runBacktestJob(params: BacktestJobParams = {}) {
  const minConfidence = Math.max(40, Math.min(95, Number(params.minConfidence) || 75));
  const warmup = Math.max(30, Math.min(60, Number(params.warmup) || 50));
  const maxHold = Math.max(2, Math.min(10, Number(params.maxHold) || 7));
  const requireNews = params.requireNews === true;
  const newsLookbackDays = Math.max(1, Math.min(14, Number(params.newsLookbackDays) || 3));
  const fromDateFilter = typeof params.fromDateFilter === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.fromDateFilter) ? params.fromDateFilter : null;

  // ---------- FINALIZE MODE ----------
  if (params.finalize && params.backtestId) {
    return await finalizeBacktest(params.backtestId);
  }

  // Survivorship-bias fix: include ALL stocks ever traded (delisted too).
  // Candle availability is the real filter — symbols with no candles are
  // skipped naturally in the simulation loop.
  const { data: stocks } = await withSupabaseRetry("load all stocks", () =>
    supabaseAdmin.from("stocks").select("symbol"),
  );
  if (!stocks?.length) return { ok: false as const, error: "no stocks" };

  // ---------- INIT MODE ----------
  if (params.init) {
    // Need fromDate/toDate for the row. Cheap: query min/max date.
    const minQ = supabaseAdmin.from("daily_candles").select("date").order("date", { ascending: true }).limit(1);
    const { data: minRow } = await withSupabaseRetry("min date", () =>
      fromDateFilter ? minQ.gte("date", fromDateFilter).maybeSingle() : minQ.maybeSingle(),
    );
    const { data: maxRow } = await withSupabaseRetry("max date", () =>
      supabaseAdmin.from("daily_candles").select("date").order("date", { ascending: false }).limit(1).maybeSingle(),
    );
    const fromDate = (minRow as { date?: string } | null)?.date ?? new Date().toISOString().slice(0, 10);
    const toDate = (maxRow as { date?: string } | null)?.date ?? fromDate;
    // Precompute & cache market regime for the window so chunks can reuse it (zero CPU impact in chunks).
    let regimesCached = 0;
    try {
      regimesCached = await precomputeMarketRegimes(fromDate, toDate, warmup);
    } catch (e) {
      console.warn("[backtest:init] regime precompute failed", e);
    }
    const { data: btRow } = await withSupabaseRetry("create backtest", () =>
      supabaseAdmin
        .from("backtests")
        .insert({
          status: "running",
          from_date: fromDate,
          to_date: toDate,
          min_confidence: minConfidence,
          strategy_version: requireNews ? "v2-trending-only+news-gate" : "v2-trending-only",
          symbols_count: stocks.length,
        })
        .select("id")
        .single(),
    );
    return { ok: true as const, mode: "init", backtestId: btRow!.id, symbols: stocks.map((s) => s.symbol), regimesCached };
  }

  // ---------- CHUNK MODE (or full run if no symbols filter) ----------
  const symbolFilter = params.symbols && params.symbols.length > 0 ? new Set(params.symbols) : null;
  const targetStocks = symbolFilter ? stocks.filter((s) => symbolFilter.has(s.symbol)) : stocks;

  type Row = { symbol: string; date: string; open: number | string; high: number | string; low: number | string; close: number | string; volume: number | string };
  const allRows: Row[] = [];
  const PAGE = 1000;
  // In chunk mode (symbolFilter set), only load candles for the requested symbols.
  const symbolsToLoad = symbolFilter ? [...symbolFilter] : null;
  for (let from = 0; ; from += PAGE) {
    const q = supabaseAdmin
      .from("daily_candles")
      .select("symbol, date, open, high, low, close, volume")
      .order("symbol", { ascending: true })
      .order("date", { ascending: true })
      .range(from, from + PAGE - 1);
    const { data: page } = await withSupabaseRetry(`load candles page ${from}`, () => {
      let qq = q;
      if (symbolsToLoad) qq = qq.in("symbol", symbolsToLoad);
      if (fromDateFilter) qq = qq.gte("date", fromDateFilter);
      return qq;
    });
    if (!page || page.length === 0) break;
    allRows.push(...(page as Row[]));
    if (page.length < PAGE) break;
  }

  const bySymbol = new Map<string, Candle[]>();
  for (const r of allRows) {
    const arr = bySymbol.get(r.symbol) ?? [];
    arr.push({ date: r.date, open: +r.open, high: +r.high, low: +r.low, close: +r.close, volume: +r.volume });
    bySymbol.set(r.symbol, arr);
  }
  for (const arr of bySymbol.values()) arr.sort((a, b) => a.date.localeCompare(b.date));

  const dates = new Set<string>();
  for (const arr of bySymbol.values()) for (const c of arr) dates.add(c.date);
  const sortedDates = [...dates].sort();
  const indexBySymbol = new Map<string, Map<string, Candle>>();
  for (const [sym, arr] of bySymbol) {
    const m = new Map<string, Candle>();
    for (const c of arr) m.set(c.date, c);
    indexBySymbol.set(sym, m);
  }
  const regimeByDate = new Map<string, MarketRegime>();
  // In chunk mode, load precomputed regimes from market_regimes (cached during init).
  if (symbolFilter) {
    const { data: regRows } = await withSupabaseRetry("load market_regimes", () =>
      supabaseAdmin
        .from("market_regimes")
        .select("date, regime")
        .gte("date", sortedDates[0] ?? "1970-01-01")
        .lte("date", sortedDates[sortedDates.length - 1] ?? "1970-01-01"),
    );
    for (const r of (regRows as { date: string; regime: string }[] | null) ?? []) {
      regimeByDate.set(r.date, r.regime as unknown as MarketRegime);
    }
  } else {
    const marketCandles: Candle[] = sortedDates.map((d) => {
      let oSum = 0, hSum = 0, lSum = 0, cSum = 0, n = 0;
      let vol = 0;
      for (const m of indexBySymbol.values()) {
        const c = m.get(d);
        if (c) { oSum += c.open; hSum += c.high; lSum += c.low; cSum += c.close; vol += c.volume; n++; }
      }
      const k = Math.max(1, n);
      return { date: d, open: oSum / k, high: hSum / k, low: lSum / k, close: cSum / k, volume: vol };
    });
    for (let i = warmup; i < marketCandles.length; i++) {
      regimeByDate.set(marketCandles[i].date, detectRegime(marketCandles.slice(Math.max(0, i - 60), i + 1)));
    }
  }

  const fromDate = sortedDates[Math.min(warmup, sortedDates.length - 1)] ?? new Date().toISOString().slice(0, 10);
  const toDate = sortedDates[sortedDates.length - 1] ?? fromDate;
  let backtestId: string;
  if (params.backtestId) {
    backtestId = params.backtestId;
  } else {
    const { data: btRow } = await withSupabaseRetry("create backtest", () =>
      supabaseAdmin
        .from("backtests")
        .insert({
          status: "running",
          from_date: fromDate,
          to_date: toDate,
          min_confidence: minConfidence,
          strategy_version: requireNews ? "v2-trending-only+news-gate" : "v2-trending-only",
          symbols_count: bySymbol.size,
        })
        .select("id")
        .single(),
    );
    backtestId = btRow!.id;
  }

  // Preload news dates per symbol when news gate is enabled.
  const newsDatesBySymbol = new Map<string, Set<string>>();
  if (requireNews) {
    const NPAGE = 1000;
    for (let from = 0; ; from += NPAGE) {
      const q = supabaseAdmin
        .from("news_sentiment")
        .select("symbol, published_at")
        .gte("published_at", fromDate)
        .order("published_at", { ascending: true })
        .range(from, from + NPAGE - 1);
      const { data: page } = await withSupabaseRetry(`load news page ${from}`, () =>
        symbolsToLoad ? q.in("symbol", symbolsToLoad) : q,
      );
      if (!page || page.length === 0) break;
      for (const r of page as { symbol: string; published_at: string }[]) {
        if (!r.published_at) continue;
        const d = r.published_at.slice(0, 10);
        const s = newsDatesBySymbol.get(r.symbol) ?? new Set<string>();
        s.add(d);
        newsDatesBySymbol.set(r.symbol, s);
      }
      if (page.length < NPAGE) break;
    }
  }

  const allTrades: SimulatedTrade[] = [];
  for (const s of targetStocks) {
    const candles = bySymbol.get(s.symbol);
    if (!candles || candles.length < warmup + 3) continue;
    const t = simulateSymbol({
      symbol: s.symbol,
      candles,
      marketRegimeByDate: regimeByDate,
      minConfidence, warmup, maxHold,
      requireNews,
      newsLookbackDays,
      newsDatesBySymbol,
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
      market_regime: t.marketRegime,
    }));
    const CHUNK = 500;
    for (let i = 0; i < rows.length; i += CHUNK) {
      await withSupabaseRetry(`insert backtest trades ${i}`, () =>
        supabaseAdmin.from("backtest_trades").insert(rows.slice(i, i + CHUNK)),
      );
    }
  }

  // In chunked mode, skip metrics — caller will run finalize separately.
  if (params.backtestId) {
    return { ok: true as const, mode: "chunk", backtestId, tradesInserted: allTrades.length };
  }

  const m = computeMetrics(allTrades);
  await withSupabaseRetry("complete backtest", () =>
    supabaseAdmin.from("backtests").update({
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
    }).eq("id", backtestId),
  );

  return { ok: true as const, backtestId, metrics: m };
}

async function finalizeBacktest(backtestId: string) {
  // Load all trades for this backtest (paginate).
  type TradeRow = {
    symbol: string; signal_date: string; entry_date: string | null; entry_price: number | null;
    exit_date: string | null; exit_price: number | null; exit_reason: string;
    pnl_pct: number | null; r_multiple: number | null; days_held: number | null;
    confidence: number | null; signal: string | null;
    stop_loss: number | null; target: number | null; atr: number | null; market_regime: string | null;
  };
  const rows: TradeRow[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data: page } = await withSupabaseRetry(`load trades ${from}`, () =>
      supabaseAdmin
        .from("backtest_trades")
        .select("symbol, signal_date, entry_date, entry_price, exit_date, exit_price, exit_reason, pnl_pct, r_multiple, days_held, confidence, signal, stop_loss, target, atr, market_regime")
        .eq("backtest_id", backtestId)
        .range(from, from + PAGE - 1),
    );
    if (!page || page.length === 0) break;
    rows.push(...(page as TradeRow[]));
    if (page.length < PAGE) break;
  }
  const trades: SimulatedTrade[] = rows.map((r) => ({
    symbol: r.symbol,
    signalDate: r.signal_date,
    entryDate: r.entry_date ?? r.signal_date,
    entryPrice: Number(r.entry_price ?? 0),
    exitDate: r.exit_date,
    exitPrice: r.exit_price === null ? null : Number(r.exit_price),
    exitReason: r.exit_reason as SimulatedTrade["exitReason"],
    pnlPct: r.pnl_pct === null ? null : Number(r.pnl_pct),
    rMultiple: r.r_multiple === null ? null : Number(r.r_multiple),
    daysHeld: r.days_held ?? 0,
    confidence: Number(r.confidence ?? 0),
    signal: (r.signal ?? "buy") as SimulatedTrade["signal"],
    stopLoss: Number(r.stop_loss ?? 0),
    target: Number(r.target ?? 0),
    atr: Number(r.atr ?? 0),
    marketRegime: (r.market_regime ?? "neutral") as SimulatedTrade["marketRegime"],
  }));
  const m = computeMetrics(trades);
  await withSupabaseRetry("complete backtest", () =>
    supabaseAdmin.from("backtests").update({
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
    }).eq("id", backtestId),
  );
  return { ok: true as const, mode: "finalize", backtestId, metrics: m };
}

/**
 * Build market regimes from daily_candles aggregate (mean OHLC across active symbols)
 * for the date window and upsert into public.market_regimes. Idempotent.
 */
async function precomputeMarketRegimes(fromDate: string, toDate: string, warmup: number): Promise<number> {
  type Row = { date: string; open: number | string; high: number | string; low: number | string; close: number | string; volume: number | string };
  const rows: Row[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data: page } = await withSupabaseRetry(`load candles for regime ${from}`, () =>
      supabaseAdmin
        .from("daily_candles")
        .select("date, open, high, low, close, volume")
        .gte("date", fromDate)
        .lte("date", toDate)
        .order("date", { ascending: true })
        .range(from, from + PAGE - 1),
    );
    if (!page || page.length === 0) break;
    rows.push(...(page as Row[]));
    if (page.length < PAGE) break;
  }
  if (rows.length === 0) return 0;
  // Aggregate per date.
  const agg = new Map<string, { o: number; h: number; l: number; c: number; v: number; n: number }>();
  for (const r of rows) {
    const a = agg.get(r.date) ?? { o: 0, h: 0, l: 0, c: 0, v: 0, n: 0 };
    a.o += +r.open; a.h += +r.high; a.l += +r.low; a.c += +r.close; a.v += +r.volume; a.n++;
    agg.set(r.date, a);
  }
  const sortedDates = [...agg.keys()].sort();
  const marketCandles: Candle[] = sortedDates.map((d) => {
    const a = agg.get(d)!;
    const k = Math.max(1, a.n);
    return { date: d, open: a.o / k, high: a.h / k, low: a.l / k, close: a.c / k, volume: a.v };
  });
  const upserts: { date: string; regime: string }[] = [];
  for (let i = warmup; i < marketCandles.length; i++) {
    const regime = detectRegime(marketCandles.slice(Math.max(0, i - 60), i + 1));
    upserts.push({ date: marketCandles[i].date, regime: regime as unknown as string });
  }
  const CHUNK = 500;
  for (let i = 0; i < upserts.length; i += CHUNK) {
    await withSupabaseRetry(`upsert market_regimes ${i}`, () =>
      supabaseAdmin.from("market_regimes").upsert(upserts.slice(i, i + CHUNK), { onConflict: "date" }),
    );
  }
  return upserts.length;
}