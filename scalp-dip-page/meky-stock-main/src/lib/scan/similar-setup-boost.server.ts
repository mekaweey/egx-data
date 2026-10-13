/**
 * Similar Setup Boost
 * --------------------
 * بنبحث في التوصيات السابقة عن إعدادات (setups) مشابهة لمرشحنا الحالي:
 *   - نفس الإشارة (buy/strong_buy)
 *   - RSI ± 7 من القيمة الحالية
 *   - MACD histogram بنفس الاتجاه (موجب/سالب)
 * بعدين بنحسب الـ win-rate في هذه الإعدادات.
 *   - win-rate ≥ 65% و n ≥ 10 → +6 لـ +12 ثقة
 *   - win-rate ≤ 35% و n ≥ 10 → -8 ثقة
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type SimilarSetupResult = {
  sampleSize: number;
  winRate: number;
  confidenceDelta: number;
  label_ar: string;
};

const NEUTRAL: SimilarSetupResult = {
  sampleSize: 0,
  winRate: 0,
  confidenceDelta: 0,
  label_ar: "",
};

export async function similarSetupBoost(args: {
  signal: string;
  rsi: number | null | undefined;
  macdHist: number | null | undefined;
}): Promise<SimilarSetupResult> {
  if (!args.signal || (args.signal !== "buy" && args.signal !== "strong_buy")) return NEUTRAL;
  if (typeof args.rsi !== "number") return NEUTRAL;

  const macdDir = (args.macdHist ?? 0) >= 0 ? "pos" : "neg";
  // نافذة أوسع عشان نلاقي عينات كافية فعلاً (كان ±7 وما بيلاقيش حاجة)
  const rsiLow = Math.max(0, args.rsi - 12);
  const rsiHigh = Math.min(100, args.rsi + 12);

  // اسحب التوصيات السابقة بنفس الإشارة وتم تقييمها
  const { data } = await supabaseAdmin
    .from("recommendations")
    .select("outcome, realized_pct, raw_ai_response")
    .in("signal", ["buy", "strong_buy"])
    .neq("outcome", "pending")
    .order("created_at", { ascending: false })
    .limit(500);

  if (!data || data.length === 0) return NEUTRAL;

  // فلتر يدوي على RSI/MACD من raw_ai_response (مش عمود مباشر)
  const similar = data.filter((r) => {
    const raw = r.raw_ai_response as Record<string, unknown> | null;
    if (!raw) return false;
    // raw قد يحتوي top_factors أو indicators
    const rsi = extractNum(raw, ["rsi14", "rsi"]);
    const mh = extractNum(raw, ["macdHist", "macd_hist", "macd_histogram"]);
    if (rsi == null) return false;
    if (rsi < rsiLow || rsi > rsiHigh) return false;
    // فقط لو عندنا MACD على الجانبين نطابق الاتجاه، غير كده نتساهل
    if (mh != null && args.macdHist != null) {
      const dir = mh >= 0 ? "pos" : "neg";
      if (dir !== macdDir) return false;
    }
    return true;
  });

  // قللنا الحد الأدنى من 10 لـ 6 عشان يبدأ يدّي إشارة أبكر
  if (similar.length < 6) return { ...NEUTRAL, sampleSize: similar.length };

  const wins = similar.filter(
    (r) =>
      r.outcome === "target_hit" ||
      (typeof r.realized_pct === "number" && Number(r.realized_pct) > 0),
  ).length;
  const winRate = (wins / similar.length) * 100;

  let confidenceDelta = 0;
  let label_ar = "";
  if (winRate >= 65) {
    // كل 5% فوق 60 تساوي ~1 نقطة، بحد أقصى 12
    confidenceDelta = Math.min(12, Math.round((winRate - 60) / 2.5));
    label_ar = `إعدادات مشابهة نجحت ${winRate.toFixed(0)}% (${similar.length} حالة)`;
  } else if (winRate <= 35) {
    confidenceDelta = -8;
    label_ar = `إعدادات مشابهة فشلت تاريخياً (${winRate.toFixed(0)}%)`;
  } else {
    label_ar = `أداء تاريخي محايد (${winRate.toFixed(0)}%)`;
  }

  return { sampleSize: similar.length, winRate, confidenceDelta, label_ar };
}

function extractNum(obj: Record<string, unknown>, keys: string[]): number | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  // ابحث في الحقول المتداخلة
  for (const v of Object.values(obj)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const found = extractNum(v as Record<string, unknown>, keys);
      if (found != null) return found;
    }
  }
  return null;
}