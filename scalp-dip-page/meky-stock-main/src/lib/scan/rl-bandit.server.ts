import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Thompson Sampling multi-armed bandit — picks the best-performing
 * strategy variant (e.g. confidence-threshold buckets) by tracking
 * realized wins/losses per arm in the recommendations table.
 *
 * Each "arm" = a confidence bucket: [60-70), [70-80), [80-95].
 * The reward = realized_pct > 0.
 */
export type BanditArm = {
  bucket: string;
  wins: number;
  losses: number;
  totalReturn: number;
  posteriorMean: number;     // expected win prob
  sample: number;            // current Thompson draw
};

export type BanditResult = {
  arms: BanditArm[];
  bestArm: string | null;
  recommendedThreshold: number;
  label_ar: string;
};

function betaSample(alpha: number, beta: number): number {
  // Cheap Beta(alpha, beta) sampler via two Gammas → ratio.
  const sampleGamma = (shape: number): number => {
    if (shape < 1) return sampleGamma(shape + 1) * Math.pow(Math.random(), 1 / shape);
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    while (true) {
      let x: number, v: number;
      do { x = randomNormal(); v = 1 + c * x; } while (v <= 0);
      v = v * v * v;
      const u = Math.random();
      if (u < 1 - 0.0331 * Math.pow(x, 4)) return d * v;
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  };
  const x = sampleGamma(alpha);
  const y = sampleGamma(beta);
  return x / (x + y);
}

function randomNormal(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export async function runBandit(): Promise<BanditResult> {
  const { data } = await supabaseAdmin
    .from("recommendations")
    .select("confidence, realized_pct, outcome")
    .neq("outcome", "pending")
    .not("realized_pct", "is", null)
    .order("created_at", { ascending: false })
    .limit(500);

  const buckets: Record<string, { wins: number; losses: number; totalReturn: number }> = {
    "60-70": { wins: 0, losses: 0, totalReturn: 0 },
    "70-80": { wins: 0, losses: 0, totalReturn: 0 },
    "80-95": { wins: 0, losses: 0, totalReturn: 0 },
  };
  for (const r of data ?? []) {
    const c = Number(r.confidence);
    const ret = Number(r.realized_pct);
    if (!Number.isFinite(c) || !Number.isFinite(ret)) continue;
    const key = c < 70 ? "60-70" : c < 80 ? "70-80" : "80-95";
    if (ret > 0) buckets[key].wins++; else buckets[key].losses++;
    buckets[key].totalReturn += ret;
  }

  const arms: BanditArm[] = Object.entries(buckets).map(([bucket, b]) => {
    const n = b.wins + b.losses;
    const posteriorMean = n > 0 ? b.wins / n : 0.5;
    const sample = betaSample(b.wins + 1, b.losses + 1);
    return { bucket, wins: b.wins, losses: b.losses, totalReturn: +b.totalReturn.toFixed(2), posteriorMean: +posteriorMean.toFixed(3), sample: +sample.toFixed(3) };
  });

  const best = arms.reduce((a, b) => (b.sample > a.sample ? b : a), arms[0]);
  const recommendedThreshold = best?.bucket === "80-95" ? 80 : best?.bucket === "70-80" ? 70 : 60;
  const label_ar = best
    ? `أفضل عتبة ثقة بناءً على الأداء: ${recommendedThreshold}+ (نسبة الفوز ${(best.posteriorMean * 100).toFixed(0)}%)`
    : "بيانات غير كافية";
  return { arms, bestArm: best?.bucket ?? null, recommendedThreshold, label_ar };
}