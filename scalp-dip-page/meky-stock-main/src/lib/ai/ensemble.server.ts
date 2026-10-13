/**
 * Ensemble voting — get a second AI's vote on the same stock.
 * Recommendation is only released if both models agree on direction.
 */
import { generateText } from "ai";
import { z } from "zod";
import { getAiGateway, getAiProviderPlan } from "./gateway.server";
import type { AiAnalysis } from "./analyze.server";
import type { Indicators } from "../analysis/indicators.server";
import type { FiveDimScores } from "../analysis/five-dim-score.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BASE_SECONDARY_WEIGHT = 1.0;

// Stacking meta-learner: نطبّق أوزان متعلَّمة من model_state على الأوزان الأساسية.
// لو موديل سجل win-rate عالي → وزنه يزيد. لو سجّل أداء ضعيف → وزنه يقل.
let _metaWeightsCache: { v: Record<string, number>; at: number } | null = null;
const META_TTL = 10 * 60 * 1000;
async function loadMetaWeights(): Promise<Record<string, number>> {
  if (_metaWeightsCache && Date.now() - _metaWeightsCache.at < META_TTL) {
    return _metaWeightsCache.v;
  }
  try {
    const { data } = await supabaseAdmin
      .from("model_state")
      .select("data")
      .eq("key", "ensemble_meta_weights_v1")
      .maybeSingle();
    const w = ((data?.data as { weights?: Record<string, number> } | null)?.weights) ?? {};
    _metaWeightsCache = { v: w, at: Date.now() };
    return w;
  } catch {
    return {};
  }
}

async function getSecondaryModels(): Promise<Array<{ provider: "gemini" | "groq" | "lovable"; id: string; weight: number }>> {
  const meta = await loadMetaWeights();
  return getAiProviderPlan({ allowPaidFallback: false }).map((p) => ({
    provider: p.provider,
    id: p.model,
    weight: +(BASE_SECONDARY_WEIGHT * (meta[p.model] ?? 1.0)).toFixed(2),
  }));
}

const VoteSchema = z.object({
  vote: z.enum(["strong_buy", "buy", "neutral", "sell", "strong_sell"]),
  confidence: z.coerce.number().min(0).max(100),
  reasoning_ar: z.string().min(5).max(300),
});

export type EnsembleVote = z.infer<typeof VoteSchema>;

export type EnsembleResult = {
  primary: AiAnalysis;
  secondary: EnsembleVote | null;          // best (highest-weight) secondary vote
  votes: Array<{ model: string; vote: EnsembleVote; weight: number }>;
  agreement: "full" | "partial" | "conflict" | "no-second";
  agreementScore: number; // 0-100
  finalSignal: AiAnalysis["signal"];
  finalConfidence: number;
};

function isBullishSignal(s: string): boolean {
  return s === "buy" || s === "strong_buy";
}
function isBearishSignal(s: string): boolean {
  return s === "sell" || s === "strong_sell";
}

/** Weighted agreement across primary + N secondaries. */
function judgeEnsemble(
  primary: AiAnalysis,
  votes: Array<{ vote: EnsembleVote; weight: number }>,
): { kind: "full" | "partial" | "conflict"; score: number } {
  const all = [
    { signal: primary.signal, weight: 1.2 },
    ...votes.map((v) => ({ signal: v.vote.vote, weight: v.weight })),
  ];
  const totalW = all.reduce((s, v) => s + v.weight, 0);
  let bullW = 0, bearW = 0, neutW = 0;
  for (const v of all) {
    if (isBullishSignal(v.signal)) bullW += v.weight;
    else if (isBearishSignal(v.signal)) bearW += v.weight;
    else neutW += v.weight;
  }
  const bullPct = bullW / totalW;
  const bearPct = bearW / totalW;
  // Full agreement: ≥90% weight on one direction
  if (bullPct >= 0.9 || bearPct >= 0.9) return { kind: "full", score: 100 };
  // Conflict: bull and bear both ≥ 30% weight
  if (bullPct >= 0.3 && bearPct >= 0.3) return { kind: "conflict", score: 0 };
  // Partial: majority leans one way but not unanimous
  const lead = Math.max(bullPct, bearPct);
  const score = Math.round(40 + (lead - 0.5) * 120); // 0.5→40, 0.9→88
  return { kind: "partial", score: Math.max(30, Math.min(85, score)) };
}

