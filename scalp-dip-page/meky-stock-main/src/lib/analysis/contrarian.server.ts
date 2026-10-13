import type { StockNews } from "@/lib/market-data/news.server";
import type { Indicators } from "./indicators.server";

/**
 * Contrarian indicator — when every signal screams "buy" simultaneously,
 * markets often reverse. We apply a small confidence haircut to extreme
 * over-consensus setups (RSI > 78 + euphoric news + ensemble unanimous).
 */
export type ContrarianResult = {
  triggered: boolean;
  confidenceDelta: number;
  reason_ar: string | null;
};

export function detectContrarian(args: {
  ind: Indicators;
  news: StockNews | null;
  ensembleAgreement: number | null;
  changePct5d?: number;
}): ContrarianResult {
  let flags = 0;
  const reasons: string[] = [];
  if (args.ind.rsi14 != null && args.ind.rsi14 > 78) { flags++; reasons.push(`RSI متطرف ${args.ind.rsi14.toFixed(0)}`); }
  if (args.news?.sentiment_score != null && args.news.sentiment_score > 0.8) { flags++; reasons.push("أخبار إيجابية بشكل مفرط"); }
  if (args.ensembleAgreement != null && args.ensembleAgreement >= 95) { flags++; reasons.push("إجماع نموذجي 100%"); }
  if (args.changePct5d != null && args.changePct5d > 15) { flags++; reasons.push(`ارتفاع +${args.changePct5d.toFixed(1)}% في 5 أيام`); }

  if (flags >= 3) {
    return { triggered: true, confidenceDelta: -7, reason_ar: `إشارة عكسية: ${reasons.join(" • ")}` };
  }
  if (flags >= 2) {
    return { triggered: true, confidenceDelta: -3, reason_ar: `حذر — تشبع: ${reasons.join(" • ")}` };
  }
  return { triggered: false, confidenceDelta: 0, reason_ar: null };
}
