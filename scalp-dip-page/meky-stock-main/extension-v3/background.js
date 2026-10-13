/*
 * Thunder Live Ticks v3 — Chrome Debugger API approach.
 *
 * Why this works when v2 didn't:
 *  - chrome.debugger attaches at the CDP layer, BELOW the page's CSP.
 *  - We get raw WebSocket frames and HTTP response bodies BEFORE Thunder's
 *    JS even sees them — no `world: MAIN` injection, no fetch override race,
 *    no DOM scraping.
 *  - The browser decrypts TLS for us. Firebase wire frames arrive as plain
 *    text strings we can JSON.parse / regex.
 *
 * Failure modes we handle up-front:
 *  1. MV3 service worker dies after ~30s idle → chrome.alarms heartbeat
 *     every 25s pings stayAlive(), and we re-attach on wake.
 *  2. Tab reload / navigation detaches the debugger silently →
 *     chrome.debugger.onDetach reattaches automatically (unless user clicked
 *     "Cancel" in the yellow bar — then we surface the error in popup).
 *  3. DevTools open on the same tab blocks attach with
 *     "Another debugger is already attached" → we detect & show clear error.
 *  4. We don't know exact URL patterns Thunder uses today → "discovery mode"
 *     for the first 60s records every URL + 1 sample body to chrome.storage
 *     so we can read them from popup and tune patterns without rebuilding.
 *  5. JSONP responses aren't valid JSON → strip `callback(...)` wrapper.
 *  6. Most frames are heartbeats / auth → permissive walker that finds any
 *     {price-like number} paired with a {symbol-or-uuid string} sibling, so
 *     we don't need to hardcode Thunder's schema.
 *  7. Symbols come as UUIDs in some frames → we cache the watchlist response
 *     (which contains both `id` and `symbol`) and translate on the fly.
 *  8. Backend may be down → ticks buffer with cap; on flush failure we keep
 *     last 200 ticks and retry next flush.
 *  9. User has multiple Thunder tabs → we only attach to the one they pick
 *     from popup, and re-pick on navigation.
 * 10. Yellow "is being debugged" bar can't be hidden → popup explains it
 *     once, with a "I understand" toggle stored locally.
 */

const BACKEND_ENDPOINT = "https://meky-stock.onrender.com/api/public/hooks/thunder-ticks";
const FLUSH_MS = 2500;
const FALLBACK_FLUSH_ALARM_MINUTES = 1;
const HEARTBEAT_MS = 25_000;
const DISCOVERY_WINDOW_MS = 60_000;
const MAX_BUFFER = 500;
const DEBUGGER_VERSION = "1.3";

// In-memory state (rebuilt from chrome.storage on wake)
let attachedTabId = null;
let buffer = [];
let uuidToSymbol = {}; // {uuid: "COMI.CA"}
let stats = {
  attached: false,
  framesSeen: 0,
  ticksParsed: 0,
  ticksSent: 0,
  ticksDropped: 0,
  lastTick: null,
  lastFlush: 0,
  lastError: null,
  lastUrl: null,
  discoveryUntil: 0,
};
let discoveryLog = []; // [{url, ts, sampleSnippet}]
let token = "";
let flushTimer = null;
let flushInFlight = false;
let rawSamples = []; // last 8 raw WS frames for debugging

// ---------- boot ----------

chrome.storage.local.get(["attachedTabId", "uuidToSymbol", "stats", "token", "discoveryLog"]).then((s) => {
  uuidToSymbol = s.uuidToSymbol || {};
  stats = { ...stats, ...(s.stats || {}), attached: false }; // attached resets on SW wake
  token = s.token || "";
  discoveryLog = s.discoveryLog || [];
  // If we were attached before SW death, try to reattach to the same tab.
  if (s.attachedTabId) {
    reattachIfPossible(s.attachedTabId).catch((e) => {
      stats.lastError = "reattach failed: " + (e?.message || String(e));
      persistStats();
    });
  }
});

chrome.alarms.create("heartbeat", { periodInMinutes: HEARTBEAT_MS / 60_000 });
// Chrome alarms are not reliable below ~30-60s depending on the browser.
// Real-time ticks need an immediate debounce flush; this alarm is only a safety net.
chrome.alarms.create("flush", { periodInMinutes: FALLBACK_FLUSH_ALARM_MINUTES });

chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === "flush") flush().catch(() => {});
  if (a.name === "heartbeat") {
    // Just touching storage is enough to keep SW alive past idle.
    chrome.storage.local.set({ _hb: Date.now() });
  }
});

// ---------- popup messaging ----------

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      if (msg.type === "getStatus") {
        sendResponse({
          ok: true,
          stats,
          attachedTabId,
          mappedSymbols: Object.keys(uuidToSymbol).length,
          buffered: buffer.length,
          discoveryLog: discoveryLog.slice(-20),
          rawSamples: rawSamples.slice(-8),
          token: token ? "set (" + token.length + " chars)" : "missing",
        });
      } else if (msg.type === "setToken") {
        token = (msg.token || "").trim();
        await chrome.storage.local.set({ token });
        sendResponse({ ok: true });
      } else if (msg.type === "attachActiveTab") {
        const tab = await pickThunderTab();
        if (!tab) {
          sendResponse({ ok: false, error: "افتح صفحة web.thndr.app الأول وادخل قائمة المراقبة." });
          return;
        }
        await attach(tab.id);
        sendResponse({ ok: true, tabId: tab.id, title: tab.title });
      } else if (msg.type === "detach") {
        await detach();
        sendResponse({ ok: true });
      } else if (msg.type === "clearDiscovery") {
        discoveryLog = [];
        await chrome.storage.local.set({ discoveryLog });
        sendResponse({ ok: true });
      } else {
        sendResponse({ ok: false, error: "unknown_message" });
      }
    } catch (e) {
      sendResponse({ ok: false, error: e?.message || String(e) });
    }
  })();
  return true; // async
});

// ---------- attach / detach ----------

async function pickThunderTab() {
  const tabs = await chrome.tabs.query({ url: ["https://web.thndr.app/*", "https://*.thndr.app/*"] });
  if (!tabs.length) return null;
  // Prefer the active one in the focused window.
  const active = tabs.find((t) => t.active) || tabs[0];
  return active;
}

async function attach(tabId) {
  if (attachedTabId === tabId && stats.attached) return;
  try {
    await chrome.debugger.attach({ tabId }, DEBUGGER_VERSION);
  } catch (e) {
    if (!String(e?.message || "").includes("Another debugger")) throw e;
    // Already attached (probably DevTools open). Tell the user.
    throw new Error("اقفل DevTools على نفس التاب وحاول تاني (debugger متاح لجهة واحدة بس).");
  }
  attachedTabId = tabId;
  stats.attached = true;
  stats.lastError = null;
  stats.discoveryUntil = Date.now() + DISCOVERY_WINDOW_MS;
  await chrome.storage.local.set({ attachedTabId });
  await chrome.debugger.sendCommand({ tabId }, "Network.enable", {});
  // Some Thunder traffic is WebSocket — enable explicit WS events.
  try {
    await chrome.debugger.sendCommand({ tabId }, "Network.setCacheDisabled", { cacheDisabled: false });
  } catch {}
  persistStats();
}

async function detach() {
  if (attachedTabId != null) {
    try { await chrome.debugger.detach({ tabId: attachedTabId }); } catch {}
  }
  attachedTabId = null;
  stats.attached = false;
  await chrome.storage.local.set({ attachedTabId: null });
  persistStats();
}

async function reattachIfPossible(tabId) {
  // Confirm tab still exists and is Thunder.
  let tab;
  try { tab = await chrome.tabs.get(tabId); } catch { return; }
  if (!tab.url || !/thndr\.app/.test(tab.url)) return;
  await attach(tabId);
}

chrome.debugger.onDetach.addListener((source, reason) => {
  if (source.tabId !== attachedTabId) return;
  stats.attached = false;
  stats.lastError = "detached: " + reason;
  persistStats();
  // "canceled_by_user" → don't auto-reattach (user clicked cancel on yellow bar).
  // "target_closed" / "replaced_with_devtools" → don't reattach.
  if (reason === "target_closed" || reason === "canceled_by_user" || reason === "replaced_with_devtools") {
    attachedTabId = null;
    chrome.storage.local.set({ attachedTabId: null });
    return;
  }
  // Page navigation → try reattach after a moment.
  setTimeout(() => {
    if (attachedTabId) reattachIfPossible(attachedTabId).catch(() => {});
  }, 1500);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === attachedTabId) {
    attachedTabId = null;
    stats.attached = false;
    chrome.storage.local.set({ attachedTabId: null });
  }
});

