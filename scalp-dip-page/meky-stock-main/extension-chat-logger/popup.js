const $ = (id) => document.getElementById(id);

async function load() {
  const r = await chrome.storage.local.get(["config_v1", "stats_v1", "outbox_v1"]);
  const cfg = r.config_v1 || {};
  $("endpoint").value = cfg.endpoint || "https://meky-stock.onrender.com/api/public/hooks/session-log";
  $("token").value = cfg.token || "";
  const s = r.stats_v1 || {};
  const box = r.outbox_v1 || [];
  $("stats").innerHTML = `
    <div>Queued lifetime: ${s.queued || 0}</div>
    <div>Sent: ${s.sent || 0}</div>
    <div>Failed attempts: ${s.failed || 0}</div>
    <div>Outbox pending: <b>${box.length}</b></div>
    <div class="ok">آخر نجاح: ${s.lastOk || "—"}</div>
    <div class="err">آخر خطأ: ${s.lastErr || "—"}</div>
  `;
}

$("save").addEventListener("click", async () => {
  await chrome.storage.local.set({
    config_v1: { endpoint: $("endpoint").value.trim(), token: $("token").value.trim() },
  });
  load();
});

$("test").addEventListener("click", async () => {
  const cfg = { endpoint: $("endpoint").value.trim(), token: $("token").value.trim() };
  try {
    const res = await fetch(cfg.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-thunder-token": cfg.token },
      body: JSON.stringify({
        client_batch_id: `chat-logger-test-${Date.now()}`,
        source: "chrome-extension:lovable-chat-logger:test",
        items: [{ kind: "message", role: "user", content: `[TEST] ${new Date().toISOString()}`, turn_id: `test-${Date.now()}` }],
      }),
    });
    const text = await res.text();
    alert(`HTTP ${res.status}\n${text.slice(0, 500)}`);
  } catch (e) {
    alert("Error: " + e.message);
  }
  load();
});

$("drain").addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "force-drain" }).catch(() => {});
  setTimeout(load, 1000);
});

load();
setInterval(load, 2000);