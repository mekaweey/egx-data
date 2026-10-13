import { generateText } from "ai";
import { getAiGateway, AI_MODEL } from "@/lib/ai/gateway.server";

/**
 * Self-healing parser: feed a chunk of HTML to Gemini Flash and ask for the
 * last traded price. Used only when regex/cheerio parsers fail.
 */
export async function extractPriceWithAI(symbol: string, html: string): Promise<number | null> {
  if (!html) return null;
  const gateway = getAiGateway();
  try {
    const { text } = await generateText({
      model: gateway(AI_MODEL),
      prompt: `Extract the LAST TRADED PRICE (number only, no currency, no commas) for stock symbol "${symbol}" from this HTML. If you cannot find it, respond with "NONE".\n\nHTML:\n${html.slice(0, 6000)}\n\nLast price:`,
    });
    const m = text.match(/[\d]+\.?\d*/);
    if (!m) return null;
    const n = parseFloat(m[0]);
    return n > 0 && n < 100000 ? n : null;
  } catch {
    return null;
  }
}