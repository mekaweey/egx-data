/**
 * Multi-Agent Debate: bull, bear, and neutral agents argue, then a judge decides.
 */

import { getAiGateway, AI_MODEL } from "@/lib/ai/gateway.server";
import { generateText, Output } from "ai";
import { z } from "zod";

export interface DebateInput {
  symbol: string;
  facts: string[]; // bullet points of known data
}

export interface DebateRound {
  bull: string;
  bear: string;
  neutral: string;
}

export interface DebateVerdict {
  decision: "buy" | "sell" | "hold";
  confidence: number;
  reasoning: string;
  rounds: DebateRound[];
}

const VerdictSchema = z.object({
  decision: z.enum(["buy", "sell", "hold"]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

async function agentSpeak(role: "bull" | "bear" | "neutral", input: DebateInput, history: DebateRound[]): Promise<string> {
  const gateway = getAiGateway();
  const personas = {
    bull: "You are an aggressive bullish analyst. Find every reason to buy.",
    bear: "You are a skeptical bearish analyst. Find every reason to sell or avoid.",
    neutral: "You are a balanced neutral analyst. Weigh both sides objectively.",
  };

  const historyText = history
    .map((r, i) => `Round ${i + 1}:\nBULL: ${r.bull}\nBEAR: ${r.bear}\nNEUTRAL: ${r.neutral}`)
    .join("\n\n");

  const prompt = `${personas[role]}\n\nStock: ${input.symbol}\nFacts:\n${input.facts.map((f) => "- " + f).join("\n")}\n\n${historyText ? "Previous debate:\n" + historyText + "\n\n" : ""}Make your argument in 2-3 sentences.`;

  const { text } = await generateText({ model: gateway(AI_MODEL), prompt });
  return text.trim();
}

export async function runDebate(input: DebateInput, rounds: number = 2): Promise<DebateVerdict> {
  const debateRounds: DebateRound[] = [];

  for (let r = 0; r < rounds; r++) {
    const [bull, bear, neutral] = await Promise.all([
      agentSpeak("bull", input, debateRounds),
      agentSpeak("bear", input, debateRounds),
      agentSpeak("neutral", input, debateRounds),
    ]);
    debateRounds.push({ bull, bear, neutral });
  }

  const gateway = getAiGateway();
  const summary = debateRounds
    .map((r, i) => `Round ${i + 1}:\nBULL: ${r.bull}\nBEAR: ${r.bear}\nNEUTRAL: ${r.neutral}`)
    .join("\n\n");

  const { output } = await generateText({
    model: gateway(AI_MODEL),
    output: Output.object({ schema: VerdictSchema }),
    prompt: `You are the judge. Given this debate about ${input.symbol}, decide buy/sell/hold with confidence and reasoning.\n\n${summary}`,
  });

  return { ...(output as z.infer<typeof VerdictSchema>), rounds: debateRounds };
}