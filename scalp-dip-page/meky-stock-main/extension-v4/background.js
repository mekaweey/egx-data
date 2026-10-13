/* Background service worker.
 * - Phase 1: ticks ingest (read-only)  → handleTicks/handleWatchlist/flush
 * - Phase 2: Semi-Auto orders         → pollOrders + dispatchOrder
 * - Phase 3: Remote Config (v2.2.0)   → config.js (kill_switch + live updates)
 *
 * Semi-Auto rules:
 *   - Auto-Execute is OFF by default. User must enable in popup.
 *   - Max N orders per day (user-configurable, default 3).
 *   - Per-order timeout: skip only after expires_at (server-controlled).
 *   - We DO NOT click the final "مراجعة الطلب" / confirm button. We stop
 *     at the prepared form so the user reviews and submits.
 */

importScripts("config.js");

// === v4 Unified: CDP module ===
// Load synchronously so its message listeners (cdp.*) are registered the moment
// the service worker wakes — even before the user toggles tickCDP on.
// Registering listeners does NOT trigger Chrome's yellow "is being debugged"
// bar — only chrome.debugger.attach() does, and that runs only when the user
// clicks "اتصل بتاب ثاندر" in the popup.
try { importScripts("cdp-module.js"); }
catch (e) { console.warn("[v4] cdp-module load failed:", e); }

// v4.2.0 — Extension-owned keepalive context.
// The previous anti-freeze lived inside Thunder tabs, so if Chrome froze the
// tab, the recovery code froze with it. Offscreen runs as an extension document
// and is only used for extension lifecycle/watchdog pings — it does NOT call
// Thunder and does NOT touch Thunder pages.
const OFFSCREEN_DOCUMENT_PATH = "offscreen.html";
const OFFSCREEN_WATCHDOG_ALARM = "thunderOffscreenWatchdog";
const L2_RECOVERY_WATCHDOG_ALARM = "thunderL2RecoveryWatchdog";
let offscreenCreating = null;
let offscreenLastPing = 0;
let offscreenEnsureCount = 0;
let offscreenLastError = null;

async function hasOffscreenDocument() {
  if (!chrome.offscreen) return false;
  const offscreenUrl = chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH);
  try {
    if (chrome.runtime.getContexts) {
      const contexts = await chrome.runtime.getContexts({
        contextTypes: ["OFFSCREEN_DOCUMENT"],
        documentUrls: [offscreenUrl],
      });
      return contexts.length > 0;
    }
    const clients = await self.clients.matchAll();
    return clients.some((client) => client.url === offscreenUrl);
  } catch {
    return false;
  }
}

async function ensureOffscreenDocument(reason = "boot") {
  if (!chrome.offscreen?.createDocument) return false;
  if (await hasOffscreenDocument()) return true;
  if (offscreenCreating) {
    await offscreenCreating;
    return true;
  }
  offscreenCreating = chrome.offscreen.createDocument({
    url: OFFSCREEN_DOCUMENT_PATH,
    reasons: ["WORKERS"],
    justification: `Thunder extension watchdog context (${reason}); no Thunder network calls.`,
  });
  try {
    await offscreenCreating;
    offscreenEnsureCount++;
    offscreenLastError = null;
    return true;
  } catch (e) {
    offscreenLastError = String(e?.message || e);
    console.warn("[Offscreen] create failed", offscreenLastError);
    return false;
  } finally {
    offscreenCreating = null;
  }
}

chrome.alarms?.create?.(OFFSCREEN_WATCHDOG_ALARM, { periodInMinutes: 0.5 });
chrome.alarms?.create?.(L2_RECOVERY_WATCHDOG_ALARM, { periodInMinutes: 0.5 });
async function forceL2Disabled() {
  try { await chrome.storage.local.set({ l2AutoCycleEnabled: false }); } catch {}
}
chrome.runtime.onStartup?.addListener?.(() => {
  ensureOffscreenDocument("startup").catch(() => {});
  forceL2Disabled().catch(() => {});
});
chrome.runtime.onInstalled?.addListener?.(() => { ensureOffscreenDocument("installed").catch(() => {}); });
ensureOffscreenDocument("service-worker-boot").catch(() => {});
forceL2Disabled().catch(() => {});

// First-install: seed v4_features with safe defaults.
chrome.runtime.onInstalled?.addListener?.(async () => {
  const { v4_features } = await chrome.storage.local.get(["v4_features"]);
  if (!v4_features) {
    await chrome.storage.local.set({
      v4_features: { tickHooks: true, tickCDP: false, orders: true, positions: true, sellT0: true, overlay: true, driftGuard: true }
    });
  }
  // Migrate legacy `token` → `v4_token` so popup field stays populated.
  const { token, v4_token } = await chrome.storage.local.get(["token", "v4_token"]);
  if (!v4_token && token) await chrome.storage.local.set({ v4_token: token });
  // v4.2.5 — L2 automation is forcibly OFF. The DIP workflow does not need
  // L2 collection, and existing installs may still have the old flag saved as true.
  await forceL2Disabled();
  await chrome.storage.local.set({
    marketwatchStats: {
      lastOk: 0,
      lastError: "passive_marketwatch_waiting_for_thunder_response",
      lastForward: 0,
      lastInserted: 0,
      lastAssets: 0,
      lastSameDay: 0,
      tokenSeenAt: 0,
      pollRunning: false,
      pollPage: "passive-only",
      source: "thunder-passive-marketwatch",
    },
  }).catch(() => {});
});

const FLUSH_MS = 2000;
const ORDER_POLL_MS = 1000;
const POSITIONS_POLL_MS = 2000;
const AUTO_INJECT_MS = 2000;
const BACKEND_LIVE_POLL_MS = 60000;
const MAX_BUFFER = 500;
const CONTENT_SCRIPT_VERSION = "v4.2.37-bg-keepalive";
// v4.1.63 — Math-only viability guard (لا يلمس قراءة ثاندر ولا حالة التاب).
// أُزيلت الفحوصات المعتمدة على السعر اللحظي (stale price, slippage, day high)
// عشان منمنعش صفقة بسبب تأخر تحديث من قائمة المراقبة.  الفحوصات الباقية
// كلها حسابية بحتة (عمولة + سقف الموجة السابقة + هدف الاستراتيجية).
const MIN_SCALP_CASH_EGP = 1000;
const MIN_SCALP_NOTIONAL_EGP = 900;
const TARGET_NET_PROFIT_PCT = 0.005;
const MAX_REQUIRED_MOVE_PCT = 0.012;
// Default "source of truth" tab for live prices/watchlist mapping. The user
// configures this in the popup; only messages from a tab whose URL starts
// with this prefix are accepted as price/watchlist input. This prevents a
// newly opened order tab (e.g. /ar/assets/<uuid>) from silently becoming
// the data source and breaking the original watchlist long-poll.
const DEFAULT_PRICE_SOURCE_URL = "https://web.thndr.app/ar/watchlist";
const EXECUTE_ORDER_MESSAGE = "executeOrderV3";
const ACTIVE_TRADE_LEDGER_KEY = "v4_active_scalp_trades";
const SIGNAL_LEDGER_KEY = "v4_scalp_signals";
const DEFAULT_ENDPOINT = "https://meky-stock.onrender.com/api/public/hooks/thunder-ticks";
const QUOTES_ENDPOINT = "https://meky-stock.onrender.com/api/public/hooks/thunder-quotes";
const BACKEND_LIVE_POLL_ENDPOINT = "https://meky-stock.onrender.com/api/public/hooks/live-tick-poll";
const ORDERS_ENDPOINT = "https://meky-stock.onrender.com/api/public/hooks/thunder-orders";
const POSITIONS_ENDPOINT = "https://meky-stock.onrender.com/api/public/hooks/thunder-positions";
const TRADES_ENDPOINT = "https://meky-stock.onrender.com/api/public/hooks/extension-trades";
const ORDERBOOK_ENDPOINT = "https://meky-stock.onrender.com/api/public/hooks/orderbook-snapshot";

// v4.2.21: L2 is passive-only. We store Thunder's own market-depth responses,
// but keep tab-opening automation disabled to avoid extra Thunder traffic.
const L2_TAB_AUTOMATION_ENABLED = false;
const L2_RECORDING_ENABLED = true;
const WATCHLIST_ENDPOINT = "https://meky-stock.onrender.com/api/public/hooks/thunder-watchlist";
const MARKETWATCH_ENDPOINT = "https://meky-stock.onrender.com/api/public/hooks/thunder-marketwatch";
const TAPE_ENDPOINT = "https://meky-stock.onrender.com/api/public/hooks/thunder-tape";
const TIMELINE_ENDPOINT = "https://meky-stock.onrender.com/api/public/hooks/scalp-timeline";
const TELEMETRY_ENDPOINT = "https://meky-stock.onrender.com/api/public/hooks/extension-telemetry";
const TRADE_JOURNAL_KEY = "v4_trade_journal";  // { "YYYY-MM-DD": [tradeRow,...] }
const CAPTURE_KEY = "v4_capture_session";       // { active, startedAt, expiresAt, symbol, events: [] }
const CAPTURE_MAX_EVENTS = 800;
const CAPTURE_DEFAULT_TTL_MS = 20 * 60 * 1000;

// ---- Redaction for captured Thunder responses ----
const HEADER_DROP = /^(authorization|cookie|set-cookie|x-firebase-.*|x-thndr-token|x-api-key|x-auth.*)$/i;
const KEY_REDACT = /(token|secret|password|jwt|api[_-]?key|refresh[_-]?token|id[_-]?token|access[_-]?token|cookie|auth|bearer|session|csrf|xsrf|signature|sig|otp|pin)/i;
const KEY_PARTIAL = /(user_id|account_id|customer_id|email|phone|mobile|national_id|nin|iban)/i;
// Catch raw JWTs that slip through under innocent keys (3 base64url parts).
const JWT_RE = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g;
function redactJwtsInString(s) {
  if (typeof s !== "string") return s;
  return s.replace(JWT_RE, "***JWT_REDACTED***");
}
function redactUrl(u) {
  if (typeof u !== "string" || !u) return u || "";
  try {
    const url = new URL(u);
    for (const k of Array.from(url.searchParams.keys())) {
      if (KEY_REDACT.test(k)) url.searchParams.set(k, "***REDACTED***");
      else if (KEY_PARTIAL.test(k)) url.searchParams.set(k, redactValue(url.searchParams.get(k) || ""));
      else url.searchParams.set(k, redactJwtsInString(url.searchParams.get(k) || ""));
    }
    return url.toString();
  } catch { return redactJwtsInString(u); }
}

function redactHeaders(h) {
  const out = {};
  if (!h || typeof h !== "object") return out;
  for (const k of Object.keys(h)) {
    if (HEADER_DROP.test(k)) { out[k] = "***REDACTED***"; continue; }
    out[k] = h[k];
  }
  return out;
}
function redactValue(v) {
  if (typeof v !== "string") return "***REDACTED***";
  if (v.length <= 8) return "***";
  return v.slice(0, 4) + "***" + v.slice(-2);
}
function redactObj(node, depth = 0) {
  if (depth > 8 || node == null) return node;
  if (Array.isArray(node)) return node.map((x) => redactObj(x, depth + 1));
  if (typeof node === "string") return redactJwtsInString(node);
  if (typeof node !== "object") return node;
  const out = {};
  for (const k of Object.keys(node)) {
    if (KEY_REDACT.test(k)) { out[k] = "***REDACTED***"; continue; }
    if (KEY_PARTIAL.test(k)) { out[k] = redactValue(node[k]); continue; }
    out[k] = redactObj(node[k], depth + 1);
  }
  return out;
}
function redactBody(text) {
  if (typeof text !== "string" || !text) return text || null;
  // Try JSON; if not JSON return as-is (truncated upstream).
  try {
    const parsed = JSON.parse(text);
    return JSON.stringify(redactObj(parsed));
  } catch {
    // Non-JSON (form-urlencoded, plain text): still scrub JWTs and obvious key=value secrets.
    let s = redactJwtsInString(text);
    s = s.replace(/(token|secret|password|jwt|api[_-]?key|refresh[_-]?token|id[_-]?token|access[_-]?token|bearer|session|csrf|xsrf|signature|otp|pin)=([^&\s]+)/gi, "$1=***REDACTED***");
    return s;
  }
}

async function getCaptureSession() {
  const s = await chrome.storage.local.get([CAPTURE_KEY]);
  return s[CAPTURE_KEY] || null;
}
async function setCaptureSession(sess) {
  await chrome.storage.local.set({ [CAPTURE_KEY]: sess });
}
async function recordCaptureEvent(raw) {
  const sess = await getCaptureSession();
  if (!sess || !sess.active) return;
  if (Date.now() > sess.expiresAt) { sess.active = false; await setCaptureSession(sess); return; }
  const ev = {
    ts_ms: raw.ts_ms || Date.now(),
    source: raw.source || "fetch",
    method: raw.method || "GET",
    url: redactUrl(raw.url || ""),
    status: raw.status || 0,
    req_body: redactBody(raw.req_body),
    resp_headers: redactHeaders(raw.resp_headers || {}),
    resp_body: redactBody(raw.resp_body),
    page_url: redactUrl(raw.page_url || ""),
  };
  sess.events = sess.events || [];
  sess.events.push(ev);
  if (sess.events.length > CAPTURE_MAX_EVENTS) sess.events = sess.events.slice(-CAPTURE_MAX_EVENTS);
  sess.lastEventAt = ev.ts_ms;
  await setCaptureSession(sess);
}
async function startCaptureSession(opts) {
  const sess = {
    active: true,
    startedAt: Date.now(),
    expiresAt: Date.now() + (opts?.ttlMs || CAPTURE_DEFAULT_TTL_MS),
    symbol: opts?.symbol || null,
    uuid: opts?.uuid || null,
    events: [],
    lastEventAt: null,
  };
  await setCaptureSession(sess);
  // Flip the page-script flag in every Thunder tab.
  const tabs = await chrome.tabs.query({ url: ["https://web.thndr.app/*", "https://*.thndr.app/*"] });
  for (const t of tabs) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: t.id, allFrames: true },
        world: "MAIN",
        func: () => { try { window.__thunderCapture = true; } catch {} },
      });
    } catch {}
  }
  return sess;
}
async function stopCaptureSession() {
  const sess = await getCaptureSession();
  if (sess) { sess.active = false; sess.stoppedAt = Date.now(); await setCaptureSession(sess); }
  const tabs = await chrome.tabs.query({ url: ["https://web.thndr.app/*", "https://*.thndr.app/*"] });
  for (const t of tabs) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: t.id, allFrames: true },
        world: "MAIN",
        func: () => { try { window.__thunderCapture = false; } catch {} },
      });
    } catch {}
  }
  return sess;
}
async function clearCaptureSession() { await chrome.storage.local.remove([CAPTURE_KEY]); }

// Re-arm capture flag on every Thunder tab load while session is active.
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (info.status !== "complete") return;
  if (!/^https:\/\/([^/]+\.)?thndr\.app\//.test(tab?.url || "")) return;
  const sess = await getCaptureSession();
  if (!sess || !sess.active) return;
  if (Date.now() > sess.expiresAt) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      world: "MAIN",
      func: () => { try { window.__thunderCapture = true; } catch {} },
    });
  } catch {}
});

// Open cheapest stock + start capture. Symbol must already exist in mapping
// (i.e. user visited Thunder watchlist before). Falls back to opening
// Thunder home so user can add it manually.
async function startCaptureForSymbol(symbol) {
  const sym = String(symbol || "").trim().toUpperCase();
  const entry = Object.entries(mapping).find(([, m]) => normalizeSymbol(m?.symbol) === sym);
  const uuid = entry ? entry[0] : null;
  const url = uuid ? `https://web.thndr.app/ar/assets/${uuid}` : "https://web.thndr.app/ar";
  const tab = await createThunderSiblingTab(url, { active: true });
  // Wait briefly for the page to register before enabling the flag.
  await new Promise((r) => setTimeout(r, 1500));
  await startCaptureSession({ symbol: sym, uuid });
  return { ok: true, symbol: sym, uuid, url, tabId: tab?.id, hasMapping: !!uuid };
}

async function getThunderAnchorTab() {
  const tabs = await chrome.tabs.query({ url: ["https://web.thndr.app/*", "https://*.thndr.app/*"] }).catch(() => []);
  if (!tabs?.length) return null;
  const activeCurrent = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
  const activeThunder = activeCurrent.find((t) => isSafeThndrUrl(t?.url));
  if (activeThunder?.id) return activeThunder;
  const normalTabs = [];
  for (const tab of tabs) {
    if (!tab?.id || !tab?.windowId) continue;
    try {
      const win = await chrome.windows.get(tab.windowId);
      if (win?.type === "normal") normalTabs.push(tab);
    } catch {}
  }
  const candidates = normalTabs.length ? normalTabs : tabs;
  const notL2 = (t) => !/#l2(?:persist|cycle)/i.test(String(t?.url || ""));
  const sourcePrefix = String(getConfig("price_source_url", DEFAULT_PRICE_SOURCE_URL) || DEFAULT_PRICE_SOURCE_URL);
  return candidates.find((t) => notL2(t) && String(t.url || "").startsWith(sourcePrefix))
    || candidates.find((t) => notL2(t) && /\/watchlist/i.test(String(t.url || "")))
    || candidates.find((t) => notL2(t))
    || candidates[0]
    || null;
}