// ---------- CDP event handling ----------

chrome.debugger.onEvent.addListener(async (source, method, params) => {
  if (source.tabId !== attachedTabId) return;
  stats.framesSeen++;

  try {
    if (method === "Network.webSocketFrameReceived") {
      const payload = params?.response?.payloadData;
      if (payload) handlePayload(payload, params?.response?.opcode === 1 ? "ws-text" : "ws-bin", "ws://" + (params?.requestId || ""));
    } else if (method === "Network.eventSourceMessageReceived") {
      handlePayload(params?.data || "", "sse", "sse://" + (params?.requestId || ""));
    } else if (method === "Network.responseReceived") {
      const url = params?.response?.url || "";
      if (!shouldInspect(url)) return;
      // Defer body fetch slightly — body isn't ready exactly at responseReceived.
      const reqId = params.requestId;
      setTimeout(() => {
        chrome.debugger.sendCommand({ tabId: source.tabId }, "Network.getResponseBody", { requestId: reqId })
          .then((res) => {
            if (!res?.body) return;
            const body = res.base64Encoded ? atob(res.body) : res.body;
            handlePayload(body, "http", url);
          })
          .catch(() => {});
      }, 250);
    }
  } catch (e) {
    stats.lastError = "event: " + (e?.message || String(e));
    persistStats();
  }
});

function shouldInspect(url) {
  if (!url) return false;
  // Skip static assets / images / fonts.
  if (/\.(png|jpe?g|gif|svg|webp|ico|woff2?|ttf|css|map)(\?|$)/i.test(url)) return false;
  // Only Thunder + Firebase REST mirrors.
  return /thndr\.app|firebaseio|firebasedatabase|googleapis\.com.*identitytoolkit/i.test(url);
}

// ---------- parsing ----------

function handlePayload(raw, kind, url) {
  stats.lastUrl = url;
  // Always keep last few raw WS frames for live debugging from popup.
  if (kind === "ws-text" || kind === "ws-bin") {
    rawSamples.push({ ts: Date.now(), kind, sample: String(raw).slice(0, 400) });
    if (rawSamples.length > 16) rawSamples = rawSamples.slice(-16);
  }
  if (Date.now() < stats.discoveryUntil) {
    discoveryLog.push({ url, kind, ts: Date.now(), sample: String(raw).slice(0, 300) });
    if (discoveryLog.length > 200) discoveryLog = discoveryLog.slice(-200);
    chrome.storage.local.set({ discoveryLog });
  }

  // 1) Try JSON (strip JSONP wrapper if present).
  let parsed = tryParseJson(raw);
  if (parsed) {
    // First: enrich UUID→symbol map if this looks like a watchlist/instruments list.
    extractSymbolMap(parsed);
    // Firebase Realtime DB wire format: {t:"d", d:{b:{p:"path/uuid/field", d:<value-or-object>}}}
    extractFirebaseTicks(parsed);
    // Then: walk to find {price, symbol/uuid} pairs.
    const ticks = walkForTicks(parsed);
    for (const t of ticks) enqueueTick(t);
    return;
  }

  // 2) Firebase long-polling / WS uses lines like `{"t":"d","d":{...}}`.
  //    Try line-by-line.
  const lines = String(raw).split(/\n+/);
  for (const ln of lines) {
    if (!ln.trim().startsWith("{")) continue;
    const p = tryParseJson(ln);
    if (p) {
      extractSymbolMap(p);
      extractFirebaseTicks(p);
      for (const t of walkForTicks(p)) enqueueTick(t);
    }
  }
}

