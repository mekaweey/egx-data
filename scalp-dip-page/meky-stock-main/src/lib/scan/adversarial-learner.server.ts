/**
 * Adversarial Self-Play
 * ----------------------
 * كل توصية فشلت بشكل ملحوظ (realized_pct ≤ -1.5 أو stop_hit) → نطلب من LLM
 * يحلّل "ليه فشلت؟" ويستخرج rule جديدة بصيغة JSON تتحط في signal_failures.
 * النظام بيتعلم من أخطائه تلقائياً.
 */
import { generateText } from "ai";
import { getAiGateway, AI_MODEL } from "@/lib/ai/gateway.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type FailureRule = {
  pattern_name: string;
  description_ar: string;
  rule: Record<string, unknown>;
};

export async function runAdversarialLearner(): Promise<{
  examined: number;
  rules_added: number;
}> {
  // 1) جلب آخر 30 توصية فشلت بشكل واضح
  const { data: losers } = await supabaseAdmin
    .from("recommendations")
    .select(
      "id, symbol, signal, confidence, realized_pct, raw_ai_response, reasons_ar, market_trend, technical_score",
    )
    .neq("outcome", "pending")
    .lte("realized_pct", -1.5)
    .order("created_at", { ascending: false })
    .limit(30);

  if (!losers || losers.length === 0) return { examined: 0, rules_added: 0 };

  // 2) اطلب من LLM يلخّص النمط المشترك في الفشل
  const gateway = getAiGateway();
  const model = gateway(AI_MODEL);

  const samples = losers.map((r) => ({
    sym: r.symbol,
    sig: r.signal,
    conf: r.confidence,
    loss_pct: r.realized_pct,
    market: r.market_trend,
    tech: r.technical_score,
    reasons: (r.reasons_ar as unknown as string[])?.slice(0, 2) ?? [],
  }));

  const system = [
    "أنت محلل أداء صارم. مهمتك اكتشاف الأنماط المشتركة في التوصيات الفاشلة.",
    "أعطني JSON يحتوي على array من 0-3 قواعد فقط، كل قاعدة بشكل:",
    `{"pattern_name":"اسم_مختصر","description_ar":"شرح بالعربية","rule":{"signal":"buy","market_trend":"down","max_confidence":75}}`,
    "rule.* يجب أن تكون شروط بسيطة قابلة للتحقق (signal, market_trend, max_confidence, min_rsi, max_rsi, sector).",
    "لا تخترع قواعد عامة — فقط ما يدعمه نمط واضح في العينة.",
    "أجب بـ JSON صالح فقط بصيغة {\"rules\":[...]} بدون أي نص آخر.",
  ].join("\n");

  let rules: FailureRule[] = [];
  try {
    const { text } = await generateText({
      model,
      system,
      prompt: JSON.stringify(samples),
      temperature: 0.2,
    });
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      const parsed = JSON.parse(m[0]) as { rules?: FailureRule[] };
      rules = (parsed.rules ?? []).slice(0, 3);
    }
  } catch {
    return { examined: losers.length, rules_added: 0 };
  }

  // 3) خزّن القواعد الجديدة (avoid duplicates by pattern_name)
  let added = 0;
  for (const r of rules) {
    if (!r.pattern_name || !r.rule) continue;
    const { data: existing } = await supabaseAdmin
      .from("signal_failures")
      .select("id, failure_count")
      .eq("pattern_name", r.pattern_name)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from("signal_failures")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({
          failure_count: (existing.failure_count ?? 0) + losers.length,
          total_count: (existing.failure_count ?? 0) + losers.length,
          last_updated: new Date().toISOString(),
        } as any)
        .eq("id", existing.id);
    } else {
      await supabaseAdmin.from("signal_failures").insert({
        pattern_name: r.pattern_name,
        description_ar: r.description_ar ?? r.pattern_name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rule_json: r.rule as any,
        failure_count: losers.length,
        total_count: losers.length,
        win_count: 0,
        is_active: true,
      });
      added++;
    }
  }

  return { examined: losers.length, rules_added: added };
}

