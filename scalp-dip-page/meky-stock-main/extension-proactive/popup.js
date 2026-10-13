async function load() {
  const s = await chrome.storage.local.get(["token", "proactive_watchlist"]);
  document.getElementById("token").value = s.token || "";
  renderWatchlist(s.proactive_watchlist || []);
  refresh();
}
function renderWatchlist(list) {
  const container = document.getElementById("watchlist");
  container.innerHTML = "";
  list.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "watchlist-item";
    div.innerHTML = '<span>' + item.symbol + '</span><span class="remove-btn" data-index="' + index + '">✖</span>';
    container.appendChild(div);
  });
}
document.getElementById("saveToken").onclick = async () => {
  const token = document.getElementById("token").value.trim();
  await chrome.storage.local.set({ token });
  alert("تم الحفظ");
};
document.getElementById("addSymbol").onclick = async () => {
  const input = document.getElementById("newSymbol");
  const symbol = input.value.trim().toUpperCase();
  if (!symbol) return;
  const s = await chrome.storage.local.get(["proactive_watchlist", "asset_mapping"]);
  const list = s.proactive_watchlist || [];
  const mapping = s.asset_mapping || {};
  const assetId = mapping[symbol];
  if (!assetId) { alert("السهم غير موجود. افتح ثاندر أولاً."); return; }
  if (list.length >= 30) { alert("الحد 30 سهم."); return; }
  if (!list.find(x => x.symbol === symbol)) {
    list.push({ symbol, asset_id: assetId });
    await chrome.storage.local.set({ proactive_watchlist: list });
    renderWatchlist(list);
    input.value = "";
  }
};
document.getElementById("watchlist").onclick = async (e) => {
  if (e.target.classList.contains("remove-btn")) {
    const index = parseInt(e.target.dataset.index);
    const s = await chrome.storage.local.get(["proactive_watchlist"]);
    const list = s.proactive_watchlist || [];
    list.splice(index, 1);
    await chrome.storage.local.set({ proactive_watchlist: list });
    renderWatchlist(list);
  }
};
async function refresh() {
  try {
    const stats = await chrome.runtime.sendMessage({ type: "proactive_get_status" });
    if (!stats) return;
    document.getElementById("sentCount").textContent = stats.sent || 0;
    document.getElementById("mwAssets").textContent = stats.mwCount + " أسهم";
    document.getElementById("lastOk").textContent = stats.lastOk ? new Date(stats.lastOk).toLocaleTimeString() : "--:--";
    document.getElementById("errorText").textContent = stats.lastError || "";
    document.getElementById("statusText").textContent = stats.lastError && stats.lastError.includes("Backoff") ? "خمول" : "نشط";
  } catch (e) {}
}
load();
setInterval(refresh, 2000);