function tryParseJson(raw) {
  if (!raw || typeof raw !== "string") return null;
  const s = raw.trim();
  try { return JSON.parse(s); } catch {}
  // JSONP: `cb(123,[...])` or `cb({...})`
  const m = s.match(/^[\w$.]+\((.*)\)\s*;?\s*$/s);
  if (m) {
    try { return JSON.parse("[" + m[1] + "]"); } catch {
      try { return JSON.parse(m[1]); } catch {}
    }
  }
  return null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SYMBOL_RE = /^[A-Z][A-Z0-9.\-_]{1,15}$/;
// SAFE STRATEGY: permissive last-trade match + explicit blocklist for
// non-trade fields. Going narrower (e.g. only "lastPrice") risks missing
// Thunder's real field name and breaking the feed entirely. The blocklist
// is what prevented the AJWA 173.50 (bid) and 143 (prev close) leaks.
const PRICE_FIELD_RE = /^(price|last|p|lastPrice|last_price|tradePrice|trade_price|ltp|lastTradePrice|lastTraded|currentPrice|nav)$/i;
const NON_TRADE_FIELDS = new Set([
  "bid", "ask", "bidPrice", "askPrice", "bid_price", "ask_price",
  "open", "high", "low", "close", "previousClose", "prevClose",
  "prev_close", "openPrice", "highPrice", "lowPrice", "closePrice",
  "referencePrice", "reference_price", "avgPrice", "vwap",
]);

// Handle Firebase Realtime DB protocol frames.
// Shapes seen in the wild:
//   {t:"d", d:{b:{p:"marketFeed/<uuid>/lastPrice", d:12.98}}}
//   {t:"d", d:{b:{p:"marketFeed/<uuid>", d:{lastPrice:12.98, volume:1000}}}}
//   {t:"d", d:{b:{p:"marketFeed", d:{"<uuid>":{lastPrice:12.98}}}}}
function extractFirebaseTicks(obj) {
  walk(obj, (node) => {
    if (!node || typeof node !== "object") return;
    const b = node.b;
    if (!b || typeof b !== "object") return;
    const p = b.p;
    const d = b.d;
    if (typeof p !== "string" || d == null) return;
    const segments = p.split("/").filter(Boolean);
    const uuidInPath = segments.find((s) => UUID_RE.test(s))?.toLowerCase();
    const lastSeg = segments[segments.length - 1];

    // Case A: d is a number — last path segment is the field name.
    if (typeof d === "number" && d > 0 && d < 100_000) {
      if (PRICE_FIELD_RE.test(lastSeg) && uuidInPath) {
        const sym = uuidToSymbol[uuidInPath];
        if (sym) enqueueTick({ symbol: sym, price: d, volume: null, uuid: uuidInPath });
      }
      return;
    }

    // Case B: d is an object — may contain price fields directly, or be keyed by uuid.
    if (typeof d === "object") {
      // B1: keyed by uuid
      for (const [k, v] of Object.entries(d)) {
        if (UUID_RE.test(k) && v && typeof v === "object") {
          const price = pickPrice(v);
          if (price != null) {
            const sym = uuidToSymbol[k.toLowerCase()];
            if (sym) enqueueTick({ symbol: sym, price, volume: pickVolume(v), uuid: k.toLowerCase() });
          }
        }
      }
      // B2: d itself describes one instrument
      const price = pickPrice(d);
      if (price != null && uuidInPath) {
        const sym = uuidToSymbol[uuidInPath];
        if (sym) enqueueTick({ symbol: sym, price, volume: pickVolume(d), uuid: uuidInPath });
      }
    }
  });
}

function pickPrice(o) {
  if (!o || typeof o !== "object") return null;
  for (const k of Object.keys(o)) {
    if (NON_TRADE_FIELDS.has(k)) continue;
    if (PRICE_FIELD_RE.test(k) && typeof o[k] === "number" && o[k] > 0 && o[k] < 100_000) return o[k];
  }
  return null;
}
function pickVolume(o) {
  if (!o || typeof o !== "object") return null;
  for (const k of ["volume", "qty", "quantity", "size", "v", "vol", "tradeQty", "trade_qty"]) {
    if (typeof o[k] === "number" && o[k] >= 0 && o[k] < 1e12) return o[k];
  }
  return null;
}

function extractSymbolMap(obj) {
  // Heuristic: any object that has both `id` (uuid) and `symbol` (ticker).
  walk(obj, (node) => {
    if (node && typeof node === "object" && !Array.isArray(node)) {
      const id = node.id || node.uuid || node.instrument_id;
      const sym = node.symbol || node.ticker || node.code;
      if (id && sym && UUID_RE.test(String(id)) && SYMBOL_RE.test(String(sym).toUpperCase())) {
        const u = String(id).toLowerCase();
        const s = String(sym).toUpperCase();
        if (uuidToSymbol[u] !== s) {
          uuidToSymbol[u] = s;
        }
      }
    }
  });
  chrome.storage.local.set({ uuidToSymbol });
}

function walkForTicks(obj) {
  const out = [];
  walk(obj, (node, path) => {
    if (!node || typeof node !== "object") return;
    // Permissive match — must NOT be a non-trade field (bid/ask/close).
    const priceKey = ["lastPrice", "last_price", "tradePrice", "trade_price", "ltp", "lastTradePrice", "price", "last", "p"].find(
      (k) => !NON_TRADE_FIELDS.has(k) && typeof node[k] === "number" && node[k] > 0 && node[k] < 100_000,
    );
    if (!priceKey) return;
    const price = node[priceKey];
    // Optional volume in same node.
    const volKey = ["volume", "qty", "quantity", "size", "v", "lastSize", "tradeQty", "trade_qty", "vol"].find(
      (k) => typeof node[k] === "number" && node[k] >= 0 && node[k] < 1e12,
    );
    const volume = volKey ? node[volKey] : null;
    // Find symbol or uuid in same node OR in path.
    let symbol = null, uuid = null;
    const symKey = ["symbol", "ticker", "s", "sym", "code"].find((k) => typeof node[k] === "string");
    if (symKey && SYMBOL_RE.test(node[symKey].toUpperCase())) symbol = node[symKey].toUpperCase();
    const idKey = ["id", "uuid", "instrument_id", "i"].find((k) => typeof node[k] === "string" && UUID_RE.test(node[k]));
    if (idKey) uuid = node[idKey].toLowerCase();
    // Also scan path for a uuid segment (Firebase path like `marketFeed/<uuid>/price`).
    if (!uuid) {
      for (const p of path) {
        if (typeof p === "string" && UUID_RE.test(p)) { uuid = p.toLowerCase(); break; }
      }
    }
    if (!symbol && uuid && uuidToSymbol[uuid]) symbol = uuidToSymbol[uuid];
    if (symbol) out.push({ symbol, price, volume, uuid });
  });
  return out;
}

function walk(node, visit, path = []) {
  visit(node, path);
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) walk(node[i], visit, path.concat(i));
  } else if (node && typeof node === "object") {
    for (const k of Object.keys(node)) walk(node[k], visit, path.concat(k));
  }
}

