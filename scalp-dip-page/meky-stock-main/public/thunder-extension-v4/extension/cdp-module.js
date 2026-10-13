(() => {
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

const BACKEND_ENDPOINT = "http://localhost:8090/api/public/hooks/thunder-ticks";
const ORDERBOOK_ENDPOINT = "http://localhost:8090/api/public/hooks/orderbook-snapshot";
const MARKETWATCH_ENDPOINT = "http://localhost:8090/api/public/hooks/thunder-marketwatch";
const QUOTES_ENDPOINT = "http://localhost:8090/api/public/hooks/thunder-quotes";
const TAPE_ENDPOINT = "http://localhost:8090/api/public/hooks/thunder-tape";

// v4.2.21: passive L2 capture. Do not open/call Thunder depth endpoints;
// only parse/store market-depth responses Thunder already fetched.
const L2_CAPTURE_ENABLED = true;
const L2_RECORDING_ENABLED = true;
const FLUSH_MS = 2500;
const FALLBACK_FLUSH_ALARM_MINUTES = 1;
const HEARTBEAT_MS = 25_000;
const DISCOVERY_WINDOW_MS = 60_000;
const MAX_BUFFER = 500;
const DEBUGGER_VERSION = "1.3";
const MARKETWATCH_WATCHDOG_ALARM = "v4cdp_marketwatch_watchdog";
// v4.2.31: aggressive auto-recovery — fires within ~45s of the warning banner
// appearing in the health dashboard instead of the previous 115s.
const MARKETWATCH_STALE_RECOVER_MS = 45_000;
const MARKETWATCH_MIN_RELOAD_GAP_MS = 35_000;
const EXECUTION_RELOAD_GRACE_MS = 30_000;
// v4.2.37: CDP foreground emulation. The tab keeps reporting
// document.visibilityState="visible" + document.hasFocus()=true and is never
// frozen/discarded by Chrome's lifecycle manager, so Thunder keeps polling
// even while the tab is in the background. Tab-switching stays as a last
// resort only after this window elapses.
const FOCUS_EMULATION_ENABLED = true;
const MARKETWATCH_STALE_TABSWITCH_MS = 150_000;

// v4.2.42: Expand Thunder X's *actual scroll container*, not the browser
// viewport. v4.2.41 was disproved by live data (24 current symbols): Thunder X
// virtualizes against a fixed-height inner container, so changing innerHeight
// cannot widen subscriptions. This routine discovers that container from live
// geometry, expands it only while the tab is in the background, and reports
// before/after mounted-row counts. It never scrolls, clicks, or calls Thunder.
const WATCHLIST_EXPANSION_ENABLED = true;
let watchlistExpansionOn = false;

async function isTabInBackground(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab || !tab.active) return true;
    const win = await chrome.windows.get(tab.windowId);
    return !win?.focused;
  } catch {
    return false;
  }
}

async function clearWatchlistExpansion(tabId) {
  if (!tabId) return;
  try {
    await chrome.debugger.sendCommand({ tabId }, "Runtime.evaluate", {
      expression: `(() => {
        const state = window.__thunderWatchlistExpansionV42;
        if (!state?.element) return { ok: true, restored: false };
        state.element.style.cssText = state.cssText || "";
        delete window.__thunderWatchlistExpansionV42;
        return { ok: true, restored: true };
      })()`,
      returnByValue: true,
    });
  } catch {}
  watchlistExpansionOn = false;
}

async function applyWatchlistExpansion(tabId) {
  if (!WATCHLIST_EXPANSION_ENABLED || !tabId) return;
  const background = await isTabInBackground(tabId);
  try {
    if (background) {
      const result = await chrome.debugger.sendCommand({ tabId }, "Runtime.evaluate", {
        expression: `(() => {
          const existing = window.__thunderWatchlistExpansionV42;
          if (existing?.element?.isConnected) {
            return { ok: true, reused: true, beforeRows: existing.beforeRows,
              mountedRows: existing.element.querySelectorAll('[data-index], [role="row"], a[href*="/assets/"]').length,
              height: existing.element.clientHeight, scrollHeight: existing.element.scrollHeight };
          }
          const candidates = Array.from(document.querySelectorAll('body *')).map((el) => {
            const cs = getComputedStyle(el);
            const ch = el.clientHeight || 0;
            const sh = el.scrollHeight || 0;
            if (ch < 120 || sh < ch + 180 || !/(auto|scroll)/.test(cs.overflowY || '')) return null;
            const assetLinks = el.querySelectorAll('a[href*="/assets/"]').length;
            const indexedRows = el.querySelectorAll('[data-index], [role="row"]').length;
            const score = assetLinks * 10000 + indexedRows * 1000 + Math.min(sh - ch, 9999);
            return { el, ch, sh, assetLinks, indexedRows, score };
          }).filter(Boolean).sort((a, b) => b.score - a.score);
          const best = candidates[0];
          if (!best || (best.assetLinks < 2 && best.indexedRows < 4)) {
            return { ok: false, reason: 'watchlist_scroll_container_not_found', candidates: candidates.length };
          }
          const beforeRows = best.el.querySelectorAll('[data-index], [role="row"], a[href*="/assets/"]').length;
          window.__thunderWatchlistExpansionV42 = { element: best.el, cssText: best.el.style.cssText, beforeRows };
          best.el.style.setProperty('height', best.sh + 'px', 'important');
          best.el.style.setProperty('max-height', 'none', 'important');
          best.el.style.setProperty('overflow-y', 'visible', 'important');
          best.el.style.setProperty('contain', 'none', 'important');
          window.dispatchEvent(new Event('resize'));
          return { ok: true, reused: false, beforeRows, mountedRows: beforeRows,
            height: best.el.clientHeight, scrollHeight: best.el.scrollHeight,
            assetLinks: best.assetLinks, indexedRows: best.indexedRows };
        })()`,
        returnByValue: true,
      });
      const value = result?.result?.value || null;
      watchlistExpansionOn = value?.ok === true;
      stats.watchlistExpansion = { ...value, on: watchlistExpansionOn, at: Date.now() };
    } else if (watchlistExpansionOn) {
      await clearWatchlistExpansion(tabId);
      stats.watchlistExpansion = { ok: true, on: false, restored: true, at: Date.now() };
    }
  } catch (e) {
    stats.watchlistExpansion = { ok: false, on: false, error: String(e?.message || e).slice(0, 120), at: Date.now() };
    return;
  }
}

