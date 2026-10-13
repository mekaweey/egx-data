/**
 * RAG over financial filings (10-K/10-Q): chunk, embed, retrieve, answer.
 */
import { getAiGateway, AI_MODEL } from "@/lib/ai/gateway.server";
import { generateText } from "ai";

export interface FilingChunk {
  id: string;
  section: string;
  text: string;
  embedding?: number[];
}

export function chunkFiling(text: string, chunkSize: number = 800): FilingChunk[] {
  const sections = text.split(/\n##\s+/);
  const chunks: FilingChunk[] = [];
  let id = 0;
  for (const sec of sections) {
    const [title, ...rest] = sec.split("\n");
    const body = rest.join("\n");
    for (let i = 0; i < body.length; i += chunkSize) {
      chunks.push({ id: `c${id++}`, section: title.trim(), text: body.slice(i, i + chunkSize) });
    }
  }
  return chunks;
}

/** Lightweight BM25-style scoring (no embeddings required). */
function score(query: string, text: string): number {
  const q = query.toLowerCase().split(/\W+/).filter(Boolean);
  const t = text.toLowerCase();
  let s = 0;
  for (const w of q) {
    const matches = t.split(w).length - 1;
    s += matches / (1 + Math.log(text.length / 100));
  }
  return s;
}

export function retrieve(chunks: FilingChunk[], query: string, k: number = 5): FilingChunk[] {
  return chunks
    .map((c) => ({ c, s: score(query, c.text) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, k)
    .map((r) => r.c);
}

export async function ragQuery(chunks: FilingChunk[], question: string): Promise<string> {
  const top = retrieve(chunks, question, 5);
  const context = top.map((c) => `[${c.section}]\n${c.text}`).join("\n\n---\n\n");
  const gateway = getAiGateway();
  const { text } = await generateText({
    model: gateway(AI_MODEL),
    prompt: `Answer the question using ONLY the context from the filing below. If not found, say "Not found in filing".\n\nContext:\n${context}\n\nQuestion: ${question}\n\nAnswer:`,
  });
  return text.trim();
}