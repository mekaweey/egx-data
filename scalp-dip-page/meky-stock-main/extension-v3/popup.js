const $ = (id) => document.getElementById(id);

async function refresh() {
  try {
    const r = await chrome.runtime.sendMessage({ type: "getStatus" });
    if (!r?.ok) return;
    const s = r.stats || {};
    $("attached").textContent = s.attached ? `متصل (tab ${r.attachedTabId})` : "غير متصل";
    $("attached").className = s.attached ? "on" : "off";
    $("frames").textContent = s.framesSeen || 0;
    $("ticks").textContent = s.ticksParsed || 0;
    $("symbols").textContent = r.mappedSymbols || 0;
    $("sent").textContent = s.ticksSent || 0;
    $("lastTick").textContent = s.lastTick ? `${s.lastTick.symbol} @ ${s.lastTick.price}` : "—";
    $("lastFlush").textContent = s.lastFlush ? new Date(s.lastFlush).toLocaleTimeString() : "—";
    $("err").textContent = s.lastError || "";
    const disc = (r.discoveryLog || []).slice(-15).reverse();
    $("discovery").innerHTML = disc.length
      ? disc.map((d) => `<div>[${d.kind}] ${d.url.slice(0, 80)}</div>`).join("")
      : "—";
    const raws = (r.rawSamples || []).slice().reverse();
    $("rawSamples").innerHTML = raws.length
      ? raws.map((s) => `<div>[${s.kind}] ${escapeHtml(s.sample)}</div>`).join("")
      : "—";
  } catch (e) {
    $("err").textContent = "popup: " + e.message;
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function loadToken() {
  const { token } = await chrome.storage.local.get(["token"]);
  if (token) $("token").value = token;
}

$("saveToken").onclick = async () => {
  const token = $("token").value.trim();
  const r = await chrome.runtime.sendMessage({ type: "setToken", token });
  $("saveToken").textContent = r?.ok ? "اتحفظ ✓" : "فشل";
  setTimeout(() => ($("saveToken").textContent = "حفظ الـ Token"), 1500);
};

$("attach").onclick = async () => {
  $("attach").textContent = "جاري الاتصال...";
  const r = await chrome.runtime.sendMessage({ type: "attachActiveTab" });
  $("attach").textContent = r?.ok ? `متصل: ${(r.title || "").slice(0, 30)}` : (r?.error || "فشل");
  setTimeout(() => ($("attach").textContent = "اتصال بتاب ثاندر النشط"), 2500);
  refresh();
};

$("detach").onclick = async () => {
  await chrome.runtime.sendMessage({ type: "detach" });
  refresh();
};

$("clearDisc").onclick = async () => {
  await chrome.runtime.sendMessage({ type: "clearDiscovery" });
  refresh();
};

loadToken();
refresh();
setInterval(refresh, 1000);