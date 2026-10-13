/* config.js — Remote Config + Realtime
 *
 * بيقرأ إعدادات الإضافة من Lovable Cloud لحظياً.
 * - أول مرة: REST fetch من Supabase
 * - بعدها: WebSocket Realtime يستقبل أي تعديل في < 1 ثانية
 * - Fallback آمن: لو فشل أي حاجة، نستخدم DEFAULTS المطابقة لـ v2.1.7
 *
 * الإضافة لا تحمّل أي JS من السيرفر (متوافق مع MV3 policy) — config = data only.
 */

const SUPABASE_URL = "https://qomdjswfuwzlktxizgry.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbWRqc3dmdXd6bGt0eGl6Z3J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTQzODQsImV4cCI6MjA5NDg3MDM4NH0.RmYxRvx4pTbvhmNVukj1dECeYuvEAflyYJCI64pzvik";

// DEFAULTS = سلوك v2.1.7 بالظبط. لو الاتصال فشل، الإضافة تشتغل بالقيم دي.
const DEFAULTS = {
  kill_switch: false,
  semi_auto_enabled: true,
  poll_interval_ms: 3000,
  tick_interval_ms: 2000,
  order_expire_seconds: 60,
  human_delay_min_ms: 800,
  human_delay_max_ms: 2500,
  thunder_selectors: {},
  config_version: 0,
};

// HARD LIMITS — حدود صلبة لا config يقدر يتخطاها (حماية ضد config ضار).
const HARD_LIMITS = {
  poll_interval_ms: { min: 1000, max: 60000 },
  tick_interval_ms: { min: 1000, max: 60000 },
  order_expire_seconds: { min: 10, max: 600 },
  human_delay_min_ms: { min: 200, max: 10000 },
  human_delay_max_ms: { min: 500, max: 20000 },
};

let _cache = { ...DEFAULTS };
let _ws = null;
let _wsReconnectTimer = null;
let _heartbeatTimer = null;
let _lastFetchTs = 0;
let _lastError = null;

function clampNumber(key, val) {
  const lim = HARD_LIMITS[key];
  if (!lim || typeof val !== "number" || !isFinite(val)) return val;
  return Math.max(lim.min, Math.min(lim.max, val));
}

function applyRow(row) {
  if (!row || !row.key) return;
  let v = row.value;
  // JSONB primitives come through as native types via REST/Realtime
  if (typeof v === "number") v = clampNumber(row.key, v);
  _cache[row.key] = v;
}

async function fetchInitialConfig() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/extension_config?select=key,value`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) throw new Error(`http_${res.status}`);
    const rows = await res.json();
    const next = { ...DEFAULTS };
    for (const row of rows) {
      let v = row.value;
      if (typeof v === "number") v = clampNumber(row.key, v);
      next[row.key] = v;
    }
    _cache = next;
    _lastFetchTs = Date.now();
    _lastError = null;
    await chrome.storage.local.set({ remoteConfig: _cache, remoteConfigTs: _lastFetchTs });
  } catch (e) {
    _lastError = "fetch_failed: " + String(e?.message || e);
    // نحاول نقرأ آخر نسخة محفوظة في storage (لو الإنترنت فصل)
    const cached = await chrome.storage.local.get(["remoteConfig"]);
    if (cached.remoteConfig) _cache = { ...DEFAULTS, ...cached.remoteConfig };
  }
}

function startRealtime() {
  stopRealtime();
  try {
    const url = `${SUPABASE_URL.replace("https://", "wss://")}/realtime/v1/websocket?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`;
    _ws = new WebSocket(url);

    _ws.addEventListener("open", () => {
      // Subscribe لجدول extension_config
      _ws.send(JSON.stringify({
        topic: "realtime:public:extension_config",
        event: "phx_join",
        payload: {
          config: {
            postgres_changes: [{ event: "*", schema: "public", table: "extension_config" }],
          },
        },
        ref: "1",
      }));
      // Heartbeat كل 25 ثانية
      _heartbeatTimer = setInterval(() => {
        try {
          _ws?.send(JSON.stringify({ topic: "phoenix", event: "heartbeat", payload: {}, ref: String(Date.now()) }));
        } catch {}
      }, 25000);
    });

    _ws.addEventListener("message", (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.event === "postgres_changes") {
          const change = msg.payload?.data;
          if (!change) return;
          const row = change.record || change.new;
          if (change.type === "DELETE") {
            const oldKey = (change.old_record || change.old)?.key;
            if (oldKey) {
              _cache[oldKey] = DEFAULTS[oldKey];
            }
          } else if (row?.key) {
            applyRow(row);
          }
          chrome.storage.local.set({ remoteConfig: _cache, remoteConfigTs: Date.now() });
        }
      } catch {}
    });

    _ws.addEventListener("close", () => {
      clearInterval(_heartbeatTimer);
      scheduleReconnect();
    });
    _ws.addEventListener("error", () => {
      try { _ws?.close(); } catch {}
    });
  } catch (e) {
    _lastError = "ws_failed: " + String(e?.message || e);
    scheduleReconnect();
  }
}

function stopRealtime() {
  clearInterval(_heartbeatTimer);
  clearTimeout(_wsReconnectTimer);
  try { _ws?.close(); } catch {}
  _ws = null;
}

function scheduleReconnect() {
  clearTimeout(_wsReconnectTimer);
  // Reconnect مع backoff (5-15 ثانية عشوائي)
  const delay = 5000 + Math.floor(Math.random() * 10000);
  _wsReconnectTimer = setTimeout(() => {
    fetchInitialConfig().finally(startRealtime);
  }, delay);
}

function getConfig(key, fallback) {
  const v = _cache[key];
  return v === undefined ? (fallback !== undefined ? fallback : DEFAULTS[key]) : v;
}

function getRemoteConfigStatus() {
  return {
    cache: _cache,
    lastFetchTs: _lastFetchTs,
    wsReady: _ws?.readyState === WebSocket.OPEN,
    lastError: _lastError,
  };
}

// تشغيل تلقائي
async function initRemoteConfig() {
  await fetchInitialConfig();
  startRealtime();
}

// Restore from storage على فور تحميل الـ SW (قبل أول fetch)
chrome.storage.local.get(["remoteConfig"]).then((s) => {
  if (s.remoteConfig) _cache = { ...DEFAULTS, ...s.remoteConfig };
});
