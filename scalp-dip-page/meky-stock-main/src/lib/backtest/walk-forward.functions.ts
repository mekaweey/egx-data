import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { computeIndicators } from "@/lib/analysis/indicators.server";
import { detectRegime, type MarketRegime } from "@/lib/analysis/regime.server";
import type { Candle } from "@/lib/market-data/types";
import { decide } from "./strategy.server";

/**
 * Walk-forward "daily prediction" simulator.
 *
 * For each trading day D in the requested window:
 *   1. Use ONLY candles[..D] (no look-ahead) to compute indicators per symbol.
 *   2. Apply the same strategy.decide() as the live engine.
 *   3. Rank all buy / strong_buy candidates by confidence and take top N.
 *   4. Compare against the ACTUAL next-day return (close/open).
 *   5. A day is "correct" if the top pick closed up on the next session.
 *
 * Returns aggregated accuracy + persists per-day rows for inspection.
 */
export const runWalkForward = createServerFn({ method: "POST" })
  .inputValidator((d: { days?: number; minConfidence?: number; picksPerDay?: number }) => ({
    days: Math.max(30, Math.min(400, d.days ?? 365)),
    minConfidence: Math.max(40, Math.min(90, d.minConfidence ?? 85)),
    picksPerDay: Math.max(1, Math.min(10, d.picksPerDay ?? 3)),
  }))
  .handler(async ({ data }) => {
    const { days, minConfidence, picksPerDay } = data;

    // Load active symbols + all candles (paginated).
    const { data: stocks, error: stockErr } = await supabaseAdmin
      .from("stocks").select("symbol").eq("is_active", true);
    if (stockErr || !stocks?.length) throw new Error(`no stocks: ${stockErr?.message}`);

    type Row = { symbol: string; date: string; open: number; high: number; low: number; close: number; volume: number };
    const PAGE = 1000;
    const allRows: Row[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data: page, error } = await supabaseAdmin
        .from("daily_candles")
        .select("symbol, date, open, high, low, close, volume")
        .order("symbol", { ascending: true })
        .order("date", { ascending: true })
        .range(from, from + PAGE - 1);
      if (error) throw new Error(`candles: ${error.message}`);
      if (!page?.length) break;
      allRows.push(...(page as unknown as Row[]));
      if (page.length < PAGE) break;
    }

    const bySymbol = new Map<string, Candle[]>();
    for (const r of allRows) {
      const arr = bySymbol.get(r.symbol) ?? [];
      arr.push({
        date: r.date,
        open: Number(r.open), high: Number(r.high), low: Number(r.low),
        close: Number(r.close), volume: Number(r.volume),
      });
      bySymbol.set(r.symbol, arr);
    }
    for (const arr of bySymbol.values()) arr.sort((a, b) => a.date.localeCompare(b.date));

    // Build sorted list of all trading dates.
    const dateSet = new Set<string>();
    for (const arr of bySymbol.values()) for (const c of arr) dateSet.add(c.date.slice(0, 10));
    const sortedDates = [...dateSet].sort();
    if (sortedDates.length < 60) throw new Error("not enough history");

    // Restrict to last `days` trading days, but keep enough headroom for warmup.
    const WARMUP = 50;
    const startIdx = Math.max(WARMUP, sortedDates.length - days - 1);
    const endIdx = sortedDates.length - 2; // need a "next" day to score
    const windowDates = sortedDates.slice(startIdx, endIdx + 1);

    // Per-symbol date->index for O(1) slicing.
    const idxBySymbol = new Map<string, Map<string, number>>();
    for (const [sym, arr] of bySymbol) {
      const m = new Map<string, number>();
      arr.forEach((c, i) => m.set(c.date.slice(0, 10), i));
      idxBySymbol.set(sym, m);
    }

    // Market regime: aggregate market candle per date, then rolling regime.
    const marketCandles: Candle[] = sortedDates.map((d) => {
      let o = 0, h = 0, l = 0, c = 0, n = 0, v = 0;
      for (const [sym, arr] of bySymbol) {
        const i = idxBySymbol.get(sym)!.get(d);
        if (i != null) {
          const k = arr[i];
          o += k.open; h += k.high; l += k.low; c += k.close; v += k.volume; n++;
        }
      }
      const k = Math.max(1, n);
      return { date: d, open: o / k, high: h / k, low: l / k, close: c / k, volume: v };
    });
    const regimeByDate = new Map<string, MarketRegime>();
    for (let i = WARMUP; i < marketCandles.length; i++) {
      regimeByDate.set(marketCandles[i].date.slice(0, 10),
        detectRegime(marketCandles.slice(Math.max(0, i - 60), i + 1)));
    }

    // Create run row.
    const fromDate = windowDates[0];
    const toDate = windowDates[windowDates.length - 1];
    const { data: runRow, error: runErr } = await supabaseAdmin
      .from("walk_forward_runs")
      .insert({
        status: "running", from_date: fromDate, to_date: toDate,
        min_confidence: minConfidence, picks_per_day: picksPerDay,
      })
      .select("id").single();
    if (runErr || !runRow) throw new Error(`run insert: ${runErr?.message}`);
    const runId = runRow.id;

    // Walk forward day-by-day.
    let correctDays = 0;
    let wrongDays = 0;
    let noPickDays = 0;
    let sumTopReturn = 0;
    let scoredDays = 0;
    let topWins = 0;
    type DayRow = {
      run_id: string;
      prediction_date: string;
      next_trading_date: string | null;
      picks: Array<{ symbol: string; confidence: number; signal: string; return_pct: number }>;
      top_pick_symbol: string | null;
      top_pick_confidence?: number | null;
      top_pick_return_pct?: number | null;
      avg_picks_return_pct?: number | null;
      was_correct: boolean | null;
      market_regime: string | null;
    };
    const dayRows: DayRow[] = [];

    for (const date of windowDates) {
      const nextDate = sortedDates[sortedDates.indexOf(date) + 1];
      if (!nextDate) continue;
      const regime = regimeByDate.get(date) ?? {
        regime: "unknown" as const, adx: null, slope_pct: null, bb_width_pct: null, description_ar: "",
      };

      // Collect candidates.
      const candidates: Array<{ symbol: string; confidence: number; signal: string; entryOpen: number; nextClose: number }> = [];
      for (const [sym, arr] of bySymbol) {
        const idxMap = idxBySymbol.get(sym)!;
        const iToday = idxMap.get(date);
        const iNext = idxMap.get(nextDate);
        if (iToday == null || iNext == null || iToday < WARMUP) continue;
        let ind;
        try { ind = computeIndicators(arr.slice(0, iToday + 1)); } catch { continue; }
        const dec = decide(ind, regime);
        if ((dec.signal !== "buy" && dec.signal !== "strong_buy") || dec.confidence < minConfidence) continue;
        candidates.push({
          symbol: sym, confidence: dec.confidence, signal: dec.signal,
          entryOpen: arr[iNext].open, nextClose: arr[iNext].close,
        });
      }

      if (!candidates.length) {
        noPickDays++;
        dayRows.push({
          run_id: runId, prediction_date: date, next_trading_date: nextDate,
          picks: [], top_pick_symbol: null, was_correct: null,
          market_regime: regime.regime,
        });
        continue;
      }

      candidates.sort((a, b) => b.confidence - a.confidence);
      const top = candidates.slice(0, picksPerDay);
      const picksWithReturn = top.map((p) => ({
        symbol: p.symbol,
        confidence: p.confidence,
        signal: p.signal,
        return_pct: +(((p.nextClose - p.entryOpen) / p.entryOpen) * 100).toFixed(2),
      }));
      const topPick = picksWithReturn[0];
      const wasCorrect = topPick.return_pct > 0;
      const avgRet = +(picksWithReturn.reduce((s, p) => s + p.return_pct, 0) / picksWithReturn.length).toFixed(2);

      if (wasCorrect) { correctDays++; topWins++; } else { wrongDays++; }
      sumTopReturn += topPick.return_pct;
      scoredDays++;

      dayRows.push({
        run_id: runId, prediction_date: date, next_trading_date: nextDate,
        picks: picksWithReturn,
        top_pick_symbol: topPick.symbol,
        top_pick_confidence: topPick.confidence,
        top_pick_return_pct: topPick.return_pct,
        avg_picks_return_pct: avgRet,
        was_correct: wasCorrect,
        market_regime: regime.regime,
      });
    }

    // Persist day rows in chunks.
    const CHUNK = 500;
    for (let i = 0; i < dayRows.length; i += CHUNK) {
      await supabaseAdmin.from("walk_forward_days").insert(dayRows.slice(i, i + CHUNK));
    }

    const accuracy = scoredDays ? +((correctDays / scoredDays) * 100).toFixed(2) : 0;
    const avgRet = scoredDays ? +(sumTopReturn / scoredDays).toFixed(3) : 0;
    const topPickWR = scoredDays ? +((topWins / scoredDays) * 100).toFixed(2) : 0;

    await supabaseAdmin.from("walk_forward_runs").update({
      status: "completed",
      finished_at: new Date().toISOString(),
      total_days: windowDates.length,
      correct_days: correctDays,
      wrong_days: wrongDays,
      no_pick_days: noPickDays,
      accuracy_pct: accuracy,
      avg_next_day_return_pct: avgRet,
      top_pick_win_rate: topPickWR,
    }).eq("id", runId);

    return {
      runId,
      windowDays: windowDates.length,
      scoredDays,
      correctDays,
      wrongDays,
      noPickDays,
      accuracyPct: accuracy,
      avgNextDayReturnPct: avgRet,
      topPickWinRate: topPickWR,
      fromDate, toDate,
    };
  });

export const listWalkForwardRuns = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await supabaseAdmin
    .from("walk_forward_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(20);
  return data ?? [];
});