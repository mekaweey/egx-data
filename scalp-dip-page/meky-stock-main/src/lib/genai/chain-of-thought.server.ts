/**
 * Chain-of-Thought Trading: model writes reasoning steps before the decision.
 */
import { getAiGateway, AI_MODEL } from "@/lib/ai/gateway.server";
import { generateText, Output } from "ai";
import { z } from "zod";

const CoTSchema = z.object({
  steps: z.array(z.string()),
  decision: z.enum(["buy", "sell", "hold"]),
  confidence: z.number().min(0).max(1),
  finalRationale: z.string(),
});

export type CoTResult = z.infer<typeof CoTSchema>;

export async function chainOfThoughtDecision(symbol: string, facts: string[]): Promise<CoTResult> {
  const gateway = getAiGateway();
  const { output } = await generateText({
    model: gateway(AI_MODEL),
    output: Output.object({ schema: CoTSchema }),
    prompt: `Think step-by-step about ${symbol}. Show your reasoning chain (at least 4 steps), then give a buy/sell/hold decision.\n\nFacts:\n${facts.map((f) => "- " + f).join("\n")}`,
  });
  return output as CoTResult;
}