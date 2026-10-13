import { EMA, RSI } from "technicalindicators";
import type { Candle } from "@/lib/market-data/types";

export type WeeklyContext = {
  weeks: number;
  rsi14_w: number | null;
  ema9_w: number | null;
  ema21_w: number | null;
  change_4w_pct: number | null;
  trend: "up" | "down" | "flat" | "unknown";
};

/**
 * Resample daily candles → weekly (ISO week, Mon-Fri grouped). Returns the
 * weekly close series + RSI/EMA on top of it. Used to confirm that short-term
 * buys also align with the higher-timeframe trend.
 */
export function computeWeeklyContext(daily: Candle[] | undefined): WeeklyContext {
  const empty: WeeklyContext = {
    weeks: 0,
    rsi14_w: null,
    ema9_w: null,
    ema21_w: null,
    change_4w_pct: null,
    trend: "unknown",
  };
  if (!daily || daily.length < 20) return empty;

  // Group by ISO year-week
  const byWeek = new Map<string, Candle[]>();
  for (const c of daily) {
    const d = new Date(c.date);
    const key = isoYearWeek(d);
    const arr = byWeek.get(key) ?? [];
    arr.push(c);
    byWeek.set(key, arr);
  }
  // Sort by week key ascending
  const keys = [...byWeek.keys()].sort();
  // Build weekly closes (last close of the week)
  const closes: number[] = [];
  for (const k of keys) {
    const week = byWeek.get(k)!;
    week.sort((a, b) => a.date.localeCompare(b.date));
    closes.push(week[week.length - 1].close);
  }
  if (closes.length < 6) return empty;

  const rsi = RSI.calculate({ period: 14, values: closes });
  const ema9 = EMA.calculate({ period: 9, values: closes });
  const ema21 = EMA.calculate({ period: 21, values: closes });

  const lastClose = closes[closes.length - 1];
  const fourWeeksAgo = closes[closes.length - 5] ?? closes[0];
  const change4w = fourWeeksAgo ? ((lastClose - fourWeeksAgo) / fourWeeksAgo) * 100 : null;

  const ema9Last = ema9[ema9.length - 1] ?? null;
  const ema21Last = ema21[ema21.length - 1] ?? null;

  let trend: WeeklyContext["trend"] = "flat";
  if (ema9Last != null && ema21Last != null) {
    if (ema9Last > ema21Last && lastClose > ema21Last) trend = "up";
    else if (ema9Last < ema21Last && lastClose < ema21Last) trend = "down";
  }

  return {
    weeks: closes.length,
    rsi14_w: rsi[rsi.length - 1] ?? null,
    ema9_w: ema9Last,
    ema21_w: ema21Last,
    change_4w_pct: change4w != null ? +change4w.toFixed(2) : null,
    trend,
  };
}

function isoYearWeek(d: Date): string {
  const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}