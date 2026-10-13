import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Model drift detection.
 *
 * Compares the recent (last 14 days) win rate of closed recommendations
 * against the long-term baseline (90 days). If recent performance has
 * collapsed by more than 15 percentage points → flag drift.
 *
 * Used by the scanner to add a warning and lower all confidences,
 * and by the dashboard to surface a "نموذج يحتاج مراجعة" banner.
 */

export type DriftReport = {
  recentWinRate: number;
  baselineWinRate: number;
  delta: number;
  drift: "none" | "mild" | "severe";
  confidencePenalty: number; // applied to every pick when severe
  label_ar: string;
  recentN: number;
  baselineN: number;
};

async function winRate(daysBack: number): Promise<{ rate: number; n: number }> {
  const since = new Date(Date.now() - daysBack * 86_400_000).toISOString();
  const { data } = await supabaseAdmin
    .from("recommendations")
    .select("outcome, realized_pct, outcome_at")
    .in("outcome", ["target_hit", "stop_hit", "expired"])
    .in("signal", ["buy", "strong_buy"])
    .gte("outcome_at", since)
    .limit(2000);
  const rows = data ?? [];
  if (rows.length === 0) return { rate: 0, n: 0 };
  const wins = rows.filter(
    (r) => r.outcome === "target_hit" || (r.realized_pct != null && Number(r.realized_pct) > 0),
  ).length;
  return { rate: +(wins / rows.length).toFixed(3), n: rows.length };
}

export async function detectDrift(): Promise<DriftReport> {
  const [recent, baseline] = await Promise.all([winRate(14), winRate(90)]);

  // Need both windows to compare meaningfully
  if (recent.n < 10 || baseline.n < 30) {
    return {
      recentWinRate: recent.rate,
      baselineWinRate: baseline.rate,
      delta: 0,
      drift: "none",
      confidencePenalty: 0,
      label_ar: "بيانات غير كافية لقياس الانحراف",
      recentN: recent.n,
      baselineN: baseline.n,
    };
  }

  const delta = +((recent.rate - baseline.rate) * 100).toFixed(1);
  if (delta <= -15) {
    return {
      recentWinRate: recent.rate,
      baselineWinRate: baseline.rate,
      delta,
      drift: "severe",
      confidencePenalty: 10,
      label_ar: `انحراف خطير في النموذج (${delta}%) — تخفيض الثقة بـ 10 نقاط لكل توصية`,
      recentN: recent.n,
      baselineN: baseline.n,
    };
  }
  if (delta <= -7) {
    return {
      recentWinRate: recent.rate,
      baselineWinRate: baseline.rate,
      delta,
      drift: "mild",
      confidencePenalty: 4,
      label_ar: `انحراف طفيف في النموذج (${delta}%)`,
      recentN: recent.n,
      baselineN: baseline.n,
    };
  }
  return {
    recentWinRate: recent.rate,
    baselineWinRate: baseline.rate,
    delta,
    drift: "none",
    confidencePenalty: 0,
    label_ar: `الأداء مستقر (${delta >= 0 ? "+" : ""}${delta}%)`,
    recentN: recent.n,
    baselineN: baseline.n,
  };
}
