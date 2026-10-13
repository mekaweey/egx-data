// Lovable Chat Logger — background service worker
// يستقبل رسائل من content.js ويبعتها لـ session-log endpoint مع outbox retry.

const DEFAULT_ENDPOINT = "https://meky-stock.onrender.com/api/public/hooks/session-log";
const OUTBOX_KEY = "outbox_v1";
const CONFIG_KEY = "config_v1";
const STATS_KEY = "stats_v1";
const MAX_OUTBOX = 500;

async function getConfig() {
  const r = await chrome.storage.local.get([CONFIG_KEY]);
  return r[CONFIG_KEY] || { endpoint: DEFAULT_ENDPOINT, token: "" };
}
async function getOutbox() {
  const r = await chrome.storage.local.get([OUTBOX_KEY]);
  return r[OUTBOX_KEY] || [];
}
async function setOutbox(box) {
  await chrome.storage.local.set({ [OUTBOX_KEY]: box.slice(-MAX_OUTBOX) });
}
async function bumpStat(key) {
  const r = await chrome.storage.local.get([STATS_KEY]);
  const s = r[STATS_KEY] || { sent: 0, failed: 0, queued: 0, lastOk: null, lastErr: null };
  s[key] = (s[key] || 0) + 1;
  await chrome.storage.local.set({ [STATS_KEY]: s });
}
async function setLast(key, val) {
  const r = await chrome.storage.local.get([STATS_KEY]);
  const s = r[STATS_KEY] || { sent: 0, failed: 0, queued: 0, lastOk: null, lastErr: null };
  s[key] = val;
  await chrome.storage.local.set({ [STATS_KEY]: s });
}

async function sendOne(item, cfg) {
  const body = {
    client_batch_id: `chat-logger-${item.msg_id}-${item.captured_at}`,
    source: "chrome-extension:lovable-chat-logger",
    items: [{
      kind: "message",
      role: item.role,
      content: item.content,
      turn_id: item.turn_id,
    }],
  };
  const res = await fetch(cfg.endpoint || DEFAULT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-thunder-token": cfg.token || "",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json().catch(() => ({}));
}

async function drain() {
  const cfg = await getConfig();
  if (!cfg.token) return; // مفيش توكن، ما نبعتش
  let box = await getOutbox();
  if (!box.length) return;
  const kept = [];
  for (const item of box) {
    try {
      await sendOne(item, cfg);
      await bumpStat("sent");
      await setLast("lastOk", new Date().toISOString());
    } catch (e) {
      item._tries = (item._tries || 0) + 1;
      await bumpStat("failed");
      await setLast("lastErr", `${new Date().toISOString()} ${String(e).slice(0, 200)}`);
      if (item._tries < 20) kept.push(item);
    }
  }
  await setOutbox(kept);
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg) return;
  if (msg.type === "force-drain") { drain().then(() => sendResponse({ ok: true })); return true; }
  if (msg.type !== "chat-message") return;
  (async () => {
    const box = await getOutbox();
    box.push(msg.payload);
    await setOutbox(box);
    await bumpStat("queued");
    drain();
    sendResponse({ ok: true });
  })();
  return true;
});

// alarm كل 30 ثانية للـ retry
chrome.alarms.create("drain", { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener((a) => { if (a.name === "drain") drain(); });

// drain عند البدء
drain();