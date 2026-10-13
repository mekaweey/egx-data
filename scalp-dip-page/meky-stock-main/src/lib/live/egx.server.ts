import type { LiveScraper, LiveTick } from "./types";

/**
 * EGX official site (final fallback): https://www.egx.com.eg
 * Uses the disclosures JSON endpoint when available; otherwise scrapes the
 * stock page.
 */
export const egxScraper: LiveScraper = {
  name: "egx",
  async fetchTick(symbol: string): Promise<LiveTick> {
    const url = `https://www.egx.com.eg/en/stocksdata.aspx?Isin=${encodeURIComponent(symbol)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
        Accept: "text/html",
      },
    });
    if (!res.ok) throw new Error(`egx HTTP ${res.status}`);
    const html = await res.text();
    const m =
      html.match(/Last[^<]*<[^>]*>\s*([\d,]+\.?\d*)/i) ||
      html.match(/lastTrade[^>]*>\s*([\d,]+\.?\d*)/i);
    if (m?.[1]) {
      const price = parseFloat(m[1].replace(/,/g, ""));
      if (price > 0) return { symbol, price, source: "egx", ts: new Date().toISOString() };
    }
    const err = new Error("egx: price not found");
    (err as Error & { html?: string }).html = html.slice(0, 8000);
    throw err;
  },
};