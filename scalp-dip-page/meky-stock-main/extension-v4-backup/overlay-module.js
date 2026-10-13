/*
 * Thunder Unified v4 — Overlay module (from v3).
 * Wrapped in IIFE + idempotency guard + feature flag check.
 * Co-exists with v1 content.js since DOM IDs (__meky_*) and storage keys
 * are unique and there's no chrome.runtime listener.
 */
(async function () {
  if (window.__thunderV4OverlayInjected) return;
  window.__thunderV4OverlayInjected = true;

  // Top-frame only — same guard v1 uses for UI features.
  try { if (window.top !== window) return; } catch {}

  // Feature flag: skip if user disabled overlay in popup.
  try {
    const { v4_features } = await chrome.storage.local.get(["v4_features"]);
    if (v4_features && v4_features.overlay === false) return;
  } catch {}

const ADVICE_ENDPOINT = "https://meky-stock.onrender.com/api/public/hooks/strategy-advice";
const REFRESH_MS = 4000;

let currentSymbol = null;
let pollTimer = null;
let collapsed = false;
let shadowRoot = null;   // isolated DOM so Thunder CSS can't blank the overlay
let checkScheduled = false;
const uuidToSymbolCache = new Map();
let lastUuidAsked = null;

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function extractUuid() {
  const m = location.pathname.match(UUID_RE) || location.search.match(UUID_RE);
  return m ? m[0].toLowerCase() : null;
}

async function resolveSymbolFromUuid(uuid) {
  if (!uuid) return null;
  if (uuidToSymbolCache.has(uuid)) return uuidToSymbolCache.get(uuid);
  try {
    const res = await chrome.runtime.sendMessage({ type: "getSymbolForUuid", payload: { uuid } });
    const sym = res?.symbol || null;
    if (sym) uuidToSymbolCache.set(uuid, sym);
    return sym;
  } catch { return null; }
}

// Clean up any old manual override from previous versions so it can't
// "stick" the overlay on a stale symbol.
try { localStorage.removeItem("__meky_manual_symbol"); } catch {}

const STOP_TOKENS = new Set([
  "STOCKS","STOCK","TRADING","MARKETS","ORDERS","PORTFOLIO","HOME","SEARCH",
  "WATCHLIST","COMPANY","COMPANIES","EGP","USD","EUR","GBP","SAR","AED",
  "BUY","SELL","ASK","BID","LOT","QTY","THNDR","THUNDER","EGX","CAIRO",
  "MARKET","PRICE","CHART","NEWS","INFO","ABOUT","LOGIN","LOGOUT","PROFILE",
  "SETTINGS","ACCOUNT","WALLET","DEPOSIT","WITHDRAW","HELP","SUPPORT","FAQ",
  "TERMS","PRIVACY","ARABIC","ENGLISH","AR","EN","DETAILS","OVERVIEW",
  "PERFORMANCE","FINANCIALS","STATISTICS","DIVIDENDS","HOLDINGS","CASH",
  "BALANCE","TRANSACTIONS","EXPLORE","DISCOVER","ASSET","ASSETS","SECURITY",
  "SECURITIES","EQUITY","EQUITIES","FUND","FUNDS","ETF","ETFS","INDEX",
  "INDICES","ORDER","LIMIT","TODAY","GAINERS","LOSERS","MOST","ACTIVE"
]);

function looksLikeTicker(s) {
  if (!s) return false;
  return /^[A-Z][A-Z0-9]{2,7}$/.test(s) && !STOP_TOKENS.has(s);
}

function extractTickers(text) {
  const cleaned = String(text || "").toUpperCase().replace(/\.(CA|EG|EGX)\b/g, " ");
  return (cleaned.match(/\b[A-Z][A-Z0-9]{2,7}\b/g) || []).filter(looksLikeTicker);
}

function isVisible(el) {
  if (!el || !(el instanceof Element)) return false;
  if (el.closest("[hidden],[aria-hidden='true']")) return false;
  const style = getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse" || Number(style.opacity) === 0) return false;
  const rect = el.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return false;
  // Ignore stale/off-screen DOM left by Thunder's SPA route transitions.
  if (rect.bottom < 0 || rect.top > window.innerHeight * 1.25) return false;
  return true;
}

function bestVisibleDomSymbol() {
  const selectors = [
    "h1", "h2", "h3", "h4",
    "[data-symbol]", "[data-ticker]", "[data-stock]", "[data-code]",
    "[class*='symbol']", "[class*='ticker']", "[class*='code']",
    "[class*='Symbol']", "[class*='Ticker']", "[class*='Code']",
    "[class*='asset']", "[class*='instrument']", "[id*='symbol']", "[id*='ticker']",
  ].join(",");
  let best = null;
  for (const el of document.querySelectorAll(selectors)) {
    if (!isVisible(el)) continue;
    const tag = el.tagName;
    const rect = el.getBoundingClientRect();
    const attrText = ["data-symbol", "data-ticker", "data-stock", "data-code", "aria-label", "title"]
      .map((a) => el.getAttribute(a) || "")
      .join(" ");
    const bodyText = (el.textContent || "").trim();
    const sourceText = `${attrText} ${bodyText.length <= 120 ? bodyText : ""}`;
    for (const ticker of extractTickers(sourceText)) {
      let score = 10;
      if (tag === "H1") score += 100;
      else if (tag === "H2") score += 80;
      else if (tag === "H3") score += 60;
      else if (tag === "H4") score += 45;
      if (attrText.includes(ticker)) score += 70;
      if (/symbol|ticker|code|asset|instrument/i.test(`${el.id} ${el.className}`)) score += 35;
      score += Math.max(0, 40 - rect.top / 20);
      if (!best || score > best.score) best = { ticker, score };
    }
  }
  return best?.ticker || null;
}

function detectSymbol() {
  // Thunder URLs: /stocks/COMI, /stock/COMI.CA, /trading/COMI, etc.
  const tokens = location.pathname.split("/").filter(Boolean);
  for (const t of tokens) {
    const cleaned = decodeURIComponent(t).toUpperCase().replace(/\.(CA|EG|EGX)$/, "");
    if (looksLikeTicker(cleaned)) return cleaned;
  }
  // Query string fallback (?symbol=COMI)
  try {
    const qp = new URLSearchParams(location.search);
    for (const k of ["symbol","ticker","code","s"]) {
      const v = (qp.get(k) || "").toUpperCase().replace(/\.(CA|EG|EGX)$/, "");
      if (looksLikeTicker(v)) return v;
    }
  } catch {}
  // DOM fallback: visible, on-screen elements only. This avoids stale hidden
  // React route content that made the overlay stay on the previous stock.
  const visibleSymbol = bestVisibleDomSymbol();
  if (visibleSymbol) return visibleSymbol;
  // Last resort only: document.title can lag during SPA transitions.
  const titleSymbol = extractTickers(document.title)[0];
  if (titleSymbol) return titleSymbol;
  return null;
}

function ensureRoot() {
  if (shadowRoot) return shadowRoot;
  const host = document.createElement("div");
  host.id = "__meky_advice_host";
  // host stays in normal DOM but its style is isolated from page CSS via shadow.
  host.style.cssText = `
    all: initial; position: fixed; z-index: 2147483647;
  `;
  document.documentElement.appendChild(host);
  applyHostPosition(host);
  shadowRoot = host.attachShadow({ mode: "open" });
  // Border ring overlay — green/orange/red glow around the page edges.
  // pointer-events:none so it NEVER intercepts clicks on Thunder UI.
  const ring = document.createElement("div");
  ring.id = "__meky_ring";
  ring.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none; z-index: 2147483646;
    border: 0 solid transparent; box-sizing: border-box;
    transition: border-color .25s ease, box-shadow .25s ease;
  `;
  shadowRoot.appendChild(ring);
  // Inner wrapper holds the visible card; all subsequent renders target this.
  const inner = document.createElement("div");
  inner.id = "__meky_advice_root";
  inner.style.cssText = `
    width: 320px; font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    direction: rtl; color: #f1f5f9; background: #0f172a;
    border: 1px solid #334155; border-radius: 12px;
    box-shadow: 0 12px 40px rgba(0,0,0,.5); overflow: hidden;
    transition: all .2s ease; box-sizing: border-box;
  `;
  shadowRoot.appendChild(inner);
  return shadowRoot;
}

// Adaptive position: on stock detail pages put the panel at the top-right
// (next to the live price, where there is empty space). On watchlist /
// portfolio / other pages drop it to the bottom-right so it doesn't cover
// the table rows. A user-dragged position (saved in localStorage) always wins.
function computePosition() {
  try {
    const saved = JSON.parse(localStorage.getItem("__meky_pos") || "null");
    if (saved && typeof saved.top === "string") return saved;
  } catch {}
  const path = (location.pathname || "").toLowerCase();
  const isStock = /\/(stocks?|symbol|ticker)\//.test(path) || /\/[A-Z]{2,6}(\/|$)/.test(location.pathname);
  if (isStock) return { top: "80px", right: "16px", bottom: "", left: "" };
  return { top: "", right: "16px", bottom: "16px", left: "" };
}
function applyHostPosition(hostEl) {
  const host = hostEl || document.getElementById("__meky_advice_host");
  if (!host) return;
  const p = computePosition();
  host.style.top = p.top || "";
  host.style.right = p.right || "";
  host.style.bottom = p.bottom || "";
  host.style.left = p.left || "";
}
function savePosition(pos) {
  try { localStorage.setItem("__meky_pos", JSON.stringify(pos)); } catch {}
}
// Allow the user to drag the panel by its header.
function makeDraggable(handleEl) {
  if (!handleEl || handleEl.__mekyDrag) return;
  handleEl.__mekyDrag = true;
  handleEl.style.cursor = "move";
  handleEl.addEventListener("mousedown", (e) => {
    const host = document.getElementById("__meky_advice_host");
    if (!host) return;
    e.preventDefault();
    const rect = host.getBoundingClientRect();
    const offX = e.clientX - rect.left;
    const offY = e.clientY - rect.top;
    const move = (ev) => {
      const x = Math.max(0, Math.min(window.innerWidth - rect.width, ev.clientX - offX));
      const y = Math.max(0, Math.min(window.innerHeight - rect.height, ev.clientY - offY));
      host.style.left = x + "px";
      host.style.top = y + "px";
      host.style.right = "";
      host.style.bottom = "";
    };
    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      savePosition({ top: host.style.top, left: host.style.left, right: "", bottom: "" });
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  });
}

function setRing(verdict) {
  const ring = $id("__meky_ring");
  if (!ring) return;
  // green = safe to enter (price <= entry / inside buy zone)
  // orange = price slightly above entry (small overshoot)
  // red = strategy says don't enter (expensive >0.5%, stop_zone, or sell)
  // off = no plan / no price
  let color = null, glow = null;
  if (verdict === "safe") { color = "#16a34a"; glow = "0 0 24px 4px rgba(22,163,74,.55) inset"; }
  else if (verdict === "near") { color = "#f97316"; glow = "0 0 24px 4px rgba(249,115,22,.55) inset"; }
  else if (verdict === "expensive" || verdict === "stop_zone") { color = "#dc2626"; glow = "0 0 28px 6px rgba(220,38,38,.6) inset"; }
  if (color) {
    ring.style.border = `6px solid ${color}`;
    ring.style.boxShadow = glow;
  } else {
    ring.style.border = "0 solid transparent";
    ring.style.boxShadow = "none";
  }
}

function ringVerdict(data) {
  const plan = data.plan;
  const live = data.live;
  if (!plan || !live) return null;
  if (data.verdict === "stop_zone") return "stop_zone";
  if (plan.signal === "sell") return "expensive";
  const p = live.price;
  const entry = plan.buyMax ?? plan.buyMin;
  if (entry == null) return null;
  const drift = (p - entry) / entry; // positive = above entry
  if (drift <= 0) return "safe";              // at or below entry → green
  if (drift <= 0.005) return "near";          // 0–0.5% above → orange
  return "expensive";                          // >0.5% above → red
}

function rootEl() {
  const sr = ensureRoot();
  return sr.getElementById("__meky_advice_root");
}
function $id(id) {
  return shadowRoot ? shadowRoot.getElementById(id) : null;
}

function renderEmpty(msg) {
  const root = rootEl();
  root.style.width = "320px";
  root.innerHTML = `
    <div style="padding:10px 12px;background:#1e293b;display:flex;justify-content:space-between;align-items:center;">
      <div style="font-size:12px;color:#94a3b8;">📊 توصية الاستراتيجية</div>
      <button id="__meky_close" title="إخفاء" style="background:none;border:0;color:#94a3b8;cursor:pointer;font-size:14px;">✕</button>
    </div>
    <div style="padding:14px;font-size:12px;color:#94a3b8;line-height:1.7;">
      <div>${msg}</div>
    </div>
  `;
  wireClose();
  const header = root.firstElementChild;
  makeDraggable(header);
}

function colorFor(verdict) {
  if (verdict === "safe") return { bar: "#16a34a", text: "#4ade80" };
  if (verdict === "expensive") return { bar: "#ca8a04", text: "#facc15" };
  if (verdict === "stop_zone") return { bar: "#dc2626", text: "#f87171" };
  return { bar: "#475569", text: "#cbd5e1" };
}

function fmt(n, d = 2) {
  if (n == null || !Number.isFinite(n)) return "—";
  return Number(n).toFixed(d);
}

function render(data) {
  const root = rootEl();
  const c = colorFor(data.verdict);
  setRing(ringVerdict(data));
  const plan = data.plan;
  const live = data.live;
  const ageBadge = live ? `<span style="color:#64748b;font-size:10px;">منذ ${live.ageSec}ث · ${live.source}</span>` : "";

  if (collapsed) {
    root.style.width = "auto";
    root.innerHTML = `
      <div id="__meky_expand" style="padding:8px 14px;background:${c.bar};cursor:pointer;font-size:12px;font-weight:600;color:#fff;">
        ${data.symbol} · ${live ? fmt(live.price) : "—"} · ${data.verdict === "safe" ? "✅" : data.verdict === "expensive" ? "⚠️" : data.verdict === "stop_zone" ? "⛔" : "❓"}
      </div>
    `;
    $id("__meky_expand").onclick = () => { collapsed = false; if (currentSymbol) refresh(currentSymbol); };
    return;
  }

  root.style.width = "320px";
  root.innerHTML = `
    <div style="height:4px;background:${c.bar};"></div>
    <div style="padding:10px 14px;background:#1e293b;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-size:14px;font-weight:700;color:#f1f5f9;">${data.symbol}</div>
        <div style="font-size:10px;color:#64748b;margin-top:2px;">توصية الاستراتيجية</div>
      </div>
      <div style="display:flex;gap:6px;">
        <button id="__meky_min" title="تصغير" style="background:none;border:0;color:#94a3b8;cursor:pointer;font-size:14px;">—</button>
        <button id="__meky_close" title="إخفاء" style="background:none;border:0;color:#94a3b8;cursor:pointer;font-size:14px;">✕</button>
      </div>
    </div>

    <div style="padding:14px;display:flex;flex-direction:column;gap:10px;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;">
        <span style="font-size:11px;color:#94a3b8;">السعر اللحظي</span>
        <span style="font-size:22px;font-weight:700;color:#f1f5f9;">${live ? fmt(live.price) : "—"}</span>
      </div>
      <div style="text-align:left;">${ageBadge}</div>

      <div style="background:${c.bar}22;border:1px solid ${c.bar};border-radius:8px;padding:10px;text-align:center;">
        <div style="color:${c.text};font-size:13px;font-weight:600;line-height:1.5;">${data.verdictAr}</div>
      </div>

      ${plan ? `
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#94a3b8;">
          <span>المصدر: <b style="color:${plan.source === "scalp" ? "#f97316" : "#60a5fa"};">${plan.source === "scalp" ? "⚡ Scalp Live" : plan.source === "sniper" ? "🎯 Sniper" : "📊 Reco"}</b></span>
          <span>${new Date(plan.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px;">
          <div style="background:#0f172a;border:1px solid #1e293b;border-radius:6px;padding:8px;">
            <div style="color:#94a3b8;">منطقة الشراء</div>
            <div style="color:#4ade80;font-weight:600;font-size:13px;margin-top:2px;">${fmt(plan.buyMin)} – ${fmt(plan.buyMax)}</div>
          </div>
          <div style="background:#0f172a;border:1px solid #1e293b;border-radius:6px;padding:8px;">
            <div style="color:#94a3b8;">الهدف (بيع)</div>
            <div style="color:#60a5fa;font-weight:600;font-size:13px;margin-top:2px;">${fmt(plan.target)}</div>
          </div>
          <div style="background:#0f172a;border:1px solid #1e293b;border-radius:6px;padding:8px;">
            <div style="color:#94a3b8;">وقف الخسارة</div>
            <div style="color:#f87171;font-weight:600;font-size:13px;margin-top:2px;">${fmt(plan.stop)}</div>
          </div>
          <div style="background:#0f172a;border:1px solid #1e293b;border-radius:6px;padding:8px;">
            <div style="color:#94a3b8;">الثقة / الإشارة</div>
            <div style="color:#facc15;font-weight:600;font-size:13px;margin-top:2px;">${plan.signal.toUpperCase()} ${plan.confidence != null ? "· " + plan.confidence + "%" : ""}</div>
          </div>
        </div>
        ${data.upsidePct != null || data.downsidePct != null ? `
          <div style="display:flex;justify-content:space-between;font-size:11px;color:#94a3b8;padding-top:4px;border-top:1px solid #1e293b;">
            <span>الربح المحتمل: <b style="color:#4ade80;">${data.upsidePct != null ? data.upsidePct.toFixed(1) + "%" : "—"}</b></span>
            <span>الخسارة المحتملة: <b style="color:#f87171;">${data.downsidePct != null ? data.downsidePct.toFixed(1) + "%" : "—"}</b></span>
          </div>
        ` : ""}
      ` : `<div style="font-size:11px;color:#94a3b8;text-align:center;padding:8px;">لا توجد توصية بعد لهذا السهم</div>`}

      <button id="__meky_manual_sell"
        style="margin-top:6px;padding:10px;border:0;border-radius:8px;background:#7c3aed;color:#fff;font-weight:700;font-size:12px;cursor:pointer;font-family:inherit;">
        💰 بيع الآن (يدوي)
      </button>
      <div style="font-size:9px;color:#64748b;text-align:center;margin-top:-4px;">يفتح نافذة البيع T0 + أسهم + الحد الأقصى + السعر الآمن. مينفذش لو في بيع تلقائي بدأ.</div>
    </div>
  `;
  wireClose();
  const minBtn = $id("__meky_min");
  if (minBtn) minBtn.onclick = () => { collapsed = true; render(data); };
  const sellBtn = $id("__meky_manual_sell");
  if (sellBtn) {
    sellBtn.onclick = () => {
      if (sellBtn.dataset.locked === "1") return;
      sellBtn.dataset.locked = "1";
      const original = sellBtn.textContent;
      sellBtn.textContent = "⏳ جاري الفتح...";
      sellBtn.style.opacity = "0.6";
      const uuid = extractUuid();
      try {
        document.dispatchEvent(new CustomEvent("__thunder_manual_sell", {
          detail: { symbol: data.symbol, uuid },
          bubbles: true,
          composed: true,
        }));
      } catch {}
      setTimeout(() => {
        sellBtn.dataset.locked = "0";
        sellBtn.textContent = original;
        sellBtn.style.opacity = "1";
      }, 30_000);
    };
  }
  // header is the second child (after the 4px color bar)
  makeDraggable(root.children[1]);
}

function wireClose() {
  const btn = $id("__meky_close");
  if (btn) btn.onclick = () => {
    const host = document.getElementById("__meky_advice_host");
    if (host) host.remove();
    shadowRoot = null;
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    currentSymbol = null;
  };
}

async function refresh(symbol) {
  try {
    const res = await fetch(`${ADVICE_ENDPOINT}?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store" });
    if (!res.ok) { setRing(null); renderEmpty(`فشل جلب التوصية (${res.status})`); return; }
    const data = await res.json();
    if (!data.ok) { setRing(null); renderEmpty(data.error || "خطأ"); return; }
    render({ ...data, symbol });
  } catch (e) {
    setRing(null);
    renderEmpty("لا يمكن الاتصال بالسيرفر");
  }
}

function startPolling(symbol) {
  if (pollTimer) clearInterval(pollTimer);
  currentSymbol = symbol;
  refresh(symbol);
  pollTimer = setInterval(() => { if (currentSymbol) refresh(currentSymbol); }, REFRESH_MS);
}

async function check() {
  let sym = detectSymbol();
  if (!sym) {
    // Thunder asset URLs use UUIDs like /ar/assets/<uuid>. Resolve via background mapping.
    const uuid = extractUuid();
    if (uuid) {
      if (uuidToSymbolCache.has(uuid)) {
        sym = uuidToSymbolCache.get(uuid);
      } else if (uuid !== lastUuidAsked) {
        lastUuidAsked = uuid;
        sym = await resolveSymbolFromUuid(uuid);
      }
    }
  }
  applyHostPosition();
  if (!sym) {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    currentSymbol = null;
    setRing(null);
    const uuid = extractUuid();
    renderEmpty(uuid
      ? "بستنى أعرف رمز السهم… افتح قائمة المراقبة لثانية واحدة عشان الاكستنشن تتعرف على الرمز ⏳"
      : "افتح أي سهم على ثاندر وسيظهر تحليله هنا تلقائياً ⏳");
    return;
  }
  if (sym !== currentSymbol) startPolling(sym);
}

function scheduleCheck(delay = 250) {
  if (checkScheduled) return;
  checkScheduled = true;
  setTimeout(() => {
    checkScheduled = false;
    check();
  }, delay);
}

// Run on load, on URL changes (SPA), and on a periodic check (some apps mutate DOM without URL change).
check();
const _push = history.pushState;
history.pushState = function () { _push.apply(this, arguments); scheduleCheck(); };
const _replace = history.replaceState;
history.replaceState = function () { _replace.apply(this, arguments); scheduleCheck(); };
window.addEventListener("popstate", () => scheduleCheck());
window.addEventListener("hashchange", () => scheduleCheck());
new MutationObserver(() => scheduleCheck(350)).observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["data-symbol", "data-ticker", "data-stock", "data-code", "class", "aria-label", "title"],
});
setInterval(check, 2000);

})(); // end IIFE
