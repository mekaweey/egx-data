/**
 * Auto-Tuning Confidence Threshold
 * ----------------------------------
 * كل أسبوع نحلّل آخر 200 توصية تم تقييمها:
 *   - لكل threshold محتمل (55..80) نحسب win-rate و عدد التوصيات.
 *   - الـ threshold الأمثل = أعلى threshold يدّي win-rate ≥ 60% مع ≥ 15 توصية.
 *   - لو مفيش، fallback لـ 70.
 * النتيجة بتتخزن في model_state[auto_threshold_v1].
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const KEY = "auto_threshold_v1";
const DEFAULT_THRESHOLD = 70;
const FALLBACK_THRESHOLD = 55;

export type AutoThreshold = {
  gold: number;
  silver: number;
  fittedAt: string;
  sampleSize: number;
  bestWinRate: number;
};

let cache: { value: AutoThreshold; at: number } | null = null;
const TTL = 10 * 60 * 1000;

export async function loadAutoThreshold(): Promise<AutoThreshold> {
  if (cache && Date.now() - cache.at < TTL) return cache.value;
  const { data } = await supabaseAdmin
    .from("model_state")
    .select("data")
    .eq("key", KEY)
    .maybeSingle();

  const v: AutoThreshold = (data?.data as AutoThreshold) ?? {
    gold: DEFAULT_THRESHOLD,
    silver: FALLBACK_THRESHOLD,
    fittedAt: new Date(0).toISOString(),
    sampleSize: 0,
    bestWinRate: 0,
  };
  cache = { value: v, at: Date.now() };
  return v;
}

export async function recomputeAutoThreshold(): Promise<AutoThreshold> {
  const { data } = await supabaseAdmin
    .from("recommendations")
    .select("confidence, outcome, realized_pct")
    .neq("outcome", "pending")
    .in("signal", ["buy", "strong_buy"])
    .order("created_at", { ascending: false })
    .limit(500);

  const rows: { confidence: number; outcome: string | null; realized_pct: number | null }[] = (data ?? []).filter(
    (r) => typeof r.confidence === "number" && r.outcome,
  ) as any;

  // Bootstrap من backtest_trades لما تكون عينة التوصيات الحقيقية صغيرة
  if (rows.length < 100) {
    const { data: bt } = await supabaseAdmin
      .from("backtest_trades")
      .select("confidence, pnl_pct, signal, exit_reason")
      .not("exit_reason", "is", null)
      .in("signal", ["buy", "strong_buy"])
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

  let bestT = DEFAULT_THRESHOLD;
  let bestWr = 0;
  for (let t = 55; t <= 80; t += 1) {
    const subset = rows.filter((r) => r.confidence >= t);
    if (subset.length < 15) continue;
    const wins = subset.filter(
      (r) =>
        r.outcome === "target_hit" ||
        (typeof r.realized_pct === "number" && Number(r.realized_pct) > 0),
    ).length;
    const wr = (wins / subset.length) * 100;
    if (wr >= 60 && t >= bestT) {
      bestT = t;
      bestWr = wr;
    } else if (wr > bestWr) {
      bestWr = wr;
    }
  }

  // silver = gold - 10 (لكن لا يقل عن 50)
  const silver = Math.max(50, bestT - 10);
  const value: AutoThreshold = {
    gold: bestT,
    silver,
    fittedAt: new Date().toISOString(),
    sampleSize: rows.length,
    bestWinRate: +bestWr.toFixed(1),
  };

  await supabaseAdmin.from("model_state").upsert({
    key: KEY,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: value as any,
    updated_at: new Date().toISOString(),
  });
  cache = { value, at: Date.now() };
  return value;
}