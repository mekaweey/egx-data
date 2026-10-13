/**
 * Tier-K Intelligence — RAG + Online Learning + Counterfactual
 * --------------------------------------------------------------------------
 * Persistent state (Supabase). Fail-open: any error returns neutral defaults.
 *
 *   K.1  Semantic News RAG (pgvector + Lovable AI embeddings)
 *        - Embeds each headline, finds historically similar news,
 *          returns the average realized 5-day move → "déjà-vu" signal.
 *
 *   K.2  Online Learning (streaming SGD on feature weights)
 *        - After every trade outcome, nudges per-feature weights with
 *          a tiny learning rate. No batch retrain needed.
 *
 *   K.3  Counterfactual Analysis
 *        - For each losing trade: "what if feature X had been at its
 *          median?" — flags features that consistently hurt decisions.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";

/* ------------------------------------------------------------------ */
/* K.1  Semantic News RAG                                              */
/* ------------------------------------------------------------------ */

const EMBED_MODEL = "openai/text-embedding-3-small"; // 1536 dims

async function embedText(text: string): Promise<number[] | null> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: EMBED_MODEL, input: text.slice(0, 4000) }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: Array<{ embedding: number[] }> };
    return json.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

/** Store a news item with its embedding. Call when a news arrives. */
export async function ragStoreNews(args: {
  symbol: string;
  headline: string;
  sentimentScore: number;
  publishedAt?: string | null;
}): Promise<void> {
  const vec = await embedText(args.headline);
  if (!vec) return;
  await supabaseAdmin.from("news_embeddings").insert({
    symbol: args.symbol,
    headline: args.headline,
    embedding: vec as unknown as string,
    sentiment_score: args.sentimentScore,
    published_at: args.publishedAt ?? null,
  });
}

/** Backfill outcome (5-day return) for previously stored news. */
export async function ragRecordOutcome(
  newsId: string,
  outcome5dPct: number,
): Promise<void> {
  await supabaseAdmin
    .from("news_embeddings")
    .update({ outcome_5d_pct: outcome5dPct, outcome_recorded_at: new Date().toISOString() })
    .eq("id", newsId);
}

export interface RagSignal {
  count: number;
  avgOutcomePct: number;
  confidence: number; // 0..1 — based on sample size + similarity
  examples: Array<{ headline: string; outcome: number; similarity: number }>;
}

/**
 * Look up historically similar news for a symbol.
 * Returns the average 5-day return of similar past headlines.
 */
export async function ragQuerySimilarNews(
  symbol: string,
  headline: string,
): Promise<RagSignal> {
  const empty: RagSignal = { count: 0, avgOutcomePct: 0, confidence: 0, examples: [] };
  const vec = await embedText(headline);
  if (!vec) return empty;

  const { data, error } = await supabaseAdmin.rpc("match_news_history", {
    query_embedding: vec as unknown as string,
    match_symbol: symbol,
    match_count: 8,
    min_similarity: 0.75,
  });
  if (error || !data || data.length === 0) return empty;

  const rows = data as Array<{
    headline: string;
    outcome_5d_pct: number | null;
    similarity: number;
  }>;
  const valid = rows.filter((r) => typeof r.outcome_5d_pct === "number");
  if (valid.length === 0) return empty;

  const sumW = valid.reduce((s, r) => s + r.similarity, 0);
  const weighted =
    valid.reduce((s, r) => s + (r.outcome_5d_pct ?? 0) * r.similarity, 0) / sumW;
  const confidence = Math.min(1, valid.length / 5) * (sumW / valid.length);

  return {
    count: valid.length,
    avgOutcomePct: weighted,
    confidence,
    examples: valid.slice(0, 3).map((r) => ({
      headline: r.headline,
      outcome: r.outcome_5d_pct ?? 0,
      similarity: r.similarity,
    })),
  };
}

/* ------------------------------------------------------------------ */
/* K.2  Online Learning (streaming SGD)                                */
/* ------------------------------------------------------------------ */

const LEARNING_RATE = 0.01;
const WEIGHT_CLAMP = 2.5;

/** Pull all current weights. Cached per request would be ideal; kept simple. */
export async function olGetWeights(): Promise<Record<string, number>> {
  const { data } = await supabaseAdmin
    .from("online_learning_state")
    .select("feature_name, weight");
  const out: Record<string, number> = {};
  for (const row of data ?? []) out[row.feature_name] = Number(row.weight);
  return out;
}

/**
 * Update weights after a trade. `features` are the normalized feature values
 * the model saw; `realizedPct` is the actual outcome (signed %).
 * Uses simple SGD: w_i += lr * error * x_i.
 */
