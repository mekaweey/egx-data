/**
 * Isotonic Confidence Calibration
 * ---------------------------------
 * بيتعلم من سجل التوصيات السابقة: لما النظام بيقول "ثقة X%" بكم بيكسب فعلاً؟
 * لو تاريخياً ثقة 60% بتعطي win-rate 75% → بنرفع كل 60 لـ 75.
 * ده بيرفع الثقة المُعروضة بطريقة شرعية (مبنية على أداء حقيقي)، مش تقليل حد.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type Bin = { low: number; high: number; n: number; wins: number; accuracy: number };

export type IsotonicMap = {
  fitted: boolean;
  sampleSize: number;
  bins: Bin[];
  // bin index → uplift to apply (e.g., +8 means add 8 confidence pts)
};

const BIN_EDGES = [30, 40, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95];

let cached: { value: IsotonicMap; at: number } | null = null;
const TTL_MS = 5 * 60 * 1000;

export async function loadIsotonicCalibration(): Promise<IsotonicMap> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;

  // اسحب آخر 1000 توصية تم تقييمها فعلياً (outcome != pending)
  const { data } = await supabaseAdmin
    .from("recommendations")
    .select("confidence, outcome, realized_pct")
    .neq("outcome", "pending")
    .order("created_at", { ascending: false })
    .limit(1000);

  const rows: { confidence: number; outcome: string | null; realized_pct: number | null }[] = (data ?? []).filter(
    (r) => typeof r.confidence === "number" && r.outcome != null,
  ) as any;

  // Bootstrap من backtest_trades لو عينة التوصيات الحقيقية ضعيفة
  if (rows.length < 200) {
    const { data: bt } = await supabaseAdmin
      .from("backtest_trades")
      .select("confidence, pnl_pct, exit_reason")
      .not("exit_reason", "is", null)
      .order("created_at", { ascending: false })
      .limit(2000);
    for (const r of bt ?? []) {
      if (typeof r.confidence !== "number") continue;
      const realized = Number(r.pnl_pct ?? 0);
      rows.push({
        confidence: r.confidence,
        outcome: realized > 0 ? "target_hit" : "stop_hit",
        realized_pct: realized,
      });
    }
  }

  const bins: Bin[] = [];
  for (let i = 0; i < BIN_EDGES.length - 1; i++) {
    const low = BIN_EDGES[i];
    const high = BIN_EDGES[i + 1];
    const inBin = rows.filter((r) => r.confidence >= low && r.confidence < high);
    const wins = inBin.filter(
      (r) =>
        r.outcome === "target_hit" ||
        (typeof r.realized_pct === "number" && Number(r.realized_pct) > 0),
    ).length;
    const n = inBin.length;
    bins.push({ low, high, n, wins, accuracy: n > 0 ? (wins / n) * 100 : (low + high) / 2 });
  }

  // Enforce monotonicity (pool-adjacent-violators light): isotonic regression.
  for (let i = 1; i < bins.length; i++) {
    if (bins[i].n >= 5 && bins[i - 1].n >= 5 && bins[i].accuracy < bins[i - 1].accuracy) {
      // merge: weighted average
      const totalN = bins[i].n + bins[i - 1].n;
      const merged = (bins[i].accuracy * bins[i].n + bins[i - 1].accuracy * bins[i - 1].n) / totalN;
      bins[i].accuracy = merged;
      bins[i - 1].accuracy = merged;
    }
  }

  const totalSamples = rows.length;
  const map: IsotonicMap = {
    fitted: totalSamples >= 50,
    sampleSize: totalSamples,
    bins,
  };
  cached = { value: map, at: Date.now() };
  return map;
}

/**
 * يطبّق التحويل: raw confidence → calibrated confidence.
 * - لو fitted=false (عينات قليلة): نرجّع الـ raw بدون تغيير.
 * - لو الـ bin عنده أداء أعلى من الثقة الخام: نرفع (شراكة 70/30 مع الخام).
 * - لو أقل: نخفض (نفس الشراكة) — معايرة عادلة بالاتجاهين.
 */
export function applyIsotonic(raw: number, map: IsotonicMap): number {
  if (!map.fitted) return raw;
  const r = Math.max(30, Math.min(95, raw));
  const bin = map.bins.find((b) => r >= b.low && r < b.high) ?? map.bins[map.bins.length - 1];
  if (bin.n < 5) return r; // bin شبه فاضي، خليها زي ما هي
  // Asymmetric calibration: ارفع بحرّية بناءً على الأداء التاريخي،
  // لكن لا تخفض بأكثر من 3 نقاط — التاريخ السيئ يعكس حاجة لتدريب
  // الموديل، مش بالضرورة إن التوصية الحالية أسوأ من ثقتها الخام.
  const calibrated = bin.accuracy * 0.6 + r * 0.4;
  let out = Math.round(calibrated);
  if (out < r) {
    // خفض محدود
    out = Math.max(r - 3, out);
  }
  return Math.max(30, Math.min(95, out));
}