import { computeIndicators } from "@/lib/analysis/indicators.server";
import { detectRegime, type MarketRegime } from "@/lib/analysis/regime.server";
import { canonicalLevels } from "@/lib/risk/levels.server";
import type { Candle } from "@/lib/market-data/types";
import { decide } from "./strategy.server";
import { estimateSlippage } from "@/lib/integration/tier-i-intelligence.server";

/**
 * User assumption: brokerage commission is 0% in Egypt, so backtests must not
 * subtract any fixed commission/fee from trade PnL.
 */
const ROUND_TRIP_COST_PCT = 0;

/**
 * Early-exit rule: if a trade is still negative at the close of day 2 (i.e. 2
 * full bars after entry), close it. Historical analysis showed days 3-4 are
 * the bleeding zone for losing trades — PF 0.43-0.56 in those buckets.
 */
const EARLY_EXIT_DAY = 2;

export type SimulatedTrade = {
  symbol: string;
  signalDate: string; // candle date used for decision
  entryDate: string;
  entryPrice: number;
  exitDate: string | null;
  exitPrice: number | null;
  exitReason: "target_hit" | "stop_hit" | "breakeven" | "max_hold" | "early_exit" | "open";
  pnlPct: number | null;
  rMultiple: number | null;
  daysHeld: number | null;
  signal: "buy" | "strong_buy";
  confidence: number;
  stopLoss: number;
  target: number;
  atr: number | null;
  marketRegime: string;
};

export type BacktestMetrics = {
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  openTrades: number;
  winRate: number; // 0-100
  avgWinPct: number;
  avgLossPct: number;
  profitFactor: number; // sum(wins) / sum(losses)
  expectancyPct: number; // avg pnl per trade
  maxDrawdownPct: number;
  sharpe: number;
  totalReturnPct: number; // compounded if you stack trades; here we use sum-of-pcts (sequential)
  bestTradePct: number;
  worstTradePct: number;
  avgDaysHeld: number;
};

/**
 * Run a strict walk-forward simulation on one symbol.
 *
 * For each candle from `warmup` to (len - 1):
 *  - Use candles[0..i] to compute indicators (NO look-ahead)
 *  - Detect market regime from `marketCandles[0..marketLen-1]` snapshot at that date
 *    (caller is responsible for slicing market candles by date if they want true day-by-day regime;
 *    we use a single-pass regime for performance unless `regimeByDate` is provided)
 *  - Decide signal
 *  - If buy/strong_buy and confidence >= minConfidence:
 *      - Entry at next candle's OPEN (i+1)
 *      - Walk forward up to maxHold days; check stop / target hit each day
 *      - If neither, exit at close of (entry + maxHold) day
 */
