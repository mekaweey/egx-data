import type { LiveScraper, LiveTick } from "./types";

/**
 * Mubasher Egypt: https://www.mubasher.info/markets/EGX/stocks/{SYMBOL}
 * Parses last price from HTML. If structure changes, AI fallback kicks in.
 */
export const mubasherScraper: LiveScraper = {
  name: "mubasher",
  async fetchTick(symbol: string): Promise<LiveTick> {
    const url = `https://www.mubasher.info/markets/EGX/stocks/${encodeURIComponent(symbol)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
      },
    });
    if (!res.ok) throw new Error(`mubasher HTTP ${res.status}`);
    const html = await res.text();

    // Pattern 1: JSON-LD embedded
    const jsonLd = html.match(/"price"\s*:\s*"?([\d.]+)"?/);
    if (jsonLd?.[1]) {
      return { symbol, price: parseFloat(jsonLd[1]), source: "mubasher", ts: new Date().toISOString(), meta: { strategy: "jsonld" } };
    }
    // Pattern 2: class="last-price" / data-last
    const m = html.match(/(?:last[-_]?price|data-last-price)[^>]*>?\s*([\d,]+\.?\d*)/i);
    if (m?.[1]) {
      const price = parseFloat(m[1].replace(/,/g, ""));
      if (price > 0) return { symbol, price, source: "mubasher", ts: new Date().toISOString(), meta: { strategy: "regex" } };
    }
    // Throw with snippet so AI fallback can try
    const snippet = html.slice(0, 8000);
    const err = new Error("mubasher: price not found in HTML");
    (err as Error & { html?: string }).html = snippet;
    throw err;
  },
};