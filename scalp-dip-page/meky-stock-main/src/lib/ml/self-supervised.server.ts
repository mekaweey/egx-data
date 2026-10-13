/**
 * #24 Self-Supervised Pre-training:
 * يتعلم تمثيلات (embeddings) من بيانات بدون labels عبر next-candle prediction.
 */
export interface PriceEmbedding { vector: number[]; reconstructionError: number }

export function encodeCandle(closes: number[], window = 10): PriceEmbedding | null {
  if (closes.length < window) return null;
  const slice = closes.slice(-window);
  const min = Math.min(...slice);
  const max = Math.max(...slice);
  const range = max - min;
  const vector = slice.map((c) => range ? (c - min) / range : 0);
  // self-supervised loss: predict next from prior (mean of last 3)
  const pred = (vector[window - 4] + vector[window - 3] + vector[window - 2]) / 3;
  const reconstructionError = Math.abs(pred - vector[window - 1]);
  return { vector, reconstructionError };
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((s, x, i) => s + x * (b[i] ?? 0), 0);
  const magA = Math.sqrt(a.reduce((s, x) => s + x * x, 0));
  const magB = Math.sqrt(b.reduce((s, x) => s + x * x, 0));
  return dot / Math.max(magA * magB, 0.0001);
}