// EGX trading hours: Sunday–Thursday, 10:00–14:30 Cairo local time.
// Cairo is UTC+2 in winter, UTC+3 in summer (DST). Use Intl to get the
// correct wall-clock without shipping a tz database.
function isEgxOpenNow(now = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Cairo",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now);
    const wd = parts.find((p) => p.type === "weekday")?.value || "";
    const h = Number(parts.find((p) => p.type === "hour")?.value ?? -1);
    const m = Number(parts.find((p) => p.type === "minute")?.value ?? -1);
    if (wd === "Fri" || wd === "Sat") return false;
    const mins = h * 60 + m;
    return mins >= 10 * 60 && mins < 14 * 60 + 30;
  } catch {
    return true; // fail-open so we don't accidentally freeze recovery
  }
}

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
  l2Parsed: 0,
  l2Sent: 0,
  l2Dropped: 0,
  l2Last: null,
  l2LastError: null,
  lastTick: null,
  lastFlush: 0,
  lastError: null,
  lastUrl: null,
  discoveryUntil: 0,
  mwParsed: 0,
  mwSent: 0,
  mwDropped: 0,
  mwLast: null,
  mwLastError: null,
  quotesParsed: 0,
  quotesSent: 0,
  quotesDropped: 0,
  quotesLast: null,
  quotesLastError: null,
};
let discoveryLog = []; // [{url, ts, sampleSnippet}]
let token = "";
let flushTimer = null;
let flushInFlight = false;
let quotesBuffer = [];
let quotesFlushTimer = null;
let quotesFlushInFlight = false;
let firebaseQuoteState = {}; // uuid -> { bid, ask, bidTs, askTs }
let lastQuoteBySymbol = {}; // symbol -> { bid, ask, ts }
let marketwatchInFlight = false;
let lastMarketwatchForwardAt = 0;
let rawSamples = []; // last 8 raw WS frames for debugging
let pendingResponseUrls = new Map(); // requestId -> url, read body after Network.loadingFinished
let attachedAt = 0;
let lastMarketwatchReloadAt = 0;
let expectedReloadTabId = null;
let lastExecutionStartedAt = 0;

// ---------- boot ----------

chrome.storage.local.get(["v4cdp_attachedTabId", "v4cdp_uuidToSymbol", "v4cdp_stats", "v4_token", "v4cdp_discoveryLog", "mapping"]).then((s) => {
  uuidToSymbol = mergeLegacyMapping(s.v4cdp_uuidToSymbol || {}, s.mapping || {});
  stats = { ...stats, ...(s.v4cdp_stats || {}), attached: false }; // attached resets on SW wake
  if (String(stats.mwLastError || "").includes("invalid input syntax for type bigint")) stats.mwLastError = null;
  token = s.v4_token || "";
  discoveryLog = s.v4cdp_discoveryLog || [];
  // If we were attached before SW death, try to reattach to the same tab.
  if (s.v4cdp_attachedTabId) {
    reattachIfPossible(s.v4cdp_attachedTabId).catch((e) => {
      stats.lastError = "reattach failed: " + (e?.message || String(e));
      persistStats();
    });
  }
});

chrome.storage.onChanged?.addListener?.((changes, area) => {
  if (area !== "local") return;
  if (changes.v4_token) token = String(changes.v4_token.newValue || "").trim();
  if (!changes.v4_token && changes.token) token = String(changes.token.newValue || "").trim();
  if (changes.mapping) {
    uuidToSymbol = mergeLegacyMapping(uuidToSymbol, changes.mapping.newValue || {});
    chrome.storage.local.set({ v4cdp_uuidToSymbol: uuidToSymbol });
  }
});

function mergeLegacyMapping(base, legacyMapping) {
  const next = { ...(base || {}) };
  for (const [uuid, value] of Object.entries(legacyMapping || {})) {
    const sym = typeof value === "string" ? value : value?.symbol;
    if (UUID_RE.test(String(uuid)) && SYMBOL_RE.test(String(sym || "").toUpperCase())) {
      next[String(uuid).toLowerCase()] = String(sym).toUpperCase();
    }
  }
  return next;
}

chrome.alarms.create("v4cdp_heartbeat", { periodInMinutes: HEARTBEAT_MS / 60_000 });
// Chrome alarms are not reliable below ~30-60s depending on the browser.
// Real-time ticks need an immediate debounce flush; this alarm is only a safety net.
chrome.alarms.create("v4cdp_flush", { periodInMinutes: FALLBACK_FLUSH_ALARM_MINUTES });
chrome.alarms.create(MARKETWATCH_WATCHDOG_ALARM, { periodInMinutes: 0.5 });

chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === "v4cdp_flush") flush().catch(() => {});
  if (a.name === "v4cdp_heartbeat") {
    // Just touching storage is enough to keep SW alive past idle.
    chrome.storage.local.set({ _hb: Date.now() });
    flushQuotes().catch(() => {});
    // v4.2.31: piggyback the watchdog on heartbeat so recovery still fires
    // even if the dedicated 30s alarm is throttled by Chrome.
    marketwatchWatchdog().catch(() => {});
  }
  if (a.name === MARKETWATCH_WATCHDOG_ALARM) marketwatchWatchdog().catch(() => {});
});

