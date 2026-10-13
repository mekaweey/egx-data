const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  console.log("waiting 180s for deploy...");
  await sleep(180000);
  const c = new AbortController();
  setTimeout(() => c.abort(), 30000);
  try {
    const r = await fetch("https://meky-stock.onrender.com/api/public/hooks/marketwatch-health", { signal: c.signal });
    const j = await r.json();
    console.log("FINAL HEALTH:", JSON.stringify({
      stale: j.stale, mw_age_s: j.age_seconds, mw_rows60: j.last_60s?.rows, mw_syms60: j.last_60s?.distinct_symbols,
      tick_age_s: j.live_ticks?.age_seconds, tick_rows60: j.live_ticks?.rows_60s, tick_syms60: j.live_ticks?.distinct_symbols_60s,
      quotes_age_s: j.live_quotes?.age_seconds, quotes_syms: j.live_quotes?.distinct_symbols_window,
      orderbook_age_s: j.orderbook?.age_seconds,
      coverage_pct: j.universe?.coverage_pct, covered: j.universe?.covered, total: j.universe?.total_sharia,
    }, null, 1));
  } catch (e) {
    console.log("health ERR:", e.message);
  }
})();
