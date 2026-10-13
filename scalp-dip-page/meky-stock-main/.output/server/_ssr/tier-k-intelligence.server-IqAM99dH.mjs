import { supabaseAdmin } from "./client.server-D5ro3rAQ.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
const EMBED_MODEL = "openai/text-embedding-3-small";
async function embedText(text) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ model: EMBED_MODEL, input: text.slice(0, 4e3) })
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  }
}
async function ragStoreNews(args) {
  const vec = await embedText(args.headline);
  if (!vec) return;
  await supabaseAdmin.from("news_embeddings").insert({
    symbol: args.symbol,
    headline: args.headline,
    embedding: vec,
    sentiment_score: args.sentimentScore,
    published_at: args.publishedAt ?? null
  });
}
async function ragRecordOutcome(newsId, outcome5dPct) {
  await supabaseAdmin.from("news_embeddings").update({ outcome_5d_pct: outcome5dPct, outcome_recorded_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", newsId);
}
async function ragQuerySimilarNews(symbol, headline) {
  const empty = { count: 0, avgOutcomePct: 0, confidence: 0, examples: [] };
  const vec = await embedText(headline);
  if (!vec) return empty;
  const { data, error } = await supabaseAdmin.rpc("match_news_history", {
    query_embedding: vec,
    match_symbol: symbol,
    match_count: 8,
    min_similarity: 0.75
  });
  if (error || !data || data.length === 0) return empty;
  const rows = data;
  const valid = rows.filter((r) => typeof r.outcome_5d_pct === "number");
  if (valid.length === 0) return empty;
  const sumW = valid.reduce((s, r) => s + r.similarity, 0);
  const weighted = valid.reduce((s, r) => s + (r.outcome_5d_pct ?? 0) * r.similarity, 0) / sumW;
  const confidence = Math.min(1, valid.length / 5) * (sumW / valid.length);
  return {
    count: valid.length,
    avgOutcomePct: weighted,
    confidence,
    examples: valid.slice(0, 3).map((r) => ({
      headline: r.headline,
      outcome: r.outcome_5d_pct ?? 0,
      similarity: r.similarity
    }))
  };
}
const LEARNING_RATE = 0.01;
const WEIGHT_CLAMP = 2.5;
async function olGetWeights() {
  const { data } = await supabaseAdmin.from("online_learning_state").select("feature_name, weight");
  const out = {};
  for (const row of data ?? []) out[row.feature_name] = Number(row.weight);
  return out;
}
async function olUpdate(features, realizedPct) {
  const target = Math.tanh(realizedPct / 5);
  const current = await olGetWeights();
  const predicted = Object.entries(features).reduce(
    (s, [k, v]) => s + (current[k] ?? 0) * v,
    0
  );
  const error = target - Math.tanh(predicted);
  const updates = [];
  for (const [name, x] of Object.entries(features)) {
    if (!Number.isFinite(x)) continue;
    const w = current[name] ?? 0;
    const grad = error * x;
    const newW = Math.max(-WEIGHT_CLAMP, Math.min(WEIGHT_CLAMP, w + LEARNING_RATE * grad));
    updates.push({
      feature_name: name,
      weight: newW,
      n_updates: 1,
      // upsert merges via SQL
      last_gradient: grad,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  if (updates.length === 0) return;
  await supabaseAdmin.from("online_learning_state").upsert(updates, {
    onConflict: "feature_name"
  });
}
async function olScoreNudge(features) {
  const weights = await olGetWeights();
  let score = 0;
  for (const [k, v] of Object.entries(features)) {
    if (!Number.isFinite(v)) continue;
    score += (weights[k] ?? 0) * v;
  }
  return Math.tanh(score) * 15;
}
async function counterfactualAnalyze(args) {
  if (args.realizedPct >= 0) return [];
  const baselinePred = args.predictFn(args.features);
  const insights = [];
  for (const [name, actual] of Object.entries(args.features)) {
    const neutral = args.neutralValues[name];
    if (neutral === void 0 || !Number.isFinite(actual)) continue;
    const cf = { ...args.features, [name]: neutral };
    const cfPred = args.predictFn(cf);
    const impact = cfPred - baselinePred;
    if (Math.abs(impact) < 5) continue;
    const insightAr = impact < 0 ? `لو ${name} كان عند القيمة المحايدة (${neutral.toFixed(2)}) بدل ${actual.toFixed(2)}، الثقة كانت هتقل ${Math.abs(impact).toFixed(1)} نقطة والصفقة الخاسرة دي كانت اتجنبت` : `${name} = ${actual.toFixed(2)} ساعد القرار بـ${impact.toFixed(1)} نقطة لكن النتيجة جت سلبية — جرّب تقلل وزنه`;
    insights.push({ feature: name, impact, insightAr });
  }
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
        insight_ar: t.insightAr
      }))
    );
  }
  return top;
}
async function counterfactualTopOffenders(limit = 10) {
  const { data } = await supabaseAdmin.from("counterfactual_insights").select("feature_name, predicted_outcome_change").order("created_at", { ascending: false }).limit(500);
  if (!data) return [];
  const agg = /* @__PURE__ */ new Map();
  for (const row of data) {
    const prev = agg.get(row.feature_name) ?? { sum: 0, n: 0 };
    prev.sum += Number(row.predicted_outcome_change);
    prev.n += 1;
    agg.set(row.feature_name, prev);
  }
  return [...agg.entries()].map(([feature, v]) => ({ feature, avgImpact: v.sum / v.n, n: v.n })).sort((a, b) => Math.abs(b.avgImpact) - Math.abs(a.avgImpact)).slice(0, limit);
}
export {
  counterfactualAnalyze,
  counterfactualTopOffenders,
  olGetWeights,
  olScoreNudge,
  olUpdate,
  ragQuerySimilarNews,
  ragRecordOutcome,
  ragStoreNews
};
