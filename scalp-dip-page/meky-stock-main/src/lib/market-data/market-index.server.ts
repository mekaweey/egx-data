import { yahooProvider } from "./yahoo.server";
import { RSI, EMA } from "technicalindicators";
import { detectRegime, type MarketRegime } from "@/lib/analysis/regime.server";
import { fetchEgxSnapshots } from "./tradingview.server";
import { computeMarketBreadth } from "./breadth.server";
import type { Candle } from "./types";

export type MarketSnapshot = {
  index_symbol: string;
  date: string; // YYYY-MM-DD
  close: number;
  change_pct: number;
  change_5d_pct: number;
  rsi14: number | null;
  ema20: number | null;
  trend: "up" | "down" | "flat";
  regime: MarketRegime["regime"];
  regime_description_ar: string;
  /** % of sharia stocks trading above their own SMA-50 (null if unavailable). */
  breadth_pct_above_sma50: number | null;
};

/**
 * Fetches EGX30 (^CASE30) daily candles and computes a simple trend snapshot.
 * Used as a market-regime filter for individual stock recommendations.
 */
export async function fetchMarketSnapshot(): Promise<MarketSnapshot | null> {
  try {
    // Try Yahoo first (gives us full candle history for regime detection).
    let candles: Candle[] = [];
    try {
      candles = await yahooProvider.fetchOHLCV("^CASE30", 90);
    } catch {
      candles = [];
    }

    // Yahoo blocks Cloudflare Worker IPs frequently. Fallback: TradingView
    // scanner gives us at least the current EGX30 close + change so we can
    // still derive a trend signal even without full history.
    if (candles.length < 25) {
      const tv = await fetchEgxSnapshots(["EGX30"]).catch(() => new Map());
      const snap = tv.get("EGX30");
      if (!snap) return null;
      const trend: "up" | "down" | "flat" =
        snap.change_pct > 0.3 ? "up" : snap.change_pct < -0.3 ? "down" : "flat";
      const breadth = await computeMarketBreadth().catch(() => null);
      return {
        index_symbol: "EGX30",
        date: new Date().toISOString().slice(0, 10),
        close: snap.close,
        change_pct: +snap.change_pct.toFixed(2),
        change_5d_pct: 0,
        rsi14: snap.rsi14,
        ema20: snap.ema21 ?? null,
        trend,
        regime: "unknown",
        regime_description_ar: "بيانات محدودة من المؤشر — تحليل تقريبي.",
        breadth_pct_above_sma50: breadth,
      };
    }

    const close = candles.map((c) => c.close);
    const last = close[close.length - 1];
    const prev = close[close.length - 2] ?? last;
    const fiveAgo = close[close.length - 6] ?? last;
    const rsiArr = RSI.calculate({ period: 14, values: close });
    const emaArr = EMA.calculate({ period: 20, values: close });
    const rsi14 = rsiArr[rsiArr.length - 1] ?? null;
    const ema20 = emaArr[emaArr.length - 1] ?? null;
    const change_pct = prev ? ((last - prev) / prev) * 100 : 0;
    const change_5d_pct = fiveAgo ? ((last - fiveAgo) / fiveAgo) * 100 : 0;

    let trend: "up" | "down" | "flat" = "flat";
    const aboveEma = ema20 != null && last > ema20;
    if (aboveEma && change_5d_pct > 0.5) trend = "up";
    else if (!aboveEma && change_5d_pct < -0.5) trend = "down";

    const regime = detectRegime(candles);
    const breadth = await computeMarketBreadth().catch(() => null);

    return {
      index_symbol: "EGX30",
      date: candles[candles.length - 1].date.slice(0, 10),
      close: last,
      change_pct: +change_pct.toFixed(2),
      change_5d_pct: +change_5d_pct.toFixed(2),
      rsi14: rsi14 != null ? +rsi14.toFixed(2) : null,
      ema20: ema20 != null ? +ema20.toFixed(2) : null,
      trend,
      regime: regime.regime,
      regime_description_ar: regime.description_ar,
      breadth_pct_above_sma50: breadth,
    };
  } catch {
    return null;
  }
}