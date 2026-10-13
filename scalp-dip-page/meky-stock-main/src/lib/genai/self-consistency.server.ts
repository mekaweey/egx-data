/**
 * Self-Consistency: sample N reasoning paths and take majority vote.
 */
import { getAiGateway, AI_MODEL } from "@/lib/ai/gateway.server";
import { generateText, Output } from "ai";
import { z } from "zod";

const VoteSchema = z.object({
  decision: z.enum(["buy", "sell", "hold"]),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
});

export interface SelfConsistencyResult {
  finalDecision: "buy" | "sell" | "hold";
  agreement: number;
  votes: z.infer<typeof VoteSchema>[];
  avgConfidence: number;
}

export async function selfConsistencyVote(
  symbol: string,
  facts: string[],
  samples: number = 5,
): Promise<SelfConsistencyResult> {
  const gateway = getAiGateway();
  const prompt = `Analyze ${symbol} and decide buy/sell/hold.\nFacts:\n${facts.map((f) => "- " + f).join("\n")}`;

  const votes = await Promise.all(
    Array.from({ length: samples }, async () => {
      const { output } = await generateText({
        model: gateway(AI_MODEL),
        output: Output.object({ schema: VoteSchema }),
        prompt,
      });
      return output as z.infer<typeof VoteSchema>;
    }),
  );

  const tally = { buy: 0, sell: 0, hold: 0 };
  for (const v of votes) tally[v.decision]++;
  const finalDecision = (Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0]) as "buy" | "sell" | "hold";
  const agreement = tally[finalDecision] / samples;
  const avgConfidence = votes.reduce((s, v) => s + v.confidence, 0) / samples;

  return { finalDecision, agreement, votes, avgConfidence };
}