// ---------- buffering & flush ----------

function enqueueTick(t) {
  stats.ticksParsed++;
  const tick = { symbol: t.symbol, price: t.price, volume: t.volume ?? null, ts: new Date().toISOString(), uuid: t.uuid };
  stats.lastTick = { symbol: tick.symbol, price: tick.price, ts: tick.ts };
  if (buffer.length >= MAX_BUFFER) {
    buffer.shift();
    stats.ticksDropped++;
  }
  buffer.push(tick);
  scheduleFlush();
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush().catch(() => {});
  }, FLUSH_MS);
}

async function flush() {
  if (!buffer.length) return;
  if (flushInFlight) return;
  if (!token) { stats.lastError = "token missing — افتح popup وحط الـ token"; persistStats(); return; }
  flushInFlight = true;
  // De-dupe by symbol — keep latest price.
  const latestBySymbol = {};
  for (const t of buffer) latestBySymbol[t.symbol] = t;
  const ticks = Object.values(latestBySymbol);
  try {
    const res = await fetch(BACKEND_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-thunder-token": token },
      body: JSON.stringify({ ticks }),
    });
    if (!res.ok) {
      const details = await res.text().catch(() => "");
      stats.lastError = `flush ${res.status}: ${details.slice(0, 180)}`;
      // Keep last 200 for retry.
      buffer = buffer.slice(-200);
    } else {
      stats.ticksSent += ticks.length;
      stats.lastFlush = Date.now();
      stats.lastError = null;
      buffer = [];
    }
  } catch (e) {
    stats.lastError = "flush net: " + (e?.message || String(e));
    buffer = buffer.slice(-200);
  } finally {
    flushInFlight = false;
  }
  persistStats();
}

function persistStats() {
  chrome.storage.local.set({ stats });
}