async function createThunderSiblingTab(url, opts = {}) {
  const anchor = await getThunderAnchorTab();
  const createProps = { url, active: opts.active !== false };
  if (anchor?.windowId != null) createProps.windowId = anchor.windowId;
  if (Number.isInteger(anchor?.index)) createProps.index = anchor.index + 1;
  const tab = await chrome.tabs.create(createProps);
  try { await chrome.tabs.update(tab.id, { autoDiscardable: false }); } catch {}
  if (tab?.windowId != null && createProps.active) {
    try { await chrome.windows.update(tab.windowId, { focused: true }); } catch {}
  }
  return tab;
}

// Thunder Egypt commission (verified): 3 EGP fixed + 0.03% of value per side.
function calcFee(value) {
  const v = Number(value) || 0;
  if (v <= 0) return 0;
  return Number((3 + 0.0003 * v).toFixed(4));
}
function cairoDateStr(d = new Date()) {
  return new Date(d.toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
    .toISOString().slice(0, 10);
}

let buffer = [];
let quotesBuffer = [];
let quotesStats = { sent: 0, dropped: 0, lastFlush: 0, lastError: null, lastQuote: null };
let lastQuoteBySymbol = {}; // symbol(UPPER) -> {bid, ask, ts}
let mapping = {};                          // uuid -> { symbol, name, day_tradable }
let stats = { sent: 0, dropped: 0, lastFlush: 0, lastError: null, jsonpCalls: 0, jsonpWithFeed: 0, wsMessages: 0, wsWithFeed: 0, domTicks: 0, backendPolls: 0, backendPollRows: 0, lastBackendPoll: 0, injectedTabs: 0, lastInject: 0, injectError: null, lastTick: null, crossTabDropped: 0 };
let priceSourceUrl = DEFAULT_PRICE_SOURCE_URL;
let dispatchedToday = {};                  // orderId -> true (in-memory dedupe)
let inFlightOrders = {};                   // orderId -> true while preparing it
let failedOrders = {};                     // orderId -> true after a terminal local failure; prevents UI click loops
let lastOrderPoll = 0;
let lastOrderError = null;
let openPositions = {};                    // symbol(UPPER) -> { id, qty, tp, sl, entry }
let triggeredSells = {};                   // position_id -> ts (dedupe local sells)
let lastPositionsPoll = 0;
let lastPositionsError = null;
let detectedPositionPosts = {};            // symbol -> last post ts (dedupe Thunder portfolio sniffing)
let registeredBuyFills = {};               // symbol|qty|price -> ts (dedupe register_buy_fill posts)
let armedInstantBrackets = {};             // symbol -> ts (dedupe instant-bracket arms per symbol per day)
let keepAlivePort = null;
let lastKeepAlivePing = 0;
let latestPriceBySymbol = {};              // symbol -> { price, ts }
let dayStatsDate = cairoDateStr();
let dayStatsBySymbol = {};                 // symbol -> { high, low, latest, updatedAt }
let marketwatchStats = {
  lastOk: 0,
  lastError: null,
  lastForward: 0,
  lastInserted: 0,
  lastAssets: 0,
  lastSameDay: 0,
  tokenSeenAt: 0,
  pollRunning: false,
  pollPage: null,
  source: null,
};
let marketwatchInFlight = false;
let tapeInFlight = false;

async function runMarketwatchPassiveRefresh(reason = "timer") {
  marketwatchStats.lastError = "active_poll_disabled_passive_only";
  marketwatchStats.pollRunning = false;
  marketwatchStats.pollPage = `passive-only:${reason}`.slice(0, 80);
  await chrome.storage.local.set({ marketwatchStats }).catch(() => {});
  return { ok: false, skipped: "active_poll_disabled_passive_only" };
}

chrome.storage.local.get(["mapping", "stats"]).then((s) => {
  mapping = s.mapping || {};
  stats = { ...stats, ...(s.stats || {}) };
});

chrome.storage.local.get(["marketwatchStats"]).then((s) => {
  if (s.marketwatchStats && typeof s.marketwatchStats === "object") {
    marketwatchStats = { ...marketwatchStats, ...s.marketwatchStats };
  }
});
// Load + watch the configured price-source URL prefix.
chrome.storage.local.get(["priceSourceUrl"]).then((s) => {
  if (typeof s.priceSourceUrl === "string" && s.priceSourceUrl.trim()) {
    priceSourceUrl = s.priceSourceUrl.trim();
  }
});
chrome.storage.onChanged?.addListener?.((changes, area) => {
  if (area !== "local") return;
  if (changes.priceSourceUrl) {
    const v = changes.priceSourceUrl.newValue;
    priceSourceUrl = (typeof v === "string" && v.trim()) ? v.trim() : DEFAULT_PRICE_SOURCE_URL;
  }
});

/**
 * Returns true if the sender tab URL is the user's configured price source.
 * Empty/unknown URL → reject (e.g. message came from a frame we can't trust).
 * If priceSourceUrl is empty (user cleared it), we fall back to accepting any
 * Thunder tab to preserve old behaviour.
 */
function isPriceSourceSender(sender) {
  const url = sender?.tab?.url || sender?.url || "";
  if (!priceSourceUrl) return /^https:\/\/([^/]+\.)?thndr\.app\//.test(url);
  return typeof url === "string" && url.startsWith(priceSourceUrl);
}

// Phase 3: تشغيل Remote Config + Realtime عند بدء الـ service worker
initRemoteConfig().catch(() => {});
chrome.runtime.onStartup?.addListener?.(() => { initRemoteConfig().catch(() => {}); });
chrome.runtime.onInstalled?.addListener?.(() => { initRemoteConfig().catch(() => {}); });
chrome.runtime.onStartup?.addListener?.(() => { autoInjectThunderTabs().catch(() => {}); });
chrome.runtime.onInstalled?.addListener?.(() => { autoInjectThunderTabs().catch(() => {}); });
chrome.alarms?.create?.("thunderSemiAutoHeartbeat", { periodInMinutes: 0.5 });
chrome.alarms?.onAlarm?.addListener?.((alarm) => {
  if (alarm.name === OFFSCREEN_WATCHDOG_ALARM) {
    ensureOffscreenDocument("alarm").catch(() => {});
    chrome.storage.local.set({
      offscreenWatchdog: {
        lastPing: offscreenLastPing || null,
        ensureCount: offscreenEnsureCount,
        lastError: offscreenLastError,
        checkedAt: Date.now(),
      },
    }).catch(() => {});
    return;
  }
  if (alarm.name === L2_RECOVERY_WATCHDOG_ALARM) {
    recoverPersistentL2Tabs().catch(() => {});
    return;
  }
  if (alarm.name !== "thunderSemiAutoHeartbeat") return;
  flush().catch(() => {});
  pollOrders().catch(() => {});
  pollPositions().catch(() => {});
  autoInjectThunderTabs().catch(() => {});
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg) return;
  lastKeepAlivePing = Date.now();
  if (msg.type === "offscreen.ping") {
    offscreenLastPing = Number(msg.ts) || Date.now();
    return;
  }
  // Hard filter: price/watchlist signals must come from the configured
  // watchlist tab only. Order tabs, mock pages, asset pages, etc. are ignored
  // for price ingestion so they cannot hijack the data source.
  const isPriceMsg = msg.type === "ticks" || msg.type === "watchlist" || msg.type === "jsonp" || msg.type === "ws" || msg.type === "quotes";
  if (isPriceMsg && !isPriceSourceSender(_sender)) {
    stats.crossTabDropped = (stats.crossTabDropped || 0) + 1;
    chrome.storage.local.set({ stats });
    return;
  }
  if (msg.type === "ticks") {
    handleTicks(msg.payload);
  } else if (msg.type === "quotes") {
    handleQuotes(msg.payload);
  } else if (msg.type === "jsonp") {
    stats.jsonpCalls = (stats.jsonpCalls || 0) + 1;
    if (msg.payload?.hasFeed) stats.jsonpWithFeed = (stats.jsonpWithFeed || 0) + 1;
    chrome.storage.local.set({ stats });
  } else if (msg.type === "ws") {
    stats.wsMessages = (stats.wsMessages || 0) + 1;
    if (msg.payload?.hasFeed) stats.wsWithFeed = (stats.wsWithFeed || 0) + 1;
    chrome.storage.local.set({ stats });
  } else if (msg.type === "watchlist") {
    handleWatchlist(msg.payload);
  } else if (msg.type === "marketwatch") {
    forwardMarketwatch(msg.payload).catch(() => {});
  } else if (msg.type === "tape") {
    forwardTape(msg.payload).catch(() => {});
  } else if (msg.type === "thunderAuthToken") {
    sendResponse({ ok: false, skipped: "auth_token_capture_disabled" });
    return true;
  } else if (msg.type === "marketwatchPoll") {
    runMarketwatchPassiveRefresh("content-poll").then(sendResponse).catch((e) => sendResponse({ ok: false, error: String(e?.message || e).slice(0, 160) }));
    return true;
  } else if (msg.type === "marketwatchStatus") {
    updateMarketwatchStatus(msg.payload || {});
  } else if (msg.type === "orderStatus") {
    // Content script reports back: { id, status, error_message? }
    reportOrderStatus(msg.payload).catch(() => {});
  } else if (msg.type === "buyFill") {
    // page-script detected confirmed buy fills in a Thunder JSON response.
    // We forward each one to the server so it can create a `positions` row
    // (TP/SL pulled from the matching paper_trades on the server side).
    registerBuyFills(msg.payload).catch(() => {});
    // Timeline: real Thunder-confirmed buy fill.
    try {
      const fills = Array.isArray(msg.payload) ? msg.payload : [];
      const now = Date.now();
      for (const f of fills) {
        if (!f?.symbol) continue;
        recordTimelineEvent({
          signal_id: f.order_id ? String(f.order_id) : null,
          symbol: normalizeSymbol(f.symbol),
          uuid: f.uuid || null,
          event: "buy_confirmed",
          at_ms: now,
          meta: { qty: Number(f.qty) || null, price: Number(f.price) || null },
        }).catch(() => {});
        // v4.1.93 — Instant-Bracket: بمجرد تأكيد الشراء، حضّر فورم البيع
        // بسعر TP بدل ما ننتظر التيك يوصل الهدف. مقفول افتراضياً.
        armInstantBracketIfEnabled(normalizeSymbol(f.symbol)).catch(() => {});
      }
    } catch {}
  } else if (msg.type === "sellFill") {
    registerSellFills(msg.payload).catch(() => {});
    try {
      const fills = Array.isArray(msg.payload) ? msg.payload : [];
      const now = Date.now();
      for (const f of fills) {
        if (!f?.symbol) continue;
        recordTimelineEvent({
          signal_id: f.order_id ? String(f.order_id) : null,
          symbol: normalizeSymbol(f.symbol),
          uuid: f.uuid || null,
          event: "sell_confirmed",
          at_ms: now,
          meta: { qty: Number(f.qty) || null, price: Number(f.price) || null },
        }).catch(() => {});
      }
    } catch {}
  } else if (msg.type === "l2Snapshot") {
    recordOrderbookSnapshot(msg.payload || {}).catch(() => {});
  } else if (msg.type === "timelineEvent") {
    recordTimelineEvent(msg.payload || {}).catch(() => {});
  } else if (msg.type === "captureEvent") {
    recordCaptureEvent(msg.payload || {}).catch(() => {});
  } else if (msg.type === "capture.start") {
    startCaptureForSymbol(msg.payload?.symbol || "COPR")
      .then(sendResponse)
      .catch((e) => sendResponse({ ok: false, error: String(e?.message || e) }));
    return true;
  } else if (msg.type === "capture.stop") {
    stopCaptureSession().then((s) => sendResponse({ ok: true, session: s })).catch((e) => sendResponse({ ok: false, error: String(e?.message || e) }));
    return true;
  } else if (msg.type === "capture.status") {
    getCaptureSession().then((s) => sendResponse({ ok: true, session: s })).catch((e) => sendResponse({ ok: false, error: String(e?.message || e) }));
    return true;
  } else if (msg.type === "capture.clear") {
    clearCaptureSession().then(() => sendResponse({ ok: true })).catch((e) => sendResponse({ ok: false, error: String(e?.message || e) }));
    return true;
  } else if (msg.type === "capture.armForSignal") {
    // In-place arm: do NOT open a tab. Used by content.js when a Scalp signal
    // triggers a buy. Reuses any existing active session (extends TTL) so a
    // single session captures buy + fill + sell across the whole flow.
    (async () => {
      try {
        const existing = await getCaptureSession();
        const sym = String(msg.payload?.symbol || "").toUpperCase() || null;
        const uuid = msg.payload?.uuid || null;
        const meta = msg.payload?.meta || null;
        if (existing && existing.active && Date.now() < (existing.expiresAt || 0)) {
          existing.expiresAt = Date.now() + (45 * 60_000);
          existing.signalMeta = meta || existing.signalMeta || null;
          if (!existing.symbol && sym) existing.symbol = sym;
          await setCaptureSession(existing);
          sendResponse({ ok: true, reused: true, session: existing });
        } else {
          const sess = await startCaptureSession({ symbol: sym, uuid, ttlMs: 45 * 60_000 });
          sess.signalMeta = meta || null;
          await setCaptureSession(sess);
          sendResponse({ ok: true, reused: false, session: sess });
        }
      } catch (e) { sendResponse({ ok: false, error: String(e?.message || e) }); }
    })();
    return true;
  } else if (msg.type === "getStatus") {
    autoInjectThunderTabs().catch(() => {});
    chrome.storage.local.get(["autoExec", "maxPerDay", "egpPerTrade"]).then((cfg) => {
      sendResponse({
        mappedSymbols: Object.keys(mapping).length,
        buffered: buffer.length,
        stats,
        autoExec: cfg.autoExec === true,
        maxPerDay: cfg.maxPerDay ?? 3,
        egpPerTrade: Math.max(MIN_SCALP_CASH_EGP, Number(cfg.egpPerTrade) || MIN_SCALP_CASH_EGP),
        executedToday: Object.keys(dispatchedToday).length,
        lastOrderPoll,
        lastOrderError,
        marketwatch: {
          ...marketwatchStats,
          hasToken: false,
          tokenAgeSec: null,
        },
        quotes: quotesStats,
        offscreen: {
          lastPingAgeSec: offscreenLastPing ? Math.round((Date.now() - offscreenLastPing) / 1000) : null,
          ensureCount: offscreenEnsureCount,
          lastError: offscreenLastError,
        },
        remoteConfig: getRemoteConfigStatus(),
      });
    });
    return true;
  } else if (msg.type === "clearMapping") {
    mapping = {};
    chrome.storage.local.set({ mapping });
    sendResponse({ ok: true });
    return true;
  } else if (msg.type === "runLocalOrderTest") {
    runLocalOrderTest().then(sendResponse).catch((e) => sendResponse({ ok: false, error: String(e?.message || e) }));
    return true;
  } else if (msg.type === "runLocalSellTest") {
    runLocalSellTest().then(sendResponse).catch((e) => sendResponse({ ok: false, error: String(e?.message || e) }));
    return true;
  } else if (msg.type === "runOpenTabTest") {
    runOpenTabTest().then(sendResponse).catch((e) => sendResponse({ ok: false, error: String(e?.message || e) }));
    return true;
  } else if (msg.type === "getSymbolForUuid") {
    const uuid = normalizeUuid(msg.payload?.uuid);
    const sym = uuid ? mapping[uuid]?.symbol || null : null;
    sendResponse({ ok: true, symbol: sym ? normalizeSymbol(sym) : null });
    return true;
  } else if (msg.type === "getTradeJournal") {
    getTradeJournal(msg.payload?.date).then(sendResponse).catch((e) => sendResponse({ ok: false, error: String(e?.message || e) }));
    return true;
  } else if (msg.type === "openPersistTab") {
    // v4.1.84: manual re-open of a persistent L2 tab from the web app
    // (used when Thunder logs the user out and their tab closes).
    if (L2_TAB_AUTOMATION_ENABLED !== true) {
      sendResponse({ ok: false, disabled: true, error: "l2_disabled" });
      return true;
    }
    const sym = normalizeSymbol(msg.payload?.symbol);
    if (!sym) { sendResponse({ ok: false, error: "no_symbol" }); return true; }
    (async () => {
      try {
        // If a persistent tab is already tracked, focus it instead of opening a duplicate.
        const existing = persistTabs.get(sym);
        if (existing) {
          try {
            const t = await chrome.tabs.get(existing.tabId);
            if (t) {
              try { await chrome.tabs.update(existing.tabId, { active: true }); } catch {}
              sendResponse({ ok: true, reused: true, tabId: existing.tabId });
              return;
            }
          } catch { persistTabs.delete(sym); }
        }
        const opened = await persistOpenSymbol(sym);
        sendResponse({ ok: !!opened, symbol: sym });
      } catch (e) {
        sendResponse({ ok: false, error: String(e?.message || e) });
      }
    })();
    return true;
  }
});

