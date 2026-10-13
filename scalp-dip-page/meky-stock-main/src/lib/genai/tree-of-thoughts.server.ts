/**
 * Tree of Thoughts: explore branching scenarios and pick the best path.
 */
import { getAiGateway, AI_MODEL } from "@/lib/ai/gateway.server";
import { generateText, Output } from "ai";
import { z } from "zod";

const BranchSchema = z.object({
  scenario: z.string(),
  probability: z.number().min(0).max(1),
  outcome: z.string(),
  expectedReturn: z.number(),
});

const TreeSchema = z.object({ branches: z.array(BranchSchema) });

export interface ToTResult {
  branches: z.infer<typeof BranchSchema>[];
  expectedValue: number;
  bestBranch: z.infer<typeof BranchSchema>;
  worstBranch: z.infer<typeof BranchSchema>;
}

export async function treeOfThoughts(symbol: string, facts: string[], branchCount: number = 4): Promise<ToTResult> {
  const gateway = getAiGateway();
  const { output } = await generateText({
    model: gateway(AI_MODEL),
    output: Output.object({ schema: TreeSchema }),
    prompt: `For ${symbol}, generate ${branchCount} distinct future scenarios (bullish, bearish, neutral, black swan). For each: probability (sum to ~1), outcome description, expected % return.\nFacts:\n${facts.map((f) => "- " + f).join("\n")}`,
  });

  const branches = output.branches;
  const ev = branches.reduce((s, b) => s + b.probability * b.expectedReturn, 0);
  const best = branches.reduce((a, b) => (b.expectedReturn > a.expectedReturn ? b : a));
  const worst = branches.reduce((a, b) => (b.expectedReturn < a.expectedReturn ? b : a));
  return { branches, expectedValue: ev, bestBranch: best, worstBranch: worst };
}