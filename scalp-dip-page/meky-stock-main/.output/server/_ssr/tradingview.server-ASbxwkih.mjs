const SCANNER_URL = "https://scanner.tradingview.com/egypt/scan";
const SCANNER_TIMEOUT_MS = 8e3;
const COLUMNS = [
  "close",
  "change",
  "change_abs",
  "volume",
  "open",
  "high",
  "low",
  "RSI",
  "MACD.macd",
  "MACD.signal",
  "MACD.hist",
  "EMA10",
  "EMA20",
  "EMA50",
  "SMA20",
  "SMA50",
  "BB.upper",
  "BB.lower",
  "ATR",
  "average_volume_10d_calc",
  "High.3M",
  "Low.3M"
];
function n(v) {
  if (v == null) return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}
function req(v) {
  const x = Number(v);
  if (!Number.isFinite(x)) throw new Error("missing required numeric field");
  return x;
}
async function fetchEgxSnapshots(symbols) {
  if (symbols.length === 0) return /* @__PURE__ */ new Map();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SCANNER_TIMEOUT_MS);
  const body = {
    symbols: { tickers: symbols.map((s) => `EGX:${s.toUpperCase()}`) },
    columns: [...COLUMNS]
  };
  const res = await fetch(SCANNER_URL, {
    method: "POST",
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      Origin: "https://www.tradingview.com",
      Referer: "https://www.tradingview.com/",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    },
    body: JSON.stringify(body)
  }).finally(() => clearTimeout(timeout));
  if (!res.ok) {
    throw new Error(`TradingView scanner HTTP ${res.status}: ${await res.text().catch(() => "")}`);
  }
  const json = await res.json();
  const out = /* @__PURE__ */ new Map();
  for (const row of json.data ?? []) {
    const sym = row.s.split(":").pop().toUpperCase();
    const d = row.d;
    try {
      out.set(sym, {
        symbol: sym,
        close: req(d[0]),
        change_pct: req(d[1]),
        change_abs: req(d[2]),
        volume: Math.round(req(d[3])),
        open: req(d[4]),
        high: req(d[5]),
        low: req(d[6]),
        rsi14: n(d[7]),
        macd: n(d[8]),
        macdSignal: n(d[9]),
        macdHist: n(d[10]),
        ema9: n(d[11]),
        ema21: n(d[12]),
        sma50: n(d[15]),
        sma20: n(d[14]),
        bbUpper: n(d[16]),
        bbLower: n(d[17]),
        bbMid: n(d[14]),
        // SMA20 ≈ middle band
        atr14: n(d[18]),
        volAvg20: n(d[19]),
        high3m: n(d[20]),
        low3m: n(d[21])
      });
    } catch {
    }
  }
  return out;
}
export {
  fetchEgxSnapshots as f
};