export async function ensembleVote(args: {
  symbol: string;
  nameAr: string;
  ind: Indicators;
  primary: AiAnalysis;
  scores: FiveDimScores;
  scanId: string;
}): Promise<EnsembleResult> {
  const { symbol, nameAr, ind, primary, scores, scanId } = args;

  // Only run second model for bullish picks (cost optimization)
  const isBullish = primary.signal === "buy" || primary.signal === "strong_buy";
  if (!isBullish) {
    return {
      primary,
      secondary: null,
      votes: [],
      agreement: "no-second",
      agreementScore: 0,
      finalSignal: primary.signal,
      finalConfidence: primary.confidence,
    };
  }

  // Query free secondary providers in parallel — they are independent.
  const promptCommon = [
    `السهم: ${nameAr} (${symbol})`,
    `السعر: ${ind.close}`,
    `RSI14: ${ind.rsi14}, MACD hist: ${ind.macdHist}`,
    `EMA9/21/SMA50: ${ind.ema9}/${ind.ema21}/${ind.sma50}`,
    `حجم نسبي: ${ind.volRatio.toFixed(2)}×`,
    `الدعم/المقاومة: ${ind.support}/${ind.resistance}`,
    `أنماط: ${ind.patterns.map((p) => p.name).join(", ") || "لا شيء"}`,
    `النتائج: فني=${scores.technical} قطاع=${scores.sector} مشاعر=${scores.sentiment} ماكرو=${scores.macro}`,
    "هل توصي بشراء لمدة 1-3 أيام؟ أعد JSON فقط.",
  ].join("\n");
  const system =
    "أنت محلل مستقل تماماً. قُيِّم السهم بحياد دون التأثر بأي توصية سابقة. " +
    'أعد JSON فقط: {"vote":"strong_buy|buy|neutral|sell|strong_sell","confidence":0-100,"reasoning_ar":"..."}';

  const SECONDARY_MODELS = await getSecondaryModels();
  const results = await Promise.allSettled(
    SECONDARY_MODELS.map(async ({ provider, id, weight }: { provider: "gemini" | "groq" | "lovable"; id: string; weight: number }) => {
      const gateway = getAiGateway(provider);
      const { text } = await generateText({
        model: gateway(id),
        system,
        prompt: promptCommon,
        temperature: 0.4,
        maxRetries: 0,
        abortSignal: AbortSignal.timeout(6000),
      });
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("no JSON");
      return { model: id, vote: VoteSchema.parse(JSON.parse(match[0])), weight };
    }),
  );

  const votes: Array<{ model: string; vote: EnsembleVote; weight: number }> = [];
  for (const r of results) if (r.status === "fulfilled") votes.push(r.value);

  // "secondary" (legacy field) = highest-weight successful vote
  const secondary: EnsembleVote | null =
    votes.length > 0 ? votes.slice().sort((a, b) => b.weight - a.weight)[0].vote : null;

  // Persist both votes for tracking
  try {
    type VoteRow = {
      scan_id: string;
      symbol: string;
      model_name: string;
      vote: "strong_buy" | "buy" | "neutral" | "sell" | "strong_sell";
      confidence: number;
      reasoning_ar: string;
    };
    const rows: VoteRow[] = [
      { scan_id: scanId, symbol, model_name: "primary", vote: primary.signal, confidence: primary.confidence, reasoning_ar: primary.reasons_ar.join(" • ") },
    ];
    for (const v of votes) {
      rows.push({
        scan_id: scanId, symbol, model_name: v.model,
        vote: v.vote.vote, confidence: v.vote.confidence, reasoning_ar: v.vote.reasoning_ar,
      });
    }
    await supabaseAdmin.from("ensemble_votes").insert(rows);
  } catch {
    // logging shouldn't kill the scan
  }

  if (votes.length === 0) {
    // Penalize: no second opinion = lower confidence
    return {
      primary,
      secondary: null,
      votes: [],
      agreement: "no-second",
      agreementScore: 50,
      finalSignal: primary.signal,
      finalConfidence: Math.max(40, primary.confidence - 10),
    };
  }

  const judgment = judgeEnsemble(primary, votes);
  let finalSignal = primary.signal;
  let finalConfidence = primary.confidence;
  const avgSecondaryConf = Math.round(
    votes.reduce((s, v) => s + v.vote.confidence * v.weight, 0) /
      votes.reduce((s, v) => s + v.weight, 0),
  );

  if (judgment.kind === "conflict") {
    finalSignal = "neutral";
    finalConfidence = Math.min(primary.confidence, avgSecondaryConf, 50);
  } else if (judgment.kind === "partial") {
    if (primary.signal === "strong_buy") finalSignal = "buy";
    finalConfidence = Math.round((primary.confidence + avgSecondaryConf) / 2) - 5;
  } else {
    // Full agreement across N models — boost stronger when more models agree.
    // مع 4 ثوانٍ ناجحين، boost = 4 + min(10, 4*2.5) = 14. ومع super-confluence
    // (كل النماذج المتاحة وافقت + متوسط ثقتها ≥ 75) نضيف 5 إضافية.
    let boost = 4 + Math.min(10, Math.round(votes.length * 2.5));
    const allAgreed = votes.length >= SECONDARY_MODELS.length;
    if (allAgreed && avgSecondaryConf >= 75 && primary.confidence >= 70) {
      boost += 5; // super-confluence bonus
    }
    finalConfidence = Math.min(95, Math.round((primary.confidence + avgSecondaryConf) / 2) + boost);
  }

  return {
    primary,
    secondary,
    votes,
    agreement: judgment.kind,
    agreementScore: judgment.score,
    finalSignal,
    finalConfidence,
  };
}