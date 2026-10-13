/**
 * Multi-Agent Debate (Bull / Bear / Risk Manager).
 * --------------------------------------------------------------------------
 * Asks the LLM to play three roles in parallel, then synthesises a verdict
 * with a confidence multiplier in [0.5, 1.2]. Fail-open: 1.0 on error.
 */
import { chatWithFallback } from "@/lib/ai/chat-fallback.server";

interface Verdict {
  bull_score: number;
  bear_score: number;
  risk_score: number;
  verdict: "confirm" | "reduce" | "reject";
  summary_ar: string;
}

export async function multiAgentDebate(input: {
  symbol: string;
  signal: string;
  confidence: number;
  signals: Array<{ name: string; value: number }>;
  regime: string;
}): Promise<{ multiplier: number; verdict: string; summary: string }> {
  if (
    !process.env.LOVABLE_API_KEY &&
    !process.env.GEMINI_API_KEY &&
    !process.env.GROQ_API_KEY
  ) {
    return { multiplier: 1, verdict: "skip", summary: "" };
  }
  try {
    const text = await chatWithFallback({
      messages: [{
        role: "user",
        content:
          "أنت 3 محللين: Bull, Bear, Risk Manager. قيّموا التوصية التالية. " +
          "أعد JSON صارم: {\"bull_score\":0-10,\"bear_score\":0-10,\"risk_score\":0-10,\"verdict\":\"confirm|reduce|reject\",\"summary_ar\":\"...\"}\n\n" +
          JSON.stringify(input),
      }],
      temperature: 0.2,
      timeoutMs: 8000,
    });
    if (!text) return { multiplier: 1, verdict: "error", summary: "" };
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return { multiplier: 1, verdict: "no_json", summary: "" };
    const output = JSON.parse(m[0]) as Verdict;
    let mul = 1;
    if (output.verdict === "confirm") mul = 1.15;
    else if (output.verdict === "reduce") mul = 0.75;
    else mul = 0.5;
    mul *= 1 + ((output.bull_score ?? 0) - (output.bear_score ?? 0)) * 0.02;
    return {
      multiplier: Math.max(0.5, Math.min(1.2, mul)),
      verdict: output.verdict,
      summary: output.summary_ar ?? "",
    };
  } catch {
    return { multiplier: 1, verdict: "error", summary: "" };
  }
}