/* Background service worker v3.0 (Proactive)
 * Handles data forwarding and state management for the proactive extension.
 */

importScripts("config.js");

const FLUSH_MS = 2000;
const ORDER_POLL_MS = 1000;
const POSITIONS_POLL_MS = 5000;
const AUTO_INJECT_MS = 5000;
const MAX_BUFFER = 500;
const CONTENT_SCRIPT_VERSION = "3.0.0-proactive";

const DEFAULT_ENDPOINT = "https://meky-stock.lovable.app/api/public/hooks/thunder-ticks";
const ORDERS_ENDPOINT = "https://meky-stock.lovable.app/api/public/hooks/thunder-orders";
const POSITIONS_ENDPOINT = "https://meky-stock.lovable.app/api/public/hooks/thunder-positions";
const MARKETWATCH_ENDPOINT = "https://meky-stock.lovable.app/api/public/hooks/thunder-marketwatch";
const L2_ENDPOINT = "https://meky-stock.lovable.app/api/public/hooks/thunder-l2";
const TRADES_ENDPOINT = "https://meky-stock.lovable.app/api/public/hooks/thunder-tape";

let stats = { sent: 0, dropped: 0, lastFlush: 0, lastError: null, injectedTabs: 0, lastTick: null };
let mapping = {};
let openPositions = {};
let triggeredSells = {};
let dispatchedToday = {};
let inFlightOrders = {};
let failedOrders = {};
let lastOrderPoll = 0;
let lastOrderError = null;

chrome.storage.local.get(["mapping", "stats"]).then((s) => {
  mapping = s.mapping || {};
  stats = { ...stats, ...(s.stats || {}) };
});

initRemoteConfig().catch(() => {});
chrome.alarms?.create?.("thunderHeartbeat", { periodInMinutes: 0.5 });
chrome.alarms?.onAlarm?.addListener?.((alarm) => {
  if (alarm.name !== "thunderHeartbeat") return;
  pollOrders().catch(() => {});
  pollPositions().catch(() => {});
  autoInjectThunderTabs().catch(() => {});
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg) return;
  
  if (msg.type === "marketwatch_proactive") {
    forwardMarketwatch(msg.payload).catch(() => {});
  } else if (msg.type === "l2_proactive") {
    forwardL2(msg.payload).catch(() => {});
  } else if (msg.type === "trades_proactive") {
    forwardTrades(msg.payload).catch(() => {});
  } else if (msg.type === "getStatus") {
    chrome.storage.local.get(["autoExec", "maxPerDay", "egpPerTrade"]).then((cfg) => {
      sendResponse({
        stats,
        autoExec: cfg.autoExec === true,
        maxPerDay: cfg.maxPerDay ?? 3,
        egpPerTrade: cfg.egpPerTrade ?? 1000,
        executedToday: Object.keys(dispatchedToday).length,
        lastOrderPoll,
        lastOrderError,
      });
    });
    return true;
  }
});

async function forwardMarketwatch(payload) {
  const { token, enabled } = await chrome.storage.local.get(["token", "enabled"]);
  if (enabled === false || !token) return;
  try {
    const res = await fetch(MARKETWATCH_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-thunder-token": token },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      stats.sent = (stats.sent || 0) + 1;
      stats.lastFlush = Date.now();
      chrome.storage.local.set({ stats });
    }
  } catch (e) {
    stats.lastError = String(e?.message || e);
    chrome.storage.local.set({ stats });
  }
}

async function forwardL2(payload) {
  const { token, enabled } = await chrome.storage.local.get(["token", "enabled"]);
  if (enabled === false || !token) return;
  try {
    const res = await fetch(L2_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-thunder-token": token },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      stats.sent = (stats.sent || 0) + 1;
      stats.lastFlush = Date.now();
      chrome.storage.local.set({ stats });
    }
  } catch (e) {}
}

async function forwardTrades(payload) {
  const { token, enabled } = await chrome.storage.local.get(["token", "enabled"]);
  if (enabled === false || !token) return;
  try {
    const res = await fetch(TRADES_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-thunder-token": token },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      stats.sent = (stats.sent || 0) + 1;
      stats.lastFlush = Date.now();
      chrome.storage.local.set({ stats });
    }
  } catch (e) {}
}

async function pollPositions() {
  const cfg = await chrome.storage.local.get(["token", "enabled"]);
  if (cfg.enabled === false || !cfg.token) return;
  try {
    const res = await fetch(POSITIONS_ENDPOINT, {
      method: "GET",
      headers: { "x-thunder-token": cfg.token },
    });
    if (res.ok) {
      const json = await res.json();
      openPositions = json?.positions || {};
    }
  } catch (e) {}
}

async function pollOrders() {
  // Keeping order polling minimal for now, focusing on the new ingestion.
}

async function autoInjectThunderTabs() {
  const tabs = await chrome.tabs.query({ url: ["https://web.thndr.app/*", "https://x.thndr.app/*"] });
  stats.injectedTabs = tabs.length;
  chrome.storage.local.set({ stats });
}

// Initialization
autoInjectThunderTabs();
pollPositions();
pollOrders();
