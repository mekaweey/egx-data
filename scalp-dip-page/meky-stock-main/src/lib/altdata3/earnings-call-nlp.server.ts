/**
 * Earnings Call Transcripts NLP — score management tone via Lovable AI.
 */
import { generateText, Output } from "ai";
import { z } from "zod";
import { getAiGateway, AI_MODEL } from "@/lib/ai/gateway.server";

const ToneSchema = z.object({
  confidence: z.number().min(-1).max(1),
  hedging: z.number().min(0).max(1),
  forwardLooking: z.number().min(-1).max(1),
  summary: z.string(),
});

export type ToneAnalysis = z.infer<typeof ToneSchema>;

export async function analyzeEarningsCall(transcript: string): Promise<ToneAnalysis> {
  const gw = getAiGateway();
  const { output } = await generateText({
    model: gw(AI_MODEL),
    output: Output.object({ schema: ToneSchema }),
    prompt:
      "Analyze this earnings call transcript. Score management tone:\n" +
      "- confidence: -1 (defensive) .. +1 (very confident)\n" +
      "- hedging: 0 (direct) .. 1 (lots of qualifiers like 'may', 'could', 'uncertain')\n" +
      "- forwardLooking: -1 (pessimistic guidance) .. +1 (raising guidance)\n\n" +
      "Transcript:\n" +
      transcript.slice(0, 8000),
  });
  return output;
}