export async function olUpdate(
  features: Record<string, number>,
  realizedPct: number,
): Promise<void> {
  const target = Math.tanh(realizedPct / 5); // squash to [-1, 1]
  const current = await olGetWeights();
  const predicted = Object.entries(features).reduce(
    (s, [k, v]) => s + (current[k] ?? 0) * v,
    0,
  );
  const error = target - Math.tanh(predicted);

  const updates: Array<{
    feature_name: string;
    weight: number;
    n_updates: number;
    last_gradient: number;
    updated_at: string;
  }> = [];

  for (const [name, x] of Object.entries(features)) {
    if (!Number.isFinite(x)) continue;
    const w = current[name] ?? 0;
    const grad = error * x;
    const newW = Math.max(-WEIGHT_CLAMP, Math.min(WEIGHT_CLAMP, w + LEARNING_RATE * grad));
    updates.push({
      feature_name: name,
      weight: newW,
      n_updates: 1, // upsert merges via SQL
      last_gradient: grad,
      updated_at: new Date().toISOString(),
    });
  }

  if (updates.length === 0) return;
  // upsert (increment n_updates handled in-app on read; simple overwrite of weight)
  await supabaseAdmin.from("online_learning_state").upsert(updates, {
    onConflict: "feature_name",
  });
}

/**
 * Apply online-learned weights as a small additive nudge to base confidence.
 * Returns the nudge in [-15, +15] confidence points.
 */
export async function olScoreNudge(
  features: Record<string, number>,
): Promise<number> {
  const weights = await olGetWeights();
  let score = 0;
  for (const [k, v] of Object.entries(features)) {
    if (!Number.isFinite(v)) continue;
    score += (weights[k] ?? 0) * v;
  }
  // tanh-squash and scale to ±15 confidence points
  return Math.tanh(score) * 15;
}

/* ------------------------------------------------------------------ */
/* K.3  Counterfactual Analysis                                        */
/* ------------------------------------------------------------------ */

/**
 * Analyze a losing trade: which feature, if it had been at its "neutral"
 * value, would have flipped the decision?
 *
 * `predictFn` is a pure scoring function the engine uses; we permute one
 * feature at a time and measure the change in predicted confidence.
 */
export async function counterfactualAnalyze(args: {
  recommendationId?: string;
  symbol: string;
  features: Record<string, number>;
  neutralValues: Record<string, number>;
  predictFn: (f: Record<string, number>) => number;
  realizedPct: number;
}): Promise<Array<{ feature: string; impact: number; insightAr: string }>> {
  // only analyze losers (otherwise nothing to learn from)
  if (args.realizedPct >= 0) return [];

  const baselinePred = args.predictFn(args.features);
  const insights: Array<{ feature: string; impact: number; insightAr: string }> = [];

  for (const [name, actual] of Object.entries(args.features)) {
    const neutral = args.neutralValues[name];
    if (neutral === undefined || !Number.isFinite(actual)) continue;

    const cf = { ...args.features, [name]: neutral };
    const cfPred = args.predictFn(cf);
    const impact = cfPred - baselinePred;

    // Only flag features whose actual value HURT the decision (lowering
    // confidence below would have prevented the losing trade).
    if (Math.abs(impact) < 5) continue;

    const insightAr =
      impact < 0
        ? `لو ${name} كان عند القيمة المحايدة (${neutral.toFixed(2)}) بدل ${actual.toFixed(2)}، الثقة كانت هتقل ${Math.abs(impact).toFixed(1)} نقطة والصفقة الخاسرة دي كانت اتجنبت`
        : `${name} = ${actual.toFixed(2)} ساعد القرار بـ${impact.toFixed(1)} نقطة لكن النتيجة جت سلبية — جرّب تقلل وزنه`;

    insights.push({ feature: name, impact, insightAr });
  }

  // persist top 5 most impactful
  const top = insights.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)).slice(0, 5);
  if (top.length > 0) {
    await supabaseAdmin.from("counterfactual_insights").insert(
      top.map((t) => ({
        recommendation_id: args.recommendationId ?? null,
        symbol: args.symbol,
        feature_name: t.feature,
        actual_value: args.features[t.feature],
        counterfactual_value: args.neutralValues[t.feature],
        predicted_outcome_change: t.impact,
        insight_ar: t.insightAr,
      })),
    );
  }

  return top;
}

/** Aggregate: which features hurt us most often across all losing trades? */
export async function counterfactualTopOffenders(
  limit = 10,
): Promise<Array<{ feature: string; avgImpact: number; n: number }>> {
  const { data } = await supabaseAdmin
    .from("counterfactual_insights")
    .select("feature_name, predicted_outcome_change")
    .order("created_at", { ascending: false })
    .limit(500);
  if (!data) return [];

  const agg = new Map<string, { sum: number; n: number }>();
  for (const row of data) {
    const prev = agg.get(row.feature_name) ?? { sum: 0, n: 0 };
    prev.sum += Number(row.predicted_outcome_change);
    prev.n += 1;
    agg.set(row.feature_name, prev);
  }

  return [...agg.entries()]
    .map(([feature, v]) => ({ feature, avgImpact: v.sum / v.n, n: v.n }))
    .sort((a, b) => Math.abs(b.avgImpact) - Math.abs(a.avgImpact))
    .slice(0, limit);
}