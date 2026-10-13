import { c as computeIndicators, a as canonicalLevels } from "./levels.server-DPpGzyqT.mjs";
import { d as decide } from "./strategy.server-BM-ZfGqV.mjs";
import { e as estimateSlippage } from "./tier-i-intelligence.server-Ddugl3s6.mjs";
const ROUND_TRIP_COST_PCT = 0;
const EARLY_EXIT_DAY = 2;
function simulateSymbol(args) {
  const { symbol, candles, marketRegimeByDate, minConfidence } = args;
  const requireNews = args.requireNews === true;
  const newsLookback = Math.max(1, args.newsLookbackDays ?? 3);
  const symbolNewsDates = requireNews ? args.newsDatesBySymbol?.get(symbol) ?? /* @__PURE__ */ new Set() : null;
  const warmup = args.warmup ?? 50;
  const maxHold = args.maxHold ?? 6;
  const cooldown = args.cooldown ?? 2;
  const trades = [];
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
    if (requireNews && symbolNewsDates) {
      const sigMs = Date.parse(sigDate);
      let hasNews = false;
      for (let k = 0; k <= newsLookback; k++) {
        const d = new Date(sigMs - k * 864e5).toISOString().slice(0, 10);
        if (symbolNewsDates.has(d)) {
          hasNews = true;
          break;
        }
      }
      if (!hasNews) continue;
    }
    const regime = marketRegimeByDate.get(sigDate) ?? {
      regime: "unknown",
      slope_pct: null
    };
    const decision = decide(ind, regime);
    if (decision.signal !== "buy" && decision.signal !== "strong_buy" || decision.confidence < minConfidence) {
      continue;
    }
    const entryBar = candles[i + 1];
    const entryPrice = entryBar.open;
    if (ind.close > 0 && entryPrice > ind.close * 1.025) continue;
    if (entryPrice < 2) continue;
    if (ind.atr14 != null && ind.atr14 / entryPrice < 0.012) continue;
    const levels = canonicalLevels(ind, { priceOverride: entryPrice });
    const stop = levels.stopLoss;
    const target = levels.target;
    if (stop >= entryPrice || target <= entryPrice) continue;
    if (levels.rrRatio < 1.5) continue;
    let trailingStop = stop;
    let movedToBreakeven = false;
    let peak = entryPrice;
    const last20 = candles.slice(Math.max(0, i - 19), i + 1);
    const avgDailyValue = last20.length > 0 ? last20.reduce((a, b) => a + b.close * b.volume, 0) / last20.length : 0;
    const atrPctEntry = ind.atr14 != null && entryPrice > 0 ? ind.atr14 / entryPrice : 0.02;
    const slippagePct = estimateSlippage({
      orderValue: 5e4,
      avgDailyValue,
      atrPct: atrPctEntry
    }) * 100;
    let exitDate = null;
    let exitPrice = null;
    let exitReason = "open";
    let daysHeld = null;
    let exitIdx = -1;
    const maxJ = Math.min(candles.length - 1, i + 1 + maxHold);
    for (let j = i + 1; j <= maxJ; j++) {
      const bar = candles[j];
      if (bar.low <= trailingStop) {
        exitPrice = bar.open < trailingStop ? bar.open : trailingStop;
        exitDate = bar.date.slice(0, 10);
        exitReason = movedToBreakeven && exitPrice >= entryPrice ? "breakeven" : "stop_hit";
        daysHeld = j - (i + 1);
        exitIdx = j;
        break;
      }
      if (bar.high >= target) {
        exitPrice = bar.open > target ? bar.open : target;
        exitDate = bar.date.slice(0, 10);
        exitReason = "target_hit";
        daysHeld = j - (i + 1);
        exitIdx = j;
        break;
      }
      if (bar.high >= entryPrice * 1.05) {
        if (bar.high > peak) peak = bar.high;
        const ts = peak * 0.97;
        if (ts > trailingStop) {
          trailingStop = ts;
          if (trailingStop >= entryPrice) movedToBreakeven = true;
        }
      }
      const dayIdx = j - (i + 1);
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
    const grossPct = exitPrice != null ? (exitPrice - entryPrice) / entryPrice * 100 : null;
    const pnlPct = grossPct != null ? +(grossPct - ROUND_TRIP_COST_PCT - slippagePct * 2).toFixed(2) : null;
    const risk = entryPrice - stop;
    const costInPrice = entryPrice * ((ROUND_TRIP_COST_PCT + slippagePct * 2) / 100);
    const rMultiple = exitPrice != null && risk > 0 ? +((exitPrice - entryPrice - costInPrice) / risk).toFixed(2) : null;
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
      signal: decision.signal,
      confidence: decision.confidence,
      stopLoss: stop,
      target,
      atr: ind.atr14 != null ? +ind.atr14.toFixed(4) : null,
      marketRegime: regime.regime
    });
    if (exitIdx > 0) nextEligibleIdx = exitIdx + cooldown;
    else nextEligibleIdx = i + 1 + cooldown;
  }
  return trades;
}
function computeMetrics(trades) {
  const closed = trades.filter((t) => t.pnlPct != null);
  const isScratch = (p) => Math.abs(p) < 0.1;
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
  const expectancy = closed.length ? +(closed.reduce((s, t) => s + (t.pnlPct ?? 0), 0) / closed.length).toFixed(2) : 0;
  const PER_TRADE_EXPOSURE = 0.1;
  let equity = 1;
  let peak = 1;
  let maxDD = 0;
  const returns = [];
  const ordered = [...closed].sort((a, b) => a.entryDate.localeCompare(b.entryDate));
  for (const t of ordered) {
    const r = t.pnlPct ?? 0;
    equity = equity * (1 + r / 100 * PER_TRADE_EXPOSURE);
    returns.push(r);
    if (equity > peak) peak = equity;
    const dd = peak > 0 ? (peak - equity) / peak * 100 : 0;
    if (dd > maxDD) maxDD = dd;
  }
  const totalReturnPct = (equity - 1) * 100;
  const mean = returns.length ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const variance = returns.length ? returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length : 0;
  const std = Math.sqrt(variance);
  const sharpe = std > 0 ? +(mean / std).toFixed(2) : 0;
  const best = closed.length ? Math.max(...closed.map((t) => t.pnlPct ?? 0)) : 0;
  const worst = closed.length ? Math.min(...closed.map((t) => t.pnlPct ?? 0)) : 0;
  const avgDays = closed.length ? +(closed.reduce((s, t) => s + (t.daysHeld ?? 0), 0) / closed.length).toFixed(1) : 0;
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
    avgDaysHeld: avgDays
  };
}
export {
  computeMetrics as c,
  simulateSymbol as s
};
