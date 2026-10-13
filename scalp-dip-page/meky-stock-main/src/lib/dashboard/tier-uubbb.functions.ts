/**
 * Public server functions for the UU-BBB tier:
 *  - submitHumanFeedback: BBB — user 👍/👎 a recommendation/symbol.
 *  - refreshLlmMetaVote:  UU — refresh the cached LLM meta-analyst vote.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  recordHumanFeedbackBBB,
  setLlmMetaVoteUU,
  snapshotTierUUBBBState,
} from "@/lib/integration/tier-uubbb-intelligence.server";
import { saveState } from "@/lib/integration/persistence.server";

const FeedbackInput = z.object({
  symbol: z.string().min(1).max(32),
  vote: z.union([z.literal(1), z.literal(-1)]),
});

export const submitHumanFeedback = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => FeedbackInput.parse(input))
  .handler(async ({ data }) => {
    recordHumanFeedbackBBB(data.symbol, data.vote);
    try { await saveState("tier_uubbb_intelligence", snapshotTierUUBBBState()); } catch {}
    return { ok: true };
  });

// ---- UU: LLM meta-analyst refresh ----------------------------------------
// Calls Lovable AI with a compact diagnostic prompt and caches a bias vote
// in memory; the orchestrator reads it via llmMetaAnalystMultiplierUU.

const META_MODEL = "google/gemini-2.5-flash-lite";

const RefreshInput = z.object({
  regime: z.string().min(1).max(64),
  recentWinRate: z.number().min(0).max(1).optional(),
  topMistakes: z.array(z.string()).max(5).optional(),
});

export const refreshLlmMetaVote = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => RefreshInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { ok: false, reason: "no_key" };

    const prompt =
      `You are a quant meta-analyst. Current market regime: ${data.regime}. ` +
      (typeof data.recentWinRate === "number"
        ? `Recent system win-rate: ${(data.recentWinRate * 100).toFixed(0)}%. `
        : "") +
      (data.topMistakes?.length
        ? `Recent recurring mistakes: ${data.topMistakes.join("; ")}. `
        : "") +
      `Reply STRICT JSON: {"bias": <number between -1 and 1>, "reason": "<≤12 words>"} ` +
      `where positive bias = lean bullish, negative = lean bearish, 0 = neutral.`;

    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`,
        },
        signal: ctrl.signal,
        body: JSON.stringify({
          model: META_MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: 0,
        }),
      });
      clearTimeout(timer);
      if (!res.ok) return { ok: false, reason: `http_${res.status}` };
      const json = await res.json();
      const text: string = json?.choices?.[0]?.message?.content ?? "";
      const m = text.match(/\{[\s\S]*\}/);
      if (!m) return { ok: false, reason: "no_json" };
      const parsed = JSON.parse(m[0]) as { bias?: number; reason?: string };
      const bias = Math.max(-1, Math.min(1, Number(parsed.bias) || 0));
      setLlmMetaVoteUU(data.regime, bias);
      try { await saveState("tier_uubbb_intelligence", snapshotTierUUBBBState()); } catch {}
      return { ok: true, bias, reason: (parsed.reason ?? "").slice(0, 120) };
    } catch (e) {
      return { ok: false, reason: e instanceof Error ? e.message : "error" };
    }
  });