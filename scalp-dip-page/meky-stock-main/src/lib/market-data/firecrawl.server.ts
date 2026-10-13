import Firecrawl from "@mendable/firecrawl-js";
import type { Candle, MarketDataProvider } from "./types";

let _client: Firecrawl | null = null;
function getClient(): Firecrawl {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY is not configured");
  if (!_client) _client = new Firecrawl({ apiKey });
  return _client;
}

type YahooChartJson = {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          open?: (number | null)[];
          high?: (number | null)[];
          low?: (number | null)[];
          close?: (number | null)[];
          volume?: (number | null)[];
        }>;
      };
    }>;
    error?: { description?: string } | null;
  };
};

function pickRange(days: number): string {
  if (days <= 30) return "1mo";
  if (days <= 90) return "3mo";
  if (days <= 180) return "6mo";
  if (days <= 365) return "1y";
  if (days <= 730) return "2y";
  return "5y";
}

function yahooJsonToCandles(json: YahooChartJson): Candle[] {
  const result = json.chart?.result?.[0];
  if (!result) return [];
  const ts = result.timestamp ?? [];
  const q = result.indicators?.quote?.[0];
  if (!q || ts.length === 0) return [];
  const out: Candle[] = [];
  for (let i = 0; i < ts.length; i++) {
    const o = q.open?.[i],
      h = q.high?.[i],
      l = q.low?.[i],
      c = q.close?.[i],
      v = q.volume?.[i];
    if (o == null || h == null || l == null || c == null) continue;
    out.push({
      date: new Date(ts[i] * 1000).toISOString(),
      open: o,
      high: h,
      low: l,
      close: c,
      volume: v ?? 0,
    });
  }
  return out;
}

/**
 * Firecrawl-backed OHLCV provider. Uses Firecrawl's proxies to call Yahoo
 * Finance's chart JSON endpoint — bypasses the 429 rate limit hitting our
 * Cloudflare Worker IPs directly.
 */
export const firecrawlProvider: MarketDataProvider = {
  name: "firecrawl-yahoo",
  async fetchOHLCV(yahooSymbol: string, days: number): Promise<Candle[]> {
    const client = getClient();
    const range = pickRange(days);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      yahooSymbol,
    )}?interval=1d&range=${range}`;

    // rawHtml on a JSON endpoint returns the raw JSON body as a string.
    const result = (await client.scrape(url, {
      formats: ["rawHtml"],
      onlyMainContent: false,
      waitFor: 300,
    })) as { rawHtml?: string; data?: { rawHtml?: string } };

    const body = result.rawHtml ?? result.data?.rawHtml ?? "";
    if (!body) throw new Error("Firecrawl returned empty body");

    let parsed: YahooChartJson;
    try {
      parsed = JSON.parse(body) as YahooChartJson;
    } catch (e) {
      throw new Error(
        `Firecrawl JSON parse failed for ${yahooSymbol}: ${(e as Error).message}; body[0..120]=${body.slice(0, 120)}`,
      );
    }

    if (parsed.chart?.error) {
      throw new Error(`Yahoo (via Firecrawl) error: ${parsed.chart.error.description ?? "unknown"}`);
    }

    const candles = yahooJsonToCandles(parsed);
    if (candles.length === 0) {
      throw new Error(`Firecrawl: no candles parsed for ${yahooSymbol}`);
    }
    return candles;
  },
};