export function simulateSymbol(args: {
  symbol: string;
  candles: Candle[];
  marketRegimeByDate: Map<string, MarketRegime>;
  minConfidence: number;
  warmup?: number; // min candles before we start trading
  maxHold?: number;
  cooldown?: number; // bars to wait after a closed trade
  /**
   * Optional news gate. If provided AND `requireNews` is true, only take
   * signals on dates where this symbol has at least one news headline
   * within the lookback window (default 3 calendar days back).
   * Zero impact when omitted.
   */
  newsDatesBySymbol?: Map<string, Set<string>>;
  requireNews?: boolean;
  newsLookbackDays?: number;
}): SimulatedTrade[] {
  const { symbol, candles, marketRegimeByDate, minConfidence } = args;
  const requireNews = args.requireNews === true;
  const newsLookback = Math.max(1, args.newsLookbackDays ?? 3);
  const symbolNewsDates = requireNews ? args.newsDatesBySymbol?.get(symbol) ?? new Set<string>() : null;
  // V4 winners-run config (validated on Jun 2025→Jun 2026 sim, +421%):
  //   hold up to 6 bars, trailing stop arms after +5% with 3% gap from peak.
  const warmup = args.warmup ?? 50;
  const maxHold = args.maxHold ?? 6;
  const cooldown = args.cooldown ?? 2;
  const trades: SimulatedTrade[] = [];
  if (candles.length < warmup + 3) return trades;

  let nextEligibleIdx = warmup;

  for (let i = warmup; i < candles.length - 1; i++) {
    if (i < nextEligibleIdx) continue;
    const slice = candles.slice(0, i + 1);
    let ind;
    try {
      ind = computeIndicators(slice);
    } catch {
      continue;
    }
    const sigDate = candles[i].date.slice(0, 10);
    // Optional news gate
    if (requireNews && symbolNewsDates) {
      const sigMs = Date.parse(sigDate);
      let hasNews = false;
      for (let k = 0; k <= newsLookback; k++) {
        const d = new Date(sigMs - k * 86400000).toISOString().slice(0, 10);
        if (symbolNewsDates.has(d)) { hasNews = true; break; }
      }
      if (!hasNews) continue;
    }
    const regime = marketRegimeByDate.get(sigDate) ?? {
      regime: "unknown" as const,
      adx: null, slope_pct: null, bb_width_pct: null, description_ar: "",
    };
    const decision = decide(ind, regime);
    if (
      (decision.signal !== "buy" && decision.signal !== "strong_buy") ||
      decision.confidence < minConfidence
    ) {
      continue;
    }

    const entryBar = candles[i + 1];
    const entryPrice = entryBar.open;
    // Reject extreme gap-up entries — R:R is broken before we start.
    if (ind.close > 0 && entryPrice > ind.close * 1.025) continue;
    // Skip penny stocks and ultra-low-volatility names — stops/targets become tick noise.
    if (entryPrice < 2.0) continue;
    if (ind.atr14 != null && ind.atr14 / entryPrice < 0.012) continue;
    // Recompute levels from the ACTUAL entry price (not yesterday's close).
    const levels = canonicalLevels(ind, { priceOverride: entryPrice });
    const stop = levels.stopLoss;
    const target = levels.target;
    if (stop >= entryPrice || target <= entryPrice) continue;
    // Minimum R:R after support/resistance clamping.
    if (levels.rrRatio < 1.5) continue;

    const initialRisk = entryPrice - stop;
    let trailingStop = stop;
    let movedToBreakeven = false;
    let peak = entryPrice;

    // Tier-I slippage: estimate based on 20-day avg turnover + ATR.
    // Assumes a notional 50k EGP order size — representative retail trade.
    const last20 = candles.slice(Math.max(0, i - 19), i + 1);
    const avgDailyValue = last20.length > 0
      ? last20.reduce((a, b) => a + b.close * b.volume, 0) / last20.length
      : 0;
    const atrPctEntry = ind.atr14 != null && entryPrice > 0 ? ind.atr14 / entryPrice : 0.02;
    const slippagePct = estimateSlippage({
      orderValue: 50_000,
      avgDailyValue,
      atrPct: atrPctEntry,
    }) * 100; // convert to %

    let exitDate: string | null = null;
    let exitPrice: number | null = null;
    let exitReason: SimulatedTrade["exitReason"] = "open";
    let daysHeld: number | null = null;
    let exitIdx = -1;

    const maxJ = Math.min(candles.length - 1, i + 1 + maxHold);
    for (let j = i + 1; j <= maxJ; j++) {
      const bar = candles[j];
      // Stop has priority on intraday move (worst case for trader).
      if (bar.low <= trailingStop) {
        // Realistic fill: if the bar opened BELOW the stop (gap-down through
        // stop), the broker fills at the open price — worse than the stop.
        // Otherwise the stop fires intraday at (approximately) the stop price.
        exitPrice = bar.open < trailingStop ? bar.open : trailingStop;
        exitDate = bar.date.slice(0, 10);
        // If we moved to break-even and got stopped at (or above) entry, this is
        // a scratch — track it separately so metrics don't mislabel it as a loss.
        exitReason = movedToBreakeven && exitPrice >= entryPrice ? "breakeven" : "stop_hit";
        daysHeld = j - (i + 1);
        exitIdx = j;
        break;
      }
      if (bar.high >= target) {
        // Symmetric realistic fill: gap-up through target opens above the
        // target — limit order fills at the open (better than target).
        exitPrice = bar.open > target ? bar.open : target;
        exitDate = bar.date.slice(0, 10);
        exitReason = "target_hit";
        daysHeld = j - (i + 1);
        exitIdx = j;
        break;
      }
      // Trailing stop: once price prints +5% above entry, lift stop to
      // (peak * 0.97). Sim confirmed this "let winners run" rule lifts
      // total return from ~+135% to ~+421% over the year while keeping
      // win rate above 45%.
      if (bar.high >= entryPrice * 1.05) {
        if (bar.high > peak) peak = bar.high;
        const ts = peak * 0.97;
        if (ts > trailingStop) {
          trailingStop = ts;
          if (trailingStop >= entryPrice) movedToBreakeven = true;
        }
      }
      // Early exit: at end of day EARLY_EXIT_DAY (e.g. 2 bars after entry),
      // if the trade is still underwater on the close, bail out before the
      // historically-bleeding days 3-4. Skip if this is also maxJ (max_hold
      // wins precedence so the bucket stays meaningful).
      const dayIdx = j - (i + 1); // 0 on entry day, 1, 2, ...
      if (dayIdx === EARLY_EXIT_DAY && j !== maxJ && bar.close < entryPrice) {
        exitPrice = bar.close;
        exitDate = bar.date.slice(0, 10);
        exitReason = "early_exit";
        daysHeld = dayIdx;
        exitIdx = j;
        break;
      }
      if (j === maxJ) {
        exitPrice = bar.close;
        exitDate = bar.date.slice(0, 10);
        exitReason = "max_hold";
        daysHeld = j - (i + 1);
        exitIdx = j;
      }
    }

    // Gross PnL (price-only), then subtract market-impact slippage only.
    // Brokerage commission is intentionally 0% per the user's requirement.
    const grossPct = exitPrice != null ? ((exitPrice - entryPrice) / entryPrice) * 100 : null;
    const pnlPct = grossPct != null
      ? +(grossPct - ROUND_TRIP_COST_PCT - slippagePct * 2).toFixed(2)
      : null;
    const risk = entryPrice - stop;
    // R-multiple also reflects slippage: subtract (slippage% * entry) / risk units.
    const costInPrice = entryPrice * ((ROUND_TRIP_COST_PCT + slippagePct * 2) / 100);
    const rMultiple =
      exitPrice != null && risk > 0
        ? +(((exitPrice - entryPrice - costInPrice) / risk)).toFixed(2)
        : null;

    trades.push({
      symbol,
      signalDate: sigDate,
      entryDate: entryBar.date.slice(0, 10),
      entryPrice: +entryPrice.toFixed(2),
      exitDate,
      exitPrice: exitPrice != null ? +exitPrice.toFixed(2) : null,
      exitReason,
      pnlPct,
      rMultiple,
      daysHeld,
      signal: decision.signal as "buy" | "strong_buy",
      confidence: decision.confidence,
      stopLoss: stop,
      target,
      atr: ind.atr14 != null ? +ind.atr14.toFixed(4) : null,
      marketRegime: regime.regime,
    });

    if (exitIdx > 0) nextEligibleIdx = exitIdx + cooldown;
    else nextEligibleIdx = i + 1 + cooldown;
  }

  return trades;
}