function updateMarketwatchStatus(payload) {
  marketwatchStats = {
    ...marketwatchStats,
    lastOk: Number(payload.lastOk) || marketwatchStats.lastOk || 0,
    lastError: payload.lastError == null ? null : String(payload.lastError).slice(0, 160),
    lastAssets: Number(payload.lastAssets) || 0,
    lastSameDay: Number(payload.lastSameDay) || 0,
    tokenSeenAt: Number(payload.tokenSeenAt) || marketwatchStats.tokenSeenAt || 0,
    pollRunning: payload.running === true,
    pollPage: payload.page ? String(payload.page).slice(0, 80) : marketwatchStats.pollPage,
  };
  chrome.storage.local.set({ marketwatchStats }).catch(() => {});
}

async function forwardMarketwatch(payload) {
  if (marketwatchInFlight) return;
  if (!payload || !Array.isArray(payload.assets) || payload.assets.length === 0) return;
  const toMarketwatchInteger = (value) => {
    if (value === "" || value == null) return null;
    const n = typeof value === "string" ? Number(value.replace(/,/g, "").trim()) : Number(value);
    return Number.isFinite(n) ? Math.round(n) : null;
  };
  const normalizedPayload = {
    ...payload,
    assets: payload.assets.map((a) => ({
      ...a,
      total_volume: toMarketwatchInteger(a?.total_volume),
      total_trades: toMarketwatchInteger(a?.total_trades),
      total_bids: toMarketwatchInteger(a?.total_bids),
      total_asks: toMarketwatchInteger(a?.total_asks),
      total_buy: toMarketwatchInteger(a?.total_buy),
      total_sell: toMarketwatchInteger(a?.total_sell),
      highest_bid_qty: toMarketwatchInteger(a?.highest_bid_qty),
      lowest_ask_qty: toMarketwatchInteger(a?.lowest_ask_qty),
    })),
  };
  const usefulRows = payload.assets.filter((a) =>
    (Number(a?.total_volume) || 0) > 0 ||
    (Number(a?.total_trades) || 0) > 0 ||
    (Number(a?.total_value) || 0) > 0
  ).length;
  if (usefulRows === 0) {
    marketwatchStats.lastAssets = payload.assets.length;
    marketwatchStats.lastSameDay = Number(payload.same_day) || payload.assets.filter((a) => a?.is_same_day === true).length || 0;
    marketwatchStats.lastError = "ignored_marketwatch_without_real_volume";
    marketwatchStats.source = payload.source ? String(payload.source).slice(0, 80) : "unknown";
    await chrome.storage.local.set({ marketwatchStats }).catch(() => {});
    return;
  }
  marketwatchStats.lastAssets = payload.assets.length;
  marketwatchStats.lastSameDay = Number(payload.same_day) || payload.assets.filter((a) => a?.is_same_day === true).length || 0;
  marketwatchStats.source = payload.source ? String(payload.source).slice(0, 80) : "unknown";
  const { enabled, token } = await chrome.storage.local.get(["enabled", "token"]);
  if (enabled === false) return;
  if (!token) { marketwatchStats.lastError = "no_ingest_token"; chrome.storage.local.set({ marketwatchStats }).catch(() => {}); return; }
  marketwatchInFlight = true;
  try {
    const res = await fetch(MARKETWATCH_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-thunder-token": token },
      body: JSON.stringify(normalizedPayload),
    });
    marketwatchStats.lastForward = Date.now();
    if (!res.ok) { marketwatchStats.lastError = `server_http_${res.status}`; return; }
    const json = await res.json().catch(() => ({}));
    marketwatchStats.lastOk = Date.now();
    marketwatchStats.lastInserted = Number(json?.inserted) || normalizedPayload.assets.length;
    marketwatchStats.lastError = null;
  } catch (e) {
    marketwatchStats.lastError = String(e?.message || e).slice(0, 160);
  } finally {
    marketwatchInFlight = false;
    chrome.storage.local.set({ marketwatchStats }).catch(() => {});
  }
}

async function forwardTape(payload) {
  if (tapeInFlight) return;
  if (!payload || typeof payload !== "object") return;
  const assetId = String(payload.asset_id || "").trim().toLowerCase();
  const trades = Array.isArray(payload.trades) ? payload.trades : [];
  if (!assetId || trades.length === 0) return;
  const { enabled, token } = await chrome.storage.local.get(["enabled", "token"]);
  if (enabled === false) return;
  if (!token) return;
  tapeInFlight = true;
  try {
    await fetch(TAPE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-thunder-token": token },
      body: JSON.stringify({
        asset_id: assetId,
        symbol: payload.symbol || null,
        captured_at: payload.captured_at || new Date().toISOString(),
        trades: trades.slice(0, 500),
      }),
    });
  } finally {
    tapeInFlight = false;
  }
}

chrome.runtime.onConnect?.addListener?.((port) => {
  if (port?.name !== "thunder-v4-keepalive") return;
  keepAlivePort = port;
  lastKeepAlivePing = Date.now();
  port.onMessage?.addListener?.((msg) => {
    if (msg?.type === "keepalive") {
      lastKeepAlivePing = Date.now();
      try { port.postMessage({ ok: true, ts: lastKeepAlivePing }); } catch {}
    }
  });
  port.onDisconnect?.addListener?.(() => {
    if (keepAlivePort === port) keepAlivePort = null;
  });
});

function handleWatchlist(arr) {
  let changed = false;
  for (const item of arr || []) {
    if (!item?.uuid || !item?.symbol) continue;
    const cur = mapping[item.uuid];
    if (!cur || cur.symbol !== item.symbol) {
      mapping[item.uuid] = {
        symbol: item.symbol,
        name: item.name || null,
        day_tradable: !!item.day_tradable,
      };
      changed = true;
    }
  }
  if (changed) chrome.storage.local.set({ mapping });
  // Passive server persistence — one snapshot per uuid per hour is enough
  // (these fields change slowly). Zero new Thunder traffic.
  recordWatchlistSnapshots(arr).catch(() => {});
}

function handleTicks(arr) {
  if (!Array.isArray(arr)) return;
  const enriched = [];
  for (const t of arr) {
    const directSymbol = normalizeSymbol(t.symbol);
    const m = mapping[t.uuid];
    const symbol = directSymbol || normalizeSymbol(m?.symbol);
    if (!symbol) { stats.dropped++; continue; }
    if (t.uuid && directSymbol && (!m || normalizeSymbol(m.symbol) !== directSymbol)) {
      mapping[t.uuid] = { ...(m || {}), symbol: directSymbol };
      chrome.storage.local.set({ mapping }).catch(() => {});
    }
    const row = { symbol, price: t.price, ts: t.ts, uuid: t.uuid, volume: t.volume ?? null };
    buffer.push(row);
    enriched.push(row);
    rememberLocalPrice(symbol, t.price, t.ts);
    if (t.source === "dom") stats.domTicks = (stats.domTicks || 0) + 1;
    stats.lastTick = { symbol, price: Number(t.price) || 0, ts: Date.now() };
    // Local sell-watcher: detect TP/SL hits instantly on the tick stream.
    checkLocalSell(symbol, t.price).catch(() => {});
  }
  if (buffer.length > MAX_BUFFER) buffer = buffer.slice(-MAX_BUFFER);
  if (enriched.length) chrome.storage.local.set({ stats }).catch(() => {});
  if (enriched.length) broadcastToThunderTabs({ type: "ticksUpdate", payload: enriched.slice(-100) });
  if (enriched.length) flush().catch(() => {});
}

function handleQuotes(arr) {
  if (!Array.isArray(arr)) return;
  const now = Date.now();
  let accepted = 0;
  for (const q of arr) {
    if (!q || typeof q !== "object") continue;
    const directSymbol = normalizeSymbol(q.symbol);
    const m = q.uuid ? mapping[q.uuid] : null;
    const symbol = directSymbol || normalizeSymbol(m?.symbol);
    if (!symbol) { quotesStats.dropped++; continue; }
    const bid = Number(q.bid);
    const ask = Number(q.ask);
    const hasBid = Number.isFinite(bid) && bid > 0 && bid < 100000;
    const hasAsk = Number.isFinite(ask) && ask > 0 && ask < 100000;
    if (!hasBid && !hasAsk) { quotesStats.dropped++; continue; }
    const row = {
      symbol,
      uuid: q.uuid || null,
      bid: hasBid ? bid : null,
      ask: hasAsk ? ask : null,
      ts: q.ts || new Date().toISOString(),
    };
    // Dedupe: skip if identical to last known quote for this symbol within 500ms.
    const prev = lastQuoteBySymbol[symbol];
    if (prev && prev.bid === row.bid && prev.ask === row.ask && (now - prev.ts) < 500) {
      continue;
    }
    lastQuoteBySymbol[symbol] = { bid: row.bid, ask: row.ask, ts: now };
    quotesBuffer.push(row);
    accepted++;
    quotesStats.lastQuote = { symbol, bid: row.bid, ask: row.ask, ts: now };
  }
  if (quotesBuffer.length > MAX_BUFFER) quotesBuffer = quotesBuffer.slice(-MAX_BUFFER);
  if (accepted) {
    chrome.storage.local.set({ quotesStats }).catch(() => {});
    flushQuotes().catch(() => {});
  }
}

let flushingQuotes = false;
async function flushQuotes() {
  if (flushingQuotes) return;
  if (quotesBuffer.length === 0) return;
  const { enabled, token } = await chrome.storage.local.get(["enabled", "token"]);
  if (enabled === false) return;
  if (!token) { quotesStats.lastError = "no_token_configured"; return; }
  flushingQuotes = true;
  const batch = quotesBuffer.splice(0, quotesBuffer.length);
  try {
    const res = await fetch(QUOTES_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-thunder-token": token },
      body: JSON.stringify({ quotes: batch }),
    });
    if (!res.ok) {
      quotesStats.lastError = `http_${res.status}`;
      quotesBuffer = batch.concat(quotesBuffer).slice(-MAX_BUFFER);
      return;
    }
    const json = await res.json().catch(() => ({}));
    quotesStats.sent += (json?.inserted ?? batch.length);
    quotesStats.lastFlush = Date.now();
    quotesStats.lastError = null;
  } catch (e) {
    quotesStats.lastError = String(e?.message || e).slice(0, 160);
    quotesBuffer = batch.concat(quotesBuffer).slice(-MAX_BUFFER);
  } finally {
    flushingQuotes = false;
    chrome.storage.local.set({ quotesStats }).catch(() => {});
  }
}

function rememberLocalPrice(symbol, rawPrice, rawTs) {
  const sym = normalizeSymbol(symbol);
  const price = Number(rawPrice) || 0;
  if (!sym || price <= 0) return;
  const now = Date.now();
  const tsNum = typeof rawTs === "number" ? rawTs : new Date(rawTs || now).getTime();
  const ts = Number.isFinite(tsNum) ? tsNum : now;
  latestPriceBySymbol[sym] = { price, ts };
  const today = cairoDateStr();
  if (today !== dayStatsDate) {
    dayStatsDate = today;
    dayStatsBySymbol = {};
  }
  const prev = dayStatsBySymbol[sym] || { high: price, low: price, latest: price, updatedAt: ts };
  dayStatsBySymbol[sym] = {
    high: Math.max(Number(prev.high) || price, price),
    low: Math.min(Number(prev.low) || price, price),
    latest: price,
    updatedAt: Math.max(Number(prev.updatedAt) || 0, ts),
  };
}

function calcViabilitySafeSellPrice(buyPrice, qty, netProfitPct = TARGET_NET_PROFIT_PCT) {
  const p = Number(buyPrice) || 0;
  const q = Math.max(1, Math.floor(Number(qty) || 0));
  if (p <= 0 || q <= 0) return 0;
  const buyValue = p * q;
  const buyFee = calcFee(buyValue);
  const desiredNetProfit = buyValue * (Number(netProfitPct) || 0);
  // sellValue - sellFee >= buyValue + buyFee + desiredNetProfit
  // S*q - (3 + 0.0003*S*q) >= buyValue + buyFee + desiredNetProfit
  return (buyValue + buyFee + 3 + desiredNetProfit) / (q * (1 - 0.0003));
}

