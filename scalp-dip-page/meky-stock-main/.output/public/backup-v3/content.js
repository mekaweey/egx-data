/* New Content Script (v3.0 - Proactive Polling)
 * Targets: https://x.thndr.app/*
 * 1. Proactive Marketwatch Polling (Global)
 * 2. Watchlist Polling (L2 + Tape)
 * 3. NO DOM SCRAPING.
 */

(function () {
  const SCRIPT_VERSION = "3.0.0-proactive";
  if (window.__thunderProactiveHooked === SCRIPT_VERSION) return;
  window.__thunderProactiveHooked = SCRIPT_VERSION;

  console.log("[thunder-ext] Proactive Polling Active v" + SCRIPT_VERSION);

  // --- Configuration & State ---
  let watchlist = []; // Array of asset_ids
  let pollingIntervals = {
    marketwatch: 15000,
    watchlist: 7500, // 5-10s
  };
  let backoff = {
    marketwatch: 0,
    watchlist: 0,
  };
  const backoffLevels = [0, 15000, 30000, 60000];
  
  let timers = {
    marketwatch: null,
    watchlist: null,
  };

  let lastTradeRecordId = {}; // asset_id -> last record id

  // --- Helpers ---
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function fetchWithBackoff(url, options, key) {
    if (backoff[key] > 0) {
      const wait = backoffLevels[Math.min(backoff[key], backoffLevels.length - 1)];
      console.log(`[thunder-ext] Backoff active for ${key}, waiting ${wait}ms`);
      await sleep(wait);
    }

    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      // Success: reset backoff
      backoff[key] = 0;
      return await res.json();
    } catch (e) {
      console.error(`[thunder-ext] Fetch failed for ${key}:`, e);
      backoff[key] = (backoff[key] || 0) + 1;
      throw e;
    }
  }

  // --- Pollers ---

  async function pollMarketwatch() {
    const url = "https://prod.thndr.app/assets-service/assets/marketwatch?market=egypt";
    try {
      const data = await fetchWithBackoff(url, { method: "GET" }, "marketwatch");
      if (data) {
        const timestamp = Date.now();
        chrome.storage.local.set({ 
          [`marketwatch_last`]: { data, timestamp } 
        });
        // Also forward to background for server ingest
        chrome.runtime.sendMessage({ type: "marketwatch_proactive", payload: { data, timestamp } });
      }
    } catch (e) {}
    
    timers.marketwatch = setTimeout(pollMarketwatch, pollingIntervals.marketwatch);
  }

  async function pollWatchlist() {
    if (watchlist.length === 0) {
      timers.watchlist = setTimeout(pollWatchlist, pollingIntervals.watchlist);
      return;
    }

    // Process watchlist sequentially or in small batches to avoid 429
    for (const assetId of watchlist) {
      try {
        // 1. Market Depth (L2)
        const l2Url = `https://prod.thndr.app/assets-service/market-depth/${assetId}`;
        const l2Data = await fetchWithBackoff(l2Url, { method: "GET" }, "watchlist");
        
        // 2. Trades Book (Tape)
        let tradesUrl = `https://prod.thndr.app/assets-service/market-depth/v2/trades-book/${assetId}?page_size=50`;
        if (lastTradeRecordId[assetId]) {
          tradesUrl += `&after=${lastTradeRecordId[assetId]}`;
        }
        const tradesData = await fetchWithBackoff(tradesUrl, { method: "GET" }, "watchlist");

        const timestamp = Date.now();
        
        // Store L2
        if (l2Data) {
          chrome.storage.local.set({ [`l2_${assetId}`]: { data: l2Data, timestamp } });
          chrome.runtime.sendMessage({ type: "l2_proactive", payload: { assetId, data: l2Data, timestamp } });
        }

        // Store Trades & Update Last ID
        if (tradesData && Array.isArray(tradesData.trades)) {
          if (tradesData.trades.length > 0) {
            // Assume the first one is the newest if sorted descending, or check IDs
            // Thunder usually returns descending? Or does 'after' imply ascending?
            // Usually 'after' with ID implies we want things with ID > after.
            const newest = tradesData.trades[0];
            if (newest && newest.id) lastTradeRecordId[assetId] = newest.id;
          }
          chrome.storage.local.set({ [`trades_${assetId}`]: { data: tradesData, timestamp } });
          chrome.runtime.sendMessage({ type: "trades_proactive", payload: { assetId, data: tradesData, timestamp } });
        }

      } catch (e) {
        // If one fails, we continue to the next or wait for next cycle
      }
      // Small delay between assets to mimic human behavior
      await sleep(500);
    }

    timers.watchlist = setTimeout(pollWatchlist, pollingIntervals.watchlist);
  }

  // --- Initialization ---
  function init() {
    chrome.storage.local.get(["watchlist"], (res) => {
      watchlist = Array.isArray(res.watchlist) ? res.watchlist : [];
      console.log("[thunder-ext] Watchlist loaded:", watchlist);
      
      startPollers();
    });
  }

  function startPollers() {
    stopPollers();
    pollMarketwatch();
    pollWatchlist();
  }

  function stopPollers() {
    if (timers.marketwatch) clearTimeout(timers.marketwatch);
    if (timers.watchlist) clearTimeout(timers.watchlist);
  }

  // Watch for watchlist changes
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.watchlist) {
      watchlist = changes.watchlist.newValue || [];
      console.log("[thunder-ext] Watchlist updated:", watchlist);
    }
  });

  // Listen for commands (like executeOrder if needed, but keeping it minimal)
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "ping") {
      sendResponse({ ok: true, version: SCRIPT_VERSION });
    }
    // Note: DOM-based order execution is removed per instructions:
    // "امسح أي كود بيقرأ من عناصر الصفحة (DOM scraping) نهائيًا"
    // If trade execution is still needed, it would need a non-scraping approach
    // or the user might be moving to API-based execution.
    return false;
  });

  init();

  // "وقف كل الجلب ... تلقائيًا لو تاب ثاندر اتقفل" 
  // This is naturally handled as the content script instance is destroyed.
})();
