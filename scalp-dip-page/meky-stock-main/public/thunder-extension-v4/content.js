/* Content script (ISOLATED world).
 * 1) Injects page-script.js into MAIN world (price/watchlist interception).
 * 2) Relays page-world messages to the background SW.
 * 3) Receives `executeOrder` from the background SW and runs a
 *    human-mimicry sequence to OPEN the buy form, fill quantity, and STOP
 *    at the review step. The user clicks the final confirm.
 *
 * Selectors are intentionally fuzzy (text-based) because Thunder's
 * production build uses hashed class names. If a step fails, we report
 * `error` back so the user gets a Telegram-style alert from the popup
 * and knows to act manually.
 */
(function () {
  const CONTENT_SCRIPT_VERSION = "v4.2.43-active-marketwatch";
  if (window.__thunderContentHooked === CONTENT_SCRIPT_VERSION) return;
  window.__thunderContentHooked = CONTENT_SCRIPT_VERSION;
  const IS_TOP_FRAME = window.top === window;
  // v4.1.85: expose a hard marker so the Lovable web app can detect the
  // extension synchronously (used by the manual "افتح تاب ثاندر" button).
  try {
    if (IS_TOP_FRAME && document?.documentElement) {
      document.documentElement.setAttribute("data-thunder-ext-v4", CONTENT_SCRIPT_VERSION);
    }
  } catch {}
  const pendingMainCommands = new Map();
  let keepAlivePort = null;
  let keepAliveTimer = null;
  let activeExecution = null;
  let orderTypeAttemptLockedUntil = 0;
  let settlementAttemptLockedUntil = 0;
  // v4.1.97-diag: throttling investigation instruments
  let __diagAudioEl = null;
  let __diagAudioCtx = null;
  let __diagOscillator = null;
  let __diagAudioCtxStartedAt = 0;
  let __diagAudioResumeAttempts = 0;
  let __diagAudioResumeOk = 0;
  let __diagDepthCount = 0;
  let __diagDepthCountSinceLastPost = 0;
  let __diagLastDepthTs = 0;
  let __diagLastSymbol = null;
  let __diagL2SoftResets = 0;
  let limitPriceAttemptLockedUntil = 0;
  let openPositionsBySymbol = {};
  let positionsBanner = null;
  const alertedPositions = {}; // pid -> last alert ts
  let __autoSellArmedAt = 0; // dedupe: global vs per-order auto-sell triggers
  const ACTIVE_TRADE_LEDGER_KEY = "v4_active_scalp_trades";
  const SIGNAL_LEDGER_KEY = "v4_scalp_signals";
  const L2_PRE_TRADE_GUARD_ENABLED = false;

  // Timeline telemetry — fire-and-forget. NEVER blocks flow.
  // Rolling context set per executeOrder call so we don't have to thread
  // signal_id/symbol/uuid through every helper.
  let __currentSignalCtx = { signal_id: null, symbol: null, uuid: null };
  function logTiming(event, meta) {
    try {
      const payload = {
        signal_id: __currentSignalCtx.signal_id || null,
        symbol: __currentSignalCtx.symbol || null,
        uuid: __currentSignalCtx.uuid || null,
        event: String(event || ""),
        at_ms: Date.now(),
        meta: (meta && typeof meta === "object") ? meta : {},
      };
      chrome.runtime.sendMessage({ type: "timelineEvent", payload }, () => { void chrome.runtime.lastError; });
    } catch {}
  }

  // ==================== Marketwatch volume capture (v4.2.21) ====================
  // Content-script polling stays disabled. Volume snapshots are captured
  // passively from Thunder's own marketwatch network responses, so we do not
  // create 429 pressure.
  const MARKETWATCH_ACTIVE_POLL_ENABLED = false;
  let mwToken = "";
  let mwTokenSeenAt = 0;
  let mwTimer = null;
  let mwInFlight = false;
  let mwLastOk = 0;
  let mwLastError = "page_active_poll_v4243";
  let mwLastAssets = 0;
  let mwLastSameDay = 0;
  let mwLastSent = 0;
  let mwBackoffUntil = 0;

  function onAuthTokenSeen(payload) {
    const t = payload && typeof payload.token === "string" ? payload.token : "";
    if (!t || t.length < 20) return;
    mwToken = t;
    mwTokenSeenAt = Date.now();
    mwLastError = "page_active_poll_v4243";
    postMarketwatchStatus();
  }

  function startMarketwatchPoller() {
    mwLastError = "page_active_poll_v4243";
    postMarketwatchStatus();
  }

  function postMarketwatchStatus() {
    try {
      chrome.runtime.sendMessage({
        type: "marketwatchStatus",
        payload: {
          hasToken: !!mwToken,
          tokenSeenAt: mwTokenSeenAt || null,
          lastOk: mwLastOk || null,
          lastError: mwLastError,
          lastAssets: mwLastAssets,
          lastSameDay: mwLastSameDay,
          lastSent: mwLastSent || null,
          backoffUntil: mwBackoffUntil || null,
          running: !!mwTimer,
          page: location.hostname,
        },
      }).catch(() => {});
    } catch {}
  }

  try {
    Object.defineProperty(window, "__thunderMarketwatchStatus", {
      configurable: true,
      get() {
        return { hasToken: !!mwToken, tokenSeenAt: mwTokenSeenAt, lastOk: mwLastOk, lastError: mwLastError, running: !!mwTimer, lastAssets: mwLastAssets, lastSameDay: mwLastSameDay, lastSent: mwLastSent, backoffUntil: mwBackoffUntil };
      },
    });
  } catch {}

  function normalizeMwNumber(v) {
    if (v === "" || v == null) return null;
    if (typeof v === "string") {
      const n = Number(v.replace(/,/g, "").trim());
      return Number.isFinite(n) ? n : null;
    }
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function pickMarketwatchSymbol(a) {
    const s = String(a?.reuters || a?.symbol_code || a?.stock_id || a?.symbol || a?.ticker || "").trim().toUpperCase();
    if (!/^[A-Z0-9._-]{2,16}$/.test(s)) return "";
    if (/^EG[A-Z0-9]{8,}$/i.test(s)) return "";
    return s;
  }

  async function pollMarketwatch() {
    mwLastError = "page_active_poll_v4243";
    postMarketwatchStatus();
  }

  const AUTO_SELL_REPREP_MS = 45_000;
  const DEBUG_PRICE_KEY = "thunder_debug_price";
  const DEBUG_PRICE_UNTIL_KEY = "thunder_debug_price_until";
  let debugPriceOverride = { price: 0, until: 0 };
  const DEMO_POSITION_KEY = "v4_demo_position";
  let demoPosition = null; // { symbol, entry, tp, sl, qty, until }

  function setDemoPosition(p) {
    if (p && p.symbol && Number(p.until) > Date.now()) {
      demoPosition = {
        symbol: String(p.symbol).toUpperCase(),
        entry: Number(p.entry) || 0,
        tp: Number(p.tp) || 0,
        sl: Number(p.sl) || 0,
        qty: Number(p.qty) || 1,
        until: Number(p.until),
      };
    } else {
      demoPosition = null;
    }
    try { refreshPositionsBanner(); } catch {}
  }
  function loadDemoPosition() {
    try {
      chrome.storage.local.get([DEMO_POSITION_KEY]).then((s) => {
        setDemoPosition(s?.[DEMO_POSITION_KEY] || null);
      }).catch(() => {});
    } catch {}
  }

  function setDebugPriceOverride(price, until) {
    const p = Number(price) || 0;
    const u = Number(until) || 0;
    debugPriceOverride = (p > 0 && u > Date.now()) ? { price: p, until: u } : { price: 0, until: 0 };
  }

  function loadDebugPriceOverride() {
    try {
      chrome.storage.local.get([DEBUG_PRICE_KEY, DEBUG_PRICE_UNTIL_KEY]).then((s) => {
        setDebugPriceOverride(s?.[DEBUG_PRICE_KEY], s?.[DEBUG_PRICE_UNTIL_KEY]);
      }).catch(() => {});
    } catch {}
  }

  loadDebugPriceOverride();
  loadDemoPosition();
  setInterval(() => {
    // auto-expire demo so banner disappears like a real sold position
    if (demoPosition && Date.now() > demoPosition.until) {
      demoPosition = null;
      try { chrome.storage.local.remove([DEMO_POSITION_KEY]); } catch {}
      try { refreshPositionsBanner(); } catch {}
    }
  }, 2000);
  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (changes[DEBUG_PRICE_KEY] || changes[DEBUG_PRICE_UNTIL_KEY]) {
        const p = changes[DEBUG_PRICE_KEY]?.newValue ?? debugPriceOverride.price;
        const u = changes[DEBUG_PRICE_UNTIL_KEY]?.newValue ?? debugPriceOverride.until;
        setDebugPriceOverride(p, u);
      }
      if (changes[DEMO_POSITION_KEY]) {
        setDemoPosition(changes[DEMO_POSITION_KEY]?.newValue || null);
      }
    });
  } catch {}

  // ---- inject MAIN-world script ----
  try {
    const s = document.createElement("script");
    s.src = chrome.runtime.getURL("page-script.js");
    s.async = false;
    (document.head || document.documentElement).appendChild(s);
    s.onload = () => s.remove();
  } catch (e) {
    console.error("[thunder-ext] inject failed", e);
  }

  function startBackgroundKeepAlive() {
    if (!IS_TOP_FRAME) return;
    const connect = () => {
      try {
        keepAlivePort = chrome.runtime.connect({ name: "thunder-v4-keepalive" });
        keepAlivePort.onDisconnect?.addListener?.(() => {
          keepAlivePort = null;
          clearInterval(keepAliveTimer);
          keepAliveTimer = setTimeout(connect, 1000);
        });
        const ping = () => {
          try { keepAlivePort?.postMessage({ type: "keepalive", ts: Date.now() }); } catch {}
        };
        ping();
        clearInterval(keepAliveTimer);
        keepAliveTimer = setInterval(ping, 15_000);
      } catch {
        clearInterval(keepAliveTimer);
        keepAliveTimer = setTimeout(connect, 2000);
      }
    };
    connect();
  }

  /**
   * Anti-freeze for the Thunder watchlist tab.
   *
   * Chrome aggressively throttles (and after ~5min may "freeze") tabs that
   * are hidden AND silent AND not the active tab in any window. When that
   * happens, Thunder's long-poll fetch stops firing → our `live_ticks` feed
   * dies → the user sees "انقطع الاتصال بثاندر".
   *
   * Two layers of defense, both invisible to Thunder:
   *   1) A muted <audio> element looped on a 1-sample silent data URL.
   *      Chrome's tab-freezing heuristic treats any tab "playing media" as
   *      in-use and skips both freezing and aggressive timer throttling,
   *      even when the tab is hidden. Audio is muted so the user hears
   *      nothing.
   *   2) A periodic Page-Visibility-independent `requestAnimationFrame` +
   *      timer combo that keeps the JS event loop warm enough for the
   *      page-script long-poll to keep ticking.
   *
   * We do NOT touch any Thunder DOM, network, or globals — purely
   * browser-side hints. Thunder cannot detect this; it's the same trick
   * music/meeting sites use to stay alive in the background.
   */
  function startAntiFreezeKeepAwake() {
    if (!IS_TOP_FRAME) return;
    if (window.__thunderAntiFreezeOn) return;
    window.__thunderAntiFreezeOn = true;
    // v4.1.98: Primary defense = Web Audio API oscillator with near-zero
    // gain. Muted <audio> elements do NOT count as "audible" for Chrome's
    // tab-freeze / timer-throttle heuristic (proven by v4.1.97 diagnostic:
    // audio_paused=false but currentTime stuck at 0 → element never actually
    // played, tab was throttled and Thunder's polling died). A Web Audio
    // graph with gain ≥ ~0.0001 produces real audio samples the mixer picks
    // up, so the tab is treated as "playing media" and timers keep firing.
    // Gain is tiny enough to be inaudible on any device.
    const startWebAudioKeeper = () => {
      try {
        if (__diagAudioCtx && __diagAudioCtx.state === "running") return;
        if (!__diagAudioCtx) {
          const Ctx = window.AudioContext || window.webkitAudioContext;
          if (!Ctx) return;
          __diagAudioCtx = new Ctx();
          const osc = __diagAudioCtx.createOscillator();
          const gain = __diagAudioCtx.createGain();
          osc.type = "sine";
          osc.frequency.value = 20; // sub-audible on typical speakers
          gain.gain.value = 0.0008;  // real energy, effectively silent
          osc.connect(gain);
          gain.connect(__diagAudioCtx.destination);
          osc.start();
          __diagOscillator = osc;
        }
        __diagAudioResumeAttempts++;
        __diagAudioCtx.resume().then(() => {
          if (__diagAudioCtx.state === "running") {
            __diagAudioResumeOk++;
            if (!__diagAudioCtxStartedAt) __diagAudioCtxStartedAt = Date.now();
          }
        }).catch(() => {});
      } catch {}
    };
    // Try immediately; browsers with a prior user gesture on this origin
    // resume synchronously.
    startWebAudioKeeper();
    // Attach one-time user-gesture unlockers. Content scripts share the
    // page's gesture state, so any click/key/touch/scroll on Thunder will
    // unlock AudioContext even though the listener is in an isolated world.
    const gestureUnlock = () => {
      startWebAudioKeeper();
      if (__diagAudioCtx && __diagAudioCtx.state === "running") {
        for (const ev of ["pointerdown", "keydown", "touchstart", "click", "wheel"]) {
          try { window.removeEventListener(ev, gestureUnlock, true); } catch {}
        }
      }
    };
    for (const ev of ["pointerdown", "keydown", "touchstart", "click", "wheel"]) {
      try { window.addEventListener(ev, gestureUnlock, { capture: true, passive: true }); } catch {}
    }
    // Re-attempt resume on visibility change back to visible AND every 15s
    // in case Chrome auto-suspends after long idle.
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) startWebAudioKeeper();
    });
    setInterval(() => {
      if (!__diagAudioCtx || __diagAudioCtx.state !== "running") startWebAudioKeeper();
    }, 15_000);

    // Secondary defense: keep the old muted <audio> as a fallback signal
    // for diagnostics — it costs nothing and lets us compare both channels
    // in future tests.
    try {
      // 44 bytes of silent WAV (1 sample, 8kHz mono) — minimal payload.
      const silentWav =
        "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
      const a = document.createElement("audio");
      __diagAudioEl = a;
      a.src = silentWav;
      a.loop = true;
      a.muted = true;
      a.autoplay = true;
      a.setAttribute("aria-hidden", "true");
      a.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;";
      const attach = () => {
        try {
          (document.body || document.documentElement).appendChild(a);
          const p = a.play();
          if (p && typeof p.catch === "function") p.catch(() => {});
        } catch {}
      };
      if (document.body) attach();
      else document.addEventListener("DOMContentLoaded", attach, { once: true });
      // Re-kick if Chrome paused it after long idle.
      setInterval(() => {
        if (a.paused) { try { a.play().catch(() => {}); } catch {} }
      }, 30_000);
    } catch {}
    // Lightweight heartbeat — keeps the SW <-> content message channel warm
    // even if the audio trick is blocked by future Chrome policy.
    setInterval(() => {
      try { chrome.runtime?.sendMessage?.({ type: "thunder-watchlist-heartbeat", ts: Date.now() }); } catch {}
    }, 25_000);
  }
  startAntiFreezeKeepAwake();

  /**
   * v4.2.32: Thunder session-loss detector.
   * Runs only on the top frame; scans the DOM every 20s for the
   * "logged-out" login modal/screen that Thunder shows when the session
   * expires silently. Fires a message to the SW which:
   *   1) POSTs /api/public/hooks/thunder-auth-alert
   *   2) Raises a Chrome notification with sound
   * De-duped: at most one alert every 3 minutes per tab.
   */
  (function startThunderAuthWatcher() {
    if (!IS_TOP_FRAME) return;
    if (window.__thunderAuthWatcherOn) return;
    window.__thunderAuthWatcherOn = true;
    let lastAlertAt = 0;
    const RX_LOGIN_TEXT = /(تسجيل\s*الدخول|سجل\s*الدخول|ادخل\s*رقم|رقم\s*الموبايل|log\s*in|sign\s*in|enter\s*your\s*phone)/i;
    const RX_URL_LOGIN = /\/(login|sign-?in|auth)(\b|\/|\?)/i;

    function detectLoggedOut() {
      try {
        // 1) URL redirected to a login route. Thunder X can temporarily use
        // /auth/2fa as part of its normal flow; that is not the old web.thndr
        // session-loss screen and must not raise the red alert by itself.
        if (location.hostname === "x.thndr.app" && /^\/auth\/2fa(?:\/|$)/.test(location.pathname)) {
          return null;
        }
        // 2) URL redirected to a real login route
        if (RX_URL_LOGIN.test(location.pathname + location.search)) {
          return { kind: "login_page", reason: "url" };
        }
        // 3) Large login modal/screen with a phone/OTP field
        const phone = document.querySelector(
          'input[type="tel"], input[name*="phone" i], input[name*="mobile" i], input[placeholder*="موبايل" i], input[placeholder*="phone" i]'
        );
        if (phone) {
          const r = phone.getBoundingClientRect();
          if (r.width > 80 && r.height > 20 && r.top >= 0 && r.top < window.innerHeight) {
            return { kind: "login_modal", reason: "phone_input_visible" };
          }
        }
        // 4) A large visible dialog whose text screams "login"
        const dialogs = document.querySelectorAll("[role='dialog'], .ant-modal-content, .ant-drawer-content");
        for (const d of dialogs) {
          const rr = d.getBoundingClientRect();
          if (rr.width < 260 || rr.height < 200) continue;
          const t = (d.innerText || "").slice(0, 400);
          if (RX_LOGIN_TEXT.test(t)) return { kind: "login_modal", reason: "dialog_text" };
        }
      } catch {}
      return null;
    }

    function tick() {
      const hit = detectLoggedOut();
      if (!hit) return;
      const now = Date.now();
      if (now - lastAlertAt < 180_000) return; // dedupe: one alert / 3 min
      lastAlertAt = now;
      try {
        chrome.runtime?.sendMessage?.({
          type: "thunder-auth-lost",
          payload: {
            kind: hit.kind,
            reason: hit.reason,
            url: location.href,
            ts: now,
          },
        });
      } catch {}
    }

    // Kick off after page settle, then poll every 20s.
    setTimeout(tick, 4_000);
    setInterval(tick, 20_000);
    // Also re-check on visibility change (user re-focuses the tab).
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) setTimeout(tick, 500);
    });
  })();

  function normalizeSymbolValue(value) {
    return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9._-]/g, "").slice(0, 16);
  }

  function currentAssetUuid() {
    return location.href.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0]?.toLowerCase() || "";
  }

  async function symbolForUuid(uuid) {
    const id = String(uuid || "").trim().toLowerCase();
    if (!id) return "";
    try {
      const res = await chrome.runtime.sendMessage({ type: "getSymbolForUuid", payload: { uuid: id } });
      return normalizeSymbolValue(res?.symbol);
    } catch { return ""; }
  }

  async function currentAssetContext(preferred = {}) {
    const uuid = String(preferred.uuid || currentAssetUuid() || "").trim().toLowerCase();
    let symbol = normalizeSymbolValue(preferred.symbol);
    if (!symbol && uuid) symbol = await symbolForUuid(uuid);
    if (!symbol) {
      const txt = (document.body?.innerText || "").slice(0, 1200);
      const m = txt.match(/(?:شراء|بيع|Buy|Sell)\s+([A-Z0-9._-]{2,16})/) || txt.match(/\b([A-Z]{2,8})\b/);
      symbol = normalizeSymbolValue(m?.[1]);
    }
    return { symbol, uuid };
  }

  function readStorage(keys) {
    return chrome.storage.local.get(keys).catch(() => ({}));
  }

  async function readTradeLedgers() {
    const s = await readStorage([ACTIVE_TRADE_LEDGER_KEY, SIGNAL_LEDGER_KEY]);
    const trades = (s[ACTIVE_TRADE_LEDGER_KEY] && typeof s[ACTIVE_TRADE_LEDGER_KEY] === "object") ? s[ACTIVE_TRADE_LEDGER_KEY] : {};
    const signals = (s[SIGNAL_LEDGER_KEY] && typeof s[SIGNAL_LEDGER_KEY] === "object") ? s[SIGNAL_LEDGER_KEY] : {};
    const now = Date.now();
    let changed = false;
    for (const [sym, rec] of Object.entries(trades)) {
      if (!rec || (rec.status === "closed" && now - Number(rec.soldAt || rec.updatedAt || 0) > 24 * 60 * 60_000)) {
        delete trades[sym]; changed = true;
      }
    }
    for (const [sym, rec] of Object.entries(signals)) {
      if (!rec || now - Number(rec.ts || 0) > 8 * 60 * 60_000) { delete signals[sym]; changed = true; }
    }
    if (changed) chrome.storage.local.set({ [ACTIVE_TRADE_LEDGER_KEY]: trades, [SIGNAL_LEDGER_KEY]: signals }).catch(() => {});
    return { trades, signals };
  }

  async function rememberScalpSignal({ symbol, uuid, orderId, refPrice, qty, signalSource, signalCreatedAt, metadata }) {
    const sym = normalizeSymbolValue(symbol);
    if (!sym) return;
    const { signals } = await readTradeLedgers();
    signals[sym] = {
      symbol: sym,
      uuid: String(uuid || "").toLowerCase(),
      signalId: String(orderId || ""),
      signalSource: String(signalSource || "scalp-live"),
      refPrice: Number(refPrice) || 0,
      plannedQty: Number(qty) || 0,
      signalCreatedAt: signalCreatedAt || null,
      metadata: metadata || null,
      ts: Date.now(),
    };
    await chrome.storage.local.set({ [SIGNAL_LEDGER_KEY]: signals }).catch(() => {});
  }

  async function upsertOpenTrade(record) {
    const sym = normalizeSymbolValue(record.symbol);
    if (!sym) return null;
    const { trades, signals } = await readTradeLedgers();
    const sig = signals[sym] || {};
    const prev = trades[sym] || {};
    const now = Date.now();
    const entryPrice = Number(record.entryPrice) || Number(record.avgCost) || Number(prev.entryPrice) || Number(sig.refPrice) || 0;
    const qty = Number(record.qty) || Number(prev.qty) || Number(sig.plannedQty) || 0;
    if (!prev.status && !sig.ts && !/confirmed|manual/i.test(String(record.source || ""))) return null;
    const next = {
      ...prev,
      status: "open",
      source: record.source || sig.signalSource || "scalp-live/manual-confirmed",
      symbol: sym,
      uuid: String(record.uuid || sig.uuid || prev.uuid || "").toLowerCase(),
      signalId: record.signalId || sig.signalId || prev.signalId || "",
      signalSource: record.signalSource || sig.signalSource || prev.signalSource || "scalp-live",
      qty,
      entryPrice,
      boughtAt: Number(prev.boughtAt) || now,
      updatedAt: now,
      lastAutoSellPreparedAt: Number(prev.lastAutoSellPreparedAt) || 0,
    };
    trades[sym] = next;
    await chrome.storage.local.set({ [ACTIVE_TRADE_LEDGER_KEY]: trades }).catch(() => {});
    return next;
  }

  async function markTradeSold(record) {
    const sym = normalizeSymbolValue(record.symbol);
    if (!sym) return;
    const { trades } = await readTradeLedgers();
    const prev = trades[sym] || { symbol: sym };
    trades[sym] = {
      ...prev,
      status: "closed",
      soldAt: Date.now(),
      exitPrice: Number(record.exitPrice) || Number(prev.exitPrice) || 0,
      exitQty: Number(record.qty) || Number(prev.qty) || 0,
      updatedAt: Date.now(),
    };
    await chrome.storage.local.set({ [ACTIVE_TRADE_LEDGER_KEY]: trades }).catch(() => {});
    stopTrailingPriceUpdater("تم تسجيل البيع");
  }

  function scrapeOrderSummary(btn) {
    try {
      const surface = btn?.closest?.("aside,section,form,div[role='dialog']") || document.body;
      const txt = normalizeDigits(surface?.innerText || surface?.textContent || "").replace(/,/g, " ");
      const at = txt.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:اسهم|سهم|shares?|units?)\s*@\s*([0-9]+(?:\.[0-9]+)?)/i);
      if (at) return { qty: Number(at[1]) || 0, price: Number(at[2]) || 0 };
      const nums = Array.from(txt.matchAll(/([0-9]+(?:\.[0-9]+)?)/g)).map((m) => Number(m[1])).filter((n) => n > 0 && n < 100000);
      const price = nums.find((n) => !Number.isInteger(n)) || 0;
      const qty = nums.find((n) => Number.isInteger(n) && n > 0 && n < 10000) || 0;
      return { qty, price };
    } catch { return { qty: 0, price: 0 }; }
  }

  async function updateTrackedTradeAutoPrepStamp(symbol) {
    const sym = normalizeSymbolValue(symbol);
    if (!sym) return;
    const { trades } = await readTradeLedgers();
    if (!trades[sym]) return;
    trades[sym] = { ...trades[sym], lastAutoSellPreparedAt: Date.now(), updatedAt: Date.now() };
    await chrome.storage.local.set({ [ACTIVE_TRADE_LEDGER_KEY]: trades }).catch(() => {});
  }

  function sellPanelLooksOpenFor(symbol) {
    const text = (document.body?.innerText || "").slice(0, 1600);
    const sym = normalizeSymbolValue(symbol);
    return /بيع|Sell/i.test(text) && (!sym || text.includes(sym)) && !!findQuantityInput();
  }

  function startTrackedPositionAutoPrepWatcher() {
    if (!IS_TOP_FRAME || window.__thunderTrackedAutoPrepWatcher) return;
    window.__thunderTrackedAutoPrepWatcher = true;
    const tick = async () => {
      try {
        if (activeExecution) return;
        const ctx = await currentAssetContext();
        if (!ctx.symbol && !ctx.uuid) return;
        const { trades } = await readTradeLedgers();
        const rec = Object.values(trades).find((t) => t?.status === "open" && (
          (ctx.symbol && normalizeSymbolValue(t.symbol) === ctx.symbol) ||
          (ctx.uuid && String(t.uuid || "").toLowerCase() === ctx.uuid)
        ));
        if (!rec) return;
        if (Date.now() - Number(rec.lastAutoSellPreparedAt || 0) < AUTO_SELL_REPREP_MS) return;
        if (sellPanelLooksOpenFor(rec.symbol)) return;
        await updateTrackedTradeAutoPrepStamp(rec.symbol);
        const orderId = `auto-sell-tracked-${Date.now()}`;
        activeExecution = { orderId, startedAt: Date.now() };
        debug(`📌 ${rec.symbol} صفقة Scalp مفتوحة من ${new Date(Number(rec.boughtAt || Date.now())).toLocaleTimeString("ar-EG")} — بجهز البيع`, "#8b5cf6");
        try {
          await executeOrder({ orderId, symbol: rec.symbol, uuid: rec.uuid || ctx.uuid, qty: 0, egp: 0, side: "sell", refPrice: Number(rec.entryPrice) || 0, driftBps: 100 });
        } finally {
          activeExecution = null;
        }
      } catch {}
    };
    setTimeout(tick, 2500);
    setInterval(tick, 4000);
  }

  startBackgroundKeepAlive();
  installGlobalBuyConfirmWatcher();
  startTrackedPositionAutoPrepWatcher();

  // v4.1.38 — Auto-detect confirmed BUY and SELL flows (مراجعة → أكد → تم),
  // persist an open/closed local ledger, and trigger sell prep after buys.
  function installGlobalBuyConfirmWatcher() {
    if (window.__thunderManualBuyWatcher) return;
    window.__thunderManualBuyWatcher = true;
    const REVIEW_RE = /مراجعة|Review/i;
    const CONFIRM_RE = /أكد|تأكيد|موافق|حسنا|حسناً|^\s*تم\b|Done|Confirm|^\s*OK\b|Okay/i;
    let sawReview = false;
    let sawConfirm = false;
    let lastOrderContext = null; // { side, symbol, uuid, qty, entryPrice } captured during review

    const detectOrderContext = (btn) => {
      try {
        const surface = btn.closest("aside,section,form,div[role='dialog']") || document.body;
        const txt = (surface.innerText || "").slice(0, 600);
        const head = txt.split("\n").slice(0, 3).join(" ");
        const side = /^\s*(بيع|Sell)\b/i.test(head) ? "sell" : /^\s*(شراء|Buy)\b/i.test(head) ? "buy" : null;
        if (!side) return null;
        const symMatch = head.match(/(?:شراء|بيع|Buy|Sell)\s+([A-Z0-9._-]{2,16})/i);
        const symbol = symMatch?.[1] || "";
        const uuid = currentAssetUuid();
        return { side, symbol: normalizeSymbolValue(symbol), uuid };
      } catch { return null; }
    };

    document.addEventListener("click", (ev) => {
      try {
        const btn = ev.target?.closest?.("button,[role='button']");
        if (!btn) return;
        const txt = (btn.innerText || btn.textContent || "").trim();
        if (!txt || txt.length > 30) return;

        if (REVIEW_RE.test(txt)) {
          const ctx = detectOrderContext(btn);
          if (!ctx) { sawReview = false; sawConfirm = false; lastOrderContext = null; return; }
          sawReview = true; sawConfirm = false; lastOrderContext = { ...ctx, ...scrapeOrderSummary(btn) };
          return;
        }
        if (!sawReview || !CONFIRM_RE.test(txt)) return;

        if (!sawConfirm) {
          sawConfirm = true;
          const s = scrapeOrderSummary(btn);
          lastOrderContext = { ...(lastOrderContext || {}), qty: s.qty || lastOrderContext?.qty || 0, entryPrice: s.price || lastOrderContext?.entryPrice || lastOrderContext?.price || 0 };
          return;
        }

        // Final تم
        const ctx = lastOrderContext || {};
        const finalSummary = scrapeOrderSummary(btn);
        sawReview = false; sawConfirm = false; lastOrderContext = null;
        if (ctx.side === "sell") {
          markTradeSold({ symbol: ctx.symbol, qty: finalSummary.qty || ctx.qty, exitPrice: finalSummary.price || ctx.entryPrice }).catch(() => {});
          debug(`✓ بيع مؤكد (${ctx.symbol || "?"}) — اتقفل من سجل الإكستنشن`, "#10b981");
          return;
        }
        if (ctx.side !== "buy") return;
        if (Date.now() < __autoSellArmedAt + 30_000) return; // dedupe
        __autoSellArmedAt = Date.now();
        debug(`✓ شراء مؤكد (${ctx.symbol || "?"}) — بسجله وبفتح البيع تلقائياً`, "#10b981");
        setTimeout(async () => {
          try {
            const liveCtx = await currentAssetContext(ctx);
            const avgCost = scrapeAvgCostFromPage();
            await upsertOpenTrade({
              symbol: liveCtx.symbol || ctx.symbol,
              uuid: liveCtx.uuid || ctx.uuid,
              qty: finalSummary.qty || ctx.qty || 0,
              entryPrice: avgCost || finalSummary.price || ctx.entryPrice || ctx.price || 0,
              source: "scalp-live/manual-confirmed",
            });
            activeExecution = null;
            await executeOrder({
              orderId: `manual-auto-sell-${Date.now()}`,
              symbol: liveCtx.symbol || ctx.symbol || "",
              uuid: liveCtx.uuid || ctx.uuid || "",
              qty: 0, egp: 0, side: "sell",
              refPrice: avgCost || finalSummary.price || ctx.entryPrice || 0, driftBps: 100,
            });
          } catch {
            debug("⚠️ تعذّر فتح البيع تلقائياً — افتحها يدوياً", "#f59e0b");
          }
        }, 2000);
      } catch {}
    }, true);
  }

  window.addEventListener("message", (event) => {
    const data = event.data;
    if (data?.__thunderMainResult === true && pendingMainCommands.has(data.id)) {
      pendingMainCommands.get(data.id)(data.result ?? !!data.ok);
      pendingMainCommands.delete(data.id);
      return;
    }
    if (!data || data.__thunder !== true) return;
    if (event.source !== window) return;
    if (data.type === "authToken") {
      try { onAuthTokenSeen(data.payload); } catch (_) {}
      return;
    }
    // v4.1.85: if the sender included a request id (from the Lovable web app),
    // relay the SW response back via window.postMessage so the caller can
    // detect success/failure and surface a real error.
    const reqId = data.__reqId || null;
    try {
      chrome.runtime.sendMessage({ type: data.type, payload: data.payload }, (resp) => {
        void chrome.runtime.lastError;
        if (reqId) {
          try {
            window.postMessage({ __thunderResponse: true, __reqId: reqId, ok: !!resp?.ok, resp: resp || null, err: chrome.runtime.lastError?.message || null }, "*");
          } catch {}
        }
      });
    } catch (e) {
      if (reqId) {
        try { window.postMessage({ __thunderResponse: true, __reqId: reqId, ok: false, err: String(e?.message || e) }, "*"); } catch {}
      }
    }
    // Also track latest price per uuid locally for the drift guard.
    if (data.type === "ticks" && Array.isArray(data.payload)) {
      for (const t of data.payload) {
        if (t?.uuid && t.price > 0) latestPriceByUuid[t.uuid] = { price: t.price, symbol: String(t.symbol || "").trim().toUpperCase(), ts: Date.now() };
      }
      refreshPositionsBanner();
    }
  // v4.2.21: L2 capture is passive again. We only store snapshots that Thunder
  // itself fetched after the L2 panel is opened; the extension never calls the
  // market-depth API directly.
    if (data.type === "l2Snapshot" && data.payload?.uuid) {
      const snap = data.payload;
      latestL2ByUuid[String(snap.uuid).toLowerCase()] = snap;
      // v4.1.97-diag: count Thunder's own market-depth responses
      try {
        __diagDepthCount += 1;
        __diagDepthCountSinceLastPost += 1;
        __diagLastDepthTs = Date.now();
        if (snap.symbol) __diagLastSymbol = String(snap.symbol).toUpperCase();
      } catch {}
    }
    // Do not auto-register positions from arbitrary Thunder JSON responses.
    // That detector was too broad and created fake open positions from market/list data.
  });

  const latestPriceByUuid = {};
  // v4.1.64: passive Level-2 order book cache. Populated only from responses
  // Thunder makes itself (GET /assets-service/market-depth/{uuid}). The
  // extension never triggers this request. Consumers must respect maxAgeMs.
  const latestL2ByUuid = {};
  function getL2AgeMs(uuid) {
    if (!uuid) return Infinity;
    const snap = latestL2ByUuid[String(uuid).toLowerCase()];
    const ts = Number(snap?.ts || 0);
    return ts > 0 ? Date.now() - ts : Infinity;
  }
  function getFreshL2(uuid, maxAgeMs = 10_000) {
    if (!uuid) return null;
    const snap = latestL2ByUuid[String(uuid).toLowerCase()];
    if (!snap) return null;
    if (Date.now() - Number(snap.ts || 0) > maxAgeMs) return null;
    if (!(Number(snap.bestBid) > 0)) return null;
    return snap;
  }
  let activeDriftWatcher = null;
  const l2PersistentRuns = new Set();
  const l2PersistentResetAt = new Map();
  const L2_PERSIST_SOFT_RESET_AFTER_MS = 90_000;
  const L2_PERSIST_SOFT_RESET_COOLDOWN_MS = 120_000;

  async function softResetOpenL2Panel(trigger, uuid, panelState, reason) {
    if (!trigger || !uuid) return false;
    const id = String(uuid).toLowerCase();
    const now = Date.now();
    const last = Number(l2PersistentResetAt.get(id) || 0);
    if (now - last < L2_PERSIST_SOFT_RESET_COOLDOWN_MS) return false;
    l2PersistentResetAt.set(id, now);
    try {
      // Proven failure in v4.1.98: the accordion can still look open while
      // Thunder's own market-depth polling has silently stopped for minutes.
      // Close → short human pause → re-open restarts Thunder's own polling
      // without direct API calls and without touching order/trade controls.
      if (panelState === "open") {
        await preciseClick(trigger);
        await new Promise((r) => setTimeout(r, 900 + Math.floor(Math.random() * 900)));
        const freshTrigger = findL2AccordionLink() || trigger;
        await preciseClick(freshTrigger);
        __diagL2SoftResets++;
        debug(`L2 soft-reset (${reason}) — close/reopen after stale polling`, "#f97316");
        return true;
      }
      if (panelState === "closed") {
        await preciseClick(trigger);
        __diagL2SoftResets++;
        debug(`L2 soft-reset (${reason}) — reopen closed panel`, "#f97316");
        return true;
      }
    } catch {}
    return false;
  }

  function startPersistentL2KeepAlive(uuid, reason = "persist") {
    const id = String(uuid || "").toLowerCase();
    if (!id) return false;
    if (l2PersistentRuns.has(id)) return true;
    l2PersistentRuns.add(id);
    (async () => {
      try {
        debug(`L2 persist keep-alive started (${reason})`, "#8b5cf6");
        await ensureL2SnapshotForUuid(id, { maxWaitMs: 8000, keepOpenMs: 10 * 60 * 60_000 });
      } catch {}
      finally {
        l2PersistentRuns.delete(id);
      }
    })();
    return true;
  }

  // ---- receive executeOrder from background ----
  // Only the top page is allowed to receive automation commands. Thunder uses
  // several frames; sending the test order to a hidden frame was the reason the
  // popup said “ok” while nothing visible happened.
  if (IS_TOP_FRAME) {
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg?.type === "ping") {
        sendResponse({ ok: true, top: true, url: location.href, version: CONTENT_SCRIPT_VERSION });
        return false;
      }
      if (msg?.type === "marketwatch.diagnostic") {
        mainWorldCommand("diagnoseMarketwatchOnce", {}, 20_000)
          .then((result) => sendResponse(result && typeof result === "object" ? result : { ok: false, error: "no_diagnostic_result" }))
          .catch((error) => sendResponse({ ok: false, error: String(error?.message || error) }));
        return true;
      }
      if (msg?.type === "positionsUpdate") {
        openPositionsBySymbol = msg.payload || {};
        refreshPositionsBanner();
        return false;
      }
      if (msg?.type === "ticksUpdate") {
        if (Array.isArray(msg.payload)) {
          for (const t of msg.payload) {
            const price = Number(t?.price) || 0;
            if (t?.uuid && price > 0) latestPriceByUuid[t.uuid] = { price, symbol: String(t.symbol || "").trim().toUpperCase(), ts: Date.now() };
          }
          refreshPositionsBanner();
        }
        return false;
      }
      if (msg?.type === "l2persist.ensure") {
        const uuid = currentAssetUuid();
        const ok = startPersistentL2KeepAlive(uuid, "background-ensure");
        const trigger = findL2AccordionLink();
        const panel = getL2PanelState(trigger, uuid);
        sendResponse({ ok, top: true, version: CONTENT_SCRIPT_VERSION, uuid, running: ok, fresh: !!getFreshL2(uuid, 30_000), ageMs: getL2AgeMs(uuid), hasTrigger: !!trigger, panelState: panel.state, panelReason: panel.reason, acState: __diagAudioCtx ? __diagAudioCtx.state : "null", acResumeAttempts: __diagAudioResumeAttempts, acResumeOk: __diagAudioResumeOk, depthTotal: __diagDepthCount, l2SoftResets: __diagL2SoftResets });
        return false;
      }
      if (msg?.type === "positionAlert") {
        showPositionAlert(msg.payload);
        return false;
      }
      if (msg?.type === "executeOrderV3") {
        if (activeExecution && Date.now() - activeExecution.startedAt < 120_000) {
          sendResponse({ ok: false, top: true, version: CONTENT_SCRIPT_VERSION, stage: "automation_already_running" });
          return false;
        }
        activeExecution = { orderId: msg.payload?.orderId, startedAt: Date.now() };
        executeOrder(msg.payload).then((result) => {
          sendResponse({ ...(result || {}), top: true, version: CONTENT_SCRIPT_VERSION });
        }).catch((e) => {
          reportStatus(msg.payload.orderId, "error", "exception: " + String(e?.message || e));
          sendResponse({ ok: false, top: true, version: CONTENT_SCRIPT_VERSION, error: String(e?.message || e) });
        }).finally(() => {
          activeExecution = null;
        });
        return true;
      }
    });
  }

  // ---- Manual sell trigger from overlay ("بيع الآن يدوي") ----
  // Shares the same dedupe window (__autoSellArmedAt + 30s) so that if both
  // the user click and the auto-sell flow fire close together, only one runs.
  if (IS_TOP_FRAME) {
    document.addEventListener("__thunder_manual_sell", async (ev) => {
      try {
        const detail = (ev && ev.detail) || {};
        if (activeExecution && Date.now() - activeExecution.startedAt < 120_000) {
          debug("⏳ في عملية شغّالة بالفعل — تجاهلت الضغطة", "#f59e0b");
          return;
        }
        if (Date.now() < __autoSellArmedAt + 30_000) {
          debug("⏳ في بيع تلقائي اتفعّل لسه — تجاهلت الضغطة", "#f59e0b");
          return;
        }
        __autoSellArmedAt = Date.now();
        // Manual click = explicit user intent. Clear any 60s safety locks
        // left over from a previous failed auto-attempt; otherwise we abort
        // with "اتوقفت بأمان: الطلبات المتقدمة محتاج اختيار يدوي" before
        // even trying to open the dropdown.
        orderTypeAttemptLockedUntil = 0;
        settlementAttemptLockedUntil = 0;
        limitPriceAttemptLockedUntil = 0;
        const liveCtx = await currentAssetContext({ symbol: detail.symbol || "", uuid: detail.uuid || "" });
        const avgCost = scrapeAvgCostFromPage();
        activeExecution = { orderId: `manual-sell-${Date.now()}`, startedAt: Date.now() };
        debug(`🖱️ بيع يدوي (${liveCtx.symbol || detail.symbol || "?"}) — بفتح نافذة البيع`, "#a855f7");
        try {
          await executeOrder({
            orderId: `manual-sell-${Date.now()}`,
            symbol: liveCtx.symbol || detail.symbol || "",
            uuid: liveCtx.uuid || detail.uuid || "",
            qty: 0, egp: 0, side: "sell",
            refPrice: avgCost || 0, driftBps: 100,
          });
        } finally {
          activeExecution = null;
        }
      } catch (e) {
        debug("⚠️ تعذّر تنفيذ البيع اليدوي: " + String(e?.message || e), "#ef4444");
      }
    });
  }

  function reportStatus(id, status, error_message) {
    chrome.runtime.sendMessage({ type: "orderStatus", payload: { id, status, error_message } }).catch(() => {});
  }

  function normalizeDigits(text) {
    return String(text || "")
      .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
      .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
  }

  function parseVisiblePrice(text, symbol) {
    const clean = normalizeDigits(text).replace(/,/g, "");
    const idx = clean.toUpperCase().indexOf(String(symbol || "").toUpperCase());
    const windowText = idx >= 0 ? clean.slice(idx, idx + 260) : clean;
    const matches = Array.from(windowText.matchAll(/(^|[^A-Z0-9])([0-9]{1,4}(?:\.[0-9]{1,4})?)(?!\s*[%٪])(?=$|[^A-Z0-9])/gi));
    const nums = matches
      .map((m) => Number(m[2]))
      .filter((n) => Number.isFinite(n) && n > 0 && n < 100000);
    const decimal = nums.find((n) => !Number.isInteger(n));
    return decimal || nums[0] || 0;
  }

  function scanVisibleAssetLinks() {
    const uuidRe = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const symbolRe = /\b[A-Z]{2,6}\b/g;
    const out = [];
    const seen = new Set();
    const ticks = [];
    for (const el of Array.from(document.querySelectorAll("a[href], [data-href]"))) {
      const href = el.getAttribute("href") || el.getAttribute("data-href") || "";
      const uuid = href.match(uuidRe)?.[0];
      if (!uuid || seen.has(uuid)) continue;
      let node = el;
      let text = "";
      for (let i = 0; node && i < 8; i++, node = node.parentElement) {
        const t = (node.textContent || "").trim();
        if (symbolRe.test(t) && t.length < 600) { text = t; break; }
        symbolRe.lastIndex = 0;
      }
      symbolRe.lastIndex = 0;
      const symbol = (text.match(symbolRe) || []).find((s) => !["EGP", "USD", "ETF"].includes(s));
      if (symbol) {
        seen.add(uuid);
        out.push({ uuid, symbol });
        const price = parseVisiblePrice(text, symbol);
        if (price > 0) ticks.push({ uuid, symbol, price, ts: new Date().toISOString(), source: "dom" });
      }
    }
    if (out.length) chrome.runtime.sendMessage({ type: "watchlist", payload: out }).catch(() => {});
    if (ticks.length) chrome.runtime.sendMessage({ type: "ticks", payload: ticks }).catch(() => {});
  }

  scanVisibleAssetLinks();
  setInterval(scanVisibleAssetLinks, 2000);

  // ---- human-mimicry helpers ----
  const rand = (min, max) => Math.floor(min + Math.random() * (max - min));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const humanDelay = (min = 600, max = 1400) => sleep(rand(min, max));

  function findByText(selector, text) {
    const list = Array.from(document.querySelectorAll(selector));
    const needle = String(text).trim();
    return list.find((el) => {
      const t = (el.textContent || "").trim();
      if (!t.includes(needle)) return false;
      // Prefer visible elements
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }) || null;
  }

  function normalizeArabicText(text) {
    return String(text || "")
      .replace(/[\u064B-\u065F\u0670]/g, "")
      .replace(/[إأآا]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/\s+/g, " ")
      .trim();
  }

  function matchesAnyLabel(text, labels) {
    const t = normalizeArabicText(text).toLowerCase();
    return labels.some((label) => {
      const l = normalizeArabicText(label).toLowerCase();
      return t === l || t.includes(l);
    });
  }

  function normalizeSettlementText(text) {
    return normalizeArabicText(normalizeDigits(text))
      .replace(/[＋]/g, "+")
      .toLowerCase();
  }

  function settlementDigits(text) {
    const t = normalizeSettlementText(text)
      .replace(/t\s*(?:[+\-]\s*)?([012])/gi, " T$1 ")
      .replace(/([012])\s*(?:نفس|ذات)?\s*الجلسه/g, " T$1 ");
    return Array.from(t.matchAll(/(?:^|[^a-z0-9])t\s*(?:[+\-]\s*)?([012])(?=[^0-9]|$)/gi)).map((m) => Number(m[1]));
  }

  function settlementTextHasDigit(text, digit) {
    return settlementDigits(text).includes(digit);
  }

  function settlementTextHasT0(text) {
    return settlementTextHasDigit(text, 0);
  }

  function settlementTextHasNonT0(text) {
    return settlementTextHasDigit(text, 1) || settlementTextHasDigit(text, 2);
  }

  function firstSettlementDigit(text) {
    return settlementDigits(text)[0] ?? null;
  }

  function settlementTextLooksT0(text) {
    const t = normalizeSettlementText(text);
    if (/(نفس|ذات)\s*الجلسه|بيع\s*نفس\s*الجلسه|same[\s-]*(day|session)|day[\s-]*trade|intraday/i.test(t)) return true;
    if (!settlementTextHasT0(text)) return false;
    if (!settlementTextHasNonT0(text)) return true;
    return firstSettlementDigit(text) === 0;
  }

  function settlementValueLooksT0(value) {
    const v = normalizeSettlementText(value).replace(/[\s_\-]+/g, "");
    return /^(0|t0|t\+0|sameday|samesession|daytrade|intraday)$/.test(v);
  }

  function settlementTokenCount(text) {
    return settlementDigits(text).length;
  }

  function isDisabled(el) {
    if (!el) return true;
    const style = getComputedStyle(el);
    return el.disabled || el.getAttribute("aria-disabled") === "true" || style.pointerEvents === "none";
  }

  function sideButtonCandidates(labels) {
    const selectors = "button, [role='button'], a, [tabindex], [onclick], div, span, p";
    const seen = new Set();
    return Array.from(document.querySelectorAll(selectors))
      .map((el) => {
        if (!isVisible(el)) return null;
        const text = cleanText(el);
        if (!text || text.length > 180 || !matchesAnyLabel(text, labels)) return null;
        if (/thndrx|thndr x|ثندرx|ثاندرx/i.test(normalizeArabicText(text))) return null;
        const directClickable = el.matches?.("button, [role='button'], a, [tabindex], [onclick]");
        const surface = directClickable ? el : clickableSurface(el);
        if (!surface || !isVisible(surface) || isDisabled(surface)) return null;
        const r = surface.getBoundingClientRect();
        if (r.width < 28 || r.height < 20) return null;
        if (r.width > Math.min(760, window.innerWidth - 12) && !directClickable) return null;
        if (seen.has(surface)) return null;
        seen.add(surface);
        const surfaceText = cleanText(surface);
        const exact = labels.some((label) => surfaceText === label || text === label) ? 0 : 20;
        const sidePenalty = /شراء|buy/i.test(labels.join(" ")) && /بيع|sell/i.test(surfaceText) ? 500 : 0;
        const tagScore = /button/i.test(surface.tagName) ? 0 : surface.getAttribute("role") === "button" ? 5 : 12;
        const sizeScore = Math.abs(r.height - 44) + Math.max(0, r.width - 260) / 8;
        return { el: surface, score: exact + tagScore + sizeScore + sidePenalty };
      })
      .filter(Boolean)
      .sort((a, b) => a.score - b.score)
      .map((item) => item.el);
  }

  // Broader search: any clickable-looking element containing the text.
  function findClickableByText(text) {
    return sideButtonCandidates([text])[0] || null;
  }

  function findInvestorModalDismissButton() {
    const surfaces = Array.from(document.querySelectorAll("[role='dialog'], .ant-modal, .ant-modal-content, aside, section, div"))
      .filter((el) => {
        if (!isVisible(el)) return false;
        const r = el.getBoundingClientRect();
        if (r.width < 220 || r.height < 120 || r.width > Math.min(920, window.innerWidth)) return false;
        const text = normalizeArabicText(cleanText(el));
        return /افتح\s*حساب\s*مستثمر|ابدا\s*الاستثمار|ابدأ\s*الاستثمار|open\s*investor\s*account/i.test(text);
      })
      .sort((a, b) => {
        const ar = a.getBoundingClientRect();
        const br = b.getBoundingClientRect();
        return (ar.width * ar.height) - (br.width * br.height);
      });
    for (const surface of surfaces) {
      const btn = Array.from(surface.querySelectorAll("button, [role='button'], a, [tabindex], [onclick], div, span"))
        .find((el) => {
          if (!isVisible(el) || isDisabled(el)) return false;
          const text = normalizeArabicText(cleanText(el));
          if (text.length > 40) return false;
          return /ليس\s*الان|ليس\s*الآن|not\s*now|later/i.test(text);
        });
      const target = clickableSurface(btn);
      if (target && isVisible(target) && !isDisabled(target)) return target;
    }
    return null;
  }

  async function dismissInvestorModalIfPresent() {
    const btn = findInvestorModalDismissButton();
    if (!btn) return false;
    debug("بقفل نافذة حساب المستثمر المؤقتة", "#f59e0b");
    await preciseClick(btn);
    await waitFor(() => !findInvestorModalDismissButton(), { timeout: 2200, interval: 120 });
    return true;
  }

  // v4.1.65: find the "معلومات السوق عن المستوى الثاني" accordion link on the
  // stock page. Confirmed DOM: <a> inside <div class="ant-card-extra"> under
  // <div class="ant-card"> / <div class="ant-card-head-wrapper">. Same
  // preciseClick tech we already use for buy/sell — a human click identical to
  // any user opening the Level-2 panel. Triggers Thunder's own GET
  // /assets-service/market-depth/{uuid} which our passive interceptor catches.
  function findL2AccordionLink() {
    const RX = /معلومات\s*السوق\s*عن\s*المستو[ىي]?\s*الثان/;
    const extras = document.querySelectorAll(".ant-card-extra a, .ant-card-extra [role='link'], .ant-card-extra button");
    for (const el of extras) {
      if (!isVisible(el) || isDisabled(el)) continue;
      const t = normalizeArabicText(cleanText(el));
      if (RX.test(t) || looksLikeMarketDepthButton(t)) return clickableSurface(el) || el;
    }
    // Fallback: Thunder changes this control between <a>, button, div/span,
    // and Ant card/collapse headers. Keep the match text-specific so we never
    // hit order-type controls, but don't depend on one tag/class.
    const candidates = document.querySelectorAll("a, button, [role='link'], [role='button'], [tabindex], [onclick], .ant-card-extra *, .ant-card-head-wrapper *, .ant-collapse-header, div, span");
    const matches = [];
    for (const el of candidates) {
      if (!isVisible(el) || isDisabled(el)) continue;
      const t = normalizeArabicText(cleanText(el));
      if (!t || t.length > 120) continue;
      if (!(RX.test(t) || looksLikeMarketDepthButton(t))) continue;
      const surface = clickableSurface(el) || el;
      if (!surface || !isVisible(surface) || isDisabled(surface)) continue;
      const r = surface.getBoundingClientRect();
      const inCardExtra = surface.closest?.(".ant-card-extra, .ant-card-head-wrapper, .ant-collapse-header") ? 0 : 40;
      const tagScore = surface.matches?.("a, button, [role='link'], [role='button']") ? 0 : 15;
      matches.push({ el: surface, score: inCardExtra + tagScore + Math.abs(r.height - 32) + Math.max(0, t.length - 55) });
    }
    matches.sort((a, b) => a.score - b.score);
    if (matches[0]) return matches[0].el;
    return null;
  }

  function findL2ModalCloseButton() {
    const btn = document.querySelector(".ant-modal-close, .ant-modal-close-x");
    if (btn && isVisible(btn) && !isDisabled(btn)) return btn;
    return null;
  }

  // v4.1.91: read L2 panel state before any click.
  // Critical: L2 controls are toggles. Clicking while already open CLOSES the
  // book, which was the source of the open/close flicker. We now only re-click
  // during long collection when the DOM positively says "closed". Unknown state
  // is treated as unsafe-to-reclick after the first open attempt.
  function getL2PanelState(trigger, uuid = "") {
    try {
      // Thunder only fetches market-depth while the L2 panel is actually open.
      // A fresh passive snapshot is therefore stronger evidence than DOM
      // attributes, because some Thunder builds omit reliable aria/hidden state.
      const panelUuid = String(uuid || currentAssetUuid() || "").trim().toLowerCase();
      if (getFreshL2(panelUuid, 30_000)) {
        return { state: "open", reason: "fresh_l2_snapshot_30s" };
      }
      if (!trigger) return { state: "unknown", reason: "no_trigger" };
      // 1) aria-expanded on the trigger itself or its ancestor.
      const withAria = trigger.closest?.("[aria-expanded]")
        || (trigger.hasAttribute?.("aria-expanded") ? trigger : null)
        || trigger.querySelector?.("[aria-expanded]");
      if (withAria) {
        const v = String(withAria.getAttribute("aria-expanded") || "").toLowerCase();
        if (v === "true") return { state: "open", reason: "aria_expanded_true" };
        if (v === "false") return { state: "closed", reason: "aria_expanded_false" };
      }
      // 2) If Thunder opened L2 as a modal/dialog, a visible close button means
      // the book is already open. Never click the trigger in this state.
      if (findL2ModalCloseButton()) return { state: "open", reason: "visible_modal_close" };
      // 2) Ant Design collapse item active class → panel is open.
      const item = trigger.closest?.(".ant-collapse-item, .ant-card, .ant-collapse, .ant-collapse-header");
      if (item) {
        if (item.classList?.contains("ant-collapse-item-active")) return { state: "open", reason: "ant_item_active" };
        // 3) Look for an active content region nearby.
        const active = item.querySelector?.(".ant-collapse-content-active, .ant-collapse-content:not(.ant-collapse-content-hidden)");
        if (active && isVisible(active)) return { state: "open", reason: "active_content_near_trigger" };
        const hidden = item.querySelector?.(".ant-collapse-content-hidden");
        if (hidden) return { state: "closed", reason: "hidden_content_near_trigger" };
      }
      // 4) Global fallback: is there an active market-depth content region on the page?
      const anyActive = document.querySelector(".ant-collapse-content-active");
      if (anyActive && isVisible(anyActive)) {
        // Only treat as "open for our accordion" if it's near our trigger.
        const near = trigger.closest?.(".ant-card, .ant-collapse");
        if (near && near.contains(anyActive)) return { state: "open", reason: "active_content_global_near" };
      }
    } catch {}
    return { state: "unknown", reason: "no_reliable_dom_signal" };
  }

  function isAccordionClosed(trigger) {
    return getL2PanelState(trigger).state === "closed";
  }

  // Opens Thunder's own L2 panel once so Thunder itself fetches market-depth
  // (our interceptor catches it). Closes the modal afterwards to keep the UI
  // clean. Silent no-op if the link is not present. Never issues any request
  // from the extension side.
  //
  // v4.1.77: added optional `keepOpenMs` — when > 0, the panel stays open
  // that long BEFORE closing, so Thunder's own ~10s polling keeps feeding
  // fresh L2 snapshots through our passive interceptor (proven by real
  // orderbook_snapshots data: PRCL/MPCI/AFMC gaps of 10-12s). Default 0
  // preserves the previous behavior exactly (buy flow is unchanged).
  async function ensureL2SnapshotForUuid(uuid, { maxWaitMs = 2500, keepOpenMs = 0 } = {}) {
    if (!uuid) return false;
    // Skip re-open only when we already have fresh data AND we're not
    // explicitly asking to keep it open for continuous capture.
    if (getFreshL2(uuid) && !keepOpenMs) return true;
    const trigger = findL2AccordionLink();
    if (!trigger) return false;
    const initialPanel = getL2PanelState(trigger, uuid);
    if (initialPanel.state === "open") {
      debug(`L2 مفتوح بالفعل (${initialPanel.reason}) — بدون ضغط`, "#10b981");
    } else {
      debug(`بفتح L2 (state=${initialPanel.state}/${initialPanel.reason})`, "#8b5cf6");
      try { await preciseClick(trigger); } catch { return false; }
    }
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      await new Promise((r) => setTimeout(r, 120));
      if (getFreshL2(uuid)) break;
    }
    // v4.1.75: human-like dwell before closing (400-1200ms) so we don't
    // close the panel the same instant the response arrives — Thunder
    // telemetry might flag "opened + closed in <100ms" as a bot pattern.
    // v4.1.77: extend dwell to keepOpenMs (if bigger) so we capture more
    // than one snapshot from Thunder's own polling.
    const baseDwellMs = 400 + Math.floor(Math.random() * 800);
    const totalDwellMs = Math.max(baseDwellMs, Number(keepOpenMs) || 0);
    // v4.1.81: for long dwells (>=60s) the accordion sometimes closes on
    // its own after Thunder's SPA re-renders — we then stop getting fresh
    // L2 snapshots. Watch for stale data every second and re-click the
    // accordion (max 5 times, ≥30s apart) to keep Thunder's own polling
    // alive. Zero new API calls from the extension; identical to a human
    // re-opening the panel. Includes diagnostic logging so we can verify.
    if (totalDwellMs >= 60_000) {
      const dwellStart = Date.now();
      // v4.1.87: Thunder's own polling cadence is ~15-20s. A 20s threshold
      // was too aggressive → we kept concluding "stale" during a normal
      // gap and re-clicked, which TOGGLED the (still-open) accordion CLOSED,
      // causing the "open 1min / close 1min" flicker. Fix:
      //   1) Bump stale threshold to 45s (well above natural gap).
      //   2) Before every re-click, verify the accordion is actually CLOSED
      //      (check aria-expanded / ant-collapse-item-active). If it's still
      //      open, DON'T click — stale data means Thunder's network stalled,
      //      not that the panel closed. Clicking would only close it.
      //   3) Space re-clicks 60s apart to further reduce toggle risk.
      // v4.1.88: health-check still runs every 1s, but a re-click is allowed
      // only when the DOM positively says CLOSED. That means if Thunder closes
      // the list, we reopen quickly; if it is open but data is stale, we do not
      // toggle it closed by mistake.
      const reclickIntervalMs = 15_000;
      const staleThresholdMs = 45_000;
      // Long-lived L2 tabs must keep trying all session. The old hard cap (5)
      // could stop after ~3 minutes, leaving the tab open but L2 closed/idle.
      const maxReclicks = Math.max(5, Math.ceil(totalDwellMs / reclickIntervalMs));
      let reclicks = 0;
      let lastReclickAt = dwellStart;
      let lastFreshLogAt = 0;
      // v4.1.90: track whether we've EVER captured L2 data for this uuid
      // during this dwell. If we never have and enough time passed, the
      // initial click failed (proven by 0 snapshots — Thunder always fetches
      // market-depth when the panel actually opens). In that case, a
      // state=unknown result is safe to treat as CLOSED: there is no open
      // panel to accidentally toggle closed, because nothing ever opened.
      let everSawL2 = Number.isFinite(getL2AgeMs(uuid));
      while (Date.now() - dwellStart < totalDwellMs) {
        await new Promise((r) => setTimeout(r, 1000));
        const fresh = getFreshL2(uuid, staleThresholdMs);
        const ageMs = getL2AgeMs(uuid);
        if (!everSawL2 && Number.isFinite(ageMs)) everSawL2 = true;
        // Light heartbeat log every ~30s so we can see accordion state.
        if (Date.now() - lastFreshLogAt >= 30_000) {
          lastFreshLogAt = Date.now();
          const st = getL2PanelState(findL2AccordionLink(), uuid);
          debug(`L2 health ${(Math.round((Date.now()-dwellStart)/1000))}s fresh=${fresh?"y":"n"} age=${Number.isFinite(ageMs)?Math.round(ageMs/1000):"∞"}s panel=${st.state} reclicks=${reclicks}`, fresh ? "#10b981" : "#f59e0b");
        }
        if (reclicks < maxReclicks && Date.now() - lastReclickAt >= reclickIntervalMs) {
          const t = findL2AccordionLink();
          const st = getL2PanelState(t, uuid);
          if (!fresh && Number.isFinite(ageMs) && ageMs >= L2_PERSIST_SOFT_RESET_AFTER_MS && (st.state === "open" || st.state === "closed")) {
            const didReset = await softResetOpenL2Panel(t, uuid, st.state, `age=${Math.round(ageMs/1000)}s panel=${st.state}`);
            if (didReset) {
              reclicks++;
              lastReclickAt = Date.now();
              continue;
            }
          }
          if (t && st.state === "closed") {
            try {
              await preciseClick(t);
              reclicks++;
              lastReclickAt = Date.now();
              debug(`L2 re-open #${reclicks} (panel closed: ${st.reason})`, "#f59e0b");
            } catch {}
          } else if (t && !fresh && st.state === "open") {
            // Panel is open but no fresh data. Short gaps can be normal;
            // >=90s gaps are handled by the soft-reset block above.
            lastReclickAt = Date.now();
            debug(`L2 stale but panel is open (${st.reason}) — no click`, "#3b82f6");
          } else if (t && !fresh && st.state === "unknown") {
            // v4.1.90: if we've NEVER captured L2 for this uuid in this dwell
            // AND at least 20s passed since dwell start, the initial click
            // failed. Thunder always fetches market-depth when the panel
            // actually opens, so 0 snapshots proves the panel is CLOSED even
            // when the DOM has no reliable signal. Safe to retry the same
            // human-like click. Working tabs (with snapshots) never enter
            // this branch. Rate-limited by reclickIntervalMs (15s) and
            // maxReclicks — no spam, no blind coordinate clicks.
            const dwellAgeMs = Date.now() - dwellStart;
            if (!everSawL2 && dwellAgeMs >= 20_000) {
              try {
                await preciseClick(t);
                reclicks++;
                lastReclickAt = Date.now();
                debug(`L2 first-open retry #${reclicks} (never saw data, ${Math.round(dwellAgeMs/1000)}s, ${st.reason})`, "#f59e0b");
              } catch {}
            } else {
              lastReclickAt = Date.now();
              debug(`L2 stale; panel state unknown (${st.reason}) — no blind click`, "#3b82f6");
            }
          }
        }
      }
    } else {
      await new Promise((r) => setTimeout(r, totalDwellMs));
    }
    // Best-effort close so the modal doesn't cover the order sidebar.
    const closeBtn = findL2ModalCloseButton();
    if (closeBtn) { try { await preciseClick(closeBtn); } catch {} }
    return !!getFreshL2(uuid);
  }

  // v4.1.95: STRICT L2 Pre-Trade Guard. Runs BEFORE buying. Three checks:
  //   1) Current bid depth AT/ABOVE the exact safe sell target ≥ qty.
  //   2) Profitability: safe sell target covers buy fee + sell fee + 0.5% net.
  //   3) Spread sanity: (bestAsk - bestBid) / bestAsk ≤ 1.5%.
  // Any failure → refuse to buy. If L2 not available at all → refuse (safe default).
  function evaluateL2ForBuy({ l2, capital, entryPriceHint, qty }) {
    if (!l2 || !Array.isArray(l2.asks) || !Array.isArray(l2.bids)) {
      return { ok: false, reason: "L2 غير متاح — رفض آمن (مش هنشتري أعمى)" };
    }
    const bestAsk = Number(l2.bestAsk) || Number(l2.asks[0]?.price) || Number(entryPriceHint) || 0;
    const bestBid = Number(l2.bestBid) || Number(l2.bids[0]?.price) || 0;
    if (!(bestAsk > 0) || !(bestBid > 0)) {
      return { ok: false, reason: "دفتر الأوامر ناقص (bestAsk/bestBid = 0)" };
    }
    const cap = Number(capital) > 0 ? Number(capital) : 1000;
    const qtyEstimate = Math.max(1, Math.floor(Number(qty) || Math.floor(cap / bestAsk)));
    // Check 3 (cheapest first): spread
    const spreadPct = (bestAsk - bestBid) / bestAsk;
    if (spreadPct > 0.015) {
      return { ok: false, reason: `Spread واسع جداً ${(spreadPct * 100).toFixed(2)}% (الحد 1.5%)`, metrics: { bestAsk, bestBid, spreadPct } };
    }
    // Check 1+2: exact post-fee safe sell target + enough current demand depth
    // at that target. Top-5 aggregate depth is NOT enough; buyers must already
    // exist at/above the price we need to sell for.
    const buyValue = bestAsk * qtyEstimate;
    const buyFee = 3 + 0.0003 * buyValue;
    const desiredNetProfit = buyValue * 0.005;
    const target = (buyValue + buyFee + 3 + desiredNetProfit) / (qtyEstimate * (1 - 0.0003));
    const bidDepthAtTarget = l2.bids.reduce((s, b) => {
      const p = Number(b?.price ?? b?.order_price ?? 0);
      const q = Number(b?.qty ?? b?.volume_traded ?? 0);
      return p >= target ? s + q : s;
    }, 0);
    if (bidDepthAtTarget < qtyEstimate) {
      return { ok: false, reason: `مفيش طلب كافي عند سعر البيع الآمن (${bidDepthAtTarget} < ${qtyEstimate})`, metrics: { bidDepthAtTarget, qtyEstimate, target } };
    }
    const fifthAsk = Number(l2.asks[Math.min(4, l2.asks.length - 1)]?.price) || bestAsk;
    if (target > fifthAsk) {
      return { ok: false, reason: `المكسب المستهدف ${target.toFixed(2)} أعلى من 5th ask ${fifthAsk.toFixed(2)}`, metrics: { target, fifthAsk } };
    }
    return { ok: true, reason: "L2 آمن: مشترين موجودين عند سعر البيع", metrics: { bestAsk, bestBid, spreadPct, bidDepthAtTarget, qtyEstimate, target, fifthAsk } };
  }

  function findSideButton(labels, { allowHeuristic = true } = {}) {
    return sideButtonCandidates(labels)[0] || (allowHeuristic ? findLikelyTradeButton(labels) : null) || null;
  }

  function findOpenThndrXButton() {
    const selectors = "a[href], button, [role='button'], [tabindex], [onclick], div, span";
    return Array.from(document.querySelectorAll(selectors))
      .map((el) => {
        if (!isVisible(el) || isDisabled(el)) return null;
        const text = cleanText(el);
        const normalized = normalizeArabicText(text).toLowerCase();
        const href = el.closest?.("a[href]")?.href || el.getAttribute?.("href") || "";
        const hay = `${normalized} ${String(href).toLowerCase()}`;
        const hasThndrX = hay.includes("thndrx") || hay.includes("thndr-x") || hay.includes("thndr x") || hay.includes("ثندرx") || hay.includes("ثاندرx");
        const surface = clickableSurface(el);
        if (!surface || !isVisible(surface) || isDisabled(surface)) return null;
        const r = surface.getBoundingClientRect();
        // Exclude the "افتح حساب مستثمر" promo button — it lives in the header
        // area too but opens the investor-account modal, not ThndrX.
        const isInvestorPromo = /حساب\s*مستثمر|investor\s*account/i.test(normalized);
        const isHeaderOpenButton = !isInvestorPromo && matchesAnyLabel(text, ["افتح", "Open"]) && r.top >= 0 && r.top <= 120 && r.height >= 34 && r.height <= 72 && r.width >= 70 && r.width <= 260;
        if (!hasThndrX && !isHeaderOpenButton) return null;
        if (r.width < 60 || r.height < 24 || r.width > Math.min(520, window.innerWidth - 12)) return null;
        const openScore = /افتح|open|launch|تداول|trade/i.test(hay) ? 0 : 80;
        const headerScore = isHeaderOpenButton ? 0 : 35;
        const tagScore = surface.matches?.("a[href], button, [role='button']") ? 0 : 18;
        return { el: surface, score: headerScore + openScore + tagScore + Math.abs(r.height - 44) + Math.max(0, r.width - 230) / 6 };
      })
      .filter(Boolean)
      .sort((a, b) => a.score - b.score)[0]?.el || null;
  }

  function safeThndrHref(el) {
    const href = el?.closest?.("a[href]")?.href || el?.getAttribute?.("href") || "";
    return /^https:\/\/([^/]+\.)?thndr\.app\//.test(href) ? href : "";
  }

  function thndrXOpenInstruction() {
    const trigger = findOpenThndrXButton();
    if (!trigger) return null;
    return { trigger, href: safeThndrHref(trigger) };
  }

  function scheduleThndrXClick(trigger) {
    setTimeout(() => {
      humanClick(trigger).catch(() => {});
    }, 120);
  }

  async function clickOpenThndrXAndWait(openX) {
    const trigger = openX?.trigger;
    if (!trigger || !isVisible(trigger) || isDisabled(trigger)) return false;
    debug("بضغط افتح ThndrX وهكمل تلقائياً", "#f59e0b");
    const clicked = (await preciseClick(trigger)) || (await humanClick(trigger));
    if (!clicked) return false;
    return !!(await waitFor(() => (
      findSideButton(["شراء", "Buy", "BUY", "بيع", "Sell", "SELL"], { allowHeuristic: false }) ||
      findOrderTypeOpener() ||
      findQuantityInput() ||
      /thndrx|trade|trader|terminal/i.test(location.href) ||
      !/\/assets\//i.test(location.href)
    ), { timeout: 12000, interval: 300 }));
  }

  async function openThndrXWorkspaceIfPresent() {
    const trigger = await waitFor(() => findOpenThndrXButton(), { timeout: 5500, interval: 150 });
    if (!trigger) return false;
    debug("هفتح واجهة التداول ThndrX", "#f59e0b");
    const href = safeThndrHref(trigger);
    if (href) {
      window.location.assign(href);
    } else {
      await humanClick(trigger);
    }
    return !!(await waitFor(() => (
      findSideButton(["شراء", "Buy", "BUY", "بيع", "Sell", "SELL"]) ||
      findOrderTypeOpener() ||
      findQuantityInput() ||
      /thndrx|trade|trader|terminal/i.test(location.href)
    ), { timeout: 26000, interval: 300 }));
  }

  function findLikelyTradeButton(labels) {
    const wantSell = labels.some((label) => /بيع|Sell/i.test(label));
    const wantBuy = labels.some((label) => /شراء|Buy/i.test(label));
    const buttons = Array.from(document.querySelectorAll("button, [role='button'], a, [tabindex], [onclick], div, span"))
      .filter((el) => isVisible(el) && !isDisabled(el))
      .map((el) => ({ el, r: el.getBoundingClientRect(), text: cleanText(el), style: getComputedStyle(el) }))
      .filter(({ r }) => r.width >= 52 && r.height >= 28 && r.width <= Math.min(460, window.innerWidth - 16) && r.height <= 110)
      .filter(({ r }) => r.top < Math.max(620, window.innerHeight * 0.82))
      .filter(({ text }) => {
        const normalized = normalizeArabicText(text);
        if (/مراجعة|تأكيد|إلغاء|حفظ|اختار|السوق|Review|Confirm|Cancel|Save|Choose|Select/i.test(normalized)) return false;
        // Critical for BUY automation: when the account/investor promo is
        // visible or the asset page only has a SELL button, the old heuristic
        // could treat those prominent buttons as the missing BUY button. That
        // is exactly why the buy flow opened the investor-card while sell was
        // unaffected. Opposite-side and investor/ThndrX buttons are never valid
        // fallbacks for a side button.
        if (/حساب\s*مستثمر|ابدا\s*الاستثمار|ابدأ\s*الاستثمار|open\s*investor\s*account/i.test(normalized)) return false;
        if (/thndrx|thndr\s*x|ثندرx|ثاندرx/i.test(normalized)) return false;
        if (wantBuy && /بيع|sell/i.test(normalized)) return false;
        if (wantSell && /شراء|buy/i.test(normalized)) return false;
        return true;
      });
    const exact = buttons.find(({ text }) => matchesAnyLabel(text, labels));
    if (exact) return clickableSurface(exact.el);
    return buttons
      .map((item) => {
        const dark = colorDarkness(item.style.backgroundColor) < 90 || colorDarkness(item.style.color) > 210;
        const hasPointer = item.style.cursor === "pointer" || item.el.matches?.("button, [role='button'], a, [tabindex], [onclick]");
        const sideScore = wantSell ? item.r.left : window.innerWidth - item.r.right;
        return { ...item, score: sideScore + (dark ? 0 : 35) + (hasPointer ? 0 : 25) + Math.abs(item.r.height - 44) };
      })
      .sort((a, b) => a.score - b.score)[0]?.el || null;
  }

  function colorDarkness(color) {
    const nums = String(color || "").match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
    if (nums.length < 3) return 255;
    return (nums[0] * 0.299) + (nums[1] * 0.587) + (nums[2] * 0.114);
  }

  function isVisible(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && style.visibility !== "hidden" && style.display !== "none";
  }

  function cleanText(el) {
    const visibleText = typeof el?.innerText === "string" ? el.innerText : (el?.textContent || "");
    return (visibleText + " " + (el?.value || "") + " " + (el?.getAttribute?.("value") || "") + " " + (el?.getAttribute?.("data-value") || "") + " " + (el?.getAttribute?.("placeholder") || "") + " " + (el?.getAttribute?.("aria-label") || "") + " " + (el?.getAttribute?.("title") || "") + " " + (el?.getAttribute?.("data-testid") || "") + " " + (el?.getAttribute?.("label") || ""))
      .replace(/\s+/g, " ")
      .trim();
  }

  function cloneTextWithoutMenuOptions(el) {
    if (!el) return "";
    if (el.tagName === "SELECT") {
      const selected = el.selectedOptions?.[0];
      return `${selected?.textContent || ""} ${el.value || ""}`.replace(/\s+/g, " ").trim();
    }
    if (/^(INPUT|TEXTAREA)$/.test(el.tagName)) return cleanText(el);
    try {
      const clone = el.cloneNode(true);
      clone.querySelectorAll?.("[role='option'], [role='menuitem'], [role='menuitemradio'], [role='listbox'], [data-radix-popper-content-wrapper], li, [data-value]").forEach((n) => n.remove());
      return ((clone.innerText || clone.textContent || "") + " " + (el.getAttribute?.("aria-label") || "") + " " + (el.getAttribute?.("title") || ""))
        .replace(/\s+/g, " ")
        .trim();
    } catch {
      return cleanText(el);
    }
  }

  function selectedControlFor(el) {
    if (!el) return null;
    if (el.matches?.("button, [role='button'], [role='combobox'], select, input")) return el;
    const children = Array.from(el.querySelectorAll?.("button, [role='button'], [role='combobox'], select, input") || [])
      .filter((child) => isVisible(child) && !isDisabled(child))
      .map((child) => ({ child, r: child.getBoundingClientRect(), text: cloneTextWithoutMenuOptions(child) }))
      .filter(({ r, text }) => r.width >= 40 && r.height >= 20 && r.height <= 90 && text.length <= 90)
      .sort((a, b) => (a.r.width * a.r.height) - (b.r.width * b.r.height));
    return children[0]?.child || el;
  }

  function selectedControlText(el) {
    return cloneTextWithoutMenuOptions(selectedControlFor(el));
  }

  function orderTypeMenuOptionCount(text) {
    const t = normalizeArabicText(text).toLowerCase();
    return [
      /سعر\s*السوق|market/i,
      /سعر\s*محدد|limit/i,
      /(?:ال)?طلبات\s*(?:ال)?متقدمه|advanced/i,
    ].filter((re) => re.test(t)).length;
  }

  function looksLikeMarketDepthButton(text) {
    const t = normalizeArabicText(text).toLowerCase();
    return /معلومات\s*(?:ال)?سوق|(?:ال)?مستوي\s*(?:ال)?ثاني|(?:ال)?مستوى\s*(?:ال)?ثاني|level\s*(?:2|ii)|market\s*depth|depth\s*of\s*market/i.test(t);
  }

  function settlementMenuOptionCount(text) {
    const t = normalizeSettlementText(text);
    return [0, 1, 2].filter((digit) => settlementTextHasDigit(t, digit)).length;
  }

  function findSmallTextElement(labels) {
    const els = Array.from(document.querySelectorAll("body *"));
    return els
      .filter((el) => {
        if (!isVisible(el)) return false;
        const text = cleanText(el);
        if (text.length > 35) return false;
        const normalized = normalizeArabicText(text).toLowerCase();
        if (/اختار|اختر|selected|chosen|t\s*[+\-]?\s*[012]/i.test(normalized)) return false;
        return labels.some((label) => {
          const wanted = normalizeArabicText(label).toLowerCase();
          return normalized === wanted || normalized.includes(wanted) || wanted.includes(normalized);
        });
      })
      .sort((a, b) => {
        const ar = a.getBoundingClientRect();
        const br = b.getBoundingClientRect();
        return (ar.width * ar.height) - (br.width * br.height);
      })[0] || null;
  }

  function clickableSurface(el) {
    if (!el) return null;
    const clickable = el.closest?.("button, [role='button'], [role='combobox'], [role='option'], a, li, input, label, [tabindex], [onclick]");
    if (clickable && isVisible(clickable)) return clickable;
    let cur = el;
    let best = el;
    for (let depth = 0; cur && depth < 7; depth++, cur = cur.parentElement) {
      if (!isVisible(cur)) continue;
      const r = cur.getBoundingClientRect();
      const style = getComputedStyle(cur);
      if ((style.cursor === "pointer" || typeof cur.onclick === "function") && r.width >= 28 && r.height >= 20 && r.width <= Math.min(760, window.innerWidth - 12) && r.height <= 180) best = cur;
    }
    if (best && isVisible(best)) return best;
    return el;
  }

  function findOrderTypeOpener() {
    const labelEl = findSmallTextElement(["نوع الطلب", "Order type"]);

    // Best path: anchor on the exact "نوع الطلب" label, then choose the field
    // horizontally aligned with it. This avoids clicking unrelated "اختار" fields.
    if (labelEl) {
      // FAST PATH: Thunder's current UI is Ant Design Select. The clickable
      // opener is the .ant-select-selector next to the label; clicking inner
      // text/input spans often does nothing, so return the selector itself.
      let antScope = labelEl;
      for (let depth = 0; antScope && depth < 7; depth++, antScope = antScope.parentElement) {
        const ant = Array.from(antScope.querySelectorAll?.(".ant-select:not(.ant-select-disabled) .ant-select-selector") || [])
          .filter((el) => isVisible(el) && !isDisabled(el))
          .map((el) => ({ el, r: el.getBoundingClientRect(), text: selectedControlText(el), allText: cleanText(el) }))
          .filter(({ r, text, allText }) => {
            if (r.height < 26 || r.height > 82 || r.width < 54 || r.width > Math.min(520, window.innerWidth - 24)) return false;
            const hay = normalizeArabicText(`${text} ${allText}`).toLowerCase();
            return /اختار|اختر|سعر\s*السوق|سعر\s*محدد|طلبات|select|choose|market|limit|advanced/i.test(hay) || orderTypeMenuOptionCount(allText) >= 1;
          })
          .sort((a, b) => {
            const ar = a.r;
            const br = b.r;
            const lr = labelEl.getBoundingClientRect();
            const ay = Math.abs((ar.top + ar.bottom) / 2 - (lr.top + lr.bottom) / 2);
            const by = Math.abs((br.top + br.bottom) / 2 - (lr.top + lr.bottom) / 2);
            return ay - by;
          });
        if (ant[0]) return ant[0].el;
      }
      const lr = labelEl.getBoundingClientRect();
      let scope = labelEl.parentElement;
      for (let depth = 0; scope && depth < 7; depth++, scope = scope.parentElement) {
        const sr = scope.getBoundingClientRect();
        if (sr.width < 140 || sr.height > 360) continue;
        const candidates = Array.from(scope.querySelectorAll("button, [role='button'], [role='combobox'], input, div, span"))
          .filter((el) => el !== labelEl && !el.contains(labelEl) && !labelEl.contains(el))
          .map((el) => ({ el, control: selectedControlFor(el), r: el.getBoundingClientRect(), text: selectedControlText(el), allText: cleanText(el) }))
          .filter(({ el, r, text }) => {
            if (!isVisible(el)) return false;
            if (r.height < 26 || r.height > 82 || r.width < 54 || r.width > Math.min(520, window.innerWidth - 24)) return false;
            if (Math.abs((r.top + r.bottom) / 2 - (lr.top + lr.bottom) / 2) > 55) return false;
            if (/نوع الطلب|Order type/i.test(text)) return false;
            return !text || text.length <= 90 || /اختار|اختر|سعر السوق|سعر محدد|طلبات|Select|Choose|Market|Limit|Advanced/i.test(text);
          })
          .sort((a, b) => {
            const ay = Math.abs((a.r.top + a.r.bottom) / 2 - (lr.top + lr.bottom) / 2);
            const by = Math.abs((b.r.top + b.r.bottom) / 2 - (lr.top + lr.bottom) / 2);
            const ax = Math.abs((a.r.left + a.r.right) / 2 - (lr.left + lr.right) / 2);
            const bx = Math.abs((b.r.left + b.r.right) / 2 - (lr.left + lr.right) / 2);
            const aMenuPenalty = Math.max(0, orderTypeMenuOptionCount(a.allText) - 1) * 35;
            const bMenuPenalty = Math.max(0, orderTypeMenuOptionCount(b.allText) - 1) * 35;
            const aText = /اختار|اختر|سعر السوق|سعر محدد|طلبات|Select|Choose|Market|Limit|Advanced/i.test(a.text) ? 0 : 20;
            const bText = /اختار|اختر|سعر السوق|سعر محدد|طلبات|Select|Choose|Market|Limit|Advanced/i.test(b.text) ? 0 : 20;
            return (ay + ax / 6 + aText + aMenuPenalty) - (by + bx / 6 + bText + bMenuPenalty);
          });
        if (candidates[0]) return clickableSurface(candidates[0].control || candidates[0].el);
      }
    }

    // Fallback: short visible select trigger. Kept second on purpose so it
    // cannot steal focus from the actual order-type row.
    const fallback = Array.from(document.querySelectorAll("button, [role='button'], [role='combobox'], div, span, input"))
      .find((el) => {
        if (!isVisible(el)) return false;
        const r = el.getBoundingClientRect();
        const text = selectedControlText(el);
        if (r.height < 26 || r.height > 82 || r.width < 54 || r.width > 360 || text.length > 70) return false;
        return /اختار|اختر|Select|Choose|سعر السوق|طلبات|Market|Advanced/i.test(text);
      });
    return clickableSurface(fallback);
  }

  function optionRootFor(el, labels) {
    let cur = el;
    let best = el;
    for (let depth = 0; cur && depth < 6; depth++, cur = cur.parentElement) {
      if (!isVisible(cur)) continue;
      const text = cleanText(cur);
      if (!labels.some((label) => text.includes(label))) break;
      if (/سعر محدد|الطلبات المتقدمة|Limit|Advanced/i.test(text) && /سعر السوق|Market|سوق/i.test(text)) break;
      const r = cur.getBoundingClientRect();
      if (r.height >= 28 && r.height <= 120 && r.width >= 80) best = cur;
    }
    return clickableSurface(best);
  }

  function snapshotVisibleElements() {
    return new WeakSet(Array.from(document.querySelectorAll("body *")).filter((el) => {
      try { return isVisible(el); } catch { return false; }
    }));
  }

  function findShortTextOption(labels, excludeRoot, excludeRe) {
    return findShortTextOptions(labels, excludeRoot, excludeRe)[0] || null;
  }

  function findShortTextOptions(labels, excludeRoot, excludeRe) {
    // Find the real opened menu option, not the closed "اختار" trigger. Some
    // dropdowns keep their option nodes mounted with opacity:0, so visibility
    // alone is not enough; the center point must also be hit-testable.
    const opener = excludeRoot || findOrderTypeOpener();
    const openerRect = opener?.getBoundingClientRect?.();
    const seen = new Set();
    const options = [];
    const selectors = "[role='option'], [role='menuitem'], [role='menuitemradio'], [role='listbox'] *, [data-radix-popper-content-wrapper] *, li[tabindex], li[role], [data-value], li, button, [role='button'], div, span, p";

    for (const raw of Array.from(document.querySelectorAll(selectors))) {
      const candidates = [
        raw.closest?.("[role='option'], [role='menuitem'], [role='menuitemradio'], li[tabindex], li[role], [data-value], li, button"),
        raw,
      ];
      for (const el of candidates) {
        if (!el || seen.has(el)) continue;
        seen.add(el);
        const score = marketOptionScore(el, labels, opener, openerRect, excludeRe);
        if (score < Infinity) options.push({ el, score });
      }
    }

    return options.sort((a, b) => a.score - b.score).map((item) => item.el);
  }

  function marketOptionScore(el, labels, opener, openerRect, excludeRe) {
    if (!el || !isVisible(el)) return Infinity;
    if (opener && (el === opener || opener.contains(el) || el.contains(opener))) return Infinity;
    if (isDisabled(el)) return Infinity;
    const style = getComputedStyle(el);
    if (Number(style.opacity || "1") < 0.08 || style.pointerEvents === "none") return Infinity;
    const r = el.getBoundingClientRect();
    if (r.height < 12 || r.height > 180 || r.width < 24 || r.width > Math.min(820, window.innerWidth - 12)) return Infinity;
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    if (cx < 0 || cy < 0 || cx > window.innerWidth || cy > window.innerHeight) return Infinity;
    const hit = document.elementFromPoint(cx, cy);
    if (!hit || !(el === hit || el.contains(hit) || hit.contains(el))) return Infinity;

    const text = cleanText(el);
    if (!text || text.length > 180) return Infinity;
    const normalizedText = normalizeArabicText(text).toLowerCase();
    if (looksLikeMarketDepthButton(normalizedText)) return Infinity;
    const hasMarket = labels.some((label) => normalizedText.includes(normalizeArabicText(label).toLowerCase()));
    if (!hasMarket) return Infinity;
    const defaultExclude = /سعر محدد|limit|الطلبات المتقدمه|advanced/i;
    const exclude = excludeRe === null ? null : (excludeRe instanceof RegExp ? excludeRe : defaultExclude);
    if (exclude && exclude.test(normalizedText)) return Infinity;

    const exact = labels.some((label) => normalizedText === normalizeArabicText(label).toLowerCase()) ? 0 : 24;
    const semantic = el.matches?.("[role='option'], [role='menuitem'], [role='menuitemradio'], li, [data-value]") ? 0 : 18;
    const nearOpener = openerRect
      ? Math.abs(cx - (openerRect.left + openerRect.width / 2)) / 8 + Math.max(0, r.top - openerRect.bottom) / 4
      : 35;
    const compact = Math.max(0, r.height - 54) + Math.max(0, r.width - 260) / 10;
    return exact + semantic + nearOpener + compact;
  }

  function orderTypeTriggerShowsMarket() {
    const opener = findOrderTypeOpener();
    if (!opener || !isVisible(opener)) return false;
    const text = selectedControlText(opener);
    return /سعر السوق|Market/i.test(text);
  }

  function findQuantityInput() {
    const orderTypeOpener = findOrderTypeOpener();
    const candidates = Array.from(document.querySelectorAll("input:not([type='hidden']), textarea"));
    const visible = candidates.filter((el) => {
      if (el === orderTypeOpener || orderTypeOpener?.contains?.(el) || el.closest?.("[role='combobox']")) return false;
      if (el.disabled || el.readOnly || !isVisible(el)) return false;
      const hay = `${el.type || ""} ${el.inputMode || ""} ${el.name || ""} ${el.id || ""} ${el.placeholder || ""} ${el.getAttribute("aria-label") || ""}`;
      if (/اختار|اختر|select|choose|order.?type|نوع الطلب/i.test(hay)) return false;
      return true;
    });
    const preferred = visible.find((el) => {
      const hay = `${el.type || ""} ${el.inputMode || ""} ${el.name || ""} ${el.id || ""} ${el.placeholder || ""} ${el.getAttribute("aria-label") || ""}`;
      return /number|numeric|qty|quantity|shares|كمية|عدد/i.test(hay);
    });
    return preferred || (visible.length === 1 ? visible[0] : null);
  }

  async function ensureMarketOrderType() {
    // If the dropdown trigger already shows "سعر السوق", nothing to do.
    if (orderTypeTriggerShowsMarket()) return true;
    if (Date.now() < orderTypeAttemptLockedUntil) {
      debug("❌ توقفت بأمان: نوع الطلب محتاج اختيار يدوي", "#ef4444");
      return false;
    }

    const opener = findOrderTypeOpener();
    if (!opener) { debug("❌ مش لاقي قائمة نوع الطلب", "#ef4444"); return false; }
    debug("بفتح قائمة نوع الطلب", "#3b82f6");

    // Native <select>: set value directly, no dropdown toggling.
    const nativeSelect = opener.tagName === "SELECT" ? opener : opener.querySelector?.("select");
    if (nativeSelect) {
      const opt = Array.from(nativeSelect.options || []).find((o) =>
        /سعر السوق|Market|سوق/i.test(`${o.textContent || ""} ${o.value || ""}`),
      );
      if (!opt) { debug("❌ select بدون خيار سعر السوق", "#ef4444"); return false; }
      const proto = Object.getPrototypeOf(nativeSelect);
      const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
      if (setter) setter.call(nativeSelect, opt.value); else nativeSelect.value = opt.value;
      nativeSelect.dispatchEvent(new Event("input", { bubbles: true }));
      nativeSelect.dispatchEvent(new Event("change", { bubbles: true }));
      return !!(await waitFor(() => orderTypeTriggerShowsMarket(), { timeout: 2500, interval: 120 }));
    }

    // Custom dropdown. Open once, then choose from the visible popup only.
    // If we cannot identify a clickable option, abort safely instead of
    // clicking the opener again and toggling it open/closed forever.
    const LABELS = ["سعر السوق", "Market order", "Market"];
    const EXCLUDE = /سعر\s*محدد|limit|(?:ال)?طلبات\s*(?:ال)?متقدمه|advanced|معلومات\s*(?:ال)?سوق|(?:ال)?مستوي\s*(?:ال)?ثاني|(?:ال)?مستوى\s*(?:ال)?ثاني|level\s*(?:2|ii)|market\s*depth|depth\s*of\s*market/i;
    const openerRect = opener.getBoundingClientRect();
    orderTypeAttemptLockedUntil = Date.now() + 60_000;
    const opened = await forceOpenDropdown(opener, () => findShortTextOption(LABELS, opener, EXCLUDE), "بفتح قائمة نوع الطلب");
    if (!opened) {
      debug("❌ قائمة نوع الطلب مفتحتش", "#ef4444");
      return false;
    }
    await humanDelay(180, 320);

    const option = await waitFor(() => findShortTextOption(LABELS, opener, EXCLUDE), { timeout: 2500, interval: 120 });
    debug("بختار سعر السوق", "#3b82f6");

    // Choose from the already-open popup using MAIN-world pointer + keyboard
    // semantics. Do not click the opener again under any failure mode.
    const mainSelected = await mainWorldSelectVisibleText(LABELS, openerRect, EXCLUDE.source);
    if (mainSelected) {
      const confirmed = await waitFor(() => orderTypeTriggerShowsMarket(), { timeout: 2600, interval: 120 });
      if (confirmed) { orderTypeAttemptLockedUntil = 0; await humanDelay(300, 600); return true; }
    }

    const optionList = findShortTextOptions(LABELS, opener, EXCLUDE).slice(0, 2);
    for (const opt of optionList.length ? optionList : (option ? [option] : [])) {
      if (!isVisible(opt)) continue;
      await preciseClick(opt);
      const confirmed = await waitFor(() => orderTypeTriggerShowsMarket(), { timeout: 1600, interval: 120 });
      if (confirmed) { orderTypeAttemptLockedUntil = 0; await humanDelay(300, 600); return true; }
      if (!findShortTextOption(LABELS, opener, EXCLUDE)) break;
    }

    debug("❌ نوع الطلب لسه مش سعر السوق", "#ef4444");
    try { document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); } catch {}
    return false;
  }

  // ---- SELL day-trade helpers (Phase 2-b) ----
  // Day-trade sells need: نوع الطلب = "الطلبات المتقدمة" AND التسوية = "T0".
  // Each helper aborts cleanly on failure BEFORE we ever touch the review
  // button, so the user can finish manually without partial state.

  function orderTypeTriggerShowsAdvanced() {
    const opener = findOrderTypeOpener();
    if (opener && isVisible(opener)) {
      // Ant Design fast path: the selected value lives in
      // .ant-select-selection-item (title attribute = ground-truth label).
      // selectedControlText() drills into the hidden search <input> and
      // misses this, so we read the item node directly first.
      const antItem = opener.querySelector?.(".ant-select-selection-item")
        || opener.closest?.(".ant-select")?.querySelector?.(".ant-select-selection-item");
      if (antItem) {
        const antText = normalizeArabicText(
          `${antItem.getAttribute("title") || ""} ${antItem.getAttribute("label") || ""} ${antItem.textContent || ""}`,
        );
        if (/(?:ال)?طلبات\s*(?:ال)?متقدمه|Advanced/i.test(antText)) return true;
      }
      const text = selectedControlText(opener);
      if (/(?:ال)?طلبات\s*(?:ال)?متقدمه|(?:ال)?طلبات\s*(?:ال)?متقدمة|Advanced/i.test(normalizeArabicText(text))) return true;
    }
    // Global Ant fallback: any visible selection-item showing Advanced.
    for (const item of Array.from(document.querySelectorAll(".ant-select-selection-item"))) {
      if (!isVisible(item)) continue;
      const t = normalizeArabicText(
        `${item.getAttribute("title") || ""} ${item.getAttribute("label") || ""} ${item.textContent || ""}`,
      );
      if (/(?:ال)?طلبات\s*(?:ال)?متقدمه|Advanced/i.test(t)) return true;
    }
    const labelEl = findSmallTextElement(["نوع الطلب", "Order type"]);
    const lr = labelEl?.getBoundingClientRect?.();
    return Array.from(document.querySelectorAll("button, [role='button'], [role='combobox'], input, div, span"))
      .some((el) => {
        if (!isVisible(el)) return false;
        const r = el.getBoundingClientRect();
        if (lr && Math.abs((r.top + r.bottom) / 2 - (lr.top + lr.bottom) / 2) > 70) return false;
        if (r.height < 20 || r.height > 90 || r.width < 40 || r.width > Math.min(540, window.innerWidth - 24)) return false;
        const text = selectedControlText(el);
        return orderTypeMenuOptionCount(cleanText(el)) <= 1 && /(?:ال)?طلبات\s*(?:ال)?متقدمه|(?:ال)?طلبات\s*(?:ال)?متقدمة|Advanced/i.test(normalizeArabicText(text));
      });
  }

  // Locate the "التسوية" / "Settlement" dropdown trigger using the same
  // label-anchored geometry the order-type opener uses.
  function findSettlementOpener() {
    // GROUND TRUTH (verified from live DOM):
    // The settlement Ant Select wrapper is identified by its inner
    // `.ant-select-selection-item[title]` whose title is one of the settlement
    // values: T0/T1/T2/T+0/T+1/T+2/اليوم/يوم. Pick that wrapper's selector.
    {
      const items = Array.from(document.querySelectorAll(".ant-select .ant-select-selection-item[title]"));
      const matches = items
        .map((it) => ({ it, wrap: it.closest(".ant-select"), title: it.getAttribute("title") || "" }))
        .filter(({ it, wrap, title }) =>
          wrap && !wrap.classList.contains("ant-select-disabled") && isVisible(it) &&
          (/^\s*T\s*[+\-]?\s*[0-9]\s*$/i.test(title) || /اليوم|^يوم$/i.test(title))
        );
      if (matches.length) {
        const sel = matches[0].wrap.querySelector(".ant-select-selector");
        if (sel && isVisible(sel)) return sel;
      }
    }
    const labelEl = findSmallTextElement(["التسوية", "تسوية", "Settlement", "Settlement type"]);
    if (!labelEl) return null;
    // FAST PATH: Ant Design Select trigger sits next to the label.
    // Walk up a few ancestors and pick the closest visible .ant-select-selector.
    {
      let node = labelEl;
      for (let d = 0; node && d < 6; d++, node = node.parentElement) {
        const sel = node.querySelector?.(".ant-select:not(.ant-select-disabled) .ant-select-selector");
        if (sel && isVisible(sel)) return sel;
      }
    }
    const lr = labelEl.getBoundingClientRect();
    let scope = labelEl.parentElement;
    for (let depth = 0; scope && depth < 7; depth++, scope = scope.parentElement) {
      const sr = scope.getBoundingClientRect();
      if (sr.width < 140 || sr.height > 360) continue;
      const candidates = Array.from(scope.querySelectorAll("button, [role='button'], [role='combobox'], select, input, div, span"))
        .filter((el) => el !== labelEl && !el.contains(labelEl) && !labelEl.contains(el))
        .map((el) => ({ el, control: selectedControlFor(el), r: el.getBoundingClientRect(), text: selectedControlText(el), allText: cleanText(el) }))
        .filter(({ el, r, text }) => {
          if (!isVisible(el)) return false;
          if (r.height < 26 || r.height > 82 || r.width < 54 || r.width > Math.min(520, window.innerWidth - 24)) return false;
          if (Math.abs((r.top + r.bottom) / 2 - (lr.top + lr.bottom) / 2) > 55) return false;
          if (/التسوية|Settlement/i.test(text)) return false;
          return !text || text.length <= 80 || /اختار|اختر|Select|Choose/i.test(text) || settlementTextHasT0(text) || settlementTextHasNonT0(text);
        })
        .sort((a, b) => {
          const aWanted = settlementTextHasT0(a.text) || /اختار|اختر|Select|Choose/i.test(a.text) ? 0 : 20;
          const bWanted = settlementTextHasT0(b.text) || /اختار|اختر|Select|Choose/i.test(b.text) ? 0 : 20;
          const aTokens = settlementTokenCount(a.text);
          const bTokens = settlementTokenCount(b.text);
          const aMenuPenalty = Math.max(0, settlementMenuOptionCount(a.allText) - 1) * 35;
          const bMenuPenalty = Math.max(0, settlementMenuOptionCount(b.allText) - 1) * 35;
          return (aWanted + aTokens * 6 + aMenuPenalty) - (bWanted + bTokens * 6 + bMenuPenalty);
        });
      if (candidates[0]) return clickableSurface(candidates[0].control || candidates[0].el);
    }
    return null;
  }

  function currentSettlementDigit() {
    const opener = findSettlementOpener();
    if (!opener || !isVisible(opener)) return null;
    const text = selectedControlText(opener);
    if (settlementValueLooksT0(`${opener.getAttribute?.("data-value") || ""} ${opener.getAttribute?.("value") || ""}`)) return 0;
    return firstSettlementDigit(text);
  }

  function settlementTriggerShowsT0() {
    const opener = findSettlementOpener();
    if (opener && isVisible(opener)) {
      const antItem = opener.querySelector?.(".ant-select-selection-item")
        || opener.closest?.(".ant-select")?.querySelector?.(".ant-select-selection-item");
      if (antItem) {
        const antText = `${antItem.getAttribute("title") || ""} ${antItem.getAttribute("label") || ""} ${antItem.textContent || ""}`;
        if (settlementTextLooksT0(antText)) return true;
      }
      const text = selectedControlText(opener);
      if (settlementTextLooksT0(text) || settlementValueLooksT0(`${opener.getAttribute?.("data-value") || ""} ${opener.getAttribute?.("value") || ""}`)) return true;
    }
    const labelEl = findSmallTextElement(["التسوية", "تسوية", "Settlement", "Settlement type"]);
    const lr = labelEl?.getBoundingClientRect?.();
    return Array.from(document.querySelectorAll("button, [role='button'], [role='combobox'], input, div, span"))
      .some((el) => {
        if (!isVisible(el)) return false;
        const r = el.getBoundingClientRect();
        if (lr && Math.abs((r.top + r.bottom) / 2 - (lr.top + lr.bottom) / 2) > 70) return false;
        if (r.height < 20 || r.height > 90 || r.width < 40 || r.width > Math.min(540, window.innerWidth - 24)) return false;
        return settlementMenuOptionCount(cleanText(el)) <= 1 && (settlementTextLooksT0(selectedControlText(el)) || settlementValueLooksT0(`${el.getAttribute?.("data-value") || ""} ${el.getAttribute?.("value") || ""}`));
      });
  }

  function settlementT0OptionScore(el, opener, openerRect) {
    if (!el || !isVisible(el) || isDisabled(el)) return Infinity;
    if (opener && (el === opener || opener.contains(el) || el.contains(opener))) return Infinity;
    const style = getComputedStyle(el);
    if (Number(style.opacity || "1") < 0.08 || style.pointerEvents === "none") return Infinity;
    const r = el.getBoundingClientRect();
    if (r.height < 14 || r.height > 220 || r.width < 28 || r.width > Math.min(900, window.innerWidth - 12)) return Infinity;
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    if (cx < 0 || cy < 0 || cx > window.innerWidth || cy > window.innerHeight) return Infinity;
    const hit = document.elementFromPoint(cx, cy);
    if (!hit || !(el === hit || el.contains(hit) || hit.contains(el))) return Infinity;
    const text = cleanText(el);
    if (!settlementTextLooksT0(text) && !settlementValueLooksT0(`${el.getAttribute?.("data-value") || ""} ${el.getAttribute?.("value") || ""}`)) return Infinity;
    const semantic = el.matches?.("[role='option'], [role='menuitem'], [role='menuitemradio'], li, [data-value]") ? 0 : 18;
    const exact = /^t\s*(?:[+\-]\s*)?0$/i.test(normalizeSettlementText(text)) ? 0 : 20;
    const near = openerRect ? Math.max(0, r.top - openerRect.bottom) / 3 + Math.abs(cx - (openerRect.left + openerRect.width / 2)) / 12 : 35;
    return semantic + exact + near + Math.max(0, r.height - 58) + Math.max(0, r.width - 320) / 12;
  }

  function findSettlementT0Options(opener) {
    const openerRect = opener?.getBoundingClientRect?.();
    // GROUND TRUTH: scope to THIS select's listbox via aria-controls on the
    // hidden combobox input (id="rc_select_2_list" → matching listbox/dropdown).
    let listbox = null;
    try {
      const wrap = opener?.closest?.(".ant-select");
      const input = wrap?.querySelector?.("input[aria-controls]");
      const listId = input?.getAttribute?.("aria-controls");
      if (listId) listbox = document.getElementById(listId)?.closest?.(".ant-select-dropdown") || document.getElementById(listId);
    } catch {}
    const scope = listbox || document;
    let antOptions = Array.from(scope.querySelectorAll(
      ".ant-select-item-option"
    )).filter((el) => {
      if (!isVisible(el) || isDisabled(el)) return false;
      const lab = `${el.getAttribute("label") || ""} ${el.getAttribute("title") || ""} ${el.textContent || ""}`;
      return /^\s*T\s*[+\-]?\s*0\s*$/i.test(lab.trim()) || /اليوم/.test(lab);
    });
    if (antOptions.length) return antOptions;
    const selectors = "[role='option'], [role='menuitem'], [role='menuitemradio'], [role='listbox'] *, [data-radix-popper-content-wrapper] *, li[tabindex], li[role], [data-value], li, button, [role='button'], div, span, p";
    const seen = new Set();
    const options = [];
    for (const raw of Array.from(document.querySelectorAll(selectors))) {
      const candidates = [
        raw.closest?.("[role='option'], [role='menuitem'], [role='menuitemradio'], li[tabindex], li[role], [data-value], li, button"),
        raw,
      ];
      for (const el of candidates) {
        if (!el || seen.has(el)) continue;
        seen.add(el);
        const score = settlementT0OptionScore(el, opener, openerRect);
        if (score < Infinity) options.push({ el, score });
      }
    }
    return options.sort((a, b) => a.score - b.score).map((item) => item.el);
  }

  async function ensureOrderTypeAdvanced() {
    if (orderTypeTriggerShowsAdvanced()) return true;
    if (Date.now() < orderTypeAttemptLockedUntil) {
      debug("⏸ توقفت بأمان: نوع الطلب 'الطلبات المتقدمة' محتاج اختيار يدوي", "#ef4444");
      return false;
    }
    const opener = findOrderTypeOpener();
    if (!opener) { debug("❌ مش لاقي قائمة نوع الطلب", "#ef4444"); return false; }
    debug("بفتح قائمة نوع الطلب (لاختيار 'الطلبات المتقدمة')", "#3b82f6");

    const LABELS = ["الطلبات المتقدمة", "الطلبات المتقدمه", "طلبات متقدمة", "طلبات متقدمه", "Advanced"];
    // Allow "advanced/الطلبات المتقدمة" but exclude market/limit single-leg entries.
    const EXCLUDE = /سعر\s*السوق|^market$|سعر\s*محدد|^limit$/i;

    // FAST PATH: Ant Design options carry the label as an HTML attribute
    // (label="الطلبات المتقدمة"). Mirror the settlement T0 fast path so we
    // do not depend on visible text shape when ground-truth attributes exist.
    const findAntAdvancedOption = () => {
      const nodes = Array.from(document.querySelectorAll(
        ".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option"
      ));
      return nodes.find((el) => {
        if (!isVisible(el) || isDisabled(el)) return false;
        const label = normalizeArabicText(
          `${el.getAttribute("label") || ""} ${el.getAttribute("title") || ""} ${el.innerText || ""}`,
        ).toLowerCase();
        if (!label) return false;
        if (EXCLUDE.test(label)) return false;
        return LABELS.some((l) => label.includes(normalizeArabicText(l).toLowerCase()));
      }) || null;
    };

    const nativeSelect = opener.tagName === "SELECT" ? opener : opener.querySelector?.("select");
    if (nativeSelect) {
      const opt = Array.from(nativeSelect.options || []).find((o) =>
        /(?:ال)?طلبات\s*(?:ال)?متقدمه|(?:ال)?طلبات\s*(?:ال)?متقدمة|Advanced/i.test(normalizeArabicText(`${o.textContent || ""} ${o.value || ""}`)),
      );
      if (!opt) { debug("❌ select بدون خيار الطلبات المتقدمة", "#ef4444"); return false; }
      const proto = Object.getPrototypeOf(nativeSelect);
      const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
      if (setter) setter.call(nativeSelect, opt.value); else nativeSelect.value = opt.value;
      nativeSelect.dispatchEvent(new Event("input", { bubbles: true }));
      nativeSelect.dispatchEvent(new Event("change", { bubbles: true }));
      return !!(await waitFor(orderTypeTriggerShowsAdvanced, { timeout: 2500, interval: 120 }));
    }

    const openerRect = opener.getBoundingClientRect();
    orderTypeAttemptLockedUntil = Date.now() + 60_000;
    const opened = await forceOpenDropdown(
      opener,
      () => findAntAdvancedOption() || findShortTextOption(LABELS, opener, EXCLUDE),
      "بفتح قائمة نوع الطلب",
    );
    if (!opened) {
      debug("❌ قائمة نوع الطلب مفتحتش — مش هقدر أوصل للطلبات المتقدمة", "#ef4444");
      return false;
    }
    await humanDelay(180, 320);
    const confirmAdvanced = async (timeout = 2600) => {
      const ok = await waitFor(orderTypeTriggerShowsAdvanced, { timeout, interval: 120 });
      if (ok) {
        orderTypeAttemptLockedUntil = 0;
        await humanDelay(300, 600);
        return true;
      }
      return false;
    };

    const fastAnt = findAntAdvancedOption();
    if (fastAnt) {
      await preciseClick(fastAnt);
      if (await confirmAdvanced(2600)) return true;
    }

    const mainSelected = await mainWorldSelectVisibleText(LABELS, openerRect, EXCLUDE.source);
    if (mainSelected && await confirmAdvanced(3200)) return true;
    if (orderTypeTriggerShowsAdvanced()) { orderTypeAttemptLockedUntil = 0; await humanDelay(300, 600); return true; }

    for (const opt of findShortTextOptions(LABELS, opener, EXCLUDE).slice(0, 2)) {
      if (!isVisible(opt)) continue;
      await preciseClick(opt);
      if (await confirmAdvanced(2200)) return true;
    }
    if (orderTypeTriggerShowsAdvanced()) { orderTypeAttemptLockedUntil = 0; await humanDelay(300, 600); return true; }
    debug("❌ مش قادر أختار 'الطلبات المتقدمة'", "#ef4444");
    try { document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); } catch {}
    return false;
  }

  async function ensureSettlementT0() {
    if (settlementTriggerShowsT0()) return true;
    if (Date.now() < settlementAttemptLockedUntil) {
      debug("⏸ توقفت بأمان: التسوية T0 محتاجة اختيار يدوي", "#ef4444");
      return false;
    }
    const opener = await waitFor(() => findSettlementOpener(), { timeout: 2500, interval: 150 });
    if (!opener) { debug("❌ مش لاقي قائمة التسوية", "#ef4444"); return false; }
    debug("بفتح قائمة التسوية لاختيار T0", "#3b82f6");

    const nativeSelect = opener.tagName === "SELECT" ? opener : opener.querySelector?.("select");
    if (nativeSelect) {
      const opt = Array.from(nativeSelect.options || []).find((o) => settlementTextLooksT0(`${o.textContent || ""} ${o.value || ""}`) || settlementValueLooksT0(o.value || ""));
      if (!opt) { debug("❌ select بدون خيار T0", "#ef4444"); return false; }
      const proto = Object.getPrototypeOf(nativeSelect);
      const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
      if (setter) setter.call(nativeSelect, opt.value); else nativeSelect.value = opt.value;
      nativeSelect.dispatchEvent(new Event("input", { bubbles: true }));
      nativeSelect.dispatchEvent(new Event("change", { bubbles: true }));
      return !!(await waitFor(settlementTriggerShowsT0, { timeout: 2500, interval: 120 }));
    }

    const beforeDigit = currentSettlementDigit();
    const openerRect = opener.getBoundingClientRect();
    settlementAttemptLockedUntil = Date.now() + 60_000;
    // Accept either a T0 option OR any visible Ant Design dropdown panel as
    // proof the menu opened. Some builds label the option "T+0" / "اليوم"
    // instead of exactly "T0", which made the strict finder time out even
    // though the panel was actually visible on screen.
    const dropdownOpenSignal = () => {
      const t0 = findSettlementT0Options(opener)[0];
      if (t0) return t0;
      // GROUND TRUTH: open state = wrapper has `ant-select-open` class AND
      // its specific listbox (matched by aria-controls id) is visible.
      const wrap = opener?.closest?.(".ant-select");
      if (wrap?.classList.contains("ant-select-open")) return wrap;
      const input = wrap?.querySelector?.("input[aria-controls]");
      const listId = input?.getAttribute?.("aria-controls");
      if (listId) {
        const lb = document.getElementById(listId);
        const panel = lb?.closest?.(".ant-select-dropdown") || lb;
        if (panel && isVisible(panel) && !panel.classList?.contains("ant-select-dropdown-hidden")) return panel;
      }
      return null;
    };
    const opened = await forceOpenDropdown(opener, dropdownOpenSignal, "بفتح قائمة التسوية");
    if (!opened) {
      debug("❌ قائمة التسوية مفتحتش — مش هقدر أختار T0", "#ef4444");
      return false;
    }
    await humanDelay(180, 320);

    const confirmT0 = async (timeout = 2600) => {
      const ok = await waitFor(settlementTriggerShowsT0, { timeout, interval: 120 });
      if (ok) {
        settlementAttemptLockedUntil = 0;
        await humanDelay(300, 600);
        return true;
      }
      return false;
    };

    // PREFER DIRECT CLICK on the T0 option (we now scope to the correct listbox
    // via aria-controls). Keyboard arithmetic from T2 (ArrowUp = T1) was picking
    // the wrong row, so try DOM click first.
    {
      const directT0 = await waitFor(() => findSettlementT0Options(opener)[0], { timeout: 1500, interval: 100 });
      if (directT0) {
        await preciseClick(directT0);
        if (await confirmT0(2200)) return true;
        // second try via main-world click
        const mainSelected = await mainWorldSelectSettlementT0(openerRect);
        if (mainSelected && await confirmT0(2200)) return true;
      }
    }

    if (beforeDigit === 2 || beforeDigit === 1) {
      const keyboardPlans = [["Home", "Enter"], ["ArrowUp", "Enter"], ["ArrowUp", "ArrowUp", "Enter"], ["0", "Enter"]];
      for (let attempt = 0; attempt < keyboardPlans.length; attempt++) {
        debug(`بختار T0 بلوحة المفاتيح — محاولة ${attempt + 1}/${keyboardPlans.length}`, "#3b82f6");
        await mainWorldKeyboardSelectSettlementT0(openerRect, keyboardPlans[attempt]);
        if (await confirmT0(1400)) return true;
        if (attempt < keyboardPlans.length - 1) {
          await preciseClick(opener);
          await humanDelay(180, 320);
        }
      }
    }

    const firstOption = await waitFor(() => findSettlementT0Options(opener)[0], { timeout: 5000, interval: 120 });
    const mainSelected = await mainWorldSelectSettlementT0(openerRect);
    if (mainSelected && await confirmT0(3200)) return true;
    if (settlementTriggerShowsT0()) { settlementAttemptLockedUntil = 0; await humanDelay(300, 600); return true; }
    for (const opt of (findSettlementT0Options(opener).length ? findSettlementT0Options(opener) : (firstOption ? [firstOption] : [])).slice(0, 3)) {
      if (!isVisible(opt)) continue;
      await preciseClick(opt);
      if (await confirmT0(2200)) return true;
    }
    if (settlementTriggerShowsT0()) { settlementAttemptLockedUntil = 0; await humanDelay(300, 600); return true; }
    debug("❌ مش قادر أختار T0", "#ef4444");
    try { document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); } catch {}
    return false;
  }

  // ---- Limit-price field (السعر المحدد) — fill helper for sell flow ----
  // Advanced/T0 sell forms require a limit price. Anchor on the exact label so
  // we do not accidentally type the price into the shares/quantity input.
  function textLooksLimitPriceLabel(text) {
    const t = normalizeArabicText(text).toLowerCase();
    return /(?:^|\s)(?:ال)?سعر\s+(?:ال)?محدد(?:\s|$)/i.test(t) || /limit\s*price/i.test(t);
  }

  function textLooksQuantityLabel(text) {
    const t = normalizeArabicText(text).toLowerCase();
    return /عدد\s*(?:ال)?(?:اسهم|سهم)|كمية|qty|quantity|shares/i.test(t);
  }

  function inputLooksQuantity(input) {
    const own = normalizeArabicText(`${input?.type || ""} ${input?.inputMode || ""} ${input?.name || ""} ${input?.id || ""} ${input?.placeholder || ""} ${input?.getAttribute?.("aria-label") || ""} ${input?.getAttribute?.("title") || ""} ${input?.getAttribute?.("data-testid") || ""}`).toLowerCase();
    if (textLooksQuantityLabel(own)) return true;
    const id = input?.id;
    if (id) {
      const safeId = window.CSS?.escape ? CSS.escape(id) : String(id).replace(/"/g, '\\"');
      const label = document.querySelector(`label[for="${safeId}"]`);
      if (label && textLooksQuantityLabel(cleanText(label))) return true;
    }
    let cur = input?.parentElement;
    for (let depth = 0; cur && depth < 3; depth++, cur = cur.parentElement) {
      const r = cur.getBoundingClientRect();
      const text = cleanText(cur);
      if (r.height <= 96 && textLooksQuantityLabel(text) && !textLooksLimitPriceLabel(text)) return true;
    }
    return false;
  }

  function inputLooksLimitPrice(input) {
    if (!input || input.disabled || input.readOnly || !isVisible(input)) return false;
    if (input.closest?.("[role='combobox']")) return false;
    const type = String(input.type || "").toLowerCase();
    if (/^(hidden|checkbox|radio|button|submit|reset|file|search)$/.test(type)) return false;
    const r = input.getBoundingClientRect();
    if (r.width < 35 || r.height < 18 || r.height > 92) return false;
    const own = normalizeArabicText(`${input.type || ""} ${input.inputMode || ""} ${input.name || ""} ${input.id || ""} ${input.placeholder || ""} ${input.getAttribute("aria-label") || ""} ${input.getAttribute("title") || ""} ${input.getAttribute("data-testid") || ""}`).toLowerCase();
    if (/كمية|عدد|qty|quantity|shares|اسهم|اسهم|نقدي|مبلغ|amount|cash/i.test(own)) return false;
    let ctx = own;
    let cur = input.parentElement;
    for (let depth = 0; cur && depth < 5; depth++, cur = cur.parentElement) {
      const cr = cur.getBoundingClientRect();
      if (cr.height <= 260 && cr.width <= Math.min(720, window.innerWidth - 12)) ctx += " " + normalizeArabicText(cleanText(cur)).toLowerCase();
    }
    return textLooksLimitPriceLabel(ctx) && !/الحد\s*الاقص|maximum|max|كمية|عدد\s*(?:ال)?اسهم|qty|quantity|shares/i.test(ctx);
  }

  function sameElement(a, b) {
    return !!a && !!b && (a === b || a.contains?.(b) || b.contains?.(a));
  }

  function findLimitPriceLabels() {
    return Array.from(document.querySelectorAll("body *"))
      .filter((el) => {
        if (!isVisible(el)) return false;
        const text = cleanText(el);
        if (!text || text.length > 90) return false;
        if (!textLooksLimitPriceLabel(text)) return false;
        const r = el.getBoundingClientRect();
        return r.width > 10 && r.height > 8 && r.width < Math.min(360, window.innerWidth - 12) && r.height < 90;
      })
      .sort((a, b) => {
        const ar = a.getBoundingClientRect();
        const br = b.getBoundingClientRect();
        return (ar.width * ar.height) - (br.width * br.height);
      });
  }

  function scoreLimitPriceInput(input, labelRect) {
    if (!input || input.disabled || input.readOnly || !isVisible(input)) return Infinity;
    if (sameElement(input, findQuantityInput()) || inputLooksQuantity(input)) return Infinity;
    if (input.closest?.("[role='combobox']")) return Infinity;
    const type = String(input.type || "").toLowerCase();
    if (/^(hidden|checkbox|radio|button|submit|reset|file|search)$/.test(type)) return Infinity;
    const r = input.getBoundingClientRect();
    if (r.width < 35 || r.height < 18 || r.height > 92) return Infinity;
    const own = normalizeArabicText(`${input.type || ""} ${input.inputMode || ""} ${input.name || ""} ${input.id || ""} ${input.placeholder || ""} ${input.getAttribute("aria-label") || ""} ${input.getAttribute("title") || ""} ${input.getAttribute("data-testid") || ""}`).toLowerCase();
    if (/كمية|عدد|qty|quantity|shares|اسهم|اسهم/i.test(own)) return Infinity;
    const ctx = inputModeContext(input);
    if (textLooksQuantityLabel(ctx)) return Infinity;
    const cy = (r.top + r.bottom) / 2;
    const ly = (labelRect.top + labelRect.bottom) / 2;
    const vertical = Math.abs(cy - ly);
    if (vertical > 120) return Infinity;
    const horizontal = Math.abs((r.left + r.right) / 2 - (labelRect.left + labelRect.right) / 2);
    const belowPenalty = r.top >= labelRect.bottom - 8 ? 0 : 24;
    const typeBonus = /decimal|numeric|number/i.test(`${input.inputMode || ""} ${input.type || ""}`) ? -8 : 0;
    return vertical + horizontal / 12 + belowPenalty + typeBonus;
  }

  function findLimitPriceInput() {
    const qtyInput = findQuantityInput();
    const labels = findLimitPriceLabels();
    for (const labelEl of labels) {
      const lr = labelEl.getBoundingClientRect();
      let scope = labelEl.parentElement;
      for (let depth = 0; scope && depth < 9; depth++, scope = scope.parentElement) {
        const sr = scope.getBoundingClientRect();
        if (sr.width < 120 || sr.height > Math.max(760, window.innerHeight * 0.9)) continue;
        const inputs = Array.from(scope.querySelectorAll("input:not([type='hidden']), textarea"))
          .filter((el) => !sameElement(el, qtyInput))
          .map((el) => ({ el, score: scoreLimitPriceInput(el, lr) }))
          .filter((item) => item.score < Infinity)
          .sort((a, b) => a.score - b.score);
        if (inputs[0]) return inputs[0].el;
      }
    }

    // Fallback for builds where the label is rendered as a placeholder/aria-label
    // instead of a separate text node.
    return Array.from(document.querySelectorAll("input:not([type='hidden']), textarea"))
      .filter((el) => !sameElement(el, qtyInput))
      .find((el) => inputLooksLimitPrice(el)) || null;
  }

  function isConfirmedLimitPriceInput(input) {
    if (!input || !isVisible(input) || input.disabled || input.readOnly) return false;
    if (sameElement(input, findQuantityInput())) return false;
    if (inputLooksQuantity(input) || inputLooksCash(input)) return false;
    const r = input.getBoundingClientRect();
    const labels = findLimitPriceLabels();
    return labels.some((labelEl) => {
      const lr = labelEl.getBoundingClientRect();
      const vertical = Math.abs(((r.top + r.bottom) / 2) - ((lr.top + lr.bottom) / 2));
      const horizontal = Math.abs(((r.left + r.right) / 2) - ((lr.left + lr.right) / 2));
      return vertical <= 95 && horizontal <= Math.max(260, lr.width + r.width + 60);
    }) || inputLooksLimitPrice(input);
  }

  function readInputNumber(input) {
    return Number(String(input?.value || input?.getAttribute?.("value") || "").replace(/[^\d.]/g, "")) || 0;
  }

  // Scrape user's average buy price ("متوسط") from the "موقعك" position card.
  // Thunder renders it as a label "متوسط ..." next to a numeric value (e.g. 39.36).
  // Returns 0 if not found — caller must fall back to market-based break-even only.
  function scrapeAvgCostFromPage() {
    try {
      const labels = Array.from(document.querySelectorAll("p, span, div, h6, h5"))
        .filter((el) => {
          const t = (el.textContent || "").trim();
          return /^متوسط/.test(t) && t.length < 30;
        });
      for (const lbl of labels) {
        // Look at siblings + parent's children for a number node.
        const candidates = [];
        if (lbl.parentElement) candidates.push(...lbl.parentElement.children);
        if (lbl.nextElementSibling) candidates.push(lbl.nextElementSibling);
        for (const c of candidates) {
          if (c === lbl) continue;
          const txt = (c.textContent || "").trim();
          const m = txt.match(/^([0-9]+(?:\.[0-9]+)?)$/);
          if (m) {
            const n = Number(m[1]);
            if (n > 0 && n < 100000) return n;
          }
        }
      }
    } catch {}
    return 0;
  }

  // v4.1.35: read live "last traded price" from the stock card.
  // Thunder renders "سعر اخر تداول" label with a numeric sibling.
  function scrapeLastPriceFromPage() {
    // 🧪 Debug simulator override (Phase 1 trailing test on real Thunder
    // while market is closed). Active ONLY when both flags are set AND
    // the expiry hasn't passed. Trailing never clicks Review/Confirm,
    // so this cannot place an order — it only rewrites the price input
    // so you can visually verify the trailing logic works end-to-end.
    try {
      if (debugPriceOverride.price > 0 && Date.now() < debugPriceOverride.until) {
        return debugPriceOverride.price;
      }
      if (debugPriceOverride.until && Date.now() >= debugPriceOverride.until) {
        debugPriceOverride = { price: 0, until: 0 };
      }
      const dbg = Number(window.__thunder_debug_price);
      const until = Number(window.__thunder_debug_price_until) || 0;
      if (Number.isFinite(dbg) && dbg > 0 && Date.now() < until) {
        return dbg;
      }
      if (until && Date.now() >= until) {
        try { delete window.__thunder_debug_price; } catch {}
        try { delete window.__thunder_debug_price_until; } catch {}
      }
    } catch {}
    try {
      const labels = Array.from(document.querySelectorAll("p, span, div, h6, h5"))
        .filter((el) => {
          const t = (el.textContent || "").trim();
          return /^سعر\s*(آخر|اخر)\s*تداول/.test(t) && t.length < 40;
        });
      for (const lbl of labels) {
        const candidates = [];
        if (lbl.parentElement) candidates.push(...lbl.parentElement.children);
        let next = lbl.nextElementSibling;
        while (next) { candidates.push(next); next = next.nextElementSibling; }
        for (const c of candidates) {
          if (c === lbl) continue;
          const txt = (c.textContent || "").trim();
          const m = txt.match(/([0-9]+(?:\.[0-9]+)?)/);
          if (m) {
            const n = Number(m[1]);
            if (n > 0 && n < 100000) return n;
          }
        }
      }
    } catch {}
    return 0;
  }

  // v4.1.35 — Phase 1 trailing limit price.
  // SAFETY: this ONLY rewrites the limit-price input field.
  // It NEVER clicks Review/Confirm. User stays in full control.
  // Guards:
  //   - Never writes below `floor` (your guaranteed-profit price).
  //   - Stops if the input is detached/hidden (modal closed).
  //   - Stops if user is actively typing in the input.
  //   - Caps edits at 30/minute (anti-spam).
  //   - Auto-stops after 15 minutes.
  //   - Stops on a sudden >3% drop from peak (suspicious spike protection).
  let __trailHandle = null;
  // v4.1.36 — persistent on-page badge so user always sees that trailing is active
  // (the normal debug() banner gets overwritten by later messages).
  function ensureTrailBadge() {
    let el = document.getElementById("__thunder_trail_badge");
    if (el) return el;
    el = document.createElement("div");
    el.id = "__thunder_trail_badge";
    el.style.cssText = [
      "position:fixed","top:12px","left:12px","z-index:2147483647",
      "background:#8b5cf6","color:#fff","font:600 13px/1.4 system-ui,sans-serif",
      "padding:8px 12px","border-radius:8px","box-shadow:0 4px 16px rgba(0,0,0,.35)",
      "direction:rtl","max-width:360px","pointer-events:none",
    ].join(";");
    document.documentElement.appendChild(el);
    return el;
  }
  function setTrailBadge(text) {
    try { ensureTrailBadge().textContent = text; } catch {}
  }
  function removeTrailBadge() {
    try { document.getElementById("__thunder_trail_badge")?.remove(); } catch {}
  }
  function stopTrailingPriceUpdater(reason) {
    if (__trailHandle) {
      try { clearInterval(__trailHandle.id); } catch {}
      debug(`⏹️ تتبع لحظي توقف${reason ? " — " + reason : ""} (peak=${(__trailHandle.peak||0).toFixed(2)}, تعديلات=${__trailHandle.edits})`, "#6b7280");
      __trailHandle = null;
      removeTrailBadge();
    }
  }
  // v4.1.69 — ARM 0.6% / TRAIL 0.2% / MAX 10min
  //   Validated on 82 real trades × 14 days (Trade-Through + slippage 0.15%):
  //   net ~384-593 EGP/day @ 10k EGP/trade, 100% exit rate, worst day -363 EGP.
  //   • Before peak reaches armBase*(1+armPct): hold at safety floor.
  //   • After arm: target = MAX(floor, peak*(1-trailPct)).
  function startTrailingPriceUpdater({
    input,
    floor,
    armBase = 0,
    armPct = 0.006,
    trailPct = 0.002,
    intervalMs = 1500,
    maxMinutes = 10,
  }) {
    stopTrailingPriceUpdater();
    if (!input || !(floor > 0)) return;
    const start = Date.now();
    let peak = 0;
    let edits = 0;
    let lastWritten = readInputNumber(input);
    let editsThisMinute = 0;
    let minuteStart = Date.now();
    let userEditingUntil = 0;
    const markUserEditing = (ev) => {
      if (ev?.isTrusted) userEditingUntil = Date.now() + 8000;
    };
    try {
      ["keydown", "beforeinput", "paste", "pointerdown", "mousedown", "touchstart"].forEach((type) => {
        input.addEventListener(type, markUserEditing, true);
      });
    } catch {}
    const armTrigger = armBase > 0 ? armBase * (1 + armPct) : 0;
    debug(
      `🎯 تتبع لحظي فعّال — حد أدنى ${floor.toFixed(2)} ج، ARM=${(armPct*100).toFixed(2)}%${armTrigger ? ` (≥${armTrigger.toFixed(2)})` : ""} ثم TRAIL=${(trailPct*100).toFixed(2)}% خلف القمة`,
      "#8b5cf6",
    );
    setTrailBadge(`🎯 تتبع لحظي — floor ${floor.toFixed(2)} | ARM ${(armPct*100).toFixed(2)}% | TRAIL ${(trailPct*100).toFixed(2)}%`);
    const handle = { id: 0, peak: 0, edits: 0 };
    handle.id = setInterval(async () => {
      try {
        if (!input.isConnected || !isVisible(input)) { stopTrailingPriceUpdater("الخانة اختفت"); return; }
        if (Date.now() - start > maxMinutes * 60_000) { stopTrailingPriceUpdater("انتهت المدة"); return; }
        if (document.activeElement === input && Date.now() < userEditingUntil) return; // real user editing — back off
        const live = scrapeLastPriceFromPage();
        if (!(live > 0)) return;
        if (live > peak) peak = live;
        handle.peak = peak;
        // Sudden crash protection
        if (peak > 0 && live < peak * 0.97 && (peak - live) > 0.5) {
          stopTrailingPriceUpdater(`هبوط حاد ${peak.toFixed(2)}→${live.toFixed(2)}`);
          return;
        }
        // ARM-then-TRAIL logic (v4.1.51):
        // Until peak crosses armTrigger, sit at the safety floor only.
        // Once armed, trail at trailPct behind the peak.
        const armed = armTrigger > 0 ? peak >= armTrigger : true;
        const trailed = armed ? peak * (1 - trailPct) : 0;
        const target = Math.max(floor, trailed);
        const rounded = Math.ceil(target * 100) / 100;
        if (Math.abs(rounded - lastWritten) < 0.01) return;
        if (Date.now() - minuteStart > 60_000) { minuteStart = Date.now(); editsThisMinute = 0; }
        if (editsThisMinute >= 30) return;
        const ok = await humanTypeExact(input, rounded.toFixed(2));
        if (ok) {
          lastWritten = rounded;
          edits++; handle.edits = edits;
          editsThisMinute++;
          userEditingUntil = 0;
          const mode = armed ? `TRAIL@${(trailPct*100).toFixed(2)}%` : `FLOOR (peak<${armTrigger.toFixed(2)})`;
          debug(`📈 ${mode}: live=${live.toFixed(2)} peak=${peak.toFixed(2)} → سعر=${rounded.toFixed(2)}`, "#8b5cf6");
          setTrailBadge(`🎯 ${mode} — live=${live.toFixed(2)} / peak=${peak.toFixed(2)} / سعر=${rounded.toFixed(2)} (تعديلات=${edits})`);
        }
      } catch (e) { /* swallow */ }
    }, intervalMs);
    __trailHandle = handle;
  }

  // Safe limit-price flow (v4.1.24):
  //  - Thunder only auto-suggests the limit price AFTER the user clicks
  //    inside the price input (post-Max). So we click the input first,
  //    wait for the auto-suggestion to land, then compare it to our
  //    break-even safety floor and overwrite only if the suggestion would
  //    sell at a loss.
  //  - Break-even formulas:
  //      • Market entry (raw price): entry * 1.0006 + 6/qty   (buy+sell fees)
  //      • Avg cost (already includes buy-side fees per Thunder's "موقفك"):
  //        avgCost * 1.0003 + 3/qty   (sell-side fees only)
  //    target = breakEven * 1.005  (+0.5% profit buffer)
  //  - v4.1.34: stopped double-counting buy fees on avgCost (was 1.0006+6/Q).
  //    Confirmed: Thunder's "متوسط سعر الوحدة" already bakes in the rosoom
  //    paid at purchase (~0.66% above execution price).
  //  - If entry or qty is unknown we DO NOT touch the field — Thunder's
  //    suggestion stays as-is and the user can adjust manually.
  async function ensureSafeLimitPrice({ refPrice, qty, uuid }) {
    stopTrailingPriceUpdater("بدء عملية جديدة");
    const input = await waitFor(() => findLimitPriceInput(), { timeout: 3000, interval: 150 });
    if (!input || !isConfirmedLimitPriceInput(input)) {
      debug("⚠️ مش لاقي خانة 'السعر المحدد' — راجع يدوياً", "#f59e0b");
      return false;
    }
    // Step 1: focus the input so Thunder fills its suggested price.
    try { await preciseClick(input); } catch {}
    try { input.focus(); } catch {}
    // Step 2: wait up to 1.5s for Thunder's auto-suggestion.
    let suggested = 0;
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 100));
      suggested = readInputNumber(input);
      if (suggested > 0) break;
    }
    let entry = Number(refPrice) || 0;
    const q = Number(qty) || 0;
    const avgCost = scrapeAvgCostFromPage();
    // v4.1.31: auto-sell after buy passes refPrice=0. Fall back to avg-cost
    // (user's actual buy price) or Thunder's own suggestion so we still
    // write a safe price instead of leaving the field empty.
    if (!(entry > 0)) entry = avgCost > 0 ? avgCost : suggested;
    if (!(entry > 0) || !(q > 0)) {
      debug(`⚠️ معرفش entry/qty/تكلفة — سيبت سعر ثاندر (${suggested || "فاضي"})`, "#f59e0b");
      return suggested > 0;
    }
    // entry comes from market refPrice OR avgCost fallback. If entry===avgCost
    // it already includes buy fees, so use sell-only formula.
    const entryIsCost = avgCost > 0 && Math.abs(entry - avgCost) < 0.001;
    const beMarket = entryIsCost
      ? entry * 1.0003 + 3 / q
      : entry * 1.0006 + 6 / q;
    const beCost = avgCost > 0 ? (avgCost * 1.0003 + 3 / q) : 0;
    const breakEven = Math.max(beMarket, beCost);
    const target = breakEven * 1.005;
    const costInfo = avgCost > 0 ? `, تكلفة=${avgCost.toFixed(2)} → تعادل-تكلفة=${beCost.toFixed(2)}` : ", تكلفة=غير معروفة";
    // v4.1.64: prefer passive Level-2 bestBid when it beats our safety floor.
    // Selling at bestBid = marketable limit → instant fill against the top buyer.
    // We NEVER open the L2 modal ourselves; we only read snapshots Thunder
    // already fetched. If no fresh snapshot exists we silently fall back to
    // the safety-floor logic below.
    // v4.1.65: if no fresh snapshot, click Thunder's own L2 accordion once
    // (preciseClick — same tech we use for buy/sell) so Thunder itself fetches
    // market-depth. Still zero requests from the extension.
    if (!getFreshL2(uuid)) { try { await ensureL2SnapshotForUuid(uuid); } catch {} }
    const l2 = getFreshL2(uuid);
    if (l2 && Number(l2.bestBid) >= target) {
      const hitBid = Number(l2.bestBid);
      const safeVal = (Math.round(hitBid * 100) / 100).toFixed(2);
      debug(`⚡ L2: bestBid=${hitBid} ≥ تعادل ${target.toFixed(2)} — بكتب ${safeVal} (بيع فوري)${costInfo}`, "#8b5cf6");
      const ok = await humanTypeExact(input, safeVal);
      if (ok) {
        await humanDelay(220, 420);
        const after = readInputNumber(input);
        if (after > 0) {
          debug(`✓ السعر المحدد = ${after} (L2 bestBid, مكسب مضمون)`, "#10b981");
          startTrailingPriceUpdater({ input, floor: target, armBase: avgCost > 0 ? avgCost : entry });
          return true;
        }
      }
      // fall through to normal path if L2 write failed for any reason
    }
    if (suggested >= target) {
      debug(`✓ سعر ثاندر آمن: ${suggested.toFixed(2)} (تعادل=${breakEven.toFixed(2)}${costInfo})`, "#10b981");
      startTrailingPriceUpdater({ input, floor: target, armBase: avgCost > 0 ? avgCost : entry });
      return true;
    }
    // Step 3: overwrite with safe target (round up to 2 decimals).
    const safe = (Math.ceil(target * 100) / 100).toFixed(2);
    debug(`بكتب سعر آمن: ${safe} (تعادل=${breakEven.toFixed(2)}${costInfo}, اقتراح ثاندر=${suggested || "فاضي"})`, "#3b82f6");
    const ok = await humanTypeExact(input, safe);
    if (!ok) {
      debug("❌ فشلت كتابة السعر الآمن — اكتبه يدوياً", "#ef4444");
      return false;
    }
    await humanDelay(220, 420);
    const after = readInputNumber(input);
    if (!(after > 0)) {
      debug("❌ السعر لسه فاضي — اكتبه يدوياً", "#ef4444");
      return false;
    }
    debug(`✓ السعر المحدد = ${after} (مكسب ≥ 0.5%)`, "#10b981");
    // v4.1.35 Phase 1: start trailing — rewrites field only, never clicks.
    startTrailingPriceUpdater({ input, floor: target, armBase: avgCost > 0 ? avgCost : entry });
    return true;
  }

  async function ensureLimitPrice(priceValue) {
    const price = Number(priceValue);
    if (!Number.isFinite(price) || price <= 0) {
      debug("⚠️ مفيش سعر محدد من السيرفر — اكتبه يدوياً", "#f59e0b");
      return false;
    }
    if (Date.now() < limitPriceAttemptLockedUntil) {
      debug("⏸ السعر المحدد محتاج كتابة يدوية", "#ef4444");
      return false;
    }
    const input = await waitFor(() => findLimitPriceInput(), { timeout: 3500, interval: 150 });
    if (!input || !isConfirmedLimitPriceInput(input)) {
      debug("⚠️ مش لاقي خانة 'السعر المحدد' — اكتبه يدوياً", "#f59e0b");
      return false;
    }
    const current = readInputNumber(input);
    if (current > 0 && Math.abs(current - price) / price < 0.0015) {
      debug(`✓ السعر المحدد متعبّى مسبقاً: ${current}`, "#10b981");
      return true;
    }
    limitPriceAttemptLockedUntil = Date.now() + 60_000;
    const valueToType = price.toFixed(2);
    debug(`بكتب السعر المحدد: ${valueToType}`, "#3b82f6");
    const ok = await humanTypeExact(input, valueToType);
    if (!ok) {
      debug("❌ فشلت كتابة السعر المحدد — اكتبه يدوياً", "#ef4444");
      return false;
    }
    await humanDelay(220, 420);
    const after = readInputNumber(input);
    if (!(after > 0)) {
      debug("❌ السعر المحدد لسه فاضي — اكتبه يدوياً", "#ef4444");
      return false;
    }
    limitPriceAttemptLockedUntil = 0;
    debug(`✓ السعر المحدد = ${after}`, "#10b981");
    return true;
  }

  function findFirstVisibleAssetRow() {
    const symbolRe = /\b[A-Z]{2,6}\b/;
    const bad = new Set(["EGP", "USD", "ETF", "BUY", "SELL"]);
    const smallTextEls = Array.from(document.querySelectorAll("body *")).filter((el) => {
      const text = (el.textContent || "").trim();
      if (!symbolRe.test(text) || text.length > 80) return false;
      const symbol = text.match(symbolRe)?.[0];
      if (!symbol || bad.has(symbol)) return false;
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && style.visibility !== "hidden" && style.display !== "none";
    });

    for (const symbolEl of smallTextEls) {
      let node = symbolEl;
      for (let depth = 0; node && depth < 8; depth++, node = node.parentElement) {
        const r = node.getBoundingClientRect();
        const text = (node.textContent || "").trim();
        if (r.width > Math.min(420, window.innerWidth * 0.35) && r.height >= 44 && r.height <= 170 && text.includes("سهم")) {
          return node;
        }
      }
    }
    return findClickableByText("سهم") || findClickableByText("Stock");
  }

  async function openFirstAssetFromCurrentList() {
    const row = findFirstVisibleAssetRow();
    if (!row) return false;
    debug("مش على صفحة سهم — هفتح أول صف سهم ظاهر", "#f59e0b");
    await humanClick(row);
    return true;
  }

  // Visible debug banner so user can see progress on the Thunder page itself.
  let debugBanner = null;
  function debug(msg, color = "#3b82f6") {
    console.info("[thunder-ext]", msg);
    try {
      if (!debugBanner) {
        debugBanner = document.createElement("div");
        debugBanner.style.cssText = "position:fixed;bottom:12px;left:12px;z-index:2147483647;padding:8px 14px;border-radius:8px;font-family:system-ui,sans-serif;font-size:13px;font-weight:600;direction:rtl;box-shadow:0 6px 24px rgba(0,0,0,0.25);color:#fff;max-width:380px;";
        document.body.appendChild(debugBanner);
      }
      debugBanner.style.background = color;
      debugBanner.textContent = "[ثندر] " + msg;
    } catch {}
  }

  async function waitFor(predicateFn, { timeout = 8000, interval = 200 } = {}) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      try {
        const v = predicateFn();
        if (v) return v;
      } catch {}
      await sleep(interval);
    }
    return null;
  }

  async function humanClick(el) {
    if (!el) return false;
    el.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
    await humanDelay(180, 420);

    const clickable = clickableSurface(el) || el;
    const r = clickable.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    const points = [
      [r.left + r.width / 2, r.top + r.height / 2],
      [r.left + Math.min(r.width - 6, Math.max(6, r.width * 0.30)), r.top + r.height / 2],
      [r.left + Math.min(r.width - 6, Math.max(6, r.width * 0.70)), r.top + r.height / 2],
    ];

    let didClick = false;
    for (const [x, y] of points) {
      if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) continue;
      didClick = (await mainWorldClickAt(x, y)) || didClick;
      await humanDelay(70, 140);
      const topEl = document.elementFromPoint(x, y);
      const targets = clickTargets(topEl || clickable, clickable);
      for (const target of targets) {
        await dispatchSafeClick(target, x, y);
        didClick = true;
        await humanDelay(80, 160);
      }
    }
    try { if (typeof clickable.click === "function") { clickable.click(); didClick = true; } } catch {}
    return didClick;
  }

  // Single, well-targeted click. Use for toggles (dropdown triggers, tabs)
  // where humanClick's multi-point click would toggle them closed again.
  async function singleClick(el) {
    if (!el) return false;
    const clickable = clickableSurface(el) || el;
    clickable.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
    await humanDelay(140, 280);
    const r = clickable.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) return false;
    let didClick = await mainWorldClickAt(x, y);
    if (!didClick) {
      const topEl = document.elementFromPoint(x, y) || clickable;
      const target = topEl.closest?.("button, [role='button'], [role='combobox'], [role='option'], a, li, [tabindex], [onclick]") || topEl;
      await dispatchSafeClick(target, x, y);
      didClick = true;
    }
    return didClick;
  }

  // One physical click only. Dropdowns toggle on every extra click, so this
  // avoids React-handler fan-out and never calls fallback .click().
  async function preciseClick(el) {
    if (!el) return false;
    const clickable = clickableSurface(el) || el;
    clickable.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
    await humanDelay(140, 260);
    const r = clickable.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) return false;
    const mainClicked = await mainWorldPreciseClickAt(x, y);
    if (mainClicked) {
      // Ant Design Select fallback: some variants only open on mousedown
      // targeted at the .ant-select wrapper (elementFromPoint lands on the
      // inner selection span). Only fire this extra event if the main click
      // did NOT manage to open the dropdown — preserves existing behavior
      // for selects that opened correctly the first time.
      const antWrap = clickable.closest?.(".ant-select:not(.ant-select-disabled)");
      if (antWrap && isVisible(antWrap)) {
        await humanDelay(90, 160);
        if (!antWrap.classList.contains("ant-select-open")) {
          await mainWorldOpenDropdownAt(x, y);
        }
      }
      return true;
    }
    await dispatchSafeClick(clickable, x, y);
    return true;
  }

  function mainWorldCommand(action, payload, timeout = 1200) {
    return new Promise((resolve) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const timer = setTimeout(() => {
        pendingMainCommands.delete(id);
        resolve(false);
      }, timeout);
      pendingMainCommands.set(id, (result) => {
        clearTimeout(timer);
        resolve(result);
      });
      window.postMessage({ __thunderMainCommand: true, id, action, payload }, "*");
    });
  }

  function mainWorldClickAt(x, y) {
    return mainWorldCommand("clickAt", { x, y }, 1400);
  }

  function mainWorldPreciseClickAt(x, y) {
    return mainWorldCommand("preciseClickAt", { x, y }, 1400);
  }

  function mainWorldOpenDropdownAt(x, y) {
    return mainWorldCommand("openDropdownAt", { x, y }, 1800);
  }

  async function forceOpenDropdown(opener, optionFinder, label) {
    if (!opener) return false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const r = opener.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      debug(`${label} — محاولة ${attempt}/3`, "#3b82f6");
      await preciseClick(opener);
      let found = await waitFor(optionFinder, { timeout: 900, interval: 90 });
      if (found) return true;
      await mainWorldOpenDropdownAt(x, y);
      found = await waitFor(optionFinder, { timeout: 1200, interval: 90 });
      if (found) return true;
      try {
        opener.focus?.({ preventScroll: true });
        opener.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", code: "ArrowDown", bubbles: true, cancelable: true, composed: true }));
        opener.dispatchEvent(new KeyboardEvent("keyup", { key: "ArrowDown", code: "ArrowDown", bubbles: true, cancelable: true, composed: true }));
      } catch {}
      found = await waitFor(optionFinder, { timeout: 900, interval: 90 });
      if (found) return true;
      await humanDelay(180, 320);
    }
    return false;
  }

  function mainWorldSelectVisibleText(labels, avoidRect, excludeText) {
    const payload = {
      labels,
      avoidRect: avoidRect ? { left: avoidRect.left, top: avoidRect.top, right: avoidRect.right, bottom: avoidRect.bottom, width: avoidRect.width, height: avoidRect.height } : null,
    };
    if (excludeText !== undefined) payload.excludeText = excludeText;
    return mainWorldCommand("selectVisibleText", payload, 1800);
  }

  function mainWorldSelectSettlementT0(avoidRect) {
    return mainWorldCommand("selectSettlementT0", {
      avoidRect: avoidRect ? { left: avoidRect.left, top: avoidRect.top, right: avoidRect.right, bottom: avoidRect.bottom, width: avoidRect.width, height: avoidRect.height } : null,
    }, 2200);
  }

  function mainWorldKeyboardSelectSettlementT0(avoidRect, keys) {
    return mainWorldCommand("keyboardSelectSettlementT0", {
      avoidRect: avoidRect ? { left: avoidRect.left, top: avoidRect.top, right: avoidRect.right, bottom: avoidRect.bottom, width: avoidRect.width, height: avoidRect.height } : null,
      keys,
    }, 1800);
  }

  function mainWorldTypeAt(input, text) {
    const r = input?.getBoundingClientRect?.();
    if (!r || r.width <= 0 || r.height <= 0) return Promise.resolve(false);
    return mainWorldCommand("typeAt", { x: r.left + r.width / 2, y: r.top + r.height / 2, text }, 1400);
  }

  function clickTargets(hit, fallback) {
    const out = [];
    const add = (node) => {
      if (node && node.nodeType === 1 && !out.includes(node) && isVisible(node) && !isDisabled(node)) out.push(node);
    };
    add(hit);
    add(hit?.closest?.("button, [role='button'], a, [tabindex], [onclick]"));
    add(fallback);
    let cur = hit?.parentElement;
    for (let i = 0; cur && i < 4; i++, cur = cur.parentElement) {
      const style = getComputedStyle(cur);
      if (cur === fallback || cur.matches?.("button, [role='button'], a, [tabindex], [onclick]") || style.cursor === "pointer") add(cur);
    }
    return out;
  }

  async function dispatchSafeClick(target, x, y) {
    try { target.focus?.({ preventScroll: true }); } catch {}
    const base = { bubbles: true, cancelable: true, composed: true, view: window, clientX: x, clientY: y, screenX: x, screenY: y, button: 0, buttons: 1, detail: 1 };
    if (typeof PointerEvent !== "undefined") {
      target.dispatchEvent(new PointerEvent("pointerover", { ...base, pointerId: 1, pointerType: "mouse", isPrimary: true }));
      target.dispatchEvent(new PointerEvent("pointermove", { ...base, pointerId: 1, pointerType: "mouse", isPrimary: true }));
      target.dispatchEvent(new PointerEvent("pointerdown", { ...base, pointerId: 1, pointerType: "mouse", isPrimary: true }));
      await humanDelay(35, 90);
      target.dispatchEvent(new PointerEvent("pointerup", { ...base, pointerId: 1, pointerType: "mouse", isPrimary: true, buttons: 0 }));
    }
    target.dispatchEvent(new MouseEvent("mouseover", base));
    target.dispatchEvent(new MouseEvent("mousemove", base));
    target.dispatchEvent(new MouseEvent("mousedown", base));
    await humanDelay(35, 90);
    target.dispatchEvent(new MouseEvent("mouseup", { ...base, buttons: 0 }));
    target.dispatchEvent(new MouseEvent("click", { ...base, buttons: 0 }));
  }

  async function humanType(input, text) {
    if (!input) return false;
    input.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
    await humanDelay(120, 260);
    const mainTyped = await mainWorldTypeAt(input, text);
    if (mainTyped) return true;
    input.focus();
    // Clear via React-friendly setter
    const proto = Object.getPrototypeOf(input);
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (setter) setter.call(input, "");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await humanDelay(150, 350);

    let buf = "";
    for (const ch of String(text)) {
      buf += ch;
      if (setter) setter.call(input, buf);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await sleep(rand(80, 200));
    }
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  async function humanTypeExact(input, text) {
    if (!input || !isVisible(input) || input.disabled || input.readOnly) return false;
    if (sameElement(input, findQuantityInput()) || inputLooksQuantity(input)) return false;
    input.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
    await humanDelay(120, 240);
    try { input.focus({ preventScroll: true }); } catch { try { input.focus(); } catch {} }
    const value = String(text);
    const setValue = (val) => {
      const proto = Object.getPrototypeOf(input);
      const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
      if (setter) setter.call(input, val); else input.value = val;
    };

    const fire = (type, opts = {}) => {
      try {
        const Ctor = type === "input" || type === "beforeinput" ? InputEvent : Event;
        input.dispatchEvent(new Ctor(type, { bubbles: true, cancelable: true, composed: true, ...opts }));
      } catch {
        input.dispatchEvent(new Event(type, { bubbles: true }));
      }
    };

    try {
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "a", code: "KeyA", ctrlKey: true, bubbles: true, cancelable: true, composed: true }));
      input.dispatchEvent(new KeyboardEvent("keyup", { key: "a", code: "KeyA", ctrlKey: true, bubbles: true, cancelable: true, composed: true }));
    } catch {}
    setValue("");
    fire("input", { inputType: "deleteContentBackward", data: null });
    await humanDelay(80, 160);
    fire("beforeinput", { inputType: "insertText", data: value });
    setValue(value);
    fire("input", { inputType: "insertText", data: value });
    fire("change");
    await humanDelay(120, 220);

    if (String(input.value || input.getAttribute?.("value") || "").replace(/,/g, "") === value) return true;

    // Retry character-by-character on the SAME confirmed element only; never
    // use coordinates or activeElement fallbacks here because activeElement is
    // often the quantity field after pressing "Max".
    setValue("");
    fire("input", { inputType: "deleteContentBackward", data: null });
    let buf = "";
    for (const ch of value) {
      buf += ch;
      fire("beforeinput", { inputType: "insertText", data: ch });
      setValue(buf);
      fire("input", { inputType: "insertText", data: ch });
      await sleep(rand(45, 95));
    }
    fire("change");
    return String(input.value || input.getAttribute?.("value") || "").replace(/,/g, "") === value;
  }

  // ---- order executor (Semi-Auto) ----
  function findBuyToggleButtons() {
    const nodes = Array.from(document.querySelectorAll("button, [role='tab'], [role='radio'], [role='switch'], label"));
    let cash = null, shares = null;
    for (const el of nodes) {
      if (!isVisible(el) || isDisabled(el)) continue;
      const txt = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (!txt || txt.length > 20) continue;
      if (!cash && /(^|\s)نقدي(\s|$)/.test(txt)) cash = el;
      else if (!shares && /(^|\s)(اسهم|أسهم)(\s|$)/.test(txt)) shares = el;
      if (cash && shares) break;
    }
    return { cash, shares };
  }

  function parseRgbAlpha(s) {
    const m = String(s || "").match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!m) return null;
    return m[4] != null ? parseFloat(m[4]) : 1;
  }

  function isCashToggleActive(cash, shares) {
    if (!cash) return false;
    for (const attr of ["aria-selected", "aria-pressed", "aria-checked", "data-state", "data-active", "data-selected"]) {
      const tv = cash.getAttribute(attr);
      const ov = shares?.getAttribute?.(attr);
      if (tv != null) {
        if (/^(true|active|on|checked|selected)$/i.test(tv)) return true;
        if (ov != null && tv !== ov && /^(false|inactive|off|unchecked)$/i.test(tv)) return false;
      }
    }
    try {
      const cs = getComputedStyle(cash);
      const ss = shares ? getComputedStyle(shares) : null;
      const ca = parseRgbAlpha(cs.backgroundColor);
      const sa = ss ? parseRgbAlpha(ss.backgroundColor) : null;
      if (ca != null && sa != null && ca !== sa) return ca > sa;
    } catch {}
    return false;
  }

  function inputModeContext(input) {
    if (!input) return "";
    const parts = [
      input.placeholder,
      input.getAttribute?.("aria-label"),
      input.getAttribute?.("title"),
      input.name,
      input.id,
    ];
    const id = input.id;
    if (id) {
      const safeId = window.CSS?.escape ? CSS.escape(id) : String(id).replace(/"/g, '\\"');
      const label = document.querySelector(`label[for="${safeId}"]`);
      if (label) parts.push(cleanText(label));
    }
    let cur = input.parentElement;
    for (let depth = 0; cur && depth < 5; depth++, cur = cur.parentElement) {
      const text = cleanText(cur);
      const r = cur.getBoundingClientRect();
      if (text && text.length <= 260 && r.height <= 220) parts.push(text);
    }
    return normalizeArabicText(parts.filter(Boolean).join(" ")).toLowerCase();
  }

  function inputLooksShares(input) {
    const ctx = inputModeContext(input);
    return /عدد\s*(?:ال)?اسهم|عدد\s*(?:ال)?سهم|اسهم|سهم|shares|number\s+of\s+shares/i.test(ctx);
  }

  function inputLooksCash(input) {
    const ctx = inputModeContext(input);
    if (textLooksLimitPriceLabel(ctx)) return false;
    return /مبلغ|قيمه|جنيه|ج\s*\.\s*م|egp|cash|amount|value/i.test(ctx) && !inputLooksShares(input);
  }

  function cashEntryInputReady() {
    const input = findQuantityInput();
    return !!input && inputLooksCash(input);
  }

  async function activateToggleWithKeyboard(el) {
    if (!el) return false;
    try { el.focus?.({ preventScroll: true }); } catch {}
    await humanDelay(80, 160);
    for (const key of ["Enter", " "]) {
      const code = key === " " ? "Space" : "Enter";
      try {
        el.dispatchEvent(new KeyboardEvent("keydown", { key, code, bubbles: true, cancelable: true, composed: true }));
        el.dispatchEvent(new KeyboardEvent("keyup", { key, code, bubbles: true, cancelable: true, composed: true }));
      } catch {}
      await humanDelay(220, 380);
      if (cashEntryInputReady()) return true;
    }
    return false;
  }

  async function ensureCashMode() {
    if (cashEntryInputReady()) return true;
    let pair = findBuyToggleButtons();
    if (!pair.cash || !pair.shares) return "no_toggle"; // not the new UI — caller falls back to shares

    for (let attempt = 1; attempt <= 3; attempt++) {
      debug(`بختار نقدي — محاولة ${attempt}/3`, "#3b82f6");
      await preciseClick(pair.cash);
      if (await waitFor(() => cashEntryInputReady(), { timeout: 1800, interval: 120 })) return true;
      if (await activateToggleWithKeyboard(pair.cash)) return true;

      pair = findBuyToggleButtons();
      if (pair.cash && pair.shares && isCashToggleActive(pair.cash, pair.shares) && inputLooksShares(findQuantityInput())) {
        await preciseClick(pair.shares);
        await humanDelay(300, 520);
        pair = findBuyToggleButtons();
        await preciseClick(pair.cash || findBuyToggleButtons().cash);
        if (await waitFor(() => cashEntryInputReady(), { timeout: 2200, interval: 120 })) return true;
      }

      pair = findBuyToggleButtons();
      await humanDelay(250, 450);
    }

    return false;
  }

  // ---- SELL helpers (Phase 2-a): ensure "أسهم" tab + click "الحد الأقصى" ----
  // Safe by design:
  //  - Only invoked from the SELL branch of executeOrder.
  //  - ensureSharesMode is a no-op when the toggle UI isn't rendered (older UI).
  //  - clickMaxButton uses an EXACT text match on "الحد الأقصى" / "Max" only;
  //    no fuzzy fallback that could hit "نقدي" or any other control.
  //  - Caller still verifies the qty input received a positive value before
  //    proceeding; on any failure we abort BEFORE the review button is clicked.
  function isSharesToggleActive(pair) {
    if (!pair?.shares) return false;
    for (const attr of ["aria-selected", "aria-pressed", "aria-checked", "data-state", "data-active", "data-selected"]) {
      const sv = pair.shares.getAttribute(attr);
      const cv = pair.cash?.getAttribute?.(attr);
      if (sv != null) {
        if (/^(true|active|on|checked|selected)$/i.test(sv)) return true;
        if (cv != null && sv !== cv && /^(false|inactive|off|unchecked)$/i.test(sv)) return false;
      }
    }
    try {
      const ss = getComputedStyle(pair.shares);
      const cs = pair.cash ? getComputedStyle(pair.cash) : null;
      const sa = parseRgbAlpha(ss.backgroundColor);
      const ca = cs ? parseRgbAlpha(cs.backgroundColor) : null;
      if (sa != null && ca != null && sa !== ca) return sa > ca;
    } catch {}
    // Last resort: if the qty input context clearly says shares, assume active.
    try { return inputLooksShares(findQuantityInput()); } catch { return false; }
  }

  async function ensureSharesMode() {
    const pair0 = findBuyToggleButtons();
    // No toggle UI rendered → older UI, shares is the only mode. Safe to proceed.
    if (!pair0.shares && !pair0.cash) return true;
    if (isSharesToggleActive(pair0)) return true;
    for (let attempt = 1; attempt <= 3; attempt++) {
      debug(`بختار أسهم — محاولة ${attempt}/3`, "#3b82f6");
      const pair = findBuyToggleButtons();
      if (!pair.shares) return false;
      await preciseClick(pair.shares);
      const ok = await waitFor(
        () => isSharesToggleActive(findBuyToggleButtons()),
        { timeout: 1500, interval: 120 },
      );
      if (ok) return true;
      await humanDelay(250, 500);
    }
    return false;
  }

  // Strict matcher — exact short text only. Never matches "نقدي", "أسهم",
  // "مراجعة", "إلغاء", etc. Length-bounded to avoid catching paragraphs.
  function findMaxButtonCandidates() {
    const exact = /^(?:الحد\s*الاقص[ىي]|max|maximum)$/i;
    const nodes = Array.from(document.querySelectorAll("button, [role='button'], a, span, div, p, label, h1, h2, h3, h4, h5, h6, [tabindex], [onclick]"));
    const candidates = [];
    const seen = new Set();
    const addTarget = (target, anchor) => {
      if (!target || seen.has(target) || !isVisible(target) || isDisabled(target)) return;
      const r = target.getBoundingClientRect();
      if (r.width < 24 || r.height < 14 || r.width > Math.min(460, window.innerWidth - 12) || r.height > 170) return;
      seen.add(target);
      const ar = anchor?.getBoundingClientRect?.() || r;
      const anchorArea = ar.width * ar.height;
      const targetArea = r.width * r.height;
      candidates.push({ el: target, score: anchorArea + targetArea / 20 });
    };
    for (const el of nodes) {
      if (!isVisible(el)) continue;
      const raw = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (!raw || raw.length > 18) continue;
      const norm = normalizeArabicText(raw).toLowerCase();
      if (!exact.test(norm)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 24 || r.height < 14 || r.width > 220 || r.height > 80) continue;
      // Try the word itself first, then the parent row/container. In Thunder's
      // current DOM the text is an <h5> inside a hashed parent div that owns the
      // click handler; bubbling from the text works only in some builds.
      addTarget(el, el);
      let cur = el.parentElement;
      for (let depth = 0; cur && depth < 4; depth++, cur = cur.parentElement) {
        const cr = cur.getBoundingClientRect();
        if (cr.width >= r.width && cr.height >= r.height && cr.width <= Math.min(460, window.innerWidth - 12) && cr.height <= 170) {
          addTarget(cur, el);
        }
      }
    }
    return candidates.sort((a, b) => a.score - b.score).map((item) => item.el);
  }

  function findMaxButton() {
    return findMaxButtonCandidates()[0] || null;
  }

  async function clickMaxButton() {
    const found = await waitFor(() => findMaxButtonCandidates().length ? findMaxButtonCandidates() : null, { timeout: 3000, interval: 150 });
    if (!found?.length) return false;
    const before = readInputNumber(findQuantityInput());
    for (let attempt = 1; attempt <= 3; attempt++) {
      const candidates = findMaxButtonCandidates().slice(0, 6);
      for (const btn of candidates) {
        debug(`بضغط الحد الأقصى — محاولة ${attempt}/3`, "#3b82f6");
        await preciseClick(btn);
        const filled = await waitFor(() => {
          const val = readInputNumber(findQuantityInput());
          return val > 0 && val !== before ? val : null;
        }, { timeout: 900, interval: 90 });
        if (filled) return true;
        await humanDelay(120, 240);
      }
      await humanDelay(220, 420);
    }
    return readInputNumber(findQuantityInput()) > 0;
  }

  async function executeOrder({ orderId, symbol, uuid, qty, egp, side, refPrice, driftBps, orderType, limitPrice, signalSource, signalCreatedAt, metadata }) {
    try {
      chrome.runtime.sendMessage({ type: "executionStarted", payload: { orderId, symbol, side } }, () => { void chrome.runtime.lastError; });
    } catch {}
    // Set rolling context so every logTiming(...) below has signal_id/symbol/uuid.
    __currentSignalCtx = {
      signal_id: orderId ? String(orderId) : null,
      symbol: String(symbol || "").trim().toUpperCase() || null,
      uuid: uuid ? String(uuid).toLowerCase() : null,
    };
    reportStatus(orderId, "opened");
    debug(`بدأ التنفيذ — ${symbol} كمية ${qty}`, "#3b82f6");

    const isSell = String(side || "buy").toLowerCase() === "sell";
    if (!isSell) {
      rememberScalpSignal({ symbol, uuid, orderId, refPrice, qty, signalSource, signalCreatedAt, metadata }).catch(() => {});
      // Auto-arm raw API capture session the moment a Scalp signal triggers a
      // buy. Reuses an existing session if one is already active. The session
      // lives long enough (45 min) to cover buy → fill → sell.
      try {
        chrome.runtime.sendMessage({
          type: "capture.armForSignal",
          payload: {
            symbol,
            uuid,
            meta: {
              orderId,
              refPrice,
              qty,
              signalSource: signalSource || "scalp-live",
              signalCreatedAt: signalCreatedAt || null,
              armedAt: Date.now(),
            },
          },
        }, () => { void chrome.runtime.lastError; });
      } catch {}
    }
    const primaryLabels = isSell
      ? ["بيع", "Sell"]
      : ["شراء", "Buy"];

    // Step 0: The regular asset/profile page only shows charts/statistics and
    // an "افتح ThndrX" entry point. Open the trading workspace first, then look
    // for Buy/Sell there. This is safe: we still stop before final review.
    await humanDelay(800, 1600);
    await dismissInvestorModalIfPresent();
    if (!findSideButton(primaryLabels, { allowHeuristic: false })) {
      const openX = thndrXOpenInstruction();
      if (openX) {
        const opened = await clickOpenThndrXAndWait(openX);
        if (opened) {
          await humanDelay(900, 1600);
          await dismissInvestorModalIfPresent();
        } else debug("لازم أفتح ThndrX الأول", "#f59e0b");
        if (opened && findSideButton(primaryLabels, { allowHeuristic: false })) {
          debug("✓ ThndrX اتفتح — بكمل التنفيذ", "#10b981");
        } else {
        return { ok: false, retryAfterNavigation: true, stage: "open_thndrx_required", thndrXUrl: openX.href || null };
        }
      }
    }

    // Step 1: wait for the trading workspace to render the buy/sell button matching `side`.
    if (!findSideButton(primaryLabels)) {
      const openedFromList = await openFirstAssetFromCurrentList();
      if (openedFromList) await humanDelay(2500, 4500);
      if (!findSideButton(primaryLabels, { allowHeuristic: false })) {
        const openX = thndrXOpenInstruction();
        if (openX) {
          const opened = await clickOpenThndrXAndWait(openX);
          if (opened) {
            await humanDelay(900, 1600);
            await dismissInvestorModalIfPresent();
          } else debug("لازم أفتح ThndrX الأول", "#f59e0b");
          if (opened && findSideButton(primaryLabels, { allowHeuristic: false })) {
            debug("✓ ThndrX اتفتح — بكمل التنفيذ", "#10b981");
          } else {
          return { ok: false, retryAfterNavigation: true, stage: "open_thndrx_required", thndrXUrl: openX.href || null };
          }
        }
      }
    }
    debug("بدور على زرار " + primaryLabels[0], "#3b82f6");
    // v4.2.5: L2 is disabled in the No-L2 build, so this legacy guard must
    // stay off. Leaving it enabled made every buy fail with l2_guard_rejected
    // and the background used to close the just-opened signal tab.
    // Legacy v4.1.66 L2 Pre-Trade Guard (BUY only). Verify order book supports:
    //   - immediate exit (bid depth)
    //   - profitable target (5th ask reachable)
    //   - reasonable spread
    // Refuses to buy on any failure OR if L2 unavailable. This is the fix
    // for "اشتريت وقدرتش أبيع" — we now verify BEFORE spending money.
    if (!isSell && L2_PRE_TRADE_GUARD_ENABLED) {
      try { await ensureL2SnapshotForUuid(uuid, { maxWaitMs: 3500 }); } catch {}
      const l2 = getFreshL2(uuid);
      if (l2) {
        logTiming("l2_snapshot_ready", {
          bestBid: Number(l2.bestBid) || null,
          bestBidQty: Number(l2.bestBidQty) || null,
          bestAsk: Number(l2.bestAsk) || null,
          bestAskQty: Number(l2.bestAskQty) || null,
          bidsLevels: Array.isArray(l2.bids) ? l2.bids.length : 0,
          asksLevels: Array.isArray(l2.asks) ? l2.asks.length : 0,
          l2_age_ms: Date.now() - Number(l2.ts || 0),
        });
      } else {
        logTiming("l2_snapshot_ready", { available: false });
      }
      const verdict = evaluateL2ForBuy({ l2, capital: Number(egp) || 0, entryPriceHint: refPrice, qty });
      logTiming("l2_guard_verdict", {
        ok: !!verdict.ok,
        reason: verdict.reason || null,
        metrics: verdict.metrics || null,
      });
      if (!verdict.ok) {
        reportStatus(orderId, "error", `l2_guard_rejected — ${verdict.reason}`);
        debug(`🛑 L2 رفض الشراء: ${verdict.reason}`, "#ef4444");
        try {
          chrome.runtime.sendMessage({ type: "signalRejected", payload: { orderId, symbol, uuid, reason: verdict.reason, metrics: verdict.metrics || null } }, () => { void chrome.runtime.lastError; });
        } catch {}
        return { ok: false, stage: "l2_guard_rejected", reason: verdict.reason, metrics: verdict.metrics || null };
      }
      debug(`✓ L2 آمن: spread=${(verdict.metrics.spreadPct * 100).toFixed(2)}%, طلب@الهدف=${verdict.metrics.bidDepthAtTarget}, هدف=${verdict.metrics.target.toFixed(2)}`, "#10b981");
      logTiming("buy_started", { qty, egp: Number(egp) || null, refPrice: Number(refPrice) || null });
    }
    if (isSell) {
      logTiming("sell_started", { qty, refPrice: Number(refPrice) || null, limitPrice: Number(limitPrice) || null });
    }
    let clickedSide = false;
    let formOpened = null;
    for (let attempt = 1; attempt <= 6 && !formOpened; attempt++) {
      // Buy flow only: Thunder can show the investor-account promo *after*
      // clicking "شراء". Previously we dismissed it only before pressing Buy,
      // so the automation kept retrying against the blocking modal and the user
      // saw the promo card instead of the order form. Sell does not normally
      // trigger this promo, but the guard is safe for both sides.
      await dismissInvestorModalIfPresent();
      const sideBtn = await waitFor(() => findSideButton(primaryLabels), { timeout: attempt === 1 ? 10_000 : 2500, interval: 150 });
      if (!sideBtn) continue;
      debug(`لقيت الزرار — محاولة ضغط ${attempt}/6`, "#10b981");
      clickedSide = (await preciseClick(sideBtn)) || clickedSide;
      await humanDelay(220, 420);
      if (await dismissInvestorModalIfPresent()) {
        // The first Buy click was consumed by the promo. Wait briefly in case
        // Thunder opens the form after dismiss, otherwise retry the side button.
        await humanDelay(450, 800);
      }
      formOpened = await waitFor(() => findOrderTypeOpener() || findQuantityInput(), { timeout: 3500, interval: 150 });
      if (!formOpened) await humanDelay(450, 800);
    }

    if (!clickedSide) {
      reportStatus(orderId, "error", `${isSell ? "sell" : "buy"}_button_not_found — افتح السهم يدوياً`);
      debug(`❌ مفيش زرار ${primaryLabels[0]} — افتح السهم يدوياً`, "#ef4444");
      return { ok: false, stage: "side_button_not_found" };
    }
    if (!formOpened) {
      reportStatus(orderId, "error", `${isSell ? "sell" : "buy"}_button_no_form — الزرار اتضغط بس نافذة الطلب مفتحتش`);
      debug(`❌ الزرار اتضغط بس نافذة الطلب مفتحتش`, "#ef4444");
      return { ok: false, stage: "side_button_no_form" };
    }
    await humanDelay(500, 900);

    // Step 2: order type.
    //  - BUY  → سعر السوق (market).
    //  - SELL → الطلبات المتقدمة + تسوية T0 (required to sell shares we
    //           bought today before the regular T+2 settlement).
    if (isSell) {
      const advOk = await ensureOrderTypeAdvanced();
      if (!advOk) {
        reportStatus(orderId, "error", "order_type_advanced_not_selected — اختار 'الطلبات المتقدمة' يدوياً");
        return { ok: false, stage: "order_type_advanced_not_selected" };
      }
      await humanDelay(400, 700);
      const t0Ok = await ensureSettlementT0();
      if (!t0Ok) {
        reportStatus(orderId, "error", "settlement_t0_not_selected — اختار T0 من التسوية يدوياً");
        return { ok: false, stage: "settlement_t0_not_selected" };
      }
      debug("✓ نوع الطلب = الطلبات المتقدمة، التسوية = T0", "#10b981");
      await humanDelay(280, 500);
    } else {
      const typeOk = await ensureMarketOrderType();
      if (!typeOk) {
        reportStatus(orderId, "error", "order_type_not_selected — اختار 'سعر السوق' يدوياً");
        return { ok: false, stage: "order_type_not_selected" };
      }
    }

    // Step 2.5 (buy only, best-effort): switch the شراء toggle from "اسهم" to "نقدي".
    // Safe by design: only fires when BOTH اسهم and نقدي tabs are clearly present,
    // and only clicks نقدي when it's not already active. Any failure is silent and
    // the flow continues with the default (shares) behavior.
    let cashMode = false;
    if (!isSell) {
      try {
        cashMode = await ensureCashMode();
        if (cashMode) debug("اخترت نقدي", "#10b981");
      } catch (e) {
        debug("تعذّر تفعيل نقدي", "#f59e0b");
      }
      if (cashMode === "no_toggle") {
        // Thunder didn't render the نقدي/أسهم toggle on this page — safe to
        // proceed in shares mode using the computed qty.
        debug("ℹ️ تبويب نقدي/أسهم مش ظاهر — هكمل بأسهم", "#3b82f6");
        cashMode = false;
      } else if (!cashMode) {
        reportStatus(orderId, "error", "cash_mode_not_verified — خانة الإدخال لسه عدد أسهم، اختار نقدي يدوياً");
        debug("❌ نقدي غير مؤكد — الخانة لسه أسهم، اتوقفت بأمان", "#ef4444");
        return { ok: false, stage: "cash_mode_not_verified" };
      }
    }

    // Step 2.6 (SELL only): ensure "أسهم" tab is active and click "الحد الأقصى".
    // This replaces typing a quantity — Thunder fills the input automatically.
    // Any failure aborts cleanly BEFORE we ever touch the review button.
    if (isSell) {
      const sharesOk = await ensureSharesMode();
      if (!sharesOk) {
        debug("⚠️ مش متأكد من tab 'أسهم' — اضغطه يدوياً", "#f59e0b");
      } else {
        await humanDelay(300, 600);
        const maxOk = await clickMaxButton();
        if (!maxOk) {
          reportStatus(orderId, "error", "max_button_not_found — اضغط 'الحد الأقصى' يدوياً");
          debug("❌ مش قادر أضغط 'الحد الأقصى' — اتوقفت بأمان", "#ef4444");
          return { ok: false, stage: "max_button_not_found" };
        } else {
          const qInput = await waitFor(() => findQuantityInput(), { timeout: 3000 });
          const filledQty = readInputNumber(qInput);
          if (filledQty > 0) debug(`✓ الحد الأقصى = ${filledQty} سهم`, "#10b981");
          else {
            reportStatus(orderId, "error", "max_qty_not_filled — اضغط 'الحد الأقصى' يدوياً");
            debug("❌ الحد الأقصى مضغطش/الكمية لسه صفر — اتوقفت بأمان", "#ef4444");
            return { ok: false, stage: "max_qty_not_filled" };
          }
          // After Max + qty filled: focus price input so Thunder auto-suggests,
          // then enforce break-even + 0.5% safety floor.
          await humanDelay(280, 500);
          const okPrice = await ensureSafeLimitPrice({ refPrice, qty: filledQty, uuid });
          if (okPrice) {
            let writtenPrice = null;
            try {
              const priceInput = findLimitPriceInput?.();
              if (priceInput) writtenPrice = readInputNumber(priceInput) || null;
            } catch {}
            logTiming("sell_price_written", { qty: filledQty, price: writtenPrice });
            const ctx = await currentAssetContext({ symbol, uuid });
            await upsertOpenTrade({
              symbol: ctx.symbol || symbol,
              uuid: ctx.uuid || uuid,
              qty: filledQty,
              entryPrice: scrapeAvgCostFromPage() || Number(refPrice) || 0,
              source: "scalp-live/sell-prepared",
            });
            await updateTrackedTradeAutoPrepStamp(ctx.symbol || symbol);
          }
        }
      }
      // Highlight review for sell and STOP. Don't try to type qty.
      const reviewBtnSell = findByText("button", "مراجعة الطلب") || findByText("button", "مراجعة") || findByText("button", "Review");
      if (reviewBtnSell) { try { reviewBtnSell.style.outline = "3px solid #f59e0b"; reviewBtnSell.style.boxShadow = "0 0 16px rgba(245,158,11,0.7)"; reviewBtnSell.scrollIntoView({ block: "center", behavior: "smooth" }); } catch {} }
      reportStatus(orderId, "prepared");
      debug("✓ نافذة البيع مفتوحة — راجع واضغط 'مراجعة الطلب'", "#10b981");
      startDriftGuard({ orderId, symbol, uuid, side: "sell", isSell: true, refPrice, driftBps, reviewBtn: reviewBtnSell });
      return { ok: true, stage: "prepared", version: CONTENT_SCRIPT_VERSION };
    }

    // Step 3: fill quantity input.
    const qtyInput = await waitFor(() => findQuantityInput(), { timeout: 7000 });

    if (!qtyInput) {
      reportStatus(orderId, "error", "qty_input_not_found");
      debug("❌ مفيش خانة كمية", "#ef4444");
      return { ok: false, stage: "qty_input_not_found" };
    }
    // For SELL: kept already-filled qty from "الحد الأقصى". Skip typing entirely.
    if (!isSell) {
      if (cashMode && !(Number(egp) > 0)) {
        reportStatus(orderId, "error", "cash_amount_missing — مبلغ الصفقة غير موجود، اتوقف بأمان");
        debug("❌ مبلغ الصفقة غير موجود — اتوقفت بأمان", "#ef4444");
        return { ok: false, stage: "cash_amount_missing" };
      }
      const valueToType = cashMode ? String(Math.floor(Number(egp))) : String(qty);
      debug((cashMode ? `بكتب المبلغ نقدي: ${valueToType} ج.م (egp=${egp})` : "بكتب الكمية: " + valueToType), "#10b981");
      const ok = await humanType(qtyInput, valueToType);
      if (!ok) {
        reportStatus(orderId, "error", "qty_type_failed");
        return { ok: false, stage: "qty_type_failed" };
      }
      await humanDelay(800, 1500);
    }

    // Step 4: STOP HERE. Do NOT click "مراجعة الطلب" / confirm.
    // Highlight the review button so the user can see it.
    const reviewBtn = findByText("button", "مراجعة الطلب") || findByText("button", "مراجعة") || findByText("button", "Review");
    if (reviewBtn) {
      try {
        reviewBtn.style.outline = "3px solid #f59e0b";
        reviewBtn.style.boxShadow = "0 0 16px rgba(245,158,11,0.7)";
        reviewBtn.scrollIntoView({ block: "center", behavior: "smooth" });
      } catch {}
    }

    reportStatus(orderId, "prepared");
    debug(`✓ جاهز — راجع واضغط 'مراجعة الطلب' بنفسك`, "#10b981");
    console.info(`[thunder-ext] ${isSell ? "SELL" : "BUY"} prepared: ${symbol} qty=${qty} — اضغط مراجعة الطلب`);

    // ---- Drift Guard: keep watching the price; warn if it moves against us. ----
    startDriftGuard({ orderId, symbol, uuid, side, isSell, refPrice, driftBps, reviewBtn });
    if (!isSell && reviewBtn) {
      attachAutoSellAfterReview({ symbol, uuid, reviewBtn });
    }
    return { ok: true, stage: "prepared", version: CONTENT_SCRIPT_VERSION };
  }

  // After the user clicks "مراجعة الطلب" on a BUY, wait briefly for the order
  // confirmation step, then automatically open the SELL sidebar for the same
  // stock. Safe: one-shot listener, self-detaches after firing or after 5 min,
  // never auto-clicks the final confirm — user still reviews the sell.
  function attachAutoSellAfterReview({ symbol, uuid, reviewBtn }) {
    // Robust trigger: Thunder re-renders the buttons after each click, so a
    // listener bound to a specific DOM node disappears. We attach ONE
    // document-level capture listener that watches for the user clicking the
    // confirmation button ("تم"/"موافق"/"Done"/"OK") that appears after the
    // buy is filled, then opens the sell sidebar for the same stock.
    let fired = false;
    // Substring match (not exact) — Thunder buttons can be "تم!", "تم.", "أكد الطلب", etc.
    const REVIEW_RE = /مراجعة|Review/i;
    const CONFIRM_RE = /أكد|تأكيد|موافق|حسنا|حسناً|^\s*تم\b|Done|Confirm|^\s*OK\b|Okay/i;
    let sawReview = false;
    let sawConfirm = false;

    const onClick = (ev) => {
      if (fired) return;
      const btn = ev.target?.closest?.("button,[role='button']");
      if (!btn) return;
      const txt = (btn.innerText || btn.textContent || "").trim();
      if (!txt || txt.length > 30) return;

      // Track the review click so we only fire on the *post-review* confirm.
      if (REVIEW_RE.test(txt)) {
        sawReview = true;
        sawConfirm = false;
        debug("✓ ضغطت مراجعة — استنى 'أكد الطلب' ثم 'تم'", "#10b981");
        return;
      }

      if (!sawReview) return;
      if (!CONFIRM_RE.test(txt)) return;

      // 3-step flow: مراجعة → أكد → تم. Fire only on the SECOND confirm click.
      if (!sawConfirm) {
        sawConfirm = true;
        debug(`✓ ضغطت '${txt}' — استنى آخر تأكيد ('تم') ثم هفتح البيع`, "#10b981");
        return;
      }

      fired = true;
      try { document.removeEventListener("click", onClick, true); } catch {}
      if (Date.now() < __autoSellArmedAt + 30_000) {
        debug("↪︎ auto-sell شُغّل بالفعل من المراقب العام — تخطي", "#6b7280");
        return;
      }
      __autoSellArmedAt = Date.now();
      debug(`✓ تم تأكيد الشراء (${txt}) — بسجّل المركز على السيرفر. البيع هيتحضّر آلياً لما يعدي L2 gate.`, "#10b981");

      // v4.2.7 — Do NOT prepare a local sell here.
      // Rationale: local sell prep bypasses the server-side runTargetSellL2Gate
      // proof that our scalp strategy requires (67.7% real-fill guarantee).
      // Instead: (1) record the position locally, (2) tell background to
      // register the fill on the server. sell-watcher (cron) + pollPositions
      // will then evaluate TP hits through the L2 gate before inserting a
      // pending_orders row. pollOrders (1s) picks up the sell and prepares
      // the form — still stopping at "مراجعة الطلب" for the user.
      setTimeout(async () => {
        try {
          const summary = scrapeOrderSummary(ev.target?.closest?.("button,[role='button']"));
          const avgCost = scrapeAvgCostFromPage();
          const filledQty = Number(summary.qty) || 0;
          const filledPrice = Number(avgCost || summary.price) || 0;
          await upsertOpenTrade({
            symbol, uuid,
            qty: filledQty,
            entryPrice: filledPrice,
            source: "scalp-live/extension-confirmed",
          });
          activeExecution = null;
          if (filledQty > 0 && filledPrice > 0) {
            try {
              chrome.runtime.sendMessage({
                type: "buyConfirmedByReview",
                payload: { symbol, uuid, qty: filledQty, entry_price: filledPrice, source: "review_click_backup" },
              });
            } catch {}
          }
        } catch (e) {
          debug("⚠️ تعذّر تسجيل المركز — راقب يدوياً", "#f59e0b");
        }
      }, 1500);
    };

    try { document.addEventListener("click", onClick, true); } catch {}
    // Auto-detach after 5 min so we never leak listeners.
    setTimeout(() => {
      try { document.removeEventListener("click", onClick, true); } catch {}
    }, 5 * 60_000);
  }

  // ---- Live TP/SL banner for open positions ----
  function ensurePositionsBanner() {
    if (positionsBanner && document.body.contains(positionsBanner)) return positionsBanner;
    positionsBanner = document.createElement("div");
    positionsBanner.style.cssText = "position:fixed;top:60px;left:12px;z-index:2147483646;padding:10px 12px;border-radius:10px;font-family:system-ui,sans-serif;font-size:12px;font-weight:600;direction:rtl;box-shadow:0 6px 24px rgba(0,0,0,0.25);background:#0f172a;color:#fff;width:300px;line-height:1.45;display:none;";
    document.body.appendChild(positionsBanner);
    return positionsBanner;
  }

  function refreshPositionsBanner() {
    const positions = { ...(openPositionsBySymbol || {}) };
    if (demoPosition && demoPosition.symbol) {
      positions[demoPosition.symbol] = {
        ...(positions[demoPosition.symbol] || {}),
        entry: demoPosition.entry,
        tp: demoPosition.tp,
        sl: demoPosition.sl,
        qty: demoPosition.qty,
        current: (debugPriceOverride.price > 0 && Date.now() < debugPriceOverride.until)
          ? debugPriceOverride.price
          : (positions[demoPosition.symbol]?.current || 0),
        __demo: true,
      };
    }
    const symbols = Object.keys(positions);
    if (!symbols.length) {
      if (positionsBanner) positionsBanner.style.display = "none";
      return;
    }
    const banner = ensurePositionsBanner();
    const lines = [];
    for (const sym of symbols) {
      const p = positions[sym];
      const match = Object.values(latestPriceByUuid)
        .filter((info) => info?.symbol === sym && info?.price > 0 && Date.now() - info.ts < 30_000)
        .sort((a, b) => b.ts - a.ts)[0];
      let price = Number(p.current) || match?.price || 0;
      // For demo position with no real price, fall back to debug override.
      if (p.__demo && (!price || price <= 0) && debugPriceOverride.price > 0 && Date.now() < debugPriceOverride.until) {
        price = debugPriceOverride.price;
      }
      const tp = Number(p.tp) || 0;
      const sl = Number(p.sl) || 0;
      const entry = Number(p.entry) || 0;
      const cur = price > 0 ? price.toFixed(3) : "—";
      const pnlPct = (price > 0 && entry > 0) ? (((price - entry) / entry) * 100) : 0;
      const pnlTxt = (price > 0 && entry > 0) ? (pnlPct >= 0 ? "+" : "") + pnlPct.toFixed(2) + "%" : "—";
      const pnlColor = pnlPct >= 0 ? "#10b981" : "#ef4444";

      // TP progress: how far from entry → tp (clamp 0..100). Hits 100 → time to sell.
      let tpProg = 0;
      if (price > 0 && tp > entry && entry > 0) {
        tpProg = Math.max(0, Math.min(100, ((price - entry) / (tp - entry)) * 100));
      }
      // SL progress: how far from entry → sl downward (clamp 0..100). Hits 100 → stop hit.
      let slProg = 0;
      if (price > 0 && sl > 0 && sl < entry && entry > 0) {
        slProg = Math.max(0, Math.min(100, ((entry - price) / (entry - sl)) * 100));
      }
      const tpHit = tpProg >= 100;
      const slHit = slProg >= 100;
      const tpColor = tpHit ? "#10b981" : "#34d399";
      const slColor = slHit ? "#ef4444" : "#f87171";

      const bar = (pct, color, bg) =>
        `<div style="background:${bg};height:8px;border-radius:4px;overflow:hidden;margin-top:3px;">`
        + `<div style="width:${pct.toFixed(1)}%;height:100%;background:${color};transition:width .25s;"></div>`
        + `</div>`;

      const flashTP = tpHit ? "animation:scalpPulse 0.8s ease-in-out infinite;" : "";
      const flashSL = slHit ? "animation:scalpPulse 0.8s ease-in-out infinite;" : "";

      lines.push(
        `<div style="border-top:1px solid #1e293b;padding:6px 0;margin-top:4px;">`
        + `<div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;">`
        + `<span>${p.__demo ? "🧪" : "📍"} <b>${sym}</b> @ ${cur}${p.__demo ? " <span style=\"color:#a78bfa;font-size:10px;\">(تجريبي)</span>" : ""}</span>`
        + `<span style="color:${pnlColor};">${pnlTxt}</span>`
        + `</div>`
        + `<div style="margin-top:4px;font-size:11px;opacity:0.85;display:flex;justify-content:space-between;${flashTP}">`
        + `<span>🎯 TP ${tp ? tp.toFixed(3) : "—"}</span><span style="color:${tpColor};">${tpProg.toFixed(0)}%${tpHit ? " — بيع الآن!" : ""}</span>`
        + `</div>${bar(tpProg, tpColor, "#064e3b")}`
        + `<div style="margin-top:6px;font-size:11px;opacity:0.85;display:flex;justify-content:space-between;${flashSL}">`
        + `<span>🛑 SL ${sl ? sl.toFixed(3) : "—"}</span><span style="color:${slColor};">${slProg.toFixed(0)}%${slHit ? " — وقف الخسارة!" : ""}</span>`
        + `</div>${bar(slProg, slColor, "#450a0a")}`
        + `</div>`
      );
    }
    const header = `<div style="font-size:11px;opacity:0.7;margin-bottom:2px;">⚡ صفقات مفتوحة (${symbols.length})</div>`;
    const style = `<style>@keyframes scalpPulse{0%,100%{opacity:1;}50%{opacity:0.55;}}</style>`;
    banner.innerHTML = style + header + lines.join("");
    banner.style.display = "block";
  }

  function showPositionAlert({ symbol, reason, price, position_id }) {
    const now = Date.now();
    if (position_id && alertedPositions[position_id] && now - alertedPositions[position_id] < 60_000) return;
    if (position_id) alertedPositions[position_id] = now;
    const isTp = reason === "target_hit";
    const color = isTp ? "#10b981" : "#ef4444";
    const text = isTp ? `🎯 ${symbol} وصل الهدف عند ${Number(price).toFixed(3)} — بِيع دلوقتي!` : `🛑 ${symbol} نزل لوقف الخسارة ${Number(price).toFixed(3)} — بِيع فوراً!`;
    try {
      const a = document.createElement("div");
      a.style.cssText = `position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:2147483647;padding:14px 22px;border-radius:10px;font-family:system-ui,sans-serif;font-size:16px;font-weight:700;direction:rtl;box-shadow:0 8px 32px rgba(0,0,0,0.4);background:${color};color:#fff;`;
      a.textContent = text;
      document.body.appendChild(a);
      setTimeout(() => { try { a.remove(); } catch {} }, 30_000);
    } catch {}
    beep(); beep();
  }

  function startDriftGuard({ orderId, symbol, uuid, isSell, refPrice, driftBps, reviewBtn }) {
    if (activeDriftWatcher) { clearInterval(activeDriftWatcher); activeDriftWatcher = null; }
    const ref = Number(refPrice) || 0;
    if (!ref || !uuid) return;
    const thresh = (Number(driftBps) || 100) / 10000; // bps → fraction
    const startedAt = Date.now();
    let warned = false;

    const banner = document.createElement("div");
    banner.style.cssText = "position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:2147483647;padding:10px 16px;border-radius:8px;font-family:system-ui,sans-serif;font-size:14px;font-weight:600;direction:rtl;box-shadow:0 6px 24px rgba(0,0,0,0.25);transition:all .2s;background:#10b981;color:#fff;";
    banner.textContent = `حارس السعر شغّال — مرجع: ${ref.toFixed(3)}`;
    document.body.appendChild(banner);

    activeDriftWatcher = setInterval(() => {
      // Auto-stop after 5 minutes or if user navigated away.
      if (Date.now() - startedAt > 5 * 60_000) { stop(); return; }
      const cur = latestPriceByUuid[uuid];
      if (!cur || Date.now() - cur.ts > 15_000) {
        banner.style.background = "#6b7280";
        banner.textContent = "حارس السعر — لا توجد أسعار حديثة";
        return;
      }
      const price = cur.price;
      const drift = (price - ref) / ref; // + = price up, - = price down
      const adverse = isSell ? -drift : drift; // for buy: price↑ bad; for sell: price↓ bad
      const pct = (drift * 100).toFixed(2);

      if (adverse > thresh) {
        // Bad drift — scream.
        if (!warned) {
          warned = true;
          try { if (reviewBtn) { reviewBtn.style.outline = "3px solid #ef4444"; reviewBtn.style.boxShadow = "0 0 24px rgba(239,68,68,0.9)"; } } catch {}
          beep();
          reportStatus(orderId, "error", `price_drift_${isSell ? "down" : "up"}_${pct}%`);
        }
        banner.style.background = "#ef4444";
        banner.textContent = `⚠️ السعر اتغير ${pct}% — متدوسش! (${price.toFixed(3)} مقابل ${ref.toFixed(3)})`;
      } else if (Math.abs(drift) > thresh / 2) {
        banner.style.background = "#f59e0b";
        banner.textContent = `تنبيه: السعر تحرك ${pct}% (${price.toFixed(3)})`;
      } else {
        banner.style.background = "#10b981";
        banner.textContent = `حارس السعر شغّال — ${price.toFixed(3)} (${pct}%)`;
      }
    }, 1000);

    function stop() {
      if (activeDriftWatcher) { clearInterval(activeDriftWatcher); activeDriftWatcher = null; }
      try { banner.remove(); } catch {}
    }
  }

  function beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "square"; o.frequency.value = 880;
      g.gain.value = 0.15;
      o.connect(g); g.connect(ctx.destination);
      o.start(); setTimeout(() => { o.stop(); ctx.close(); }, 400);
    } catch {}
  }

  // ============================================================
  // v4.1.74 — L2 Auto-Cycle receiver (safe, opt-in)
  // Triggered by background.js opening /assets/{uuid}#l2cycle in a
  // background tab. When we see that hash, we behave exactly like a
  // human curious about the depth panel: wait for the page to be
  // ready, click the accordion once (existing preciseClick), let
  // Thunder's own market-depth response be intercepted passively,
  // then message background so it can close the tab. Never issues
  // any request from the extension itself. No-op on any other page.
  // ============================================================
  (function initL2CycleReceiver() {
    if (!IS_TOP_FRAME) return;
    if (!/#l2cycle\b/.test(location.hash)) return;
    let done = false;
    const finish = (reason) => {
      if (done) return; done = true;
      try { chrome.runtime?.sendMessage?.({ type: "l2cycle.done", payload: { uuid: currentAssetUuid(), reason } }); } catch {}
    };
    const run = async () => {
      try {
        const uuid = currentAssetUuid();
        if (!uuid) { finish("no_uuid"); return; }
        // Human-like settle time after page load (Thunder's SPA needs
        // ~1-2s to render the asset card + accordion).
        await new Promise((r) => setTimeout(r, 1200 + Math.floor(Math.random() * 900)));
        // v4.1.77: keep the depth panel open ~90s so Thunder's ~10s polling
        // feeds us ~9 snapshots per visit (was 1). Purely additive: nothing
        // else runs in this background tab, and it's invisible to the user.
        // v4.1.80: signal symbols (#l2cycle-signal) dwell ~300s so we
        // capture ~30 snapshots around the moment a real trade would fire.
        const isSignal = /#l2cycle-signal\b/.test(location.hash);
        const keepOpenMs = isSignal ? 300_000 : 90_000;
        const ok = await ensureL2SnapshotForUuid(uuid, { maxWaitMs: 6000, keepOpenMs });
        finish(ok ? "snapshot_ok" : "no_accordion");
      } catch {
        finish("error");
      }
    };
    // Kick after DOM is interactive.
    if (document.readyState === "complete" || document.readyState === "interactive") {
      setTimeout(run, 200);
    } else {
      window.addEventListener("DOMContentLoaded", () => setTimeout(run, 200), { once: true });
    }
    // Hard timeout — always tell background to close. Covers whichever
    // keep-open window applied above (90s or 300s) plus a margin.
    const hardTimeoutMs = /#l2cycle-signal\b/.test(location.hash) ? 315_000 : 100_000;
    setTimeout(() => finish("timeout"), hardTimeoutMs);
  })();

  // v4.1.82 — Persistent L2 mode. Triggered by background.js opening
  // /ar/assets/{uuid}#l2persist in a hidden tab. Opens the L2 accordion
  // once and keeps it open for the rest of the trading session.
  // Content.js relies on ensureL2SnapshotForUuid's built-in re-click
  // safety net (v4.1.81) to reopen the accordion if Thunder collapses
  // it. Background.js closes the tab at end of session.
  (function initL2PersistReceiver() {
    if (!IS_TOP_FRAME) return;
    // v4.1.96: تشغيل تلقائي لـ persistent L2 على أي صفحة `/ar/assets/{uuid}`
    // — سواء background فتحها بـ `#l2persist` أو المستخدم فاتحها بإيده.
    // السبب: التابات اليدوي بدون hash كانت مبتاخدش keep-alive أبداً،
    // فبعد ~5د من throttle ثاندر بيقف polling وبنخسر كل L2 (يوم 13/7:
    // 83 snapshot بس). getL2PanelState بيتحقق الأول: لو L2 مفتوح فعلاً
    // مفيش أي كليك (السطر 991)، فمفيش تدخل في تجربة المستخدم.
    // v4.1.97: افتح L2 keep-alive فقط لما background فتح التاب صراحةً بـ
    // `#l2persist`. أي تاب إشارة/شراء يدوي على /assets/{uuid} من غير الهاش
    // ما يفتحش L2 تلقائيًا — كان بيربك المستخدم ومش مطلوب لأن سيرفر
    // sell-watcher شغّال على live_ticks لكل TP/Trailing/SL.
    const hasHash = /#l2persist\b/.test(location.hash);
    if (!hasHash) return;
    const run = async () => {
      try {
        const uuid = currentAssetUuid();
        if (!uuid) return;
        // Human-like settle after page load.
        await new Promise((r) => setTimeout(r, 1500 + Math.floor(Math.random() * 1200)));
        // Very long dwell (~10h). The dwell loop re-clicks the accordion
        // if Thunder collapses it, so snapshots keep flowing.
        startPersistentL2KeepAlive(uuid, hasHash ? "hash" : "asset-page-auto");
      } catch {}
    };
    if (document.readyState === "complete" || document.readyState === "interactive") {
      setTimeout(run, 400);
    } else {
      window.addEventListener("DOMContentLoaded", () => setTimeout(run, 400), { once: true });
    }
  })();

  // v4.1.97-diag: Throttling investigation — post diagnostics every 30s
  // to /api/public/hooks/ext-diag so we can prove which mechanism (Chrome
  // throttle vs. Thunder visibility-pause vs. blocked autoplay) is causing
  // background snapshot gaps. Only runs on Thunder asset pages (top frame).
  (function initThrottlingDiag() {
    if (!IS_TOP_FRAME) return;
    if (!/thndr\.app/i.test(location.host)) return;
    let clientId = null;
    try {
      chrome.storage.local.get(["l2TelemetryClientId"], (r) => {
        clientId = r?.l2TelemetryClientId || null;
        if (!clientId) {
          clientId = (self.crypto?.randomUUID?.() || String(Date.now()) + "-" + Math.random().toString(36).slice(2));
          try { chrome.storage.local.set({ l2TelemetryClientId: clientId }); } catch {}
        }
      });
    } catch {}
    const postDiag = async () => {
      try {
        const a = __diagAudioEl;
        const nowTs = Date.now();
        const audioContextRunning = __diagAudioCtx ? __diagAudioCtx.state === "running" : false;
        const mediaElementPlaying = a ? !Boolean(a.paused) : false;
        const visibleKeepalive = document.visibilityState === "visible";
        const payload = {
          client_id: clientId,
          symbol: __diagLastSymbol,
          visibility_state: document.visibilityState,
          audio_paused: !(mediaElementPlaying || audioContextRunning || visibleKeepalive),
          audio_muted: a ? Boolean(a.muted) : null,
          audio_ready_state: a ? Number(a.readyState) : null,
          audio_current_time: a ? Number(a.currentTime) : null,
          depth_count_30s: __diagDepthCountSinceLastPost,
          last_depth_age_ms: __diagLastDepthTs ? (nowTs - __diagLastDepthTs) : null,
          extra: {
            v: "v4.2.2-observability",
            has_focus: (typeof document.hasFocus === "function") ? document.hasFocus() : null,
            hidden: document.hidden,
            depth_total: __diagDepthCount,
            url_hash: location.hash || null,
            path: location.pathname || null,
            // v4.1.98 — Web Audio keeper state (the real anti-throttle)
            ac_state: __diagAudioCtx ? __diagAudioCtx.state : "null",
            ac_current_time: __diagAudioCtx ? Number(__diagAudioCtx.currentTime) : null,
            ac_started_at: __diagAudioCtxStartedAt || null,
            ac_resume_attempts: __diagAudioResumeAttempts,
            ac_resume_ok: __diagAudioResumeOk,
            l2_soft_resets: __diagL2SoftResets,
            media_element_playing: mediaElementPlaying,
            visible_keepalive: visibleKeepalive,
            effective_keepalive: mediaElementPlaying || audioContextRunning || visibleKeepalive,
            keepalive_strategy: "visible_l2_popup_window",
          },
        };
        __diagDepthCountSinceLastPost = 0;
        await fetch("http://localhost:8090/api/public/hooks/ext-diag", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        });
      } catch {}
    };
    // First post after 5s (to let audio init), then every 30s.
    setTimeout(postDiag, 5000);
    setInterval(postDiag, 30_000);
  })();
})();
