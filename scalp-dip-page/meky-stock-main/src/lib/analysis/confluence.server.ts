import type { Indicators } from "@/lib/analysis/indicators.server";
import type { WeeklyContext } from "@/lib/analysis/multi-timeframe.server";
import type { MarketSnapshot } from "@/lib/market-data/market-index.server";

export type ConfluenceReport = {
  score: number; // 0..100 — how aligned the timeframes are
  bullishVotes: number;
  bearishVotes: number;
  total: number;
  aligned: boolean; // true when ≥75% of votes agree
  conflict: boolean; // true when daily/weekly diverge sharply
  notes_ar: string[];
};

/**
 * Multi-timeframe confluence: daily (indicators), weekly (WeeklyContext),
 * and market regime (MarketSnapshot.trend). When all three agree on the
 * direction → boost confidence; when they conflict → demote.
 */
export function computeConfluence(
  ind: Indicators,
  weekly: WeeklyContext | null,
  market: MarketSnapshot | null,
): ConfluenceReport {
  const votes: Array<{ tf: string; dir: "bull" | "bear" | "flat" }> = [];
  const notes: string[] = [];

  // Daily — based on EMA9 vs EMA21 and RSI
  const ema9 = ind.ema9 ?? 0;
  const ema21 = ind.ema21 ?? 0;
  const rsi = ind.rsi14 ?? 50;
  if (ema9 > 0 && ema21 > 0) {
    if (ema9 > ema21 && rsi > 50) {
      votes.push({ tf: "daily", dir: "bull" });
      notes.push("اليومي: صاعد (EMA9>EMA21, RSI>50)");
    } else if (ema9 < ema21 && rsi < 50) {
      votes.push({ tf: "daily", dir: "bear" });
      notes.push("اليومي: هابط");
    } else {
      votes.push({ tf: "daily", dir: "flat" });
    }
  }

  // Weekly
  if (weekly && weekly.trend !== "unknown") {
    if (weekly.trend === "up") {
      votes.push({ tf: "weekly", dir: "bull" });
      notes.push("الأسبوعي: اتجاه صاعد");
    } else if (weekly.trend === "down") {
      votes.push({ tf: "weekly", dir: "bear" });
      notes.push("الأسبوعي: اتجاه هابط");
    } else {
      votes.push({ tf: "weekly", dir: "flat" });
    }
  }

  // Market regime
  if (market?.trend) {
    if (market.trend === "up") {
      votes.push({ tf: "market", dir: "bull" });
      notes.push("السوق العام: صاعد");
    } else if (market.trend === "down") {
      votes.push({ tf: "market", dir: "bear" });
      notes.push("السوق العام: هابط");
    } else {
      votes.push({ tf: "market", dir: "flat" });
    }
  }

  const bull = votes.filter((v) => v.dir === "bull").length;
  const bear = votes.filter((v) => v.dir === "bear").length;
  const total = votes.length;
  const dominant = Math.max(bull, bear);
  const score = total > 0 ? Math.round((dominant / total) * 100) : 50;
  const aligned = total >= 2 && dominant / total >= 0.75;
  const conflict = bull >= 1 && bear >= 1 && Math.abs(bull - bear) <= 0;

  return { score, bullishVotes: bull, bearishVotes: bear, total, aligned, conflict, notes_ar: notes };
}