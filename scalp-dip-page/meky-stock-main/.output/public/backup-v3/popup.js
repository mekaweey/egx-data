async function load() {
  const s = await chrome.storage.local.get(["token", "enabled", "watchlist"]);
  document.getElementById("token").value = s.token || "";
  document.getElementById("watchlist").value = (s.watchlist || []).join(", ");
  setToggle(s.enabled !== false);
  refresh();
}

function setToggle(on) {
  const btn = document.getElementById("toggle");
  btn.textContent = on ? "شغّال ✓" : "متوقف ✗";
  btn.className = on ? "toggle-on" : "toggle-off";
  btn.dataset.on = on ? "1" : "0";
}

document.getElementById("save").onclick = async () => {
  const token = document.getElementById("token").value.trim();
  const watchlistRaw = document.getElementById("watchlist").value;
  const watchlist = watchlistRaw.split(",")
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  await chrome.storage.local.set({ token, watchlist });
  const btn = document.getElementById("save");
  btn.textContent = "اتحفظ ✓";
  setTimeout(() => (btn.textContent = "حفظ"), 1200);
  refresh();
};

document.getElementById("toggle").onclick = async () => {
  const on = document.getElementById("toggle").dataset.on === "1";
  await chrome.storage.local.set({ enabled: !on });
  setToggle(!on);
};

async function refresh() {
  const s = await chrome.storage.local.get(["watchlist", "stats", "marketwatch_last"]);
  document.getElementById("wCount").textContent = (s.watchlist || []).length;
  
  const status = await chrome.runtime.sendMessage({ type: "getStatus" }).catch(() => null);
  if (status) {
    document.getElementById("sent").textContent = status.stats?.sent || 0;
    document.getElementById("err").textContent = status.stats?.lastError || "";
  }

  if (s.marketwatch_last?.timestamp) {
    document.getElementById("mwTime").textContent = new Date(s.marketwatch_last.timestamp).toLocaleTimeString();
  }
}

load();
setInterval(refresh, 2000);