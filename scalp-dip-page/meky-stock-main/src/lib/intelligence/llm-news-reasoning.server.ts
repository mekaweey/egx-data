/**
 * LLM News Reasoning: use Gemini via Lovable AI Gateway to read news
 * and reason about the impact on a specific stock.
 */

import { getAiGateway, AI_MODEL } from "@/lib/ai/gateway.server";
import { generateText, Output } from "ai";
import { z } from "zod";

export interface NewsItem {
  headline: string;
  summary?: string;
  source?: string;
  publishedAt?: string;
}

export interface NewsReasoningResult {
  impactScore: number; // -1 to +1
  confidence: number;
  timeHorizon: "intraday" | "short" | "medium" | "long";
  rationale: string;
  keyDrivers: string[];
  risks: string[];
}

const ReasoningSchema = z.object({
  impactScore: z.number().min(-1).max(1),
  confidence: z.number().min(0).max(1),
  timeHorizon: z.enum(["intraday", "short", "medium", "long"]),
  rationale: z.string(),
  keyDrivers: z.array(z.string()),
  risks: z.array(z.string()),
});

export async function reasonOverNews(
  symbol: string,
  news: NewsItem[],
  context?: { sector?: string; recentPrice?: number; recentMoves?: string },
): Promise<NewsReasoningResult> {
  const gateway = getAiGateway();
  const model = gateway(AI_MODEL);

  const newsText = news
    .slice(0, 10)
    .map((n, i) => `${i + 1}. [${n.source ?? "unknown"}] ${n.headline}${n.summary ? "\n   " + n.summary : ""}`)
    .join("\n\n");

  const contextText = context
    ? `\nContext:\n- Sector: ${context.sector ?? "N/A"}\n- Recent price: ${context.recentPrice ?? "N/A"}\n- Recent moves: ${context.recentMoves ?? "N/A"}`
    : "";

  const prompt = `You are a senior equity analyst. Analyze the following news for stock ${symbol} and reason about the directional impact.${contextText}\n\nNews items:\n${newsText}\n\nProvide:\n- impactScore: -1 (very bearish) to +1 (very bullish)\n- confidence: 0 to 1\n- timeHorizon: intraday / short (days) / medium (weeks) / long (months+)\n- rationale: 2-3 sentences\n- keyDrivers: bullet list of main factors\n- risks: bullet list of risks to the thesis`;

  const { output } = await generateText({
    model,
    output: Output.object({ schema: ReasoningSchema }),
    prompt,
  });

  return output as NewsReasoningResult;
}