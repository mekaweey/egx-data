import type { Candle, MarketDataProvider } from "./types";

/**
 * Alpha Vantage backup provider. Only active when ALPHA_VANTAGE_KEY is set.
 * Free tier is heavily rate-limited (25 req/day) so this is best-effort.
 * Yahoo symbols like "COMI.CA" are converted to Alpha Vantage format "COMI.CAI".
 */
export const alphaVantageProvider: MarketDataProvider = {
  name: "alphavantage",
  async fetchOHLCV(yahooSymbol: string, _days: number): Promise<Candle[]> {
    const key = process.env.ALPHA_VANTAGE_KEY;
    if (!key) throw new Error("ALPHA_VANTAGE_KEY not set");

    // Yahoo uses .CA for Cairo; Alpha Vantage uses .CAI
    const avSymbol = yahooSymbol.replace(/\.CA$/i, ".CAI");
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(
      avSymbol,
    )}&outputsize=compact&apikey=${encodeURIComponent(key)}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`AlphaVantage HTTP ${res.status}`);
    const json = (await res.json()) as Record<string, unknown>;

    if (typeof json["Note"] === "string") throw new Error("AlphaVantage rate limit");
    if (typeof json["Error Message"] === "string") {
      throw new Error(`AlphaVantage: ${json["Error Message"]}`);
    }

    const series = json["Time Series (Daily)"] as Record<string, Record<string, string>> | undefined;
    if (!series) throw new Error("AlphaVantage returned no series");

    const candles: Candle[] = Object.entries(series)
      .map(([date, row]) => ({
        date: new Date(date).toISOString(),
        open: Number(row["1. open"]),
        high: Number(row["2. high"]),
        low: Number(row["3. low"]),
        close: Number(row["4. close"]),
        volume: Number(row["5. volume"]) || 0,
      }))
      .filter((c) => Number.isFinite(c.close))
      .sort((a, b) => a.date.localeCompare(b.date));

    if (candles.length === 0) throw new Error("AlphaVantage returned no usable candles");
    return candles;
  },
};