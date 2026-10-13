import { yahooProvider } from "./yahoo.server";
import type { Candle } from "./types";

/**
 * Fetches the last `days` daily candles for many symbols in parallel via Yahoo.
 * Returns a Map keyed by the bare EGX symbol (uppercase) → array of candles
 * sorted ascending by date. Symbols that fail are simply absent from the map.
 */
export async function fetchHistoryBulk(
  stocks: Array<{ symbol: string; yahoo_symbol: string }>,
  days = 90,
  concurrency = 24,
): Promise<Map<string, Candle[]>> {
  const out = new Map<string, Candle[]>();
  let i = 0;

  async function worker() {
    while (i < stocks.length) {
      const idx = i++;
      const s = stocks[idx];
      try {
        const candles = await yahooProvider.fetchOHLCV(s.yahoo_symbol, days);
        if (candles.length > 0) out.set(s.symbol.toUpperCase(), candles);
      } catch {
        // silent skip; caller can detect missing entries
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, stocks.length) }, worker));

  // Retry any symbols that came back empty — Yahoo occasionally rate-limits
  // individual requests, leaving holes in the universe each scan.
  const missing = stocks.filter((s) => !out.has(s.symbol.toUpperCase()));
  if (missing.length > 0) {
    let j = 0;
    async function retryWorker() {
      while (j < missing.length) {
        const idx = j++;
        const s = missing[idx];
        try {
          const candles = await yahooProvider.fetchOHLCV(s.yahoo_symbol, days);
          if (candles.length > 0) out.set(s.symbol.toUpperCase(), candles);
        } catch {
          // silent skip
        }
      }
    }
    await Promise.all(
      Array.from({ length: Math.min(8, missing.length) }, retryWorker),
    );
  }

  return out;
}