/**
 * Stacking Meta-Learner: يتعلّم وزن لكل موديل بناءً على أدائه التاريخي.
 * بنحسب win-rate لكل موديل من ensemble_votes ↔ recommendations.outcome
 * ونخزّن weights في model_state[ensemble_meta_weights_v1].
 */
export async function updateEnsembleMetaWeights(): Promise<{
  models: number;
  weights: Record<string, number>;
}> {
  const { data: votes } = await supabaseAdmin
    .from("ensemble_votes")
    .select("model_name, vote, recommendation_id")
    .order("created_at", { ascending: false })
    .limit(2000);

  const recoIds = [...new Set((votes ?? []).map((v) => v.recommendation_id).filter(Boolean))];
  const { data: recos } = await supabaseAdmin
    .from("recommendations")
    .select("id, outcome, realized_pct")
    .in("id", (recoIds.length ? recoIds : ["__none__"]) as string[]);

  const outcomeMap = new Map<string, boolean | null>();
  (recos ?? []).forEach((r) => {
    if (r.outcome === "pending") outcomeMap.set(r.id, null);
    else
      outcomeMap.set(
        r.id,
        r.outcome === "target_hit" ||
          (typeof r.realized_pct === "number" && Number(r.realized_pct) > 0),
      );
  });

  const tally = new Map<string, { wins: number; total: number }>();
  for (const v of votes ?? []) {
    if (!v.recommendation_id) continue;
    const out = outcomeMap.get(v.recommendation_id);
    if (out == null) continue;
    const isBuyVote = v.vote === "buy" || v.vote === "strong_buy";
    if (!isBuyVote) continue;
    const t = tally.get(v.model_name) ?? { wins: 0, total: 0 };
    t.total += 1;
    if (out) t.wins += 1;
    tally.set(v.model_name, t);
  }

  const weights: Record<string, number> = {};
  tally.forEach((v, k) => {
    if (v.total < 5) {
      weights[k] = 1.0; // not enough data
      return;
    }
    const wr = v.wins / v.total;
    // weight ∈ [0.4, 1.4] بناءً على win-rate (0.5 = neutral)
    weights[k] = +Math.max(0.4, Math.min(1.4, 0.4 + wr * 2)).toFixed(2);
  });

  // Seed fallback: لو الـ ensemble_votes فاضية، استخدم أداء backtest على
  // مستوى الـ "tier models" المسجلة في model_state عشان مفيش ramp-up صفر.
  if (Object.keys(weights).length === 0) {
    const { data: tiers } = await supabaseAdmin
      .from("model_state")
      .select("key")
      .like("key", "tier_%_intelligence");
    const { data: bt } = await supabaseAdmin
      .from("backtest_trades")
      .select("pnl_pct, exit_reason")
      .not("exit_reason", "is", null)
      .limit(2000);
    const closed = (bt ?? []).filter((r) => typeof r.pnl_pct === "number");
    const wr = closed.length ? closed.filter((r) => Number(r.pnl_pct) > 0).length / closed.length : 0.5;
    const seed = +Math.max(0.6, Math.min(1.3, 0.4 + wr * 2)).toFixed(2);
    for (const t of tiers ?? []) {
      const name = (t.key as string).replace(/_intelligence$/, "");
      weights[name] = seed;
    }
    // ضيف الموديل الأساسي لو لسه مفيش حاجة
    if (Object.keys(weights).length === 0) weights["primary"] = seed;
  }

  await supabaseAdmin.from("model_state").upsert({
    key: "ensemble_meta_weights_v1",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { weights, fitted_at: new Date().toISOString() } as any,
    updated_at: new Date().toISOString(),
  });

  return { models: Object.keys(weights).length, weights };
}