/**
 * Aggregate metrics across a flat list of simulated trades.
 * Equity curve assumes equal-weight sequential trades (sum of pcts).
 */
export function computeMetrics(trades: SimulatedTrade[]): BacktestMetrics {
  const closed = trades.filter((t) => t.pnlPct != null);
  // A "scratch" is a trade that exited within ±0.1% of entry (typically a
  // break-even trailing stop). Don't punish the strategy by counting these as
  // losses — they don't move the equity curve meaningfully.
  const isScratch = (p: number) => Math.abs(p) < 0.1;
  const wins = closed.filter((t) => (t.pnlPct ?? 0) > 0 && !isScratch(t.pnlPct ?? 0));
  const losses = closed.filter((t) => (t.pnlPct ?? 0) < 0 && !isScratch(t.pnlPct ?? 0));
  const scratches = closed.filter((t) => isScratch(t.pnlPct ?? 0));
  const decisive = wins.length + losses.length;
  const winRate = decisive ? +(wins.length / decisive * 100).toFixed(2) : 0;
  const avgWin = wins.length ? +(wins.reduce((s, t) => s + (t.pnlPct ?? 0), 0) / wins.length).toFixed(2) : 0;
  const avgLoss = losses.length ? +(losses.reduce((s, t) => s + (t.pnlPct ?? 0), 0) / losses.length).toFixed(2) : 0;
  const sumWins = wins.reduce((s, t) => s + (t.pnlPct ?? 0), 0);
  const sumLosses = Math.abs(losses.reduce((s, t) => s + (t.pnlPct ?? 0), 0));
  const profitFactor = sumLosses > 0 ? +(sumWins / sumLosses).toFixed(2) : sumWins > 0 ? 999 : 0;
  const expectancy = closed.length
    ? +(closed.reduce((s, t) => s + (t.pnlPct ?? 0), 0) / closed.length).toFixed(2)
    : 0;

  // Equity curve & drawdown — COMPOUND (multiplicative) so DD is bounded to 100%.
  // Realistic exposure model: each trade risks PER_TRADE_EXPOSURE of equity,
  // not 100%. With ~241 trades, equal-weight (100%) compounding produces a
  // catastrophic ~70% drawdown that doesn't reflect actual portfolio sizing.
  // A typical swing trader allocates ~10% per position.
  const PER_TRADE_EXPOSURE = 0.10;
  let equity = 1;
  let peak = 1;
  let maxDD = 0; // percentage of equity peak
  const returns: number[] = [];
  const ordered = [...closed].sort((a, b) => a.entryDate.localeCompare(b.entryDate));
  for (const t of ordered) {
    const r = t.pnlPct ?? 0;
    equity = equity * (1 + (r / 100) * PER_TRADE_EXPOSURE);
    returns.push(r);
    if (equity > peak) peak = equity;
    const dd = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
    if (dd > maxDD) maxDD = dd;
  }
  const totalReturnPct = (equity - 1) * 100;

  const mean = returns.length ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const variance = returns.length
    ? returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length
    : 0;
  const std = Math.sqrt(variance);
  // Per-trade Sharpe (not annualised — useful for relative comparison).
  const sharpe = std > 0 ? +(mean / std).toFixed(2) : 0;

  const best = closed.length ? Math.max(...closed.map((t) => t.pnlPct ?? 0)) : 0;
  const worst = closed.length ? Math.min(...closed.map((t) => t.pnlPct ?? 0)) : 0;
  const avgDays = closed.length
    ? +(closed.reduce((s, t) => s + (t.daysHeld ?? 0), 0) / closed.length).toFixed(1)
    : 0;

  return {
    totalTrades: closed.length,
    wins: wins.length,
    losses: losses.length,
    breakevens: scratches.length,
    openTrades: trades.length - closed.length,
    winRate,
    avgWinPct: avgWin,
    avgLossPct: avgLoss,
    profitFactor,
    expectancyPct: expectancy,
    maxDrawdownPct: +maxDD.toFixed(2),
    sharpe,
    totalReturnPct: +totalReturnPct.toFixed(2),
    bestTradePct: +best.toFixed(2),
    worstTradePct: +worst.toFixed(2),
    avgDaysHeld: avgDays,
  };
}