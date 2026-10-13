/**
 * LLM Reasoning Layer — uses Lovable AI (Gemini) to sanity-check the
 * ensemble pick. If the LLM flags an internal contradiction, we lower
 * the confidence; if it endorses, we leave it alone.
 * Designed to fail-open: any error → no change.
 */
import type { ModuleSignal } from "./pipeline-integrator.server";
import { chatWithFallback } from "@/lib/ai/chat-fallback.server";

interface SanityResult {
  verdict: "endorse" | "neutral" | "reject";
  reason: string;
  multiplier: number;
}

export async function sanityCheck(args: {
  symbol: string;
  signal: string;
  confidence: number;
  regime: string;
  signals: ModuleSignal[];
}): Promise<SanityResult> {
  if (
    !process.env.LOVABLE_API_KEY &&
    !process.env.GEMINI_API_KEY &&
    !process.env.GROQ_API_KEY
  ) {
    return { verdict: "neutral", reason: "no_key", multiplier: 1 };
  }

  const top = [...args.signals]
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 6)
    .map((s) => `${s.name}=${s.value.toFixed(2)}`)
    .join(", ");

  const prompt = `You are a quant risk reviewer. Pick: ${args.symbol} signal=${args.signal} ` +
    `confidence=${args.confidence.toFixed(0)} regime=${args.regime}. Top module signals: ${top}. ` +
    `Reply STRICT JSON: {"verdict":"endorse|neutral|reject","reason":"<≤12 words>"} ` +
    `Reject only if signals strongly contradict the action.`;

  try {
    const text = await chatWithFallback({
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      timeoutMs: 6000,
    });
    if (!text) return { verdict: "neutral", reason: "no_response", multiplier: 1 };
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return { verdict: "neutral", reason: "no_json", multiplier: 1 };
    const parsed = JSON.parse(m[0]) as { verdict?: string; reason?: string };
    const verdict = parsed.verdict === "endorse" ? "endorse"
      : parsed.verdict === "reject" ? "reject" : "neutral";
    // أوزان أقوى للتحكيم: التأييد يرفع 12% والرفض يخفض 35%
    const multiplier = verdict === "reject" ? 0.65 : verdict === "endorse" ? 1.12 : 1;
    return { verdict, reason: (parsed.reason ?? "").slice(0, 120), multiplier };
  } catch {
    return { verdict: "neutral", reason: "exception", multiplier: 1 };
  }
}
