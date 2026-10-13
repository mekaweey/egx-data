import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * A/B testing — compares two strategy variants (e.g. with/without meta-learner)
 * by hashing recommendation IDs into buckets and tracking realized returns.
 * Uses a two-proportion z-test for statistical significance.
 */
export type ABResult = {
  variantA: { name: string; n: number; winRate: number; avgReturn: number };
  variantB: { name: string; n: number; winRate: number; avgReturn: number };
  zScore: number;
  pValue: number;
  winner: "A" | "B" | "tie";
  significant: boolean;
  label_ar: string;
};

function bucketOf(uuid: string): "A" | "B" {
  // Simple deterministic split by first hex char
  const c = uuid.charCodeAt(0);
  return c % 2 === 0 ? "A" : "B";
}

function normalCdf(z: number): number {
  // Abramowitz & Stegun approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

export async function runABTest(): Promise<ABResult> {
  const { data } = await supabaseAdmin
    .from("recommendations")
    .select("id, realized_pct, outcome")
    .neq("outcome", "pending")
    .not("realized_pct", "is", null)
    .order("created_at", { ascending: false })
    .limit(500);

  const a = { wins: 0, n: 0, totalReturn: 0 };
  const b = { wins: 0, n: 0, totalReturn: 0 };
  for (const r of data ?? []) {
    const ret = Number(r.realized_pct);
    if (!Number.isFinite(ret)) continue;
    const bucket = bucketOf(String(r.id));
    const target = bucket === "A" ? a : b;
    target.n++;
    target.totalReturn += ret;
    if (ret > 0) target.wins++;
  }
  const pA = a.n > 0 ? a.wins / a.n : 0;
  const pB = b.n > 0 ? b.wins / b.n : 0;
  const pPool = (a.wins + b.wins) / Math.max(1, a.n + b.n);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / Math.max(1, a.n) + 1 / Math.max(1, b.n)));
  const zScore = se > 0 ? (pA - pB) / se : 0;
  const pValue = +(2 * (1 - normalCdf(Math.abs(zScore)))).toFixed(4);
  const significant = pValue < 0.05 && a.n >= 30 && b.n >= 30;
  const winner: "A" | "B" | "tie" =
    !significant ? "tie" : pA > pB ? "A" : "B";

  const label_ar = a.n + b.n < 30
    ? "اختبار A/B: بيانات غير كافية بعد"
    : significant
      ? `الفائز إحصائيًا: المتغير ${winner} (p=${pValue})`
      : `لا فرق إحصائي بين المتغيرات (p=${pValue})`;

  return {
    variantA: { name: "A", n: a.n, winRate: +(pA * 100).toFixed(1), avgReturn: a.n > 0 ? +(a.totalReturn / a.n).toFixed(2) : 0 },
    variantB: { name: "B", n: b.n, winRate: +(pB * 100).toFixed(1), avgReturn: b.n > 0 ? +(b.totalReturn / b.n).toFixed(2) : 0 },
    zScore: +zScore.toFixed(3),
    pValue,
    winner,
    significant,
    label_ar,
  };
}