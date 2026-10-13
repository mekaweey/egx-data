importScripts("config.js");
const MARKETWATCH_INTERVAL_SEC = 15;
const L2_TAPE_INTERVAL_SEC = 7;
const STORAGE_KEY_WATCHLIST = "proactive_watchlist";
const STORAGE_KEY_STATS = "proactive_stats";
const MARKETWATCH_URL = "https://prod.thndr.app/assets-service/assets/marketwatch?market=egypt";
// Ingest hooks (backend expects x-thunder-token header, not Authorization Bearer).
const MARKETWATCH_ENDPOINT = "https://meky-stock.onrender.com/api/public/hooks/thunder-marketwatch";
const TAPE_ENDPOINT = "https://meky-stock.onrender.com/api/public/hooks/thunder-tape";
let mwTimer = null;
let l2Timer = null;
let nextRunAllowed = 0;
let backoffMinutes = 0;
async function getStats() {
  const s = await chrome.storage.local.get([STORAGE_KEY_STATS]);
  return s[STORAGE_KEY_STATS] || { sent: 0, mwCount: 0, l2Count: 0, lastError: null, lastOk: 0 };
}
async function updateStats(patch) {
  const current = await getStats();
  await chrome.storage.local.set({ [STORAGE_KEY_STATS]: { ...current, ...patch } });
}
async function fetchWithBackoff(url, options = {}) {
  if (Date.now() < nextRunAllowed) throw new Error("Exponential backoff active");
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      if (res.status === 429 || res.status >= 500) handleFailure();
      throw new Error("HTTP " + res.status);
    }
    backoffMinutes = 0;
    nextRunAllowed = 0;
    return res;
  } catch (e) {
    handleFailure();
    throw e;
  }
}
function handleFailure() {
  backoffMinutes = backoffMinutes === 0 ? 0.25 : Math.min(60, backoffMinutes * 2);
  nextRunAllowed = Date.now() + backoffMinutes * 60 * 1000;
  updateStats({ lastError: "Backoff active: " + Math.round(backoffMinutes * 60) + "s" });
}
async function isThunderOpen() {
  const tabs = await chrome.tabs.query({ url: "https://x.thndr.app/*" });
  return tabs.length > 0;
}
// Map a raw Thunder marketwatch asset to the exact field names the backend accepts.
function normalizeMarketwatchAsset(a) {
  const num = (v) => (v === "" || v == null ? null : Number(String(v).replace(/,/g, "").trim()) || null);
  const int = (v) => {
    const n = num(v);
    return n == null || !isFinite(n) ? null : Math.round(n);
  };
  return {
    symbol: String(a.symbol || a.asset_id || "").trim().toUpperCase(),
    asset_id: a.asset_id || a.uuid || null,
    ref_price: num(a.ref_price ?? a.refPrice ?? a.reference_price),
    last_price: num(a.last_price ?? a.lastPrice ?? a.price ?? a.ltp),
    avg_change_prc: num(a.avg_change_prc ?? a.avgChangePrc ?? a.avg_change),
    total_volume: int(a.total_volume ?? a.totalVolume ?? a.volume ?? a.traded_volume ?? a.cumVolume) || null,
    total_trades: int(a.total_trades ?? a.totalTrades ?? a.trades ?? a.trade_count),
    total_value: num(a.total_value ?? a.totalValue ?? a.value ?? a.traded_value),
    total_bids: int(a.total_bids ?? a.totalBids),
    total_asks: int(a.total_asks ?? a.totalAsks),
    total_buy: int(a.total_buy ?? a.totalBuy),
    total_sell: int(a.total_sell ?? a.totalSell),
    high_price_limit: num(a.high_price_limit ?? a.highPriceLimit ?? a.max_limit),
    low_price_limit: num(a.low_price_limit ?? a.lowPriceLimit ?? a.min_limit),
    avg_5_day: num(a.avg_5_day ?? a.avg5Day),
    avg_30_day: num(a.avg_30_day ?? a.avg30Day),
    avg_90_day: num(a.avg_90_day ?? a.avg90Day),
    is_same_day: a.is_same_day === true || a.isSameDay === true ? true : (a.is_same_day === false || a.isSameDay === false ? false : null),
    highest_bid: num(a.highest_bid ?? a.highestBid ?? a.best_bid ?? a.bid_price ?? a.bid),
    lowest_ask: num(a.lowest_ask ?? a.lowestAsk ?? a.best_ask ?? a.ask_price ?? a.ask),
    highest_bid_qty: int(a.highest_bid_qty ?? a.highestBidQty ?? a.bid_qty ?? a.bid_size ?? a.bid_volume),
    lowest_ask_qty: int(a.lowest_ask_qty ?? a.lowestAskQty ?? a.ask_qty ?? a.ask_size ?? a.ask_volume),
    high_price: num(a.high_price ?? a.highPrice ?? a.day_high),
    low_price: num(a.low_price ?? a.lowPrice ?? a.day_low),
    last_trade_volume: int(a.last_trade_volume ?? a.lastTradeVolume),
    last_change_prc: num(a.last_change_prc ?? a.lastChangePrc ?? a.last_change ?? a.change_prc),
    symbol_state: a.symbol_state || a.symbolState || null,
    trade_rec_serial: int(a.trade_rec_serial ?? a.tradeRecSerial ?? a.symbols_rec_serial),
    last_trade_date: a.last_trade_date || a.lastTradeDate || null,
    open_price: num(a.open_price ?? a.openPrice ?? a.open),
    previous_close: num(a.previous_close ?? a.previousClose ?? a.prev_close ?? a.prevClose),
    close_price: num(a.close_price ?? a.closePrice),
    high_52_week: num(a.high_52_week ?? a.high52Week ?? a.week_52_high ?? a.yearHigh),
    low_52_week: num(a.low_52_week ?? a.low52Week ?? a.week_52_low ?? a.yearLow),
    listed_shares: num(a.listed_shares ?? a.listedShares ?? a.outstanding_shares ?? a.outstandingShares),
    avg_180_day: num(a.avg_180_day ?? a.avg180Day),
  };
}
async function runMarketwatch() {
  if (!(await isThunderOpen())) return;
  try {
    const res = await fetchWithBackoff(MARKETWATCH_URL);
    const data = await res.json();
    const assets = (data?.assets || []).map(normalizeMarketwatchAsset).filter((x) => x && x.symbol);
    if (assets.length > 0) {
      const token = (await chrome.storage.local.get(["token"])).token;
      await fetch(MARKETWATCH_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-thunder-token": token },
        body: JSON.stringify({ captured_at: new Date().toISOString(), assets })
      });
      updateStats({ mwCount: assets.length, lastOk: Date.now(), lastError: null, sent: (await getStats()).sent + 1 });
      const mapping = {};
      assets.forEach(a => { if (a.asset_id && a.symbol) mapping[a.symbol] = a.asset_id; });
    }
  } catch (e) {}
}
async function runL2Tape() {
  if (!(await isThunderOpen())) return;
  const { proactive_watchlist } = await chrome.storage.local.get([STORAGE_KEY_WATCHLIST]);
  if (!proactive_watchlist || proactive_watchlist.length === 0) return;
  const token = (await chrome.storage.local.get(["token"])).token;
  for (const item of proactive_watchlist) {
    const assetId = item.asset_id;
    if (!assetId) continue;
    try {
      const tapeRes = await fetchWithBackoff("https://prod.thndr.app/assets-service/market-depth/v2/trades-book/" + assetId + "?page_size=50");
      const tapeData = await tapeRes.json();
      const newTrades = tapeData?.trades || [];
      if (newTrades.length > 0) {
        const maxId = Math.max(...newTrades.map(t => t.record_id || 0));
        await chrome.storage.local.set({ ["last_record_" + assetId]: maxId });
      }
      if (newTrades.length > 0) {
        await fetch(TAPE_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-thunder-token": token },
          body: JSON.stringify({
            captured_at: new Date().toISOString(),
            asset_id: assetId,
            symbol: item.symbol || null,
            trades: newTrades.map(t => ({
              cursor: t.record_id ?? t.cursor ?? t.id,
              side: t.side ?? null,
              price: t.price ?? t.price_egp,
              volume: t.quantity ?? t.volume ?? t.qty,
              value: t.value ?? null,
              time: t.trade_time ?? t.created_at ?? t.timestamp ?? null,
            }))
          })
        });
        updateStats({ l2Count: (await getStats()).l2Count + 1, lastOk: Date.now(), sent: (await getStats()).sent + 1 });
      }
    } catch (e) {}
    await new Promise(r => setTimeout(r, 500));
  }
}
function startTimers() {
  stopTimers();
  mwTimer = setInterval(runMarketwatch, MARKETWATCH_INTERVAL_SEC * 1000);
  l2Timer = setInterval(runL2Tape, L2_TAPE_INTERVAL_SEC * 1000);
  runMarketwatch();
  setTimeout(runL2Tape, 2000);
}
function stopTimers() {
  if (mwTimer) clearInterval(mwTimer);
  if (l2Timer) clearInterval(l2Timer);
  mwTimer = null;
  l2Timer = null;
}
chrome.alarms.create("watchdog", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "watchdog") {
    isThunderOpen().then(open => {
      if (open && !mwTimer) startTimers();
      else if (!open && mwTimer) stopTimers();
    });
  }
});
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "proactive_get_status") {
    getStats().then(sendResponse);
    return true;
  }
});
isThunderOpen().then(open => { if (open) startTimers(); });