function numberFromMeta(meta, keys) {
  if (!meta || typeof meta !== "object") return 0;
  for (const key of keys) {
    const n = Number(meta[key]);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
}

function assessBuyViability(order, { qty, egp, qtyMode }) {
  const side = String(order?.side || "buy").toLowerCase();
  if (side === "sell") return { ok: true, reason: "sell_order" };

  const symbol = normalizeSymbol(order?.symbol);
  const refPrice = Number(order?.ref_price) || 0;
  if (!symbol || refPrice <= 0) return { ok: false, code: "missing_ref_price" };

  const latest = latestPriceBySymbol[symbol];
  const latestPrice = latest && Number(latest.price) > 0 ? Number(latest.price) : 0;
  // v4.1.63: استخدم السعر اللحظي لو موجود، وإلا ارجع لسعر الإشارة بدون منع
  // الصفقة. مفيش إجبار على تحديث حديث عشان منكسرش الشراء بسبب تأخر تاب.
  const entryPrice = latestPrice > 0 ? latestPrice : refPrice;
  const q = Math.max(1, Math.floor(Number(qty) || 0));
  const intendedCash = Math.max(0, Number(egp) || 0);
  const effectiveCash = qtyMode === "fixed" ? q * entryPrice : intendedCash;
  const expectedQty = qtyMode === "fixed" ? q : Math.max(1, Math.floor((effectiveCash || entryPrice) / entryPrice));
  const expectedNotional = expectedQty * entryPrice;

  if (qtyMode !== "fixed" && effectiveCash < MIN_SCALP_CASH_EGP) {
    return {
      ok: false,
      code: "cash_below_minimum",
      detail: `مبلغ الصفقة ${effectiveCash.toFixed(0)}ج أقل من الحد الآمن ${MIN_SCALP_CASH_EGP}ج`,
      entryPrice, refPrice, expectedQty, expectedNotional,
    };
  }
  if (expectedNotional < MIN_SCALP_NOTIONAL_EGP) {
    return {
      ok: false,
      code: "notional_below_minimum",
      detail: `القيمة المتوقعة ${expectedNotional.toFixed(0)}ج صغيرة والعمولة الثابتة هتأكل الربح`,
      entryPrice, refPrice, expectedQty, expectedNotional,
    };
  }

  const safeSell = calcViabilitySafeSellPrice(entryPrice, expectedQty, TARGET_NET_PROFIT_PCT);
  const requiredMovePct = safeSell > 0 ? (safeSell - entryPrice) / entryPrice : 0;
  if (requiredMovePct > MAX_REQUIRED_MOVE_PCT) {
    return {
      ok: false,
      code: "required_move_unrealistic",
      detail: `لازم السهم يطلع ${(requiredMovePct * 100).toFixed(2)}% بعد العمولات عشان يكسب`,
      entryPrice, refPrice, expectedQty, expectedNotional, safeSell, requiredMovePct,
    };
  }

  const meta = order?.metadata || {};
  const recentCeiling = numberFromMeta(meta, ["recent_ceiling_price", "lookback_ref_price", "pre_drop_price"]);
  if (recentCeiling > 0 && safeSell > recentCeiling) {
    return {
      ok: false,
      code: "safe_sell_above_recent_ceiling",
      detail: `سعر البيع الآمن ${safeSell.toFixed(2)} أعلى من سقف آخر حركة ${recentCeiling.toFixed(2)}`,
      entryPrice, refPrice, expectedQty, expectedNotional, safeSell, requiredMovePct, recentCeiling,
    };
  }

  const localDayHigh = Number(dayStatsBySymbol[symbol]?.high) || 0;
  const metaDayHigh = numberFromMeta(meta, ["day_high_so_far", "day_high", "high_so_far"]);
  const dayHigh = Math.max(localDayHigh, metaDayHigh);

  const strategyTp = numberFromMeta(meta, ["tp_price", "target_price", "theoretical_tp"]);
  if (strategyTp > 0 && safeSell > strategyTp) {
    return {
      ok: false,
      code: "safe_sell_above_strategy_target",
      detail: `سعر البيع الآمن ${safeSell.toFixed(2)} أعلى من هدف الاستراتيجية ${strategyTp.toFixed(2)}`,
      entryPrice, refPrice, expectedQty, expectedNotional, safeSell, requiredMovePct, strategyTp,
    };
  }

  return {
    ok: true,
    code: "viable",
    entryPrice, refPrice, expectedQty, expectedNotional, safeSell, requiredMovePct,
    dayHigh: dayHigh || null,
    usedFreshTick: latestPrice > 0,
  };
}

function formatViabilityBlock(v) {
  const parts = [v?.code || "blocked"];
  if (v?.detail) parts.push(v.detail);
  if (Number(v?.entryPrice) > 0) parts.push(`entry=${Number(v.entryPrice).toFixed(3)}`);
  if (Number(v?.refPrice) > 0) parts.push(`ref=${Number(v.refPrice).toFixed(3)}`);
  if (Number(v?.expectedQty) > 0) parts.push(`qty=${Number(v.expectedQty).toFixed(0)}`);
  if (Number(v?.safeSell) > 0) parts.push(`safeSell=${Number(v.safeSell).toFixed(3)}`);
  if (Number(v?.dayHigh) > 0) parts.push(`dayHigh=${Number(v.dayHigh).toFixed(3)}`);
  return parts.join(" | ").slice(0, 480);
}

async function pollPositions() {
  const cfg = await chrome.storage.local.get(["token", "enabled"]);
  if (cfg.enabled === false) return;
  if (!cfg.token) { lastPositionsError = "no_token_configured"; return; }
  try {
    const res = await fetch(POSITIONS_ENDPOINT, {
      method: "GET",
      headers: { "x-thunder-token": cfg.token },
    });
    lastPositionsPoll = Date.now();
    if (!res.ok) { lastPositionsError = `positions_http_${res.status}`; return; }
    const json = await res.json();
    const list = Array.isArray(json?.positions) ? json.positions : [];
    const next = {};
    for (const p of list) {
      const sym = normalizeSymbol(p.symbol);
      if (!sym) continue;
      next[sym] = {
        id: p.id,
        qty: Number(p.quantity) || 0,
        tp: Number(p.target_price) || 0,
        sl: Math.max(Number(p.stop_loss) || 0, Number(p.trailing_stop) || 0),
        entry: Number(p.entry_price) || 0,
        current: Number(p.current_price) || 0,
      };
    }
    openPositions = next;
      broadcastToThunderTabs({ type: "positionsUpdate", payload: openPositions });
    // Drop triggered entries for positions that are no longer open.
    for (const pid of Object.keys(triggeredSells)) {
      const stillOpen = Object.values(openPositions).some((p) => p.id === pid);
      if (!stillOpen) delete triggeredSells[pid];
    }
    lastPositionsError = null;
  } catch (e) {
    lastPositionsError = String(e?.message || e);
  }
}

// v4.1.93 — Instant-Bracket: بعد تأكيد الشراء بلحظات، نفتح فورم بيع limit عند TP
// مباشرةً بدلاً من انتظار وصول التيك للهدف. يستعمل نفس مسار
// prepareLocalSellFromPosition المُختبَر (سعر السوق مُلغى، الطلبات المتقدمة + T0،
// يتوقف قبل "مراجعة الطلب"). مقفول افتراضياً — يفعّله المستخدم من popup.
async function armInstantBracketIfEnabled(symbol) {
  const sym = normalizeSymbol(symbol);
  if (!sym) return;
  // v4.2.7 — Instant-Bracket is permanently disabled.
  // Reason: it prepared a local sell at TP immediately after buy fill,
  // bypassing the server-side runTargetSellL2Gate proof (67.7% real-fill
  // guarantee) that our scalp strategy depends on. Every sell must be
  // authorized by the server (sell-watcher / thunder-positions POST) so
  // the L2 gate runs on the freshest orderbook snapshot at TP-hit time.
  return;
  /* eslint-disable no-unreachable */
  // dedupe: صفقة واحدة/سهم/يوم
  const today = cairoDateStr();
  const key = `${sym}|${today}`;
  if (armedInstantBrackets[key]) return;
  const cfg = await chrome.storage.local.get(["instantBracketOnFill", "enabled"]);
  if (cfg.enabled === false) return;
  if (cfg.instantBracketOnFill !== true) return;
  armedInstantBrackets[key] = Date.now();
  // Poll openPositions حتى يظهر السهم بـ tp>0 (السيرفر بيعمله insert بعد registerBuyFill)
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    const pos = openPositions[sym];
    if (pos && pos.id && Number(pos.tp) > 0 && Number(pos.qty) > 0) {
      if (triggeredSells[pos.id]) return; // TP hit already handled sell
      triggeredSells[pos.id] = Date.now();
      lastPositionsError = `instant_bracket_arming_${sym}`;
      try {
        await prepareLocalSellFromPosition(sym, pos, Number(pos.tp), "auto_bracket");
        lastPositionsError = `instant_bracket_armed_${sym}`;
      } catch (e) {
        // فشل التحضير → اسمح للـ TP-hit fallback القديم يشتغل
        delete triggeredSells[pos.id];
        delete armedInstantBrackets[key];
        lastPositionsError = `instant_bracket_failed_${sym}: ${String(e?.message || e)}`;
      }
      return;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  // Timeout: مانتفعّلش الـ bracket، الـ TP-hit fallback القديم لسه شغّال
  delete armedInstantBrackets[key];
  lastPositionsError = `instant_bracket_timeout_${sym}`;
  /* eslint-enable no-unreachable */
}

async function checkLocalSell(symbol, price) {
  const sym = normalizeSymbol(symbol);
  const pos = openPositions[sym];
  if (!pos) return;
  if (triggeredSells[pos.id]) return;
  if (!(price > 0)) return;

  let reason = null;
  if (pos.tp > 0 && price >= pos.tp) reason = "target_hit";
  else if (pos.sl > 0 && price <= pos.sl) reason = "stop_hit";
  // EOD Force Sell — after 14:15 Cairo time, exit any still-open position
  // at whatever price is available. Priority: don't get the stock stuck
  // to next day (T+0 same-session constraint).
  if (!reason) {
    const cairoNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
    const mins = cairoNow.getHours() * 60 + cairoNow.getMinutes();
    if (mins >= 14 * 60 + 15 && mins < 14 * 60 + 28) {
      reason = "eod_force";
    } else {
      return;
    }
  }

  triggeredSells[pos.id] = Date.now();
  // v4.2.8 — every sell goes through the server:
  //   target_hit → POST /thunder-positions → runTargetSellL2Gate → inserts
  //                pending_orders only if L2 proves depth sellable at TP.
  //   stop_hit   → alert-only (unchanged). Stop-loss is not a profit exit,
  //                so it must not require L2 depth; the manual seller
  //                handles it.
  //   eod_force  → skip L2 gate, sell at current market price before close.
  broadcastToThunderTabs({
    type: "positionAlert",
    payload: { symbol: sym, reason, price, position_id: pos.id },
  });
  if (reason === "stop_hit") {
    lastPositionsError = `sl_hit_${sym}_alert_only`;
    return;
  }
  lastPositionsError = `${reason}_${sym}_requesting_server`;
  requestServerGatedSell(pos, reason, price).catch((e) => {
    lastPositionsError = `server_gate_request_failed_${sym}: ${String(e?.message || e)}`;
    // Allow retry if the server request itself failed (network/timeout).
    // Note: an L2-gate rejection is NOT a failure — the server will retry
    // the gate on next sell-watcher cron cycle when more depth arrives.
    delete triggeredSells[pos.id];
  });
}

// v4.2.7 — Ask the server to L2-gate and queue a sell for this position.
// Server runs runTargetSellL2Gate on the freshest orderbook_snapshots row.
// If it passes, server inserts pending_orders side=sell; pollOrders picks
// it up within 1s and prepares the form (stops at "مراجعة الطلب").
async function requestServerGatedSell(pos, reason, refPrice) {
  const cfg = await chrome.storage.local.get(["token"]);
  if (!cfg.token) throw new Error("no_token_configured");
  const res = await fetch(POSITIONS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-thunder-token": cfg.token },
    body: JSON.stringify({
      action: "sell",
      position_id: pos.id,
      reason,
      ref_price: Number(refPrice) || 0,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`http_${res.status}`);
  if (body?.ok === false && body?.reason === "sell_l2_gate_rejected") {
    // L2 gate said no — keep triggered flag OFF so we can re-check next tick.
    lastPositionsError = `l2_gate_rejected_${pos.symbol}: ${body?.detail || "no_depth"}`;
    delete triggeredSells[pos.id];
    return;
  }
  if (body?.ok !== true) throw new Error(String(body?.error || body?.reason || "unknown"));
  lastPositionsError = `server_queued_sell_${pos.symbol}_${reason}`;
}

// v4.2.7 — Handle the "buy confirmed via review click" backup from content.js.
// The primary path is `buyFill` (parsed from Thunder JSON). This handler is
// a safety net when JSON parsing missed the fill.
// v4.2.32: forward Thunder session-lost alerts to backend + Chrome notification.
const THUNDER_AUTH_ALERT_ENDPOINT =
  "https://meky-stock.onrender.com/api/public/hooks/thunder-auth-alert";
let __lastAuthAlertAt = 0;
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type !== "thunder-auth-lost") return;
  const now = Date.now();
  // Global dedupe (across tabs): one alert every 3 minutes.
  if (now - __lastAuthAlertAt < 180_000) return;
  __lastAuthAlertAt = now;
  const p = msg.payload || {};
  const url = String(p.url || sender?.tab?.url || "https://web.thndr.app/");
  const kind = String(p.kind || "login_required");
  const reason = String(p.reason || "");
  const message = `تم تسجيل خروجك من ثاندر — سجّل دخول فوراً من الموبايل حتى تستمر تجميع البيانات.`;
  // 1) Chrome notification with sound (requireInteraction so it stays on screen).
  try {
    chrome.notifications?.create?.(`thunder-auth-${now}`, {
      type: "basic",
      iconUrl: chrome.runtime.getURL("icon.png"),
      title: "🚨 ثاندر: انتهت الجلسة",
      message,
      priority: 2,
      requireInteraction: true,
    });
  } catch {}
  // 2) Forward to backend so /marketwatch-health can display a banner.
  try {
    fetch(THUNDER_AUTH_ALERT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        url,
        message: reason ? `${message} (${reason})` : message,
        client_id: (chrome.runtime?.id || "") + ":" + (sender?.tab?.id ?? "?"),
        extras: { reason, ts: now, version: "v4.2.32" },
      }),
    }).catch(() => {});
  } catch {}
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type !== "buyConfirmedByReview") return;
  const p = msg.payload || {};
  const symbol = String(p.symbol || "").toUpperCase();
  const qty = Number(p.qty) || 0;
  const entry_price = Number(p.entry_price) || 0;
  if (!symbol || qty <= 0 || entry_price <= 0) return;
  registerBuyFills([{ symbol, qty, entry_price, source: p.source || "review_click_backup" }]).catch(() => {});
});

async function prepareLocalSellFromPosition(symbol, pos, price, reason) {
  const sym = normalizeSymbol(symbol);
  if (!sym || !pos?.id) return;
  const uuid = uuidForSymbol(sym);
  if (!uuid) {
    broadcastToThunderTabs({
      type: "positionAlert",
      payload: { symbol: sym, reason, price, position_id: pos.id, error: "uuid_not_mapped" },
    });
    throw new Error(`uuid_not_mapped_${sym}`);
  }
  const targetUrl = `https://web.thndr.app/ar/assets/${uuid}`;
  const tab = await createThunderSiblingTab(targetUrl, { active: true });
  const orderId = `auto-sell-local-${pos.id}-${Date.now()}`;
  const refPrice = Number(pos.entry) || Number(price) || 0;
  const result = await sendExecuteOrderWhenReady(tab.id, {
    type: EXECUTE_ORDER_MESSAGE,
    payload: {
      orderId,
      symbol: sym,
      uuid,
      qty: Number(pos.qty) || 0,
      egp: 0,
      side: "sell",
      orderType: "limit",
      limitPrice: Number(pos.tp) || 0,
      refPrice,
      driftBps: 100,
      signalSource: `local_${reason}`,
      signalCreatedAt: new Date().toISOString(),
      metadata: { position_id: pos.id, reason, trigger_price: Number(price) || null, target_price: Number(pos.tp) || null, stop_loss: Number(pos.sl) || null },
    },
  }, 90_000);
  if (!result?.ok) throw new Error(result?.stage || result?.error || "sell_prepare_not_ok");
  lastPositionsError = `sell_prepared_${sym}_${reason}`;
}

async function flush() {
  if (buffer.length === 0) return;
  const { enabled, endpoint, token } = await chrome.storage.local.get(["enabled", "endpoint", "token"]);
  if (enabled === false) return;
  if (!token) { stats.lastError = "no_token_configured"; return; }
  const url = endpoint || DEFAULT_ENDPOINT;

  const batch = buffer.splice(0, buffer.length);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-thunder-token": token },
      body: JSON.stringify({ ticks: batch }),
    });
    if (!res.ok) {
      stats.lastError = `http_${res.status}`;
      buffer = batch.concat(buffer).slice(-MAX_BUFFER);
      return;
    }
    const json = await res.json().catch(() => ({}));
    stats.sent += (json?.inserted ?? batch.length);
    stats.lastFlush = Date.now();
    stats.lastError = null;
  } catch (e) {
    stats.lastError = String(e?.message || e);
    buffer = batch.concat(buffer).slice(-MAX_BUFFER);
  } finally {
    chrome.storage.local.set({ stats });
  }
}

// -------------------- Orders polling (Semi-Auto) --------------------

async function pollOrders() {
  const cfg = await chrome.storage.local.get(["token", "autoExec", "maxPerDay", "egpPerTrade", "enabled", "qtyMode", "fixedQty", "alwaysNewTab"]);
  if (cfg.enabled === false) return;
  if (cfg.autoExec !== true) return;
  // Phase 3: kill switch + global toggle من Remote Config (لحظي)
  if (getConfig("kill_switch", false) === true) { lastOrderError = "kill_switch_active"; return; }
  if (getConfig("semi_auto_enabled", true) === false) { lastOrderError = "semi_auto_disabled_globally"; return; }
  if (!cfg.token) { lastOrderError = "no_token_configured"; return; }

  const max = cfg.maxPerDay ?? 3;
  if (Object.keys(dispatchedToday).length + Object.keys(inFlightOrders).length >= max) {
    lastOrderError = `daily_cap_reached_${max}`;
    return;
  }

  try {
    const res = await fetch(ORDERS_ENDPOINT, {
      method: "GET",
      headers: { "x-thunder-token": cfg.token },
    });
    lastOrderPoll = Date.now();
    if (!res.ok) { lastOrderError = `orders_http_${res.status}`; return; }
    const json = await res.json();
    const orders = Array.isArray(json?.orders) ? json.orders : [];
    lastOrderError = null;

    for (const o of orders) {
      if (dispatchedToday[o.id] || inFlightOrders[o.id] || failedOrders[o.id]) continue;
      if (!["pending", "opened"].includes(o.status)) continue;
      if (o.expires_at && new Date(o.expires_at).getTime() <= Date.now()) continue;

      // Prefer uuid resolved from Thunder live ticks (v3 debugger extension),
      // fallback to old local watchlist mapping if available.
      const uuid = normalizeUuid(o.uuid) || uuidForSymbol(o.symbol);
      if (!uuid) {
        lastOrderError = `uuid_not_mapped_${o.symbol} — شغّل v3 على ثندر أو افتح قائمة المراقبة`;
        continue;
      }

      // Quantity decision (extension-side only — لا يمس الاستراتيجية):
      //  1) server-provided qty يفوز دائماً.
      //  2) qtyMode=fixed + fixedQty>0 → استخدم العدد الثابت.
      //  3) auto (افتراضي): المبلغ ÷ السعر اللحظي.
      const price = Number(o.ref_price) || 0;
      const explicitQty = Number(o.qty);
      const fixedQty = Math.floor(Number(cfg.fixedQty) || 0);
      let qty;
      let egp = Math.max(MIN_SCALP_CASH_EGP, Number(cfg.egpPerTrade) || MIN_SCALP_CASH_EGP);
      if (Number.isFinite(explicitQty) && explicitQty > 0) {
        qty = Math.floor(explicitQty);
        if (price > 0) egp = Math.max(MIN_SCALP_CASH_EGP, Math.floor(qty * price));
      } else if (cfg.qtyMode === "fixed" && fixedQty > 0) {
        qty = fixedQty;
        if (price > 0) egp = Math.max(MIN_SCALP_CASH_EGP, Math.floor(qty * price));
      } else {
        qty = price > 0 ? Math.max(1, Math.floor(egp / price)) : 1;
      }

      // v4.1.62 — Trade Viability Guard (BUY only): rejects mathematically bad
      // entries before opening Thunder.  This closes the WKOL-type hole where
      // a tiny notional or a slipped entry needs an unreachable sell price after
      // fees.  SELL orders are never blocked by this guard.
      const viability = assessBuyViability(o, { qty, egp, qtyMode: cfg.qtyMode === "fixed" ? "fixed" : "auto" });
      if (!viability.ok) {
        const msg = "viability_blocked: " + formatViabilityBlock(viability);
        lastOrderError = msg;
        failedOrders[o.id] = true;
        reportOrderStatus({ id: o.id, status: "error", error_message: msg });
        continue;
      }

      if (Object.keys(dispatchedToday).length + Object.keys(inFlightOrders).length >= max) break;
      inFlightOrders[o.id] = true;

      // Timeline: signal received by extension (before we touch Thunder).
      recordTimelineEvent({
        signal_id: String(o.id),
        symbol: normalizeSymbol(o.symbol),
        uuid,
        event: "signal_received",
        at_ms: Date.now(),
        meta: {
          side: o.side,
          ref_price: Number(o.ref_price) || null,
          order_type: o.order_type || null,
          limit_price: Number(o.limit_price) || null,
          qty,
          signal_created_at: o.created_at || null,
          signal_source: o.signal_source || null,
        },
      }).catch(() => {});

      // v4.1.60: نفتح تاب جديدة في نفس النافذة الحالية (مش نافذة منفصلة).
      // ده بيخلي تاب قائمة المراقبة محتفظة باتصال CDP بدون قطع، ومفيش
      // إشعار "انقطع الاتصال بثاندر" بعد كل إشارة. الـ throttling مش
      // بيقطع long-polling لأن التاب لسه موجودة في نفس النافذة المرئية،
      // والـ silent audio + autoDiscardable=false كفيلين بإبقائها نشطة.
      const targetUrl = `https://web.thndr.app/ar/assets/${uuid}`;
      let tab;
      try {
        tab = await createThunderSiblingTab(targetUrl, { active: true });
        recordTimelineEvent({
          signal_id: String(o.id),
          symbol: normalizeSymbol(o.symbol),
          uuid,
          event: "tab_opened",
          at_ms: Date.now(),
          meta: { tab_id: tab?.id || null },
        }).catch(() => {});
      } catch (e2) {
        lastOrderError = "tab_open_failed: " + String(e2?.message || e2);
        failedOrders[o.id] = true;
        delete inFlightOrders[o.id];
        continue;
      }

      prepareOrderInTab(tab.id, {
        type: EXECUTE_ORDER_MESSAGE,
        payload: {
          orderId: o.id,
          symbol: o.symbol,
          uuid,
          qty,
          egp,
          side: o.side,
          orderType: o.order_type,
          limitPrice: Number(o.limit_price) || 0,
          refPrice: Number(o.ref_price) || 0,
          driftBps: 100, // 1% adverse move triggers warning
          signalSource: o.signal_source,
          signalCreatedAt: o.created_at,
          metadata: o.metadata || null,
        },
      }).catch((e) => {
        lastOrderError = "prepare_failed: " + String(e?.message || e);
        failedOrders[o.id] = true;
        reportOrderStatus({ id: o.id, status: "error", error_message: lastOrderError });
      }).finally(() => {
        delete inFlightOrders[o.id];
      });
    }
  } catch (e) {
    lastOrderError = String(e?.message || e);
  }
}

