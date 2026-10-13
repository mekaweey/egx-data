/**
 * Self-Critique Agent.
 * --------------------------------------------------------------------------
 * Periodically asks the LLM to analyse the most recent LOSING recommendations
 * and produce a JSON list of common failure patterns. The patterns are
 * returned to the caller who can store them in `signal_failures` for the
 * scanner to avoid in the future. Fail-open: returns [] on any error.
 */
import { chatWithFallback } from "@/lib/ai/chat-fallback.server";

export interface LosingTrade {
  symbol: string;
  signal: string;
  confidence: number;
  realised_pct: number;
  reasons_ar?: string[] | null;
  market_trend?: string | null;
}

export interface FailurePattern {
  pattern_name: string;
  description_ar: string;
  avoid_when: string;
}

export async function critiqueLosingTrades(trades: LosingTrade[]): Promise<FailurePattern[]> {
  if (trades.length < 3) return [];
  if (
    !process.env.LOVABLE_API_KEY &&
    !process.env.GEMINI_API_KEY &&
    !process.env.GROQ_API_KEY
  ) return [];
  try {
    const text = await chatWithFallback({
      messages: [{
        role: "user",
        content:
          "أنت محلل كمي. حلل التوصيات الخاسرة التالية واستخرج أنماط فشل مشتركة (≤5). " +
          "أعد JSON صارم بالشكل: {\"patterns\":[{\"pattern_name\":\"...\",\"description_ar\":\"...\",\"avoid_when\":\"...\"}]}\n\n" +
          JSON.stringify(trades.slice(0, 50)),
      }],
      temperature: 0.1,
      timeoutMs: 15_000,
    });
    if (!text) return [];
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return [];
    const parsed = JSON.parse(m[0]) as { patterns?: FailurePattern[] };
    return (parsed.patterns ?? []).slice(0, 5);
  } catch {
    return [];
  }
}