/**
 * Weekly adaptive learning — analyzes failed recommendations to discover
 * patterns that consistently lose money, then logs them to signal_failures
 * for the rule-gate to use.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type Reco = {
  symbol: string;
  confidence: number;
  outcome: string;
  realized_pct: number | null;
  market_trend: string | null;
  technical_score: number | null;
  sentiment_score: number | null;
  sector_score: number | null;
  ensemble_agreement: number | null;
  rr_ratio: number | null;
};

export type LearnedPattern = {
  pattern_name: string;
  description_ar: string;
  rule_json: Record<string, unknown>;
  win_count: number;
  failure_count: number;
  total_count: number;
};

export async function runAdaptiveLearning(): Promise<{
  patterns: LearnedPattern[];
  saved: number;
}> {
  // Pull all resolved buys from the last 90 days
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("recommendations")
    .select("symbol,confidence,outcome,realized_pct,market_trend,technical_score,sentiment_score,sector_score,ensemble_agreement,rr_ratio")
    .in("signal", ["buy", "strong_buy"])
    .in("outcome", ["target_hit", "stop_hit", "expired"])
    .gte("created_at", since);
  if (error || !data || data.length < 20) {
    return { patterns: [], saved: 0 };
  }

  const recos = data as Reco[];
  const patterns: LearnedPattern[] = [];

  // Pattern 1: bearish market buys
  bucket(recos, "bearish_market_buy", "شراء أثناء سوق هابط", (r) => r.market_trend === "down", patterns);

  // Pattern 2: low ensemble agreement (<70)
  bucket(recos, "low_ensemble_agreement", "إجماع منخفض بين النماذج (<70)", (r) => (r.ensemble_agreement ?? 100) < 70, patterns);

  // Pattern 3: low technical score (<55)
  bucket(recos, "weak_technical", "تحليل فني ضعيف (<55)", (r) => (r.technical_score ?? 100) < 55, patterns);

  // Pattern 4: weak sector
  bucket(recos, "weak_sector", "قطاع ضعيف (<50)", (r) => (r.sector_score ?? 100) < 50, patterns);

  // Pattern 5: negative sentiment
  bucket(recos, "negative_sentiment", "مشاعر سلبية (<40)", (r) => (r.sentiment_score ?? 100) < 40, patterns);

  // Pattern 6: very low confidence (<60) — historical failure mode
  bucket(recos, "low_confidence", "ثقة منخفضة (<60)", (r) => r.confidence < 60, patterns);

  // Persist patterns that actually have signal (≥10 samples, win rate < 40%)
  let saved = 0;
  for (const p of patterns) {
    const winRate = p.total_count > 0 ? (p.win_count / p.total_count) * 100 : 0;
    if (p.total_count >= 10 && winRate < 40) {
      const { error: upErr } = await supabaseAdmin.from("signal_failures").upsert(
        {
          pattern_name: p.pattern_name,
          description_ar: p.description_ar,
          rule_json: p.rule_json as never,
          win_count: p.win_count,
          failure_count: p.failure_count,
          total_count: p.total_count,
          is_active: true,
          last_updated: new Date().toISOString(),
        },
        { onConflict: "pattern_name" } as never,
      );
      if (!upErr) saved++;
    }
  }
  return { patterns, saved };
}

function bucket(
  recos: Reco[],
  name: string,
  descAr: string,
  filter: (r: Reco) => boolean,
  acc: LearnedPattern[],
): void {
  const matching = recos.filter(filter);
  if (matching.length === 0) return;
  const wins = matching.filter((r) => r.outcome === "target_hit").length;
  const losses = matching.filter((r) => r.outcome === "stop_hit").length;
  acc.push({
    pattern_name: name,
    description_ar: descAr,
    rule_json: { filter: name },
    win_count: wins,
    failure_count: losses,
    total_count: matching.length,
  });
}

/** Load active learned-failure rules so rule-gate can use them. */
export async function getActiveFailurePatterns(): Promise<Set<string>> {
  const { data } = await supabaseAdmin
    .from("signal_failures")
    .select("pattern_name")
    .eq("is_active", true);
  return new Set((data ?? []).map((r) => r.pattern_name));
}