function uuidForSymbol(symbol) {
  const want = normalizeSymbol(symbol);
  for (const [uuid, m] of Object.entries(mapping)) {
    if (normalizeSymbol(m?.symbol) === want) return uuid;
  }
  return null;
}

function normalizeSymbol(symbol) {
  return String(symbol || "").trim().toUpperCase();
}

function normalizeUuid(value) {
  const s = String(value || "").trim().toLowerCase();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(s) ? s : null;
}

async function autoInjectThunderTabs() {
  try {
    const tabs = await chrome.tabs.query({ url: ["https://web.thndr.app/*", "https://*.thndr.app/*"] });
    let injected = 0;
    for (const tab of tabs) {
      if (!tab?.id || !isSafeThndrUrl(tab.url)) continue;
      try {
        await ensureContentScript(tab.id);
        // Prevent Chrome from auto-discarding the watchlist / price tab when
        // it sits in the background for a long time. Discarded tabs lose
        // their long-polling connection silently.
        try { await chrome.tabs.update(tab.id, { autoDiscardable: false }); } catch {}
        injected++;
      } catch (e) {
        stats.injectError = String(e?.message || e);
      }
    }
    stats.injectedTabs = injected;
    stats.lastInject = Date.now();
    if (injected > 0) stats.injectError = null;
    chrome.storage.local.set({ stats }).catch(() => {});
  } catch (e) {
    stats.injectError = String(e?.message || e);
    chrome.storage.local.set({ stats }).catch(() => {});
  }
}

async function pollBackendLiveTicks() {
  const { enabled } = await chrome.storage.local.get(["enabled"]);
  if (enabled === false) return;
  try {
    const res = await fetch(BACKEND_LIVE_POLL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      stats.lastError = `backend_poll_http_${res.status}`;
      return;
    }
    stats.backendPolls = (stats.backendPolls || 0) + 1;
    stats.backendPollRows = (stats.backendPollRows || 0) + (Number(json?.fetched) || 0);
    stats.sent = (stats.sent || 0) + (Number(json?.fetched) || 0);
    if (json?.sample?.symbol && Number(json.sample.price) > 0) {
      stats.lastTick = { symbol: normalizeSymbol(json.sample.symbol), price: Number(json.sample.price), ts: Date.now() };
    }
    stats.lastBackendPoll = Date.now();
    stats.lastFlush = Date.now();
    stats.lastError = json?.skipped ? `backend_poll_${json.skipped}` : null;
  } catch (e) {
    stats.lastError = "backend_poll_failed: " + String(e?.message || e);
  } finally {
    chrome.storage.local.set({ stats }).catch(() => {});
  }
}

async function broadcastToThunderTabs(message) {
  try {
    const tabs = await chrome.tabs.query({ url: ["https://web.thndr.app/*", "https://*.thndr.app/*"] });
    for (const t of tabs) {
      if (!t?.id) continue;
      chrome.tabs.sendMessage(t.id, message).catch(() => {});
    }
  } catch {}
}

async function prepareOrderInTab(tabId, message) {
  const result = await sendExecuteOrderWhenReady(tabId, message, 90_000);
  // v4.2.5: Never close a user-visible signal tab automatically.
  // If a legacy content script still returns l2_guard_rejected, keep the tab
  // open and report the reason only. This prevents the "tab closes after
  // 10-15s" behavior while preserving server-side status reporting.
  if (result && result.ok === false && result.stage === "l2_guard_rejected") {
    const reason = String(result.reason || "L2 غير آمن");
    try {
      chrome.notifications?.create?.({
        type: "basic",
        iconUrl: chrome.runtime.getURL("icon.png"),
        title: `🛑 ${message?.payload?.symbol || "الإشارة"} — اترفضت`,
        message: `الاكستنشن رفض الشراء لكنه ساب تاب ثاندر مفتوحة.\nالسبب: ${reason}`,
        priority: 2,
      });
    } catch {}
    try {
      await reportOrderStatus({
        id: message?.payload?.orderId,
        status: "error",
        error_message: `l2_guard_rejected: ${reason}`,
      });
    } catch {}
    lastOrderError = `l2_guard_rejected: ${reason}`;
    return result;
  }
  if (!result?.ok) throw new Error(result?.error || result?.stage || "prepare_not_ok");
  dispatchedToday[message.payload.orderId] = true;
  lastOrderError = null;
  return result;
}

function isSafeThndrUrl(url) {
  return /^https:\/\/([^/]+\.)?thndr\.app\//.test(String(url || ""));
}

async function waitForTabReady(tabId, timeoutMs = 25_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab?.status === "complete" && /^https:\/\/([^/]+\.)?thndr\.app\//.test(tab.url || "")) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function runLocalOrderTest() {
  const cfg = await chrome.storage.local.get(["egpPerTrade"]);
  const egp = Math.max(MIN_SCALP_CASH_EGP, Number(cfg.egpPerTrade) || MIN_SCALP_CASH_EGP);
  const entry = Object.entries(mapping).find(([uuid, m]) => uuid && m?.symbol);
  const [uuid, m] = entry || [null, { symbol: "TEST" }];
  const symbol = normalizeSymbol(m.symbol);
  const tabs = await chrome.tabs.query({ url: ["https://web.thndr.app/*", "https://*.thndr.app/*"] });
  const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
  let tab = activeTabs.find((t) => /^https:\/\/([^/]+\.)?thndr\.app\//.test(t.url || "")) || tabs[0];
  if (!tab && uuid) {
    tab = await createThunderSiblingTab(`https://web.thndr.app/ar/assets/${uuid}`, { active: true });
  } else if (!tab) {
    tab = await createThunderSiblingTab("https://web.thndr.app/ar", { active: true });
  } else if (uuid) {
    await chrome.tabs.update(tab.id, { active: true, url: `https://web.thndr.app/ar/assets/${uuid}` });
  } else {
    await chrome.tabs.update(tab.id, { active: true });
  }
  const result = await sendExecuteOrderWhenReady(tab.id, {
      type: EXECUTE_ORDER_MESSAGE,
      payload: { orderId: `local-test-${Date.now()}`, symbol, uuid, qty: 1, egp, side: "buy" },
    }, uuid ? 90_000 : 20_000);
  lastOrderError = null;
  return { ok: !!result?.ok, symbol, version: result?.version };
}

// Phase 2-a test: open the SELL sidebar on an asset, choose "أسهم" tab,
// click "الحد الأقصى". Stops before review. The user picks any owned symbol
// from their watchlist (test uses the first mapped symbol). Same safety
// guarantees as runLocalOrderTest — local-test-* IDs are never reported to
// the server.
async function runLocalSellTest() {
  const entry = Object.entries(mapping).find(([uuid, m]) => uuid && m?.symbol);
  const [uuid, m] = entry || [null, { symbol: "TEST" }];
  const symbol = normalizeSymbol(m.symbol);
  const tabs = await chrome.tabs.query({ url: ["https://web.thndr.app/*", "https://*.thndr.app/*"] });
  const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
  let tab = activeTabs.find((t) => /^https:\/\/([^/]+\.)?thndr\.app\//.test(t.url || "")) || tabs[0];
  if (!tab && uuid) {
    tab = await createThunderSiblingTab(`https://web.thndr.app/ar/assets/${uuid}`, { active: true });
  } else if (!tab) {
    tab = await createThunderSiblingTab("https://web.thndr.app/ar", { active: true });
  } else if (uuid) {
    await chrome.tabs.update(tab.id, { active: true, url: `https://web.thndr.app/ar/assets/${uuid}` });
  } else {
    await chrome.tabs.update(tab.id, { active: true });
  }
  const result = await sendExecuteOrderWhenReady(tab.id, {
      type: EXECUTE_ORDER_MESSAGE,
      payload: { orderId: `local-test-${Date.now()}`, symbol, uuid, qty: 0, egp: 0, side: "sell" },
    }, uuid ? 90_000 : 20_000);
  lastOrderError = null;
  return { ok: !!result?.ok, symbol, stage: result?.stage, version: result?.version };
}

// Dry-run: just opens a fresh Thunder tab for any mapped symbol (or a fallback
// URL) WITHOUT touching the form. Use this to verify that real signals will
// actually open a new tab in Thunder. No order is prepared or reported.
async function runOpenTabTest() {
  const entry = Object.entries(mapping).find(([uuid, m]) => uuid && m?.symbol);
  const [uuid, m] = entry || [null, null];
  const symbol = m?.symbol ? normalizeSymbol(m.symbol) : null;
  const url = uuid ? `https://web.thndr.app/ar/assets/${uuid}` : "https://web.thndr.app/ar";
  try {
    const tab = await createThunderSiblingTab(url, { active: true });
    return { ok: true, symbol: symbol || "(no mapped symbol)", tabId: tab?.id, url };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

async function ensureContentScript(tabId) {
  try {
    const pong = await chrome.tabs.sendMessage(tabId, { type: "ping" });
    if (pong?.ok && pong.version === CONTENT_SCRIPT_VERSION) return true;
  } catch {}
  try {
    await chrome.scripting.executeScript({ target: { tabId, allFrames: false }, files: ["page-script.js"], world: "MAIN" });
  } catch {}
  try {
    await chrome.scripting.executeScript({ target: { tabId, allFrames: false }, files: ["content.js"], world: "ISOLATED" });
    await new Promise((r) => setTimeout(r, 200));
    return true;
  } catch (e) {
    throw new Error("content_script_inject_failed: " + String(e?.message || e));
  }
}

async function sendExecuteOrder(tabId, message) {
  await ensureContentScript(tabId);
  return chrome.tabs.sendMessage(tabId, message);
}

async function sendExecuteOrderWhenReady(tabId, message, timeoutMs = 12_000) {
  const start = Date.now();
  let lastErr = null;
  let lastResult = null;
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await sendExecuteOrder(tabId, message);
      lastResult = res;
      if (res?.ok) return res;
      if (["l2_guard_rejected", "order_type_not_selected", "order_type_advanced_not_selected", "settlement_t0_not_selected", "limit_price_not_filled", "qty_input_not_found", "qty_type_failed", "side_button_not_found", "side_button_no_form", "cash_mode_not_verified", "cash_amount_missing", "shares_mode_not_verified", "max_button_not_found", "max_qty_not_filled"].includes(res?.stage)) {
        return res;
      }
      if (res?.retryAfterNavigation) {
        if (res.thndrXUrl && isSafeThndrUrl(res.thndrXUrl)) {
          await chrome.tabs.update(tabId, { active: true, url: res.thndrXUrl });
        }
        tabId = await waitForLikelyTradingTab(tabId, 35_000);
        await waitForTabReady(tabId, 35_000);
        await new Promise((r) => setTimeout(r, 1800));
        continue;
      }
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(lastErr?.message || lastResult?.stage || "thunder_page_not_ready");
}

async function waitForLikelyTradingTab(preferredTabId, timeoutMs = 35_000) {
  const start = Date.now();
  let best = preferredTabId;
  while (Date.now() - start < timeoutMs) {
    try {
      const preferred = await chrome.tabs.get(preferredTabId);
      if (isSafeThndrUrl(preferred?.url)) {
        best = preferred.id;
        if (isLikelyTradingUrl(preferred.url)) return preferred.id;
      }
    } catch {}
    try {
      const tabs = await chrome.tabs.query({ url: ["https://web.thndr.app/*", "https://*.thndr.app/*"] });
      const trading = tabs.find((t) => isLikelyTradingUrl(t.url));
      if (trading?.id) return trading.id;
      const active = tabs.find((t) => t.active && t.id);
      if (active?.id) best = active.id;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return best;
}

function isLikelyTradingUrl(url) {
  const u = String(url || "").toLowerCase();
  return isSafeThndrUrl(u) && (/thndrx|trader|trade|terminal|workspace|market/.test(u) || !/\/assets\//.test(u));
}

async function reportOrderStatus({ id, status, error_message }) {
  const sid = String(id || "");
  if (sid.startsWith("local-test-") || sid.startsWith("auto-sell-") || sid.startsWith("auto-sell-local-") || sid.startsWith("manual-auto-sell-")) return;
  const { token } = await chrome.storage.local.get(["token"]);
  if (!token) return;
  try {
    await fetch(ORDERS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-thunder-token": token },
      body: JSON.stringify({ id, status, error_message }),
    });
  } catch {}
}

async function recordOrderbookSnapshot(snap) {
  const uuid = normalizeUuid(snap?.uuid);
  if (!uuid) return;
  const symbol = normalizeSymbol(snap?.symbol || mapping[uuid]?.symbol);
  if (!symbol) return;
  if (L2_RECORDING_ENABLED !== true) return; // kill-switch — parsing still runs, no upload
  const { token } = await chrome.storage.local.get(["token"]);
  if (!token) return;
  try {
    await fetch(ORDERBOOK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-thunder-token": token },
      body: JSON.stringify({
        symbol,
        ts: snap.ts || Date.now(),
        best_bid: Number(snap.bestBid) || null,
        best_bid_qty: Number(snap.bestBidQty) || null,
        best_ask: Number(snap.bestAsk) || null,
        best_ask_qty: Number(snap.bestAskQty) || null,
        last_price: Number(latestPriceBySymbol[symbol]?.price) || null,
        bids: Array.isArray(snap.bids) ? snap.bids : [],
        asks: Array.isArray(snap.asks) ? snap.asks : [],
        source: "thunder_l2_ext",
      }),
    });
    // v4.1.89: telemetry counter — track successful snapshot per symbol.
    try { telemetryOnSnapshot(symbol); } catch {}
  } catch {}
}

// Timeline telemetry — fire-and-forget. Any failure is swallowed so it can
// NEVER block a buy/sell decision. Batches or single events accepted.
async function recordTimelineEvent(payload) {
  try {
    const events = Array.isArray(payload) ? payload : [payload];
    const clean = [];
    for (const e of events) {
      if (!e || typeof e !== "object") continue;
      const symbol = normalizeSymbol(e.symbol);
      const event = String(e.event || "").trim();
      const at_ms = Number(e.at_ms);
      if (!symbol || !event || !Number.isFinite(at_ms) || at_ms <= 0) continue;
      clean.push({
        signal_id: e.signal_id ? String(e.signal_id) : null,
        symbol,
        uuid: e.uuid ? String(e.uuid).toLowerCase() : null,
        event,
        at_ms,
        meta: (e.meta && typeof e.meta === "object") ? e.meta : {},
      });
    }
    if (!clean.length) return;
    const { token } = await chrome.storage.local.get(["token"]);
    if (!token) return;
    await fetch(TIMELINE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-thunder-token": token },
      body: JSON.stringify({ events: clean }),
    });
  } catch {}
}

// Passive watchlist snapshotting — throttled per uuid to 1/hour.
const watchlistLastSent = {};
async function recordWatchlistSnapshots(arr) {
  if (!Array.isArray(arr) || !arr.length) return;
  const { token } = await chrome.storage.local.get(["token"]);
  if (!token) return;
  const now = Date.now();
  const HOUR = 60 * 60_000;
  const items = [];
  for (const it of arr) {
    if (!it?.symbol || !it?.uuid) continue;
    const key = String(it.uuid).toLowerCase();
    const last = watchlistLastSent[key] || 0;
    if (now - last < HOUR) continue;
    watchlistLastSent[key] = now;
    items.push({
      symbol: String(it.symbol).toUpperCase(),
      uuid: key,
      name: it.name ?? null,
      day_tradable: typeof it.day_tradable === "boolean" ? it.day_tradable : null,
      feed_price: Number(it.feed_price) || null,
      previous_close: Number(it.previous_close) || null,
      min_price_limit: Number(it.min_price_limit) || null,
      max_price_limit: Number(it.max_price_limit) || null,
      day_trade_limit: Number(it.day_trade_limit) || null,
      round_digits: Number.isFinite(it.round_digits) ? it.round_digits : null,
      market_id: it.market_id ?? null,
    });
  }
  if (!items.length) return;
  // GC cache to prevent unbounded growth.
  for (const [k, ts] of Object.entries(watchlistLastSent)) {
    if (now - Number(ts) > 24 * HOUR) delete watchlistLastSent[k];
  }
  try {
    await fetch(WATCHLIST_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-thunder-token": token },
      body: JSON.stringify({ items }),
    });
  } catch {}
}

// Bridge: send confirmed Thunder buy fills to the server so a `positions` row
// (with TP/SL from paper_trades) gets created and the sell-watcher can act.
// Local 10-minute dedupe by (symbol, qty, price) avoids hammering the server
// when Thunder repeats the same order in successive responses.
async function registerBuyFills(fills) {
  if (!Array.isArray(fills) || !fills.length) return;
  const { token } = await chrome.storage.local.get(["token"]);
  if (!token) return;
  const now = Date.now();
  // Garbage-collect dedupe cache so it can't grow forever.
  for (const [k, ts] of Object.entries(registeredBuyFills)) {
    if (now - Number(ts) > 60 * 60_000) delete registeredBuyFills[k];
  }
  for (const raw of fills) {
    const symbol = String(raw?.symbol || "").trim().toUpperCase();
    const qty = Number(raw?.qty);
    const entryPrice = Number(raw?.entry_price);
    if (!symbol || !(qty > 0) || !(entryPrice > 0)) continue;
    const key = `${symbol}|${Math.floor(qty)}|${entryPrice.toFixed(4)}`;
    if (registeredBuyFills[key] && now - registeredBuyFills[key] < 10 * 60_000) continue;
    registeredBuyFills[key] = now;
    try {
      const res = await fetch(POSITIONS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-thunder-token": token },
        body: JSON.stringify({
          action: "register_buy_fill",
          symbol, qty, entry_price: entryPrice,
          source: String(raw?.source || "thunder_fill").slice(0, 64),
        }),
      });
      const json = await res.json().catch(() => ({}));
      await upsertLocalTradeFromFill({ symbol, qty, entryPrice, server: json });
      await journalRecordBuy({ symbol, qty, price: entryPrice, source: raw?.source }).catch(() => {});
    } catch {}
  }
}

async function registerSellFills(fills) {
  if (!Array.isArray(fills) || !fills.length) return;
  for (const raw of fills) {
    const symbol = normalizeSymbol(raw?.symbol);
    const qty = Number(raw?.qty) || 0;
    const exitPrice = Number(raw?.exit_price || raw?.price) || 0;
    if (!symbol) continue;
    await markLocalTradeSold({ symbol, qty, exitPrice });
    await journalRecordSell({ symbol, qty, exitPrice }).catch(() => {});
  }
}

async function getTradeStores() {
  const s = await chrome.storage.local.get([ACTIVE_TRADE_LEDGER_KEY, SIGNAL_LEDGER_KEY]);
  return {
    trades: (s[ACTIVE_TRADE_LEDGER_KEY] && typeof s[ACTIVE_TRADE_LEDGER_KEY] === "object") ? s[ACTIVE_TRADE_LEDGER_KEY] : {},
    signals: (s[SIGNAL_LEDGER_KEY] && typeof s[SIGNAL_LEDGER_KEY] === "object") ? s[SIGNAL_LEDGER_KEY] : {},
  };
}

async function upsertLocalTradeFromFill({ symbol, qty, entryPrice, server }) {
  const sym = normalizeSymbol(symbol);
  if (!sym || !(entryPrice > 0)) return;
  const { trades, signals } = await getTradeStores();
  const sig = signals[sym] || {};
  const prev = trades[sym] || {};
  const now = Date.now();
  trades[sym] = {
    ...prev,
    status: "open",
    symbol: sym,
    uuid: prev.uuid || sig.uuid || "",
    signalId: sig.signalId || prev.signalId || String(server?.paper_trade_id || ""),
    signalSource: sig.signalSource || prev.signalSource || "scalp-live",
    source: "thunder_fill",
    qty: Math.max(1, Math.floor(qty)),
    entryPrice: Number(entryPrice),
    boughtAt: Number(prev.boughtAt) || now,
    updatedAt: now,
    serverPositionId: server?.position_id || prev.serverPositionId || null,
  };
  await chrome.storage.local.set({ [ACTIVE_TRADE_LEDGER_KEY]: trades });
}

async function markLocalTradeSold({ symbol, qty, exitPrice }) {
  const sym = normalizeSymbol(symbol);
  if (!sym) return;
  const { trades } = await getTradeStores();
  const prev = trades[sym] || { symbol: sym };
  trades[sym] = {
    ...prev,
    status: "closed",
    soldAt: Date.now(),
    updatedAt: Date.now(),
    exitQty: Number(qty) || Number(prev.qty) || 0,
    exitPrice: Number(exitPrice) || Number(prev.exitPrice) || 0,
  };
  await chrome.storage.local.set({ [ACTIVE_TRADE_LEDGER_KEY]: trades });
}

// =================== Trade Journal (P&L per trade + per day) ===================

async function readJournal() {
  const s = await chrome.storage.local.get([TRADE_JOURNAL_KEY]);
  const j = s[TRADE_JOURNAL_KEY];
  return (j && typeof j === "object") ? j : {};
}
async function writeJournal(j) {
  await chrome.storage.local.set({ [TRADE_JOURNAL_KEY]: j });
}
function summariseDay(rows) {
  let realised = 0, openCount = 0, closedCount = 0, wins = 0, losses = 0;
  let totalBuy = 0, totalSell = 0, totalFees = 0;
  for (const r of rows || []) {
    totalBuy += Number(r.buy_value) || 0;
    totalFees += (Number(r.buy_fee) || 0) + (Number(r.sell_fee) || 0);
    if (r.status === "closed") {
      closedCount++;
      realised += Number(r.pnl) || 0;
      totalSell += Number(r.sell_value) || 0;
      if ((Number(r.pnl) || 0) >= 0) wins++; else losses++;
    } else openCount++;
  }
  return {
    realised: +realised.toFixed(2),
    totalBuy: +totalBuy.toFixed(2),
    totalSell: +totalSell.toFixed(2),
    totalFees: +totalFees.toFixed(2),
    openCount, closedCount, wins, losses,
    count: (rows || []).length,
  };
}
async function getTradeJournal(dateArg) {
  const date = dateArg || cairoDateStr();
  const j = await readJournal();
  const rows = (j[date] || []).slice().sort((a, b) => (b.opened_at || 0) - (a.opened_at || 0));
  return { ok: true, date, rows, summary: summariseDay(rows) };
}

async function syncTradeToServer(row) {
  try {
    const { token } = await chrome.storage.local.get(["token"]);
    if (!token) return;
    await fetch(TRADES_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-thunder-token": token },
      body: JSON.stringify({
        client_trade_id: row.client_trade_id,
        symbol: row.symbol,
        trade_date: row.trade_date,
        source: row.source || "thunder_fill",
        status: row.status,
        opened_at: new Date(row.opened_at).toISOString(),
        buy_qty: row.buy_qty ?? null,
        buy_price: row.buy_price ?? null,
        buy_value: row.buy_value ?? null,
        buy_fee: row.buy_fee ?? null,
        buy_total_cost: row.buy_total_cost ?? null,
        closed_at: row.closed_at ? new Date(row.closed_at).toISOString() : null,
        sell_qty: row.sell_qty ?? null,
        sell_price: row.sell_price ?? null,
        sell_value: row.sell_value ?? null,
        sell_fee: row.sell_fee ?? null,
        sell_net_proceeds: row.sell_net_proceeds ?? null,
        pnl: row.pnl ?? null,
        pnl_pct: row.pnl_pct ?? null,
      }),
    });
  } catch {}
}

async function journalRecordBuy({ symbol, qty, price, source }) {
  const sym = normalizeSymbol(symbol);
  const q = Math.max(0, Number(qty) || 0);
  const p = Number(price) || 0;
  if (!sym || !(q > 0) || !(p > 0)) return;
  const date = cairoDateStr();
  const j = await readJournal();
  const rows = j[date] || [];
  // dedupe: an open row for the same symbol with the same qty+price = same fill
  const dupKey = `${sym}|${Math.floor(q)}|${p.toFixed(4)}`;
  if (rows.some(r => r.status === "open" && `${r.symbol}|${Math.floor(r.buy_qty || 0)}|${(Number(r.buy_price) || 0).toFixed(4)}` === dupKey)) return;
  const buyValue = +(q * p).toFixed(4);
  const buyFee = calcFee(buyValue);
  const now = Date.now();
  const row = {
    client_trade_id: `ext-${sym}-${now}`,
    symbol: sym,
    trade_date: date,
    source: source || "thunder_fill",
    status: "open",
    opened_at: now,
    buy_qty: q,
    buy_price: p,
    buy_value: buyValue,
    buy_fee: buyFee,
    buy_total_cost: +(buyValue + buyFee).toFixed(4),
  };
  rows.push(row);
  j[date] = rows;
  await writeJournal(j);
  syncTradeToServer(row).catch(() => {});
}

async function journalRecordSell({ symbol, qty, exitPrice }) {
  const sym = normalizeSymbol(symbol);
  const p = Number(exitPrice) || 0;
  if (!sym || !(p > 0)) return;
  const date = cairoDateStr();
  const j = await readJournal();
  // Match the OLDEST open row for this symbol (FIFO)
  for (const dKey of [date, ...Object.keys(j).filter(k => k !== date)]) {
    const rows = j[dKey] || [];
    const idx = rows.findIndex(r => r.symbol === sym && r.status === "open");
    if (idx < 0) continue;
    const row = rows[idx];
    const q = Number(qty) || Number(row.buy_qty) || 0;
    if (!(q > 0)) return;
    const sellValue = +(q * p).toFixed(4);
    const sellFee = calcFee(sellValue);
    const sellNet = +(sellValue - sellFee).toFixed(4);
    const buyTotal = Number(row.buy_total_cost) || 0;
    const pnl = +(sellNet - buyTotal).toFixed(4);
    const pnlPct = buyTotal > 0 ? +((pnl / buyTotal) * 100).toFixed(3) : null;
    rows[idx] = {
      ...row,
      status: "closed",
      closed_at: Date.now(),
      sell_qty: q,
      sell_price: p,
      sell_value: sellValue,
      sell_fee: sellFee,
      sell_net_proceeds: sellNet,
      pnl,
      pnl_pct: pnlPct,
    };
    j[dKey] = rows;
    await writeJournal(j);
    syncTradeToServer(rows[idx]).catch(() => {});
    return;
  }
}

// Reset dispatchedToday at Cairo midnight (cheap: clear at 5am UTC)
function maybeResetDay() {
  const d = new Date();
  if (d.getUTCHours() === 5 && d.getUTCMinutes() < 5) { dispatchedToday = {}; failedOrders = {}; }
}

setInterval(flush, FLUSH_MS);
setInterval(autoInjectThunderTabs, AUTO_INJECT_MS);
setInterval(pollOrders, ORDER_POLL_MS);
setInterval(pollPositions, POSITIONS_POLL_MS);
setInterval(maybeResetDay, 60_000);
autoInjectThunderTabs().catch(() => {});

// ============================================================
// v4.1.74 — L2 Auto-Cycle (opt-in, safety-first)
// One background tab every 3-5 min (jitter), opens a random
// watchlist stock, our content.js clicks the "معلومات السوق"
// accordion once, Thunder's own market-depth response is
// intercepted passively → orderbook_snapshots row saved →
// tab closed. Human-like pacing, hard caps, market hours only.
// ============================================================
// v4.1.79: زيادة كثافة L2 أكتر بدون كسر السلوك البشري.
//  - فترة بين التابات: 2-4د (زي ما هي — سلوك بشري)
//  - cooldown لكل سهم: 20د → 10د (6×/ساعة بدل 3×)
//  - سقف/ساعة: 20 → 30
//  - auto-cycle شغالة افتراضياً (شوف onInstalled فوق)
const L2_CYCLE_MIN_MS = 2 * 60_000;
const L2_CYCLE_MAX_MS = 4 * 60_000;
const L2_CYCLE_PER_UUID_COOLDOWN_MS = 10 * 60_000;
const L2_CYCLE_HOURLY_CAP = 30;
const l2CycleVisited = {};   // uuid -> lastTs
const l2CycleOpens = [];     // recent open timestamps for hourly cap
let l2CycleTimer = null;
let l2CycleActiveTab = null; // { tabId, uuid, openedAt, mode }

// v4.1.80: cache signal-symbol list from server (60s TTL). Used to
// prioritise which watchlist UUID to open for L2 capture. Fetch is
// tiny (~100 bytes), server-only endpoint, no Thunder side-effects.
const RECENT_SIGNALS_URL = "https://meky-stock.onrender.com/api/public/hooks/recent-signal-symbols";
let recentSignalsCache = { ts: 0, symbols: [] };
async function getRecentSignalSymbols() {
  const now = Date.now();
  if (now - recentSignalsCache.ts < 60_000) return recentSignalsCache.symbols;
  try {
    const r = await fetch(RECENT_SIGNALS_URL, { cache: "no-store" });
    if (!r.ok) return recentSignalsCache.symbols;
    const j = await r.json();
    const syms = Array.isArray(j?.symbols) ? j.symbols.map((s) => String(s).toUpperCase()) : [];
    recentSignalsCache = { ts: now, symbols: syms };
    return syms;
  } catch {
    return recentSignalsCache.symbols;
  }
}

function inCairoMarketHours() {
  const now = new Date();
  const s = now.toLocaleString("en-US", { timeZone: "Africa/Cairo", hour12: false });
  const m = s.match(/(\d{1,2}):(\d{2})/);
  if (!m) return false;
  const h = Number(m[1]); const mn = Number(m[2]);
  const t = h * 60 + mn;
  return t >= (10 * 60) && t <= (14 * 60 + 30);
}

async function pickL2CycleUuid() {
  const now = Date.now();
  const eligible = Object.keys(mapping || {}).filter((u) => {
    const last = l2CycleVisited[u] || 0;
    return now - last > L2_CYCLE_PER_UUID_COOLDOWN_MS;
  });
  if (!eligible.length) return null;
  // v4.1.80: 70% chance to pick a UUID whose symbol has a fresh signal
  const signalSyms = await getRecentSignalSymbols();
  if (signalSyms.length && Math.random() < 0.7) {
    const wanted = new Set(signalSyms);
    const signalCandidates = eligible.filter((u) => {
      const sym = normalizeSymbol(mapping[u]?.symbol);
      return sym && wanted.has(sym);
    });
    if (signalCandidates.length) {
      const uuid = signalCandidates[Math.floor(Math.random() * signalCandidates.length)];
      return { uuid, mode: "signal" };
    }
  }
  const uuid = eligible[Math.floor(Math.random() * eligible.length)];
  return { uuid, mode: "random" };
}

async function closeL2CycleTab(reason) {
  const tab = l2CycleActiveTab;
  l2CycleActiveTab = null;
  if (!tab) return;
  try { await chrome.tabs.remove(tab.tabId); } catch {}
  console.log(`[L2Cycle] closed tab ${tab.tabId} uuid=${tab.uuid} reason=${reason}`);
}

async function runL2CycleOnce() {
  try {
    if (L2_TAB_AUTOMATION_ENABLED !== true) return;
    const { l2AutoCycleEnabled } = await chrome.storage.local.get(["l2AutoCycleEnabled"]);
    if (!l2AutoCycleEnabled) return;
    if (!inCairoMarketHours()) return;
    // NOTE: we DO run in parallel with scalp signal flow — the scalp tab
    // captures L2 for its own symbol via ensureL2SnapshotForUuid, and this
    // cycler opens a different background tab for a different watchlist
    // symbol. Zero overlap, zero interference.
    // Hourly cap.
    const now = Date.now();
    while (l2CycleOpens.length && now - l2CycleOpens[0] > 60 * 60_000) l2CycleOpens.shift();
    if (l2CycleOpens.length >= L2_CYCLE_HOURLY_CAP) return;
    // Only run if the user actually has Thunder open (a watchlist tab exists).
    const thunderTabs = await chrome.tabs.query({ url: "https://web.thndr.app/*" }).catch(() => []);
    if (!thunderTabs || thunderTabs.length === 0) return;
    // Don't run if a previous cycle tab is still open.
    if (l2CycleActiveTab) return;
    const pick = await pickL2CycleUuid();
    if (!pick) return;
    const { uuid, mode } = pick;
    // v4.1.80: signal symbols get an extended dwell (~300s) to capture
    // many more L2 snapshots around the moment we'd actually trade.
    const hash = mode === "signal" ? "#l2cycle-signal" : "#l2cycle";
    const failsafeMs = mode === "signal" ? 320_000 : 105_000;
    const url = `https://web.thndr.app/ar/assets/${uuid}${hash}`;
    const opened = await createVisibleL2Window(url, "cycle");
    l2CycleActiveTab = { tabId: opened.tabId, windowId: opened.windowId, uuid, openedAt: now, mode };
    l2CycleVisited[uuid] = now;
    l2CycleOpens.push(now);
    setTimeout(() => {
      if (l2CycleActiveTab && l2CycleActiveTab.tabId === opened.tabId) {
        closeL2CycleTab("failsafe_timeout");
      }
    }, failsafeMs);
  } catch (e) {
    console.warn("[L2Cycle] tick error", e);
  }
}

function scheduleNextL2Cycle() {
  const delay = L2_CYCLE_MIN_MS + Math.floor(Math.random() * (L2_CYCLE_MAX_MS - L2_CYCLE_MIN_MS));
  if (l2CycleTimer) clearTimeout(l2CycleTimer);
  l2CycleTimer = setTimeout(async () => {
    await runL2CycleOnce();
    scheduleNextL2Cycle();
  }, delay);
}
scheduleNextL2Cycle();

// Receive completion signal from content.js and close the tab promptly.
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type !== "l2cycle.done") return;
  if (!l2CycleActiveTab) return;
  if (sender?.tab?.id !== l2CycleActiveTab.tabId) return;
  // Small human-ish delay before close (so Thunder's response completes).
  setTimeout(() => closeL2CycleTab(msg?.payload?.reason || "done"), 800 + Math.floor(Math.random() * 700));
});

// ============================================================
// v4.1.82 — Persistent Signal L2 Tabs (aggressive coverage)
// ============================================================
// For every symbol that has a fresh scalp signal, open a Thunder
// asset tab with the L2 accordion pinned open and KEEP IT OPEN
// for the rest of the trading session. Thunder polls
// market-depth on its own every ~15-20s while the panel is
// visible, so each persistent tab yields ~200 snapshots/hour
// with zero extension-initiated requests to Thunder.
//
// Safety:
//  - Runs only when the user already has Thunder open.
//  - Runs only during Cairo market hours (10:00-14:30).
//  - Hard cap = PERSIST_MAX_TABS concurrent tabs (LRU evict).
//  - Closes ALL persistent tabs at end of session.
//  - No direct API requests to Thunder from us: we just open
//    an asset page and let content.js operate the accordion.
// ============================================================
const PERSIST_MAX_TABS = 25;
const PERSIST_POLL_MS = 30_000;
// v4.1.87: sequential opening — wait between tabs to look human AND
// to give the previous tab time to load + confirm L2.
const PERSIST_STAGGER_MIN_MS = 2000;
const PERSIST_STAGGER_MAX_MS = 4000;
const PERSIST_L2_LOAD_WAIT_MS = 10_000;   // wait for page to load before first ensure
const PERSIST_L2_CONFIRM_TIMEOUT_MS = 30_000; // give L2 up to 30s to go fresh=y
const PERSIST_L2_CONFIRM_INTERVAL_MS = 2_000; // local poll while confirming; no Thunder request
const PERSIST_L2_RECOVERY_STALE_MS = 90_000;
const PERSIST_L2_RECOVERY_COOLDOWN_MS = 120_000;
const persistTabs = new Map(); // symbol -> { tabId, uuid, openedAt }
const persistRecoveryAt = new Map(); // symbol -> last background-driven reload/open
let persistOpenInFlight = false;

const L2_WINDOW_WIDTH = 430;
const L2_WINDOW_HEIGHT = 760;
const L2_WINDOW_LEFT = 16;
const L2_WINDOW_TOP = 16;
const L2_WINDOW_OFFSET = 34;

function l2WindowBounds(kind = "persist") {
  const n = kind === "cycle" ? 0 : persistTabs.size;
  const col = n % 6;
  const row = Math.floor(n / 6) % 3;
  return {
    width: L2_WINDOW_WIDTH,
    height: L2_WINDOW_HEIGHT,
    left: L2_WINDOW_LEFT + col * L2_WINDOW_OFFSET,
    top: L2_WINDOW_TOP + row * L2_WINDOW_OFFSET,
  };
}

async function createVisibleL2Window(url, kind = "persist") {
  const bounds = l2WindowBounds(kind);
  try {
    const win = await chrome.windows.create({
      url,
      type: "popup",
      focused: false,
      ...bounds,
    });
    const tab = Array.isArray(win?.tabs) ? win.tabs[0] : null;
    if (!tab?.id) throw new Error("window_created_without_tab");
    try { await chrome.tabs.update(tab.id, { autoDiscardable: false }); } catch {}
    return { tabId: tab.id, windowId: win?.id || null };
  } catch (e) {
    // Fallback keeps the old behavior if popup creation is blocked.
    const tab = await chrome.tabs.create({ url, active: false });
    try { await chrome.tabs.update(tab.id, { autoDiscardable: false }); } catch {}
    return { tabId: tab.id, windowId: tab.windowId || null, fallback: true, error: String(e?.message || e) };
  }
}

function persistLog(msg, extra) {
  if (extra !== undefined) console.log(`[Persist] ${msg}`, extra);
  else console.log(`[Persist] ${msg}`);
}

async function persistCloseTab(symbol, reason) {
  const info = persistTabs.get(symbol);
  if (!info) return;
  persistTabs.delete(symbol);
  try { await chrome.tabs.remove(info.tabId); } catch {}
  persistLog(`closed ${symbol} tab=${info.tabId} reason=${reason}`);
  try { telemetryOnClose(symbol, reason); } catch {}
}

async function persistCloseAll(reason) {
  const syms = Array.from(persistTabs.keys());
  for (const s of syms) await persistCloseTab(s, reason);
}

async function persistEvictOldest() {
  if (persistTabs.size < PERSIST_MAX_TABS) return;
  let oldestSym = null;
  let oldestTs = Infinity;
  for (const [sym, info] of persistTabs) {
    if (info.openedAt < oldestTs) { oldestTs = info.openedAt; oldestSym = sym; }
  }
  if (oldestSym) await persistCloseTab(oldestSym, "lru_evict");
}

function persistUuidForSymbol(symbol) {
  const target = String(symbol || "").toUpperCase();
  for (const [uuid, m] of Object.entries(mapping || {})) {
    const s = normalizeSymbol(m?.symbol);
    if (s && s.toUpperCase() === target) return uuid;
  }
  return null;
}

async function persistOpenSymbol(symbol) {
  if (persistTabs.has(symbol)) return false;
  const uuid = persistUuidForSymbol(symbol);
  if (!uuid) { persistLog(`no uuid for ${symbol} (not in watchlist mapping)`); return false; }
  await persistEvictOldest();
  const url = `https://web.thndr.app/ar/assets/${uuid}#l2persist`;
  try {
    const opened = await createVisibleL2Window(url, "persist");
    persistTabs.set(symbol, { tabId: opened.tabId, windowId: opened.windowId, uuid, openedAt: Date.now() });
    persistLog(`opened ${symbol} tab=${opened.tabId} window=${opened.windowId || "?"} uuid=${uuid} visible=${opened.fallback ? "fallback-tab" : "popup"} (total=${persistTabs.size})`);
    try { telemetryOnOpen(symbol, uuid); } catch {}
    return true;
  } catch (e) {
    persistLog(`open failed for ${symbol}`, e);
    return false;
  }
}

async function persistReconcileTabs() {
  // Drop entries whose Chrome tab was closed by the user manually.
  for (const [sym, info] of Array.from(persistTabs.entries())) {
    try {
      const t = await chrome.tabs.get(info.tabId);
      if (!t) persistTabs.delete(sym);
      else if (t.windowId && info.windowId !== t.windowId) persistTabs.set(sym, { ...info, windowId: t.windowId });
    } catch {
      persistTabs.delete(sym);
    }
  }
}

async function persistEnsureTab(symbol, info) {
  if (!info?.tabId) return;
  try {
      const resp = await chrome.tabs.sendMessage(info.tabId, { type: "l2persist.ensure", payload: { symbol, uuid: info.uuid } });
      const age = Number.isFinite(Number(resp?.ageMs)) ? `${Math.round(Number(resp.ageMs) / 1000)}s` : "∞";
      persistLog(`ensure ${symbol} tab=${info.tabId} fresh=${resp?.fresh ? "y" : "n"} age=${age} panel=${resp?.panelState || "?"} trigger=${resp?.hasTrigger ? "y" : "n"} ac=${resp?.acState || "?"} resets=${resp?.l2SoftResets ?? "?"}`);
      try { telemetryOnEnsure(symbol, resp); } catch {}
  } catch (e) {
    persistLog(`ensure failed ${symbol} tab=${info.tabId}`, String(e?.message || e));
    try { telemetryOnEnsure(symbol, null, String(e?.message || e)); } catch {}
  }
}

async function persistEnsureAllTabs() {
  if (L2_TAB_AUTOMATION_ENABLED !== true) return;
  if (!inCairoMarketHours()) return;
  await persistReconcileTabs();
  for (const [sym, info] of Array.from(persistTabs.entries())) {
    await persistEnsureTab(sym, info);
  }
}

async function recoverPersistentL2Tabs() {
  if (L2_TAB_AUTOMATION_ENABLED !== true) return;
  if (!inCairoMarketHours()) return;
  await loadTelemetryState();
  await persistReconcileTabs();
  const now = Date.now();
  for (const [symbol, info] of Array.from(persistTabs.entries())) {
    const d = l2Diag[symbol] || {};
    const openedAt = Number(info?.openedAt || 0);
    const lastSnapshotAt = Number(d.lastSnapshotAt || 0);
    const aliveLongEnough = openedAt > 0 && now - openedAt > 60_000;
    const snapshotAge = lastSnapshotAt > 0 ? now - lastSnapshotAt : Infinity;
    const stale = aliveLongEnough && snapshotAge > PERSIST_L2_RECOVERY_STALE_MS;
    if (!stale) continue;
    const lastRecovery = Number(persistRecoveryAt.get(symbol) || d.lastRecoveryAt || 0);
    if (now - lastRecovery < PERSIST_L2_RECOVERY_COOLDOWN_MS) continue;
    persistRecoveryAt.set(symbol, now);
    const entry = telemetryEntry(symbol);
    entry.lastRecoveryAt = now;
    entry.recoveryCount = (Number(entry.recoveryCount) || 0) + 1;
    entry.recoveryReason = lastSnapshotAt > 0 ? `snapshot_stale_${Math.round(snapshotAge / 1000)}s` : "no_snapshot_after_open";
    persistTelemetryState();
    persistLog(`background recovery ${symbol}: ${entry.recoveryReason}`);
    try {
      const t = await chrome.tabs.get(info.tabId);
      const nextUrl = `https://web.thndr.app/ar/assets/${info.uuid}#l2persist-recover-${now}`;
      try { if (t.windowId) await chrome.windows.update(t.windowId, { state: "normal", focused: false }); } catch {}
      await chrome.tabs.update(t.id, { url: nextUrl, active: true });
      persistTabs.set(symbol, { ...info, tabId: t.id, windowId: t.windowId || info.windowId || null, openedAt: now });
      try { await chrome.tabs.update(t.id, { autoDiscardable: false }); } catch {}
    } catch {
      try { await chrome.tabs.remove(info.tabId); } catch {}
      const opened = await createVisibleL2Window(`https://web.thndr.app/ar/assets/${info.uuid}#l2persist-recover-${now}`, "persist");
      persistTabs.set(symbol, { ...info, tabId: opened.tabId, windowId: opened.windowId, openedAt: now });
    }
  }
}

// v4.1.87: open a tab, then poll its L2 status until fresh=y (or timeout).
// Returns true if fresh was confirmed, false otherwise. Does NOT throw.
async function persistWaitForL2Fresh(symbol, info) {
  if (!info?.tabId) return false;
  // Initial load window.
  await new Promise((r) => setTimeout(r, PERSIST_L2_LOAD_WAIT_MS));
  const deadline = Date.now() + PERSIST_L2_CONFIRM_TIMEOUT_MS;
  let attempt = 0;
  while (Date.now() < deadline) {
    attempt++;
    try {
      const resp = await chrome.tabs.sendMessage(info.tabId, { type: "l2persist.ensure", payload: { symbol, uuid: info.uuid } });
      const age = Number.isFinite(Number(resp?.ageMs)) ? `${Math.round(Number(resp.ageMs) / 1000)}s` : "∞";
      persistLog(`confirm ${symbol} attempt=${attempt} fresh=${resp?.fresh ? "y" : "n"} age=${age} panel=${resp?.panelState || "?"} trigger=${resp?.hasTrigger ? "y" : "n"} ac=${resp?.acState || "?"} resets=${resp?.l2SoftResets ?? "?"}`);
      if (resp?.fresh) return true;
    } catch (e) {
      // Tab might still be loading — keep polling until deadline.
      persistLog(`confirm ${symbol} attempt=${attempt} error=${String(e?.message || e)}`);
    }
    if (Date.now() >= deadline) break;
    await new Promise((r) => setTimeout(r, PERSIST_L2_CONFIRM_INTERVAL_MS));
  }
  return false;
}

async function persistTick() {
  if (persistOpenInFlight) return;
  persistOpenInFlight = true;
  try {
    if (L2_TAB_AUTOMATION_ENABLED !== true) {
      if (persistTabs.size > 0) await persistCloseAll("l2_disabled");
      return;
    }
    // End-of-session cleanup.
    if (!inCairoMarketHours()) {
      if (persistTabs.size > 0) await persistCloseAll("session_end");
      return;
    }
    // v4.1.92 — Respect the global semi-auto switch. If the user turned
    // semi-auto OFF, we must NOT auto-spawn L2 persistence tabs (the whole
    // 20-tab swarm on install/reload was caused by ignoring this flag).
    if (getConfig("semi_auto_enabled", true) === false) {
      if (persistTabs.size > 0) await persistCloseAll("semi_auto_disabled");
      return;
    }
    // Only run if user actually has Thunder open (so we don't spawn
    // asset tabs into an empty browser).
    const thunderTabs = await chrome.tabs.query({ url: "https://web.thndr.app/*" }).catch(() => []);
    if (!thunderTabs || thunderTabs.length === 0) return;
    // Only proceed if we have a watchlist mapping (otherwise no uuids).
    if (!mapping || Object.keys(mapping).length === 0) return;
    // Sync with actual Chrome tabs (user might have closed some).
    await persistReconcileTabs();
    // Pull fresh signal symbols (server caches 60s; we poll every 30s).
    const signals = await getRecentSignalSymbols();
    if (!signals.length) return;
    // v4.1.87: SEQUENTIAL opening — open one tab, wait until its L2 is
    // confirmed fresh (or timeout), then space 2-4s before opening the next.
    // This ensures we never spawn 20 tabs in 30s; instead they open over
    // ~7-10 minutes with each one verified before the next.
    for (const rawSym of signals) {
      const sym = String(rawSym || "").toUpperCase();
      if (!sym) continue;
      if (persistTabs.has(sym)) continue;
      const opened = await persistOpenSymbol(sym);
      if (opened) {
        const info = persistTabs.get(sym);
        // Wait until L2 is actually pulling data in this tab before moving on.
        if (info) {
          const ok = await persistWaitForL2Fresh(sym, info);
          if (!ok) persistLog(`WARN ${sym} L2 not fresh after ${PERSIST_L2_CONFIRM_TIMEOUT_MS/1000}s — moving on anyway`);
        }
        // Human-ish stagger before opening the next tab.
        const delay = PERSIST_STAGGER_MIN_MS + Math.floor(Math.random() * (PERSIST_STAGGER_MAX_MS - PERSIST_STAGGER_MIN_MS));
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  } catch (e) {
    persistLog("tick error", e);
  } finally {
    persistOpenInFlight = false;
  }
}

setInterval(persistTick, PERSIST_POLL_MS);
setInterval(persistEnsureAllTabs, 15_000);
setTimeout(persistTick, 12_000);
setTimeout(persistEnsureAllTabs, 25_000);

// If the user closes a persistent tab manually, drop it from our map.
chrome.tabs.onRemoved.addListener((tabId) => {
  for (const [sym, info] of persistTabs) {
    if (info.tabId === tabId) {
      persistTabs.delete(sym);
      persistLog(`user closed ${sym}`);
      try { telemetryOnClose(sym, "user_closed"); } catch {}
      break;
    }
  }
});

// ============================================================
// v4.1.89 — Per-tab telemetry (local diagnostics + server ship)
// ============================================================
// Tracks each persistent L2 tab locally in chrome.storage.local['l2Diagnostics']
// so the popup can show a live table. Every 60s ships a compact snapshot
// of all live tabs to the server so the operator can see health of the
// collection pipeline from the web app itself.
// Zero requests to Thunder. Only requests are POST → our own endpoint.
// If POST fails, we silently retry on the next tick (never blocks L2).
// ============================================================
const TELEMETRY_STORAGE_KEY = "l2Diagnostics";           // { [symbol]: {...} }
const TELEMETRY_CLIENT_ID_KEY = "l2TelemetryClientId";   // uuid string
const TELEMETRY_POST_MS = 60_000;

// In-memory mirror of the diagnostics map — flushed to chrome.storage.local
// on every mutation. Restored on service-worker wake.
let l2Diag = {};
let l2DiagLoaded = false;

async function loadTelemetryState() {
  if (l2DiagLoaded) return;
  try {
    const obj = await chrome.storage.local.get([TELEMETRY_STORAGE_KEY]);
    l2Diag = (obj && obj[TELEMETRY_STORAGE_KEY]) || {};
  } catch { l2Diag = {}; }
  l2DiagLoaded = true;
}
function persistTelemetryState() {
  try { chrome.storage.local.set({ [TELEMETRY_STORAGE_KEY]: l2Diag }); } catch {}
}
function telemetryEntry(sym) {
  if (!l2Diag[sym]) l2Diag[sym] = { symbol: sym, snapshotsSent: 0 };
  return l2Diag[sym];
}

function telemetryOnOpen(symbol, uuid) {
  if (!l2DiagLoaded) return; // will backfill on next persistTick
  const e = telemetryEntry(symbol);
  e.uuid = uuid || e.uuid || null;
  e.openedAt = Date.now();
  e.snapshotsSent = 0;
  e.lastSnapshotAt = null;
  e.closedAt = null;
  e.closeReason = null;
  persistTelemetryState();
}
function telemetryOnEnsure(symbol, resp, errMsg) {
  if (!l2DiagLoaded) return;
  const e = telemetryEntry(symbol);
  e.lastEnsureAt = Date.now();
  if (resp) {
    e.lastFresh = !!resp.fresh;
    e.lastAgeMs = Number.isFinite(Number(resp.ageMs)) ? Number(resp.ageMs) : null;
    e.panelState = resp.panelState || null;
    e.hasTrigger = !!resp.hasTrigger;
    e.lastEnsureError = null;
    e.panelReason = resp.panelReason || null;
    e.acState = resp.acState || null;
    e.acResumeAttempts = Number.isFinite(Number(resp.acResumeAttempts)) ? Number(resp.acResumeAttempts) : null;
    e.acResumeOk = Number.isFinite(Number(resp.acResumeOk)) ? Number(resp.acResumeOk) : null;
    e.depthTotal = Number.isFinite(Number(resp.depthTotal)) ? Number(resp.depthTotal) : null;
    e.l2SoftResets = Number.isFinite(Number(resp.l2SoftResets)) ? Number(resp.l2SoftResets) : null;
  } else {
    e.lastEnsureError = errMsg || "unknown";
  }
  persistTelemetryState();
}
function telemetryOnSnapshot(symbol) {
  if (!l2DiagLoaded) return;
  const e = telemetryEntry(symbol);
  e.snapshotsSent = (Number(e.snapshotsSent) || 0) + 1;
  e.lastSnapshotAt = Date.now();
  persistTelemetryState();
}
function telemetryOnClose(symbol, reason) {
  if (!l2DiagLoaded) return;
  const e = telemetryEntry(symbol);
  e.closedAt = Date.now();
  e.closeReason = reason || "closed";
  persistTelemetryState();
}

async function getOrCreateClientId() {
  const obj = await chrome.storage.local.get([TELEMETRY_CLIENT_ID_KEY]);
  let cid = obj?.[TELEMETRY_CLIENT_ID_KEY];
  if (!cid) {
    cid = (self.crypto?.randomUUID?.() || String(Date.now()) + "-" + Math.random().toString(36).slice(2));
    try { await chrome.storage.local.set({ [TELEMETRY_CLIENT_ID_KEY]: cid }); } catch {}
  }
  return cid;
}

function _ageSec(ms) {
  if (!Number.isFinite(Number(ms))) return null;
  return Math.max(0, Math.round((Date.now() - Number(ms)) / 1000));
}

async function postTelemetryOnce() {
  try {
    await loadTelemetryState();
    // Only report symbols that are currently live in persistTabs — that's
    // the operator's actual open-tab set.
    const liveSyms = new Set(Array.from(persistTabs.keys()));
    const tabs = [];
    for (const sym of liveSyms) {
      const info = persistTabs.get(sym);
      const d = l2Diag[sym] || {};
      tabs.push({
        symbol: sym,
        uuid: info?.uuid || d.uuid || null,
        opened_at_ms: Number(info?.openedAt || d.openedAt) || null,
        uptime_sec: _ageSec(info?.openedAt || d.openedAt),
        last_ensure_age_sec: _ageSec(d.lastEnsureAt),
        last_l2_fresh: typeof d.lastFresh === "boolean" ? d.lastFresh : null,
        last_l2_age_sec: Number.isFinite(Number(d.lastAgeMs)) ? Math.round(Number(d.lastAgeMs) / 1000) : null,
        panel_state: d.panelState || null,
        has_trigger: typeof d.hasTrigger === "boolean" ? d.hasTrigger : null,
        snapshots_sent: Number(d.snapshotsSent) || 0,
        last_snapshot_age_sec: _ageSec(d.lastSnapshotAt),
        recovery_count: Number(d.recoveryCount) || 0,
        last_recovery_age_sec: _ageSec(d.lastRecoveryAt),
        panel_reason: d.panelReason || null,
        ac_state: d.acState || null,
        ac_resume_attempts: Number.isFinite(Number(d.acResumeAttempts)) ? Number(d.acResumeAttempts) : null,
        ac_resume_ok: Number.isFinite(Number(d.acResumeOk)) ? Number(d.acResumeOk) : null,
        depth_total: Number.isFinite(Number(d.depthTotal)) ? Number(d.depthTotal) : null,
        l2_soft_resets: Number.isFinite(Number(d.l2SoftResets)) ? Number(d.l2SoftResets) : null,
      });
    }
    // Nothing to report and not in market hours — skip.
    if (!tabs.length && !inCairoMarketHours()) return;
    const { token } = await chrome.storage.local.get(["token"]);
    if (!token) return;
    const clientId = await getOrCreateClientId();
    const body = {
      clientId,
      ts: Date.now(),
      marketOpen: inCairoMarketHours(),
      persistTabsCount: liveSyms.size,
      persistMaxTabs: PERSIST_MAX_TABS,
      signalsCount: (recentSignalsCache?.symbols || []).length,
      offscreen: {
        lastPingAgeSec: offscreenLastPing ? Math.round((Date.now() - offscreenLastPing) / 1000) : null,
        ensureCount: offscreenEnsureCount,
        lastError: offscreenLastError,
      },
      tabs,
    };
    await fetch(TELEMETRY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-thunder-token": token },
      body: JSON.stringify(body),
    });
  } catch (e) {
    // Silent — telemetry must never break L2 pipeline.
    console.warn("[Telemetry] post failed", String(e?.message || e));
  }
}

// Boot: load state, then run first telemetry tick after 15s, then every 60s.
loadTelemetryState().then(() => {
  setTimeout(postTelemetryOnce, 15_000);
  setInterval(postTelemetryOnce, TELEMETRY_POST_MS);
});

// Popup diagnostic message → returns the full l2Diag map + live tabs.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== "l2diag.get") return;
  (async () => {
    await loadTelemetryState();
    const live = Array.from(persistTabs.entries()).map(([sym, info]) => ({
      symbol: sym, uuid: info.uuid, openedAt: info.openedAt, tabId: info.tabId,
    }));
    sendResponse({
      ok: true,
      now: Date.now(),
      marketOpen: inCairoMarketHours(),
      persistMaxTabs: PERSIST_MAX_TABS,
      signals: recentSignalsCache?.symbols || [],
      offscreen: {
        lastPingAgeSec: offscreenLastPing ? Math.round((Date.now() - offscreenLastPing) / 1000) : null,
        ensureCount: offscreenEnsureCount,
        lastError: offscreenLastError,
      },
      live,
      diag: l2Diag,
    });
  })();
  return true;
});

// =====================================================================
// v4.2.38 — Background Sleep Proof (اختبار مؤكد بدون تخمين)
//
// الهدف: نثبت بالقياس (مش بالتخمين) إن تاب ثاندر أكس فاضلة "صاحية" وهي في
// الخلفية بعد تفعيل focus emulation + WebLifecycleState=active.
//
// الطريقة: نحقن probe في التاب نفسها يقيس كل ثانية:
//   - انحراف المؤقّت (setInterval 1000ms). كروم بيخنق تابات الخلفية إلى
//     تيك واحد كل 60 ثانية، فلو maxGap فضل ~1s يبقى مفيش throttling.
//   - document.visibilityState و document.hasFocus() (focus emulation شغال؟)
//   - أحداث freeze/resume و document.wasDiscarded (التاب اتجمّدت/اتشالت؟)
//   - عدد requests الشبكة اللي الصفحة عملتها خلال الاختبار (PerformanceObserver)
// النتيجة كلها بتتخزن في الـservice worker وتظهر في البوب-أب.
// =====================================================================

let bgProof = null; // { runId, startedAt, endsAt, tabId, url, last, framesAtStart }

// cdp-module.js runs inside its own IIFE, so its `stats` object (attached /
// focusEmu / framesSeen) is NOT the `stats` declared in this file. The only
// shared surface is the storage key it persists on every change.
async function getCdpStats() {
  try {
    const s = await chrome.storage.local.get("v4cdp_stats");
    return s?.v4cdp_stats || null;
  } catch {
    return null;
  }
}

function bgProofProbe(runId, durationMs) {
  try { window.__thBgProof?.stop?.(); } catch {}
  const started = Date.now();
  const state = {
    runId,
    startedAt: started,
    endsAt: started + durationMs,
    ticks: 0,
    maxGapMs: 0,
    throttledTicks: 0,
    hiddenTicks: 0,
    blurredTicks: 0,
    freezes: 0,
    resumes: 0,
    wasDiscarded: document.wasDiscarded === true,
    netRequests: 0,
    lastTickAt: started,
    finished: false,
    href: location.href,
  };
  let po = null;
  try {
    po = new PerformanceObserver((list) => { state.netRequests += list.getEntries().length; });
    po.observe({ type: "resource", buffered: false });
  } catch {}
  const onFreeze = () => { state.freezes++; report(); };
  const onResume = () => { state.resumes++; report(); };
  document.addEventListener("freeze", onFreeze);
  document.addEventListener("resume", onResume);
  function report() {
    try { chrome.runtime.sendMessage({ type: "bgproof.sample", data: { ...state } }); } catch {}
  }
  const iv = setInterval(() => {
    const now = Date.now();
    const gap = now - state.lastTickAt;
    state.lastTickAt = now;
    state.ticks++;
    if (gap > state.maxGapMs) state.maxGapMs = gap;
    if (gap > 3000) state.throttledTicks++;
    if (document.visibilityState !== "visible") state.hiddenTicks++;
    if (!document.hasFocus()) state.blurredTicks++;
    if (now >= state.endsAt) {
      state.finished = true;
      stop();
      return;
    }
    if (state.ticks % 5 === 0) report();
  }, 1000);
  function stop() {
    clearInterval(iv);
    try { po?.disconnect(); } catch {}
    document.removeEventListener("freeze", onFreeze);
    document.removeEventListener("resume", onResume);
    report();
    window.__thBgProof = null;
  }
  window.__thBgProof = { stop, state };
  report();
  return { ok: true, startedAt: started, href: location.href };
}

async function bgProofPickTab() {
  if (typeof attachedTabId === "number" && attachedTabId) {
    try {
      const t = await chrome.tabs.get(attachedTabId);
      if (t?.url && /thndr\.app/.test(t.url)) return t;
    } catch {}
  }
  const tabs = await chrome.tabs.query({ url: ["https://x.thndr.app/*", "https://web.thndr.app/*", "https://*.thndr.app/*"] });
  return tabs?.[0] || null;
}

async function bgProofStart(durationMs) {
  const tab = await bgProofPickTab();
  if (!tab?.id) return { ok: false, error: "مفيش تاب ثاندر مفتوحة" };
  const runId = "p" + Date.now();
  const [res] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: bgProofProbe,
    args: [runId, durationMs],
  });
  if (!res?.result?.ok) return { ok: false, error: "فشل حقن الـprobe" };
  const cdp = await getCdpStats();
  bgProof = {
    runId,
    tabId: tab.id,
    url: tab.url,
    startedAt: Date.now(),
    endsAt: Date.now() + durationMs,
    durationMs,
    framesAtStart: Number(cdp?.framesSeen) || 0,
    focusEmuAtStart: cdp?.focusEmu ? { ...cdp.focusEmu } : null,
    cdpAttached: cdp?.attached === true,
    last: null,
  };
  await chrome.storage.local.set({ v4_bgproof: bgProof });
  return { ok: true, runId, tabId: tab.id, url: tab.url };
}

function bgProofVerdict() {
  if (!bgProof) return null;
  const s = bgProof.last;
  const elapsedSec = Math.round((Date.now() - bgProof.startedAt) / 1000);
  const expectedTicks = Math.min(elapsedSec, Math.round(bgProof.durationMs / 1000));
  if (!s) return { level: "wait", text: "لسه مفيش عينات من التاب…" };
  const coverage = expectedTicks ? s.ticks / expectedTicks : 0;
  const reasons = [];
  if (s.maxGapMs > 5000) reasons.push(`المؤقّت اتخنق (أكبر فجوة ${Math.round(s.maxGapMs / 1000)}ث)`);
  if (coverage < 0.8) reasons.push(`ناقص تيكات (${s.ticks}/${expectedTicks})`);
  if (s.freezes > 0) reasons.push(`التاب اتجمّدت ${s.freezes} مرة`);
  if (s.wasDiscarded) reasons.push("التاب كانت اتشالت من الذاكرة");
  const focusOk = s.blurredTicks === 0;
  if (!focusOk) reasons.push(`الصفحة حسّت إنها مش focused في ${s.blurredTicks} تيك`);
  if (reasons.length) return { level: "fail", text: "❌ " + reasons.join(" · ") };
  const bgSec = Number(bgProof.bgSeconds) || 0;
  if (elapsedSec > 20 && bgSec < Math.min(30, elapsedSec * 0.5)) {
    return { level: "warn", text: `⚠️ التاب فضلت في المقدمة (${bgSec}ث بس في الخلفية من ${elapsedSec}ث) — بدّل لتاب تانية علشان الاختبار يبقى حقيقي` };
  }
  return { level: "pass", text: `✅ التاب فضلت صاحية وهي في الخلفية ${bgSec}ث (أكبر فجوة ${s.maxGapMs}ms، بدون freeze، والصفحة شايفة نفسها focused)` };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "bgproof.sample") {
    if (bgProof && msg.data?.runId === bgProof.runId) {
      bgProof.last = msg.data;
      bgProof.updatedAt = Date.now();
      // v4.2.40: authoritative "is the tab really in the background?" check.
      // document.visibilityState can stay "visible" under focus emulation, so
      // we ask the browser directly (tab.active + window focused) instead.
      (async () => {
        try {
          const t = await chrome.tabs.get(bgProof.tabId);
          let winFocused = false;
          try { winFocused = (await chrome.windows.get(t.windowId))?.focused === true; } catch {}
          const foreground = t?.active === true && winFocused;
          const now = Date.now();
          const prev = bgProof.lastCheckAt || bgProof.startedAt;
          const deltaSec = Math.min(15, Math.max(0, Math.round((now - prev) / 1000)));
          bgProof.lastCheckAt = now;
          bgProof.bgSeconds = (bgProof.bgSeconds || 0) + (foreground ? 0 : deltaSec);
          bgProof.fgSeconds = (bgProof.fgSeconds || 0) + (foreground ? deltaSec : 0);
          bgProof.tabForeground = foreground;
        } catch {}
        chrome.storage.local.set({ v4_bgproof: bgProof });
      })();
    }
    return; // no response needed
  }
  if (msg?.type === "bgproof.start") {
    bgProofStart(Number(msg.durationMs) || 300_000)
      .then(sendResponse)
      .catch((e) => sendResponse({ ok: false, error: String(e?.message || e) }));
    return true;
  }
  if (msg?.type === "bgproof.status") {
    (async () => {
      if (!bgProof) {
        const st = await chrome.storage.local.get("v4_bgproof");
        if (st?.v4_bgproof) bgProof = st.v4_bgproof;
      }
      const cdp = await getCdpStats();
      sendResponse({
        ok: true,
        now: Date.now(),
        run: bgProof,
        verdict: bgProofVerdict(),
        focusEmu: cdp?.focusEmu || null,
        cdpAttached: cdp?.attached === true,
        framesDelta: bgProof ? Math.max(0, (Number(cdp?.framesSeen) || 0) - (bgProof.framesAtStart || 0)) : 0,
      });
    })();
    return true;
  }
  if (msg?.type === "bgproof.clear") {
    bgProof = null;
    chrome.storage.local.remove("v4_bgproof");
    sendResponse({ ok: true });
    return true;
  }
});
