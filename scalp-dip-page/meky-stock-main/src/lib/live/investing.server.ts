import Firecrawl from "@mendable/firecrawl-js";
import type { LiveScraper, LiveTick } from "./types";

let _fc: Firecrawl | null = null;
function fc() {
  const k = process.env.FIRECRAWL_API_KEY;
  if (!k) throw new Error("FIRECRAWL_API_KEY missing");
  if (!_fc) _fc = new Firecrawl({ apiKey: k });
  return _fc;
}

/**
 * Investing.com via Firecrawl (rotating proxies → bypasses Cloudflare).
 * URL: https://www.investing.com/equities/{slug}
 */
export const investingScraper: LiveScraper = {
  name: "investing",
  async fetchTick(symbol, _yahoo, investingSlug): Promise<LiveTick> {
    if (!investingSlug) throw new Error("no investing_slug");
    const url = `https://www.investing.com/equities/${investingSlug}`;
    const res = (await fc().scrape(url, {
      formats: ["rawHtml"],
      onlyMainContent: false,
      waitFor: 800,
    })) as { rawHtml?: string; data?: { rawHtml?: string } };
    const html = res.rawHtml ?? res.data?.rawHtml ?? "";
    if (!html) throw new Error("investing: empty response");

    // Pattern: data-test="instrument-price-last" >12.34<
    const m =
      html.match(/instrument-price-last[^>]*>\s*([\d,]+\.?\d*)/i) ||
      html.match(/"last"\s*:\s*"?([\d.]+)"?/);
    if (m?.[1]) {
      const price = parseFloat(m[1].replace(/,/g, ""));
      if (price > 0) return { symbol, price, source: "investing", ts: new Date().toISOString(), meta: { url } };
    }
    const err = new Error("investing: price not found");
    (err as Error & { html?: string }).html = html.slice(0, 8000);
    throw err;
  },
};