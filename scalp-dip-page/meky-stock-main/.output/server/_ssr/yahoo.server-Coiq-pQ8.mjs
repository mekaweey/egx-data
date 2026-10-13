const YAHOO_TIMEOUT_MS = 4e3;
const yahooProvider = {
  name: "yahoo",
  async fetchOHLCV(yahooSymbol, days) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), YAHOO_TIMEOUT_MS);
    const range = days <= 30 ? "1mo" : days <= 90 ? "3mo" : days <= 180 ? "6mo" : days <= 365 ? "1y" : days <= 730 ? "2y" : "5y";
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      yahooSymbol
    )}?interval=1d&range=${range}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        Accept: "application/json,text/plain,*/*"
      }
    }).finally(() => clearTimeout(timeout));
    if (!res.ok) {
      throw new Error(`Yahoo HTTP ${res.status}`);
    }
    const json = await res.json();
    const err = json.chart?.error;
    if (err) throw new Error(`Yahoo error: ${err.description ?? "unknown"}`);
    const result = json.chart?.result?.[0];
    const ts = result?.timestamp ?? [];
    const q = result?.indicators?.quote?.[0];
    if (!q || ts.length === 0) throw new Error("Yahoo returned no candles");
    const candles = [];
    for (let i = 0; i < ts.length; i++) {
      const o = q.open?.[i];
      const h = q.high?.[i];
      const l = q.low?.[i];
      const c = q.close?.[i];
      const v = q.volume?.[i];
      if (o == null || h == null || l == null || c == null) continue;
      candles.push({
        date: new Date(ts[i] * 1e3).toISOString(),
        open: o,
        high: h,
        low: l,
        close: c,
        volume: v ?? 0
      });
    }
    return candles;
  }
};
export {
  yahooProvider as y
};
