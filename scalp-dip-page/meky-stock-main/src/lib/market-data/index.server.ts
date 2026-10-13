import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Candle, OHLCVResult } from "./types";
import { firecrawlProvider } from "./firecrawl.server";
import { yahooProvider } from "./yahoo.server";
import { syntheticProvider } from "./synthetic.server";

// Firecrawl first: it proxies Yahoo's chart JSON through its own IPs so we
// dodge the 429 rate-limit that hits Cloudflare Worker IPs directly.
// AlphaVantage removed: 0/185 success rate over the last 30 days (verified
// via data_source_logs) — pure latency cost with no real-data benefit.
const PROVIDERS = [firecrawlProvider, yahooProvider, syntheticProvider];
const MIN_CANDLES = 60;

async function logAttempt(
  provider: string,
  symbol: string,
  ok: boolean,
  latencyMs: number,
  candlesCount: number,
  error?: string,
) {
  try {
    await supabaseAdmin.from("data_source_logs").insert({
      provider,
      symbol,
      ok,
      latency_ms: latencyMs,
      candles_count: candlesCount,
      error: error ?? null,
    });
  } catch {
    // logging failure must not break a scan
  }
}

export async function fetchOHLCV(yahooSymbol: string, days = 120): Promise<OHLCVResult> {
  let lastError = "no provider";
  for (const provider of PROVIDERS) {
    const start = Date.now();
    try {
      const candles = await provider.fetchOHLCV(yahooSymbol, days);
      const latency = Date.now() - start;
      if (candles.length < MIN_CANDLES) {
        await logAttempt(
          provider.name,
          yahooSymbol,
          false,
          latency,
          candles.length,
          `insufficient candles: ${candles.length}`,
        );
        lastError = `insufficient candles (${candles.length})`;
        continue;
      }
      await logAttempt(provider.name, yahooSymbol, true, latency, candles.length);
      return { symbol: yahooSymbol, candles, provider: provider.name };
    } catch (e) {
      const latency = Date.now() - start;
      const msg = e instanceof Error ? e.message : String(e);
      lastError = msg;
      await logAttempt(provider.name, yahooSymbol, false, latency, 0, msg);
    }
  }
  throw new Error(`All providers failed for ${yahooSymbol}: ${lastError}`);
}

export type { Candle, OHLCVResult };