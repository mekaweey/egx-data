import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { MetaWeights } from "@/lib/analysis/meta-learner.server";
import type { MarketRegime } from "@/lib/analysis/regime-detection.server";
import { windowStartISO } from "@/lib/analysis/training-window.server";

/**
 * Regime-Specific Meta-Learner.
 *
 * Trains separate logistic-regression weights for each market regime
 * (bull / bear / neutral / volatile). Picks the regime-matched model
 * at scan-time, falling back to a global default when there is not
 * enough per-regime history.
 *
 * Fully automatic — runs as part of the scan pipeline.
 */

const DEFAULT: MetaWeights = {
  w: [0.25, 0.15, 0.2, 0.15, 0.25],
  b: 0,
  fitted: false,
  sampleSize: 0,
  accuracy: 0,
};

const MIN_SAMPLES = 40;

function sigmoid(z: number) {
  return 1 / (1 + Math.exp(-z));
}

function regimeBucket(r: MarketRegime): "bull" | "bear" | "neutral" | "volatile" {
  if (r === "bull_trending") return "bull";
  if (r === "bear_trending") return "bear";
  if (r === "high_volatility") return "volatile";
  return "neutral";
}

function trendBucket(trend: string | null | undefined): "bull" | "bear" | "neutral" {
  if (trend === "up") return "bull";
  if (trend === "down") return "bear";
  return "neutral";
}

function trainOn(rows: Array<{ x: number[]; y: number }>): MetaWeights {
  if (rows.length < MIN_SAMPLES) return DEFAULT;
  let w = [...DEFAULT.w];
  let b = 0;
  const lr = 0.05;
  const epochs = 200;
  for (let e = 0; e < epochs; e++) {
    for (const r of rows) {
      const z = r.x.reduce((s, v, k) => s + v * w[k], b);
      const err = sigmoid(z) - r.y;
      for (let k = 0; k < 5; k++) w[k] -= lr * err * r.x[k];
      b -= lr * err;
    }
  }
  const sumPos = w.reduce((s, v) => s + Math.max(0, v), 0) || 1;
  const wNorm = w.map((v) => +(Math.max(0, v) / sumPos).toFixed(4)) as MetaWeights["w"];
  let correct = 0;
  for (const r of rows) {
    const z = r.x.reduce((s, v, k) => s + v * w[k], b);
    if ((sigmoid(z) >= 0.5 ? 1 : 0) === r.y) correct++;
  }
  return {
    w: wNorm,
    b: +b.toFixed(4),
    fitted: true,
    sampleSize: rows.length,
    accuracy: +(correct / rows.length).toFixed(3),
  };
}

export async function trainRegimeSpecificMeta(
  activeRegime: MarketRegime,
): Promise<{ active: MetaWeights; bucket: string; perRegime: Record<string, MetaWeights> }> {
  // Pull recs joined with market regime via recommendations.market_regime if present,
  // otherwise fall back to scans.created_at → recent market_snapshots trend bucket.
  const { data } = await supabaseAdmin
    .from("recommendations")
    .select(
      "technical_score, fundamental_score, sentiment_score, macro_score, sector_score, outcome, realized_pct, market_trend",
    )
    .in("outcome", ["target_hit", "stop_hit", "expired"])
    .in("signal", ["buy", "strong_buy"])
    .gte("created_at", windowStartISO())
    .limit(5000);

  const buckets: Record<string, Array<{ x: number[]; y: number }>> = {
    bull: [], bear: [], neutral: [], volatile: [],
  };

  for (const r of data ?? []) {
    if (r.technical_score == null || r.sentiment_score == null || r.macro_score == null || r.sector_score == null) continue;
    const b = trendBucket(r.market_trend);
    buckets[b].push({
      x: [
        Number(r.technical_score) / 100,
        Number(r.fundamental_score ?? r.technical_score) / 100,
        Number(r.sentiment_score) / 100,
        Number(r.macro_score) / 100,
        Number(r.sector_score) / 100,
      ],
      y: r.outcome === "target_hit" || (r.realized_pct != null && Number(r.realized_pct) > 0) ? 1 : 0,
    });
  }

  const perRegime: Record<string, MetaWeights> = {
    bull: trainOn(buckets.bull),
    bear: trainOn(buckets.bear),
    neutral: trainOn(buckets.neutral),
    volatile: trainOn(buckets.volatile),
  };

  const bucket = regimeBucket(activeRegime);
  const active = perRegime[bucket].fitted ? perRegime[bucket] : DEFAULT;

  return { active, bucket, perRegime };
}