// ---------- popup messaging ----------

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "executionStarted") {
    lastExecutionStartedAt = Date.now();
    // v4.1.60: لا نفصل الـ debugger عند تنفيذ أمر جديد.
    // الفصل كان بيكسر اتصال CDP بتاب قائمة المراقبة (مصدر الأسعار)،
    // ويضطر المستخدم يضغط "اتصل بتاب ثاندر" بعد كل إشارة.
    // التاب الجديد بتاع الأمر مالوش علاقة بالـ debugger أصلاً
    // (CDP متربط بتاب الـ watchlist فقط)، فمفيش بانر أصفر هيظهر عليه.
    sendResponse({ ok: true, detached: false, kept: true });
    return true;
  }
  // Only handle messages prefixed cdp.* — leave the rest to v1 background.js.
  if (!msg || typeof msg.type !== "string" || !msg.type.startsWith("cdp.")) return;
  (async () => {
    try {
      if (msg.type === "cdp.getStatus") {
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
      } else if (msg.type === "cdp.attachActiveTab") {
        const tab = await pickThunderTab();
        if (!tab) {
          sendResponse({ ok: false, error: "افتح صفحة web.thndr.app الأول وادخل قائمة المراقبة." });
          return;
        }
        await attach(tab.id);
        sendResponse({ ok: true, tabId: tab.id, title: tab.title });
      } else if (msg.type === "cdp.detach") {
        await detach();
        sendResponse({ ok: true });
      } else if (msg.type === "cdp.clearDiscovery") {
        discoveryLog = [];
        await chrome.storage.local.set({ v4cdp_discoveryLog: discoveryLog });
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
  const { priceSourceUrl } = await chrome.storage.local.get(["priceSourceUrl"]).catch(() => ({}));
  const sourcePrefix = String(priceSourceUrl || "https://web.thndr.app/ar/watchlist").trim();
  const isWatchlist = (t) => /\/watchlist/i.test(String(t?.url || ""));
  const isTrade = (t) => /\/workspaces\/[^/]+\/trade(?:\?|#|\/|$)/i.test(String(t?.url || ""));
  const matchesSource = (t) => sourcePrefix && String(t?.url || "").startsWith(sourcePrefix);
  const active = tabs.find((t) => t.active);
  return tabs.find(isTrade)
    || (active && isTrade(active) ? active : null)
    || tabs.find(matchesSource)
    || tabs.find(isWatchlist)
    || (active && /thndr\.app/.test(String(active.url || "")) ? active : null)
    || tabs[0];
}

function isThunderUrl(url) {
  return /^https:\/\/([^/]+\.)?thndr\.app\//i.test(String(url || ""));
}

function isWatchlistTab(tab) {
  return isThunderUrl(tab?.url) && /\/watchlist(?:\?|#|\/|$)/i.test(String(tab?.url || ""));
}

function isTradeTerminalTab(tab) {
  return isThunderUrl(tab?.url) && /\/workspaces\/[^/]+\/trade(?:\?|#|\/|$)/i.test(String(tab?.url || ""));
}

async function getMarketwatchRecoveryTabs() {
  const tabs = await chrome.tabs.query({ url: ["https://web.thndr.app/*", "https://*.thndr.app/*"] });
  const watchlists = tabs.filter(isWatchlistTab).sort((a, b) => Number(b.active) - Number(a.active));
  const trades = tabs.filter(isTradeTerminalTab).sort((a, b) => Number(b.active) - Number(a.active));
  const targets = [];
  if (trades[0]) targets.push({ tab: trades[0], role: "trade" });
  if (watchlists[0] && watchlists[0].id !== trades[0]?.id) targets.push({ tab: watchlists[0], role: "watchlist" });
  return targets;
}

async function reloadMarketwatchRecoveryTabs(staleMs) {
  const targets = await getMarketwatchRecoveryTabs();
  if (!targets.length) {
    stats.mwLastError = "watchdog_waiting_for_trade_tab";
    persistStats();
    return false;
  }

  const executionFresh = Date.now() - lastExecutionStartedAt < EXECUTION_RELOAD_GRACE_MS;
  const trade = targets.find((item) => item.role === "trade")?.tab || null;
  if (!trade?.id) {
    stats.mwLastError = "watchdog_waiting_for_trade_terminal_tab";
    persistStats();
    return false;
  }
  if (executionFresh) {
    stats.mwLastError = "auto_focus_trade_skipped_execution_active";
    persistStats();
    return false;
  }

  if (attachedTabId !== trade.id) await attach(trade.id);

  const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
  const previousActive = activeTabs?.[0] || null;
  await chrome.tabs.update(trade.id, { active: true });
  setTimeout(() => {
    if (previousActive?.id && previousActive.id !== trade.id) {
      chrome.tabs.update(previousActive.id, { active: true }).catch(() => {});
    }
  }, 1800);

  lastMarketwatchReloadAt = Date.now();
  stats.mwLastError = `auto_focus_trade_after_${Math.round(staleMs / 1000)}s_stale`;
  stats.mwWatchdog = {
    lastReloadAt: lastMarketwatchReloadAt,
    staleSec: Math.round(staleMs / 1000),
    targets: ["trade_focus_pulse"],
  };
  persistStats();
  return true;
}

async function attach(tabId) {
  if (attachedTabId === tabId && stats.attached) return;
  if (attachedTabId != null && attachedTabId !== tabId && stats.attached) {
    try { await chrome.debugger.detach({ tabId: attachedTabId }); } catch {}
  }
  try {
    await chrome.debugger.attach({ tabId }, DEBUGGER_VERSION);
  } catch (e) {
    if (!String(e?.message || "").includes("Another debugger")) throw e;
    // Already attached (probably DevTools open). Tell the user.
    throw new Error("اقفل DevTools على نفس التاب وحاول تاني (debugger متاح لجهة واحدة بس).");
  }
  attachedTabId = tabId;
  attachedAt = Date.now();
  stats.attached = true;
  stats.lastError = null;
  stats.discoveryUntil = Date.now() + DISCOVERY_WINDOW_MS;
  await chrome.storage.local.set({ v4cdp_attachedTabId: attachedTabId });
  await chrome.debugger.sendCommand({ tabId }, "Network.enable", {});
  // Some Thunder traffic is WebSocket — enable explicit WS events.
  try {
    await chrome.debugger.sendCommand({ tabId }, "Network.setCacheDisabled", { cacheDisabled: false });
  } catch {}
  await applyForegroundEmulation(tabId);
  persistStats();
}

/**
 * Keep a background tab behaving exactly like a focused foreground tab.
 *
 * - Emulation.setFocusEmulationEnabled: same switch DevTools exposes as
 *   "Emulate a focused page" → document.hasFocus() stays true and the page
 *   never receives blur, so Thunder's polling loops don't idle down.
 * - Page.setWebLifecycleState{state:"active"}: blocks Chrome from freezing
 *   or discarding the tab (the real reason data stops after a few minutes).
 *
 * Both are re-asserted on every heartbeat because a navigation/reattach
 * resets them.
 */
async function applyForegroundEmulation(tabId = attachedTabId) {
  if (!FOCUS_EMULATION_ENABLED || !tabId) return false;
  let ok = true;
  const errs = [];
  try {
    await chrome.debugger.sendCommand({ tabId }, "Page.enable", {});
  } catch (e) { errs.push("page:" + String(e?.message || e).slice(0, 60)); }
  try {
    await chrome.debugger.sendCommand({ tabId }, "Emulation.setFocusEmulationEnabled", { enabled: true });
  } catch (e) { ok = false; errs.push("focus:" + String(e?.message || e).slice(0, 60)); }
  try {
    await chrome.debugger.sendCommand({ tabId }, "Page.setWebLifecycleState", { state: "active" });
  } catch (e) { ok = false; errs.push("lifecycle:" + String(e?.message || e).slice(0, 60)); }
  try { await applyWatchlistExpansion(tabId); } catch {}
  stats.focusEmu = { ok, at: Date.now(), tabId, error: errs.length ? errs.join(" | ") : null };
  persistStats();
  return ok;
}

async function detach() {
  if (attachedTabId != null) {
    if (watchlistExpansionOn) await clearWatchlistExpansion(attachedTabId);
    try { await chrome.debugger.detach({ tabId: attachedTabId }); } catch {}
  }
  attachedTabId = null;
  attachedAt = 0;
  stats.attached = false;
  await chrome.storage.local.set({ v4cdp_attachedTabId: null });
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
  if (reason === "target_closed" && expectedReloadTabId === source.tabId) {
    setTimeout(() => {
      if (attachedTabId) reattachIfPossible(attachedTabId).catch(() => {});
    }, 2500);
    return;
  }
  // "canceled_by_user" → don't auto-reattach (user clicked cancel on yellow bar).
  // "target_closed" / "replaced_with_devtools" → don't reattach.
  if (reason === "target_closed" || reason === "canceled_by_user" || reason === "replaced_with_devtools") {
    attachedTabId = null;
    chrome.storage.local.set({ v4cdp_attachedTabId: null });
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
    attachedAt = 0;
    stats.attached = false;
    chrome.storage.local.set({ v4cdp_attachedTabId: null });
  }
});

chrome.tabs.onUpdated?.addListener?.((tabId, info, tab) => {
  if (tabId !== attachedTabId) return;
  if (info.status !== "complete") return;
  if (!tab?.url || !/thndr\.app/.test(String(tab.url))) return;
  setTimeout(() => {
    reattachIfPossible(tabId).catch((e) => {
      stats.lastError = "post_reload_reattach: " + (e?.message || String(e));
      persistStats();
    });
  }, 1200);
});

async function marketwatchWatchdog() {
  const now = Date.now();
  // Only run recovery during EGX trading hours (Sun–Thu, 10:00–14:30 Cairo).
  // After close, Thunder itself stops pushing marketwatch — reloading tabs
  // would just churn the browser for no data.
  if (!isEgxOpenNow()) {
    stats.mwLastError = "watchdog_skipped_market_closed";
    persistStats();
    return;
  }
  if (!attachedTabId) {
    const preferred = await pickThunderTab();
    if (preferred?.id) {
      try {
        await attach(preferred.id);
        stats.mwLastError = "watchdog_attached_missing_tab";
        persistStats();
      } catch (e) {
        stats.mwLastError = "watchdog_attach_failed: " + String(e?.message || e).slice(0, 120);
        persistStats();
      }
    }
  }
  if (attachedTabId && stats.attached !== true) {
    try {
      await reattachIfPossible(attachedTabId);
      stats.mwLastError = "watchdog_reattached_after_detach";
      persistStats();
    } catch (e) {
      stats.mwLastError = "watchdog_reattach_failed: " + String(e?.message || e).slice(0, 120);
      persistStats();
      return;
    }
  }
  const activeMs = attachedAt ? now - attachedAt : 0;
  if (activeMs < 60_000) return;
  // Cheap, invisible first line of defense: re-assert foreground emulation
  // before ever touching the user's active tab.
  try { await applyForegroundEmulation(); } catch {}
  const lastOk = Number(stats.mwLast?.ts) || 0;
  const staleMs = lastOk ? now - lastOk : activeMs;
  if (staleMs < MARKETWATCH_STALE_RECOVER_MS) return;
  if (FOCUS_EMULATION_ENABLED && stats.focusEmu?.ok && staleMs < MARKETWATCH_STALE_TABSWITCH_MS) {
    stats.mwLastError = `focus_emulation_active_no_tabswitch_${Math.round(staleMs / 1000)}s`;
    persistStats();
    return;
  }
  if (now - lastMarketwatchReloadAt < MARKETWATCH_MIN_RELOAD_GAP_MS) return;
  await reloadMarketwatchRecoveryTabs(staleMs);
}

// ---------- CDP event handling ----------

chrome.debugger.onEvent.addListener(async (source, method, params) => {
  if (source.tabId !== attachedTabId) return;
  stats.framesSeen++;

  try {
    if (method === "Network.webSocketFrameReceived") {
      const payload = params?.response?.payloadData;
      if (payload) handlePayload(decodeWebSocketPayload(payload, params?.response?.opcode), params?.response?.opcode === 1 ? "ws-text" : "ws-bin", "ws://" + (params?.requestId || ""));
    } else if (method === "Network.eventSourceMessageReceived") {
      handlePayload(params?.data || "", "sse", "sse://" + (params?.requestId || ""));
    } else if (method === "Network.responseReceived") {
      const url = params?.response?.url || "";
      if (!shouldInspect(url)) return;
      pendingResponseUrls.set(params.requestId, url);
      if (pendingResponseUrls.size > 200) pendingResponseUrls = new Map(Array.from(pendingResponseUrls).slice(-120));
    } else if (method === "Network.loadingFinished") {
      const reqId = params?.requestId;
      const url = pendingResponseUrls.get(reqId);
      if (!url) return;
      pendingResponseUrls.delete(reqId);
      chrome.debugger.sendCommand({ tabId: source.tabId }, "Network.getResponseBody", { requestId: reqId })
        .then((res) => {
          if (!res?.body) return;
          const body = res.base64Encoded ? decodeBase64Utf8(res.body) : res.body;
          handlePayload(body, "http", url);
        })
        .catch(() => {});
    }
  } catch (e) {
    stats.lastError = "event: " + (e?.message || String(e));
    persistStats();
  }
});

function decodeWebSocketPayload(payload, opcode) {
  if (opcode === 1) return payload;
  const decoded = decodeBase64Utf8(payload);
  return decoded || payload;
}

function decodeBase64Utf8(value) {
  try {
    const binary = atob(String(value || ""));
    const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  } catch {
    try { return atob(String(value || "")); } catch { return ""; }
  }
}

function shouldInspect(url) {
  if (!url) return false;
  // Skip static assets / images / fonts.
  if (/\.(png|jpe?g|gif|svg|webp|ico|woff2?|ttf|css|map)(\?|$)/i.test(url)) return false;
  // Only Thunder + Firebase REST mirrors.
  return /thndr\.app|firebaseio|firebasedatabase|googleapis\.com.*identitytoolkit/i.test(url);
}

const MARKET_DEPTH_RE = /\/market-depth\/([0-9a-fA-F-]{36})/;
// Thunder X trades-book/v2 endpoint:
//   /assets-service/market-depth/v2/trades-book/{asset_id}?page_size=...
const TRADES_BOOK_RE = /\/market-depth\/v2\/trades-book\/([0-9a-fA-F-]{36})/;

function isMarketDepthUrl(url) {
  return MARKET_DEPTH_RE.test(String(url || ""));
}
function isTradesBookUrl(url) {
  return TRADES_BOOK_RE.test(String(url || ""));
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
    chrome.storage.local.set({ v4cdp_discoveryLog: discoveryLog });
  }

  // 1) Try JSON (strip JSONP wrapper if present).
  let parsed = tryParseJson(raw);
  if (parsed) {
    if (L2_CAPTURE_ENABLED === true && isMarketDepthUrl(url) && !isTradesBookUrl(url)) recordMarketDepthFromCdp(url, parsed).catch(() => {});
    if (isTradesBookUrl(url)) forwardTapeFromCdp(url, parsed).catch(() => {});
    const marketwatch = extractMarketwatchSnapshot(parsed, url);
    if (marketwatch) forwardMarketwatchFromCdp(marketwatch).catch(() => {});
    // First: enrich UUID→symbol map if this looks like a watchlist/instruments list.
    extractSymbolMap(parsed);
    // Firebase Realtime DB wire format: {t:"d", d:{b:{p:"path/uuid/field", d:<value-or-object>}}}
    extractFirebaseTicks(parsed);
    extractFirebaseQuotes(parsed);
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
      const marketwatch = extractMarketwatchSnapshot(p, url);
      if (marketwatch) forwardMarketwatchFromCdp(marketwatch).catch(() => {});
      extractFirebaseTicks(p);
      extractFirebaseQuotes(p);
      for (const t of walkForTicks(p)) enqueueTick(t);
    }
  }
}

function normalizeMwNumber(v) {
  if (v === "" || v == null) return null;
  if (typeof v === "string") {
    const n = Number(v.replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function mwInteger(v) {
  const n = normalizeMwNumber(v);
  return n == null ? null : Math.round(n);
}

function pickMarketwatchSymbol(a) {
  const s = String(a?.reuters || a?.symbol_code || a?.stock_id || a?.symbol || a?.ticker || a?.code || "").trim().toUpperCase();
  if (!/^[A-Z0-9._-]{2,16}$/.test(s)) return "";
  if (/^EG[A-Z0-9]{8,}$/i.test(s)) return "";
  return s;
}

function firstMwNumber(a, keys) {
  for (const k of keys) {
    const n = normalizeMwNumber(a?.[k]);
    if (n != null) return n;
  }
  return null;
}

function shapeMarketwatchAssets(assets) {
  if (!Array.isArray(assets) || assets.length < 10 || assets.length > 500) return null;
  const shaped = [];
  let sameDay = 0;
  let rawSampleCount = 0;
  for (const a of assets) {
    if (!a || typeof a !== "object") continue;
    const hasMarketFields =
      Object.prototype.hasOwnProperty.call(a, "total_volume") ||
      Object.prototype.hasOwnProperty.call(a, "totalVolume") ||
      Object.prototype.hasOwnProperty.call(a, "volume") ||
      Object.prototype.hasOwnProperty.call(a, "total_trades") ||
      Object.prototype.hasOwnProperty.call(a, "totalTrades") ||
      Object.prototype.hasOwnProperty.call(a, "total_value") ||
      Object.prototype.hasOwnProperty.call(a, "last_trade_price") ||
      Object.prototype.hasOwnProperty.call(a, "lastTradePrice") ||
      Object.prototype.hasOwnProperty.call(a, "last_price") ||
      Object.prototype.hasOwnProperty.call(a, "avg_change_prc");
    if (!hasMarketFields) continue;
    const symbol = pickMarketwatchSymbol(a);
    if (!symbol) continue;
    if (a.is_same_day === true || a.isSameDay === true) sameDay++;
    // v4.2.29 diagnostic: attach the original asset object for the first 5 rows
    // so we can inspect the actual Thunder field names on the server side.
    // No behavior change — the ingest hook already accepts `raw` (nullable).
    let rawSample = null;
    if (rawSampleCount < 5) {
      try {
        rawSample = JSON.parse(JSON.stringify(a));
        rawSampleCount++;
      } catch { rawSample = null; }
    }
    shaped.push({
      symbol,
      asset_id: a.asset_id != null ? String(a.asset_id) : (a.assetId != null ? String(a.assetId) : null),
      ref_price: firstMwNumber(a, ["ref_price", "refPrice", "reference_price", "referencePrice"]),
      last_price: firstMwNumber(a, ["last_trade_price", "lastTradePrice", "last_price", "lastPrice", "price", "ltp"]),
      avg_change_prc: firstMwNumber(a, ["avg_change_prc", "avgChangePrc", "change_percent", "changePercent"]),
      total_volume: mwInteger(firstMwNumber(a, ["total_volume", "totalVolume", "volume", "traded_volume", "tradedVolume", "cumVolume"])),
      total_trades: mwInteger(firstMwNumber(a, ["total_trades", "totalTrades", "trades", "trade_count", "tradeCount"])),
      total_value: firstMwNumber(a, ["total_value", "totalValue", "value", "traded_value", "tradedValue"]),
      total_bids: mwInteger(firstMwNumber(a, ["total_bids", "totalBids"])),
      total_asks: mwInteger(firstMwNumber(a, ["total_asks", "totalAsks"])),
      total_buy: mwInteger(firstMwNumber(a, ["total_buy", "totalBuy"])),
      total_sell: mwInteger(firstMwNumber(a, ["total_sell", "totalSell"])),
      high_price_limit: firstMwNumber(a, ["high_price_limit", "highPriceLimit"]),
      low_price_limit: firstMwNumber(a, ["low_price_limit", "lowPriceLimit"]),
      avg_5_day: firstMwNumber(a, ["avg_5_day", "avg5Day"]),
      avg_30_day: firstMwNumber(a, ["avg_30_day", "avg30Day"]),
      avg_90_day: firstMwNumber(a, ["avg_90_day", "avg90Day"]),
      is_same_day: a.is_same_day ?? a.isSameDay ?? null,
      highest_bid: firstMwNumber(a, ["highest_bid", "highestBid", "best_bid", "bestBid", "bid_price", "bidPrice", "bid"]),
      lowest_ask: firstMwNumber(a, ["lowest_ask", "lowestAsk", "best_ask", "bestAsk", "ask_price", "askPrice", "ask", "offer_price", "offerPrice"]),
      highest_bid_qty: mwInteger(firstMwNumber(a, ["highest_bid_qty", "highestBidQty", "bid_qty", "bidQty", "bid_size", "bidSize", "bid_volume", "bidVolume"])),
      lowest_ask_qty: mwInteger(firstMwNumber(a, ["lowest_ask_qty", "lowestAskQty", "ask_qty", "askQty", "ask_size", "askSize", "offer_qty", "offerQty", "ask_volume", "askVolume"])),
      high_price: firstMwNumber(a, ["high_price", "highPrice", "day_high", "dayHigh"]),
      low_price: firstMwNumber(a, ["low_price", "lowPrice", "day_low", "dayLow"]),
      last_trade_volume: firstMwNumber(a, ["last_trade_volume", "lastTradeVolume"]),
      last_change_prc: firstMwNumber(a, ["last_change_prc", "lastChangePrc", "change_prc", "changePrc"]),
      symbol_state: (a.symbol_state ?? a.symbolState ?? null) != null ? String(a.symbol_state ?? a.symbolState) : null,
      trade_rec_serial: mwInteger(firstMwNumber(a, ["trade_rec_serial", "tradeRecSerial", "symbols_rec_serial", "symbolsRecSerial"])),
      last_trade_date: (a.last_trade_date ?? a.lastTradeDate ?? null) != null ? String(a.last_trade_date ?? a.lastTradeDate) : null,
      open_price: firstMwNumber(a, ["open_price", "openPrice"]),
      previous_close: firstMwNumber(a, ["previous_close", "previousClose", "prev_close", "prevClose"]),
      close_price: firstMwNumber(a, ["close_price", "closePrice"]),
      high_52_week: firstMwNumber(a, ["high_52_week", "high52Week", "week_52_high", "yearHigh"]),
      low_52_week: firstMwNumber(a, ["low_52_week", "low52Week", "week_52_low", "yearLow"]),
      listed_shares: firstMwNumber(a, ["listed_shares", "listedShares", "outstanding_shares", "outstandingShares"]),
      avg_180_day: firstMwNumber(a, ["avg_180_day", "avg180Day"]),
      raw: rawSample,
    });
  }
  const usefulRows = shaped.filter((a) =>
    (Number(a.total_volume) || 0) > 0 ||
    (Number(a.total_trades) || 0) > 0 ||
    (Number(a.total_value) || 0) > 0
  ).length;
  return shaped.length >= 10 && usefulRows > 0 ? { assets: shaped, sameDay, usefulRows } : null;
}

function findMarketwatchAssets(json) {
  try {
    if (!json || typeof json !== "object") return null;
    const direct = shapeMarketwatchAssets(Array.isArray(json) ? json : json.assets);
    if (direct) return direct;
    const queue = [json];
    const seen = new WeakSet();
    let visits = 0;
    while (queue.length && visits < 180) {
      const node = queue.shift();
      if (!node || typeof node !== "object") continue;
      if (seen.has(node)) continue;
      seen.add(node);
      visits++;
      if (Array.isArray(node)) {
        const shaped = shapeMarketwatchAssets(node);
        if (shaped) return shaped;
        for (const child of node.slice(0, 40)) if (child && typeof child === "object") queue.push(child);
      } else {
        for (const child of Object.values(node)) if (child && typeof child === "object") queue.push(child);
      }
    }
  } catch {}
  return null;
}

function extractMarketwatchSnapshot(json, url) {
  const found = findMarketwatchAssets(json);
  if (!found?.assets?.length) return null;
  return {
    captured_at: new Date().toISOString(),
    assets: found.assets,
    same_day: found.sameDay,
    source: "thunder-cdp-marketwatch",
    response_url: String(url || "").slice(0, 240),
  };
}

async function forwardMarketwatchFromCdp(payload) {
  if (!payload?.assets?.length) return;
  if (marketwatchInFlight) return;
  if (Date.now() - lastMarketwatchForwardAt < 4_000) return;
  const safePayload = {
    ...payload,
    assets: payload.assets.map((a) => ({
      ...a,
      total_volume: mwInteger(a?.total_volume),
      total_trades: mwInteger(a?.total_trades),
      total_bids: mwInteger(a?.total_bids),
      total_asks: mwInteger(a?.total_asks),
      total_buy: mwInteger(a?.total_buy),
      total_sell: mwInteger(a?.total_sell),
      highest_bid_qty: mwInteger(a?.highest_bid_qty),
      lowest_ask_qty: mwInteger(a?.lowest_ask_qty),
    })),
  };
  stats.mwParsed = (stats.mwParsed || 0) + payload.assets.length;
  if (!token) {
    stats.mwDropped = (stats.mwDropped || 0) + payload.assets.length;
    stats.mwLastError = "token missing";
    persistStats();
    return;
  }
  marketwatchInFlight = true;
  lastMarketwatchForwardAt = Date.now();
  try {
    const res = await fetch(MARKETWATCH_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-thunder-token": token },
      body: JSON.stringify(safePayload),
    });
    if (!res.ok) {
      const details = await res.text().catch(() => "");
      stats.mwLastError = `marketwatch ${res.status}: ${details.slice(0, 160)}`;
      stats.mwDropped = (stats.mwDropped || 0) + payload.assets.length;
    } else {
      const json = await res.json().catch(() => ({}));
      stats.mwSent = (stats.mwSent || 0) + (Number(json?.inserted) || safePayload.assets.length);
      stats.mwLast = { ts: Date.now(), assets: payload.assets.length, sameDay: payload.same_day || 0, source: payload.source };
      stats.mwLastError = null;
    }
  } catch (e) {
    stats.mwLastError = String(e?.message || e).slice(0, 180);
    stats.mwDropped = (stats.mwDropped || 0) + payload.assets.length;
  } finally {
    marketwatchInFlight = false;
    persistStats();
  }
}

// -----------------------------------------------------------------------------
// Passive Thunder X trades-book/v2 (tape / Level 3) capture.
// Only fires when the user themselves opens an asset detail page — the
// extension never polls this endpoint. Zero detection surface.
// -----------------------------------------------------------------------------
let tapeInFlight = false;
let lastTapeForwardAt = 0;
const tapeLastCursorByAsset = Object.create(null);

function shapeTapeTrades(json) {
  // Thunder X trades-book/v2 payload shape (observed in HAR):
  //   { data: [ { cursor, order_side|side, order_price|price, volume_traded|volume, value, trade_date|time }, ... ] }
  // Fall back to any array of trade-like objects.
  const candidates = [];
  const push = (arr) => { if (Array.isArray(arr)) candidates.push(arr); };
  if (json && typeof json === "object") {
    push(json.data);
    push(json.trades);
    push(json.results);
    if (Array.isArray(json)) push(json);
  }
  for (const arr of candidates) {
    const out = [];
    for (const t of arr) {
      if (!t || typeof t !== "object") continue;
      const cursor = t.cursor ?? t.id ?? t.trade_id ?? t.sequence ?? t.seq;
      if (cursor == null) continue;
      const cursorNum = Number(cursor);
      if (!Number.isFinite(cursorNum)) continue;
      const side = String(t.order_side ?? t.side ?? t.trade_side ?? "").toUpperCase() || null;
      const price = Number(t.order_price ?? t.price ?? t.trade_price ?? NaN);
      const volume = Number(t.volume_traded ?? t.volume ?? t.qty ?? t.quantity ?? NaN);
      const value = Number(t.value ?? t.trade_value ?? NaN);
      const time = t.trade_date ?? t.time ?? t.trade_time ?? t.timestamp ?? null;
      out.push({
        cursor: cursorNum,
        side: side || null,
        price: Number.isFinite(price) ? price : null,
        volume: Number.isFinite(volume) ? volume : null,
        value: Number.isFinite(value) ? value : null,
        time: time == null ? null : String(time),
      });
    }
    if (out.length) return out;
  }
  return [];
}

async function forwardTapeFromCdp(url, json) {
  try {
    const m = TRADES_BOOK_RE.exec(String(url || ""));
    const assetId = String(m?.[1] || "").toLowerCase();
    if (!assetId) return;
    const trades = shapeTapeTrades(json);
    if (!trades.length) return;

    // Cursor de-dupe on the client: only forward strictly new trades.
    const lastCursor = tapeLastCursorByAsset[assetId] || 0;
    const fresh = trades.filter((t) => t.cursor > lastCursor).slice(0, 500);
    if (!fresh.length) return;
    const maxCursor = fresh.reduce((mx, t) => (t.cursor > mx ? t.cursor : mx), lastCursor);
    tapeLastCursorByAsset[assetId] = maxCursor;

    // Rate-limit forwarding to at most one POST per 1.5s.
    if (tapeInFlight) return;
    if (Date.now() - lastTapeForwardAt < 1_500) return;
    if (!token) {
      stats.tapeDropped = (stats.tapeDropped || 0) + fresh.length;
      stats.tapeLastError = "token missing";
      persistStats();
      return;
    }
    const symbol = uuidToSymbol[assetId] || null;
    const body = {
      asset_id: assetId,
      symbol,
      captured_at: new Date().toISOString(),
      trades: fresh,
    };
    tapeInFlight = true;
    lastTapeForwardAt = Date.now();
    stats.tapeParsed = (stats.tapeParsed || 0) + fresh.length;
    try {
      const res = await fetch(TAPE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-thunder-token": token },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const details = await res.text().catch(() => "");
        stats.tapeLastError = `tape ${res.status}: ${details.slice(0, 160)}`;
        stats.tapeDropped = (stats.tapeDropped || 0) + fresh.length;
      } else {
        const j = await res.json().catch(() => ({}));
        stats.tapeSent = (stats.tapeSent || 0) + (Number(j?.inserted) || fresh.length);
        stats.tapeLast = { ts: Date.now(), asset_id: assetId, symbol, count: fresh.length };
        stats.tapeLastError = null;
      }
    } catch (e) {
      stats.tapeLastError = String(e?.message || e).slice(0, 180);
      stats.tapeDropped = (stats.tapeDropped || 0) + fresh.length;
    } finally {
      tapeInFlight = false;
      persistStats();
    }
  } catch {}
}

async function recordMarketDepthFromCdp(url, json) {
  // Not a market-depth L2 payload — trades-book/v2 shares the market-depth
  // path prefix on Thunder X, so the caller must have already routed
  // trades-book URLs to forwardTapeFromCdp.
  if (L2_CAPTURE_ENABLED !== true) return;
  try {
    const m = MARKET_DEPTH_RE.exec(String(url || ""));
    const uuid = String(m?.[1] || "").toLowerCase();
    if (!uuid) return;
    const rawAsks = Array.isArray(json?.asks_per_price) ? json.asks_per_price : [];
    const rawBids = Array.isArray(json?.bids_per_price) ? json.bids_per_price : [];
    if (!rawAsks.length && !rawBids.length) return;
    const asks = rawAsks
      .map((a) => ({ price: Number(a?.order_price), qty: Number(a?.volume_traded) || 0 }))
      .filter((a) => a.price > 0)
      .sort((a, b) => a.price - b.price)
      .slice(0, 5);
    const bids = rawBids
      .map((b) => ({ price: Number(b?.order_price), qty: Number(b?.volume_traded) || 0 }))
      .filter((b) => b.price > 0)
      .sort((a, b) => b.price - a.price)
      .slice(0, 5);
    const symbol = uuidToSymbol[uuid];
    if (!symbol) {
      stats.l2Dropped++;
      stats.l2LastError = `missing_symbol_for_${uuid}`;
      persistStats();
      return;
    }
    stats.l2Parsed++;
    const payload = {
      symbol,
      ts: Date.now(),
      best_bid: Number(bids[0]?.price) || null,
      best_bid_qty: Number(bids[0]?.qty) || null,
      best_ask: Number(asks[0]?.price) || null,
      best_ask_qty: Number(asks[0]?.qty) || null,
      last_price: null,
      bids,
      asks,
        source: "thunder_l2_cdp_passive",
    };
    if (!token) {
      stats.l2Dropped++;
      stats.l2LastError = "token missing";
      persistStats();
      return;
    }
    if (L2_RECORDING_ENABLED !== true) {
      // Kill-switch active — do not send. Count so popup shows we're parsing
      // fine, just intentionally not shipping.
      stats.l2Dropped++;
      stats.l2LastError = "l2_recording_disabled";
      persistStats();
      return;
    }
    const res = await fetch(ORDERBOOK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-thunder-token": token },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const details = await res.text().catch(() => "");
      stats.l2LastError = `l2 ${res.status}: ${details.slice(0, 160)}`;
      persistStats();
      return;
    }
    stats.l2Sent++;
    stats.l2Last = { symbol, uuid, ts: Date.now(), bestBid: payload.best_bid, bestAsk: payload.best_ask };
    stats.l2LastError = null;
    persistStats();
  } catch (e) {
    stats.l2LastError = String(e?.message || e);
    persistStats();
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

const BID_FIELD_RE = /^(highest_bid|highestBid|best_bid|bestBid|bid|bidPrice|bid_price)$/i;
const ASK_FIELD_RE = /^(lowest_ask|lowestAsk|best_ask|bestAsk|ask|askPrice|ask_price|offer|offerPrice)$/i;

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

function extractFirebaseQuotes(obj) {
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

    if (uuidInPath && (BID_FIELD_RE.test(lastSeg) || ASK_FIELD_RE.test(lastSeg))) {
      enqueueQuote(uuidInPath, BID_FIELD_RE.test(lastSeg) ? "bid" : "ask", d);
      return;
    }

    if (uuidInPath && d && typeof d === "object") {
      const bid = pickQuoteNumber(d, BID_FIELD_RE);
      const ask = pickQuoteNumber(d, ASK_FIELD_RE);
      if (bid != null) enqueueQuote(uuidInPath, "bid", bid);
      if (ask != null) enqueueQuote(uuidInPath, "ask", ask);
      return;
    }

    if (typeof d === "object") {
      for (const [k, v] of Object.entries(d)) {
        if (!UUID_RE.test(k) || !v || typeof v !== "object") continue;
        const bid = pickQuoteNumber(v, BID_FIELD_RE);
        const ask = pickQuoteNumber(v, ASK_FIELD_RE);
        if (bid != null) enqueueQuote(k.toLowerCase(), "bid", bid);
        if (ask != null) enqueueQuote(k.toLowerCase(), "ask", ask);
      }
    }
  });
}

function pickQuoteNumber(o, fieldRe) {
  if (!o || typeof o !== "object") return null;
  for (const k of Object.keys(o)) {
    if (!fieldRe.test(k)) continue;
    const n = Number(o[k]);
    if (Number.isFinite(n) && n > 0 && n < 100_000) return n;
  }
  return null;
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
  chrome.storage.local.set({ v4cdp_uuidToSymbol: uuidToSymbol });
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
  chrome.storage.local.set({ v4cdp_stats: stats });
}

function enqueueQuote(uuid, side, rawValue) {
  const id = String(uuid || "").toLowerCase();
  if (!UUID_RE.test(id)) return;
  const value = Number(rawValue);
  if (!Number.isFinite(value) || value <= 0 || value >= 100_000) return;
  const symbol = uuidToSymbol[id];
  if (!symbol) {
    stats.quotesDropped = (stats.quotesDropped || 0) + 1;
    stats.quotesLastError = `missing_symbol_for_${id}`;
    persistStats();
    return;
  }
  const state = firebaseQuoteState[id] || (firebaseQuoteState[id] = {});
  if (side === "bid") { state.bid = value; state.bidTs = Date.now(); }
  else if (side === "ask") { state.ask = value; state.askTs = Date.now(); }
  else return;
  const bid = Number(state.bid) > 0 ? Number(state.bid) : null;
  const ask = Number(state.ask) > 0 ? Number(state.ask) : null;
  if (bid == null && ask == null) return;
  const prev = lastQuoteBySymbol[symbol];
  const now = Date.now();
  if (prev && prev.bid === bid && prev.ask === ask && now - prev.ts < 500) return;
  lastQuoteBySymbol[symbol] = { bid, ask, ts: now };
  quotesBuffer.push({ symbol, uuid: id, bid, ask, ts: new Date().toISOString() });
  if (quotesBuffer.length > MAX_BUFFER) quotesBuffer = quotesBuffer.slice(-MAX_BUFFER);
  stats.quotesParsed = (stats.quotesParsed || 0) + 1;
  stats.quotesLast = { symbol, bid, ask, ts: now };
  scheduleQuotesFlush();
  persistStats();
}

function scheduleQuotesFlush() {
  if (quotesFlushTimer) return;
  quotesFlushTimer = setTimeout(() => {
    quotesFlushTimer = null;
    flushQuotes().catch(() => {});
  }, 700);
}

async function flushQuotes() {
  if (!quotesBuffer.length || quotesFlushInFlight) return;
  if (!token) {
    stats.quotesLastError = "token missing";
    persistStats();
    return;
  }
  quotesFlushInFlight = true;
  const batch = quotesBuffer.splice(0, quotesBuffer.length);
  try {
    const res = await fetch(QUOTES_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-thunder-token": token },
      body: JSON.stringify({ quotes: batch }),
    });
    if (!res.ok) {
      const details = await res.text().catch(() => "");
      stats.quotesLastError = `quotes ${res.status}: ${details.slice(0, 140)}`;
      stats.quotesDropped = (stats.quotesDropped || 0) + batch.length;
      quotesBuffer = batch.concat(quotesBuffer).slice(-MAX_BUFFER);
      return;
    }
    const json = await res.json().catch(() => ({}));
    stats.quotesSent = (stats.quotesSent || 0) + (Number(json?.inserted) || batch.length);
    stats.quotesLastError = null;
  } catch (e) {
    stats.quotesLastError = String(e?.message || e).slice(0, 160);
    quotesBuffer = batch.concat(quotesBuffer).slice(-MAX_BUFFER);
  } finally {
    quotesFlushInFlight = false;
    persistStats();
  }
}

})();
