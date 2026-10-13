const DEFAULT_ENDPOINT = "https://meky-stock.onrender.com/api/public/hooks/thunder-ticks";
const MIN_SCALP_CASH_EGP = 1000;

async function load() {
  const s = await chrome.storage.local.get(["token", "endpoint", "enabled", "autoExec", "maxPerDay", "egpPerTrade", "qtyMode", "fixedQty", "alwaysNewTab", "priceSourceUrl"]);
  document.getElementById("token").value = s.token || "";
  document.getElementById("endpoint").value = s.endpoint || DEFAULT_ENDPOINT;
  const psu = document.getElementById("priceSourceUrl");
  if (psu) psu.value = s.priceSourceUrl ?? "https://web.thndr.app/ar/watchlist";
  document.getElementById("egpPerTrade").value = Math.max(MIN_SCALP_CASH_EGP, Number(s.egpPerTrade) || MIN_SCALP_CASH_EGP);
  document.getElementById("maxPerDay").value = s.maxPerDay ?? 3;
  document.getElementById("qtyMode").value = s.qtyMode === "fixed" ? "fixed" : "auto";
  document.getElementById("fixedQty").value = s.fixedQty ?? "";
  document.getElementById("fixedQtyWrap").style.display = s.qtyMode === "fixed" ? "block" : "none";
  await chrome.storage.local.set({ alwaysNewTab: true, autoSell: false });
  document.getElementById("alwaysNewTab").value = "true";
  setToggle(s.enabled !== false);
  setAutoExec(s.autoExec === true);
}

function setToggle(on) {
  const btn = document.getElementById("toggle");
  btn.textContent = on ? "شغّال ✓" : "متوقف ✗";
  btn.className = on ? "toggle-on" : "toggle-off";
  btn.dataset.on = on ? "1" : "0";
}
function setAutoExec(on) {
  const btn = document.getElementById("autoExecBtn");
  btn.textContent = on ? "Semi-Auto: شغّال ✓" : "Semi-Auto: متوقف ✗";
  btn.className = on ? "toggle-on" : "toggle-off";
  btn.dataset.on = on ? "1" : "0";
}

document.getElementById("save").onclick = async () => {
  const token = document.getElementById("token").value.trim();
  const endpoint = document.getElementById("endpoint").value.trim() || DEFAULT_ENDPOINT;
  const egpPerTrade = Math.max(MIN_SCALP_CASH_EGP, Number(document.getElementById("egpPerTrade").value) || MIN_SCALP_CASH_EGP);
  const maxPerDay = Math.max(1, Math.min(50, Number(document.getElementById("maxPerDay").value) || 3));
  const priceSourceUrl = (document.getElementById("priceSourceUrl")?.value || "").trim();
  await chrome.storage.local.set({ token, v4_token: token, endpoint, egpPerTrade, maxPerDay, priceSourceUrl });
  const btn = document.getElementById("save");
  btn.textContent = "اتحفظ ✓";
  setTimeout(() => (btn.textContent = "حفظ"), 1200);
};

document.getElementById("toggle").onclick = async () => {
  const on = document.getElementById("toggle").dataset.on === "1";
  await chrome.storage.local.set({ enabled: !on });
  setToggle(!on);
};
document.getElementById("autoExecBtn").onclick = async () => {
  const on = document.getElementById("autoExecBtn").dataset.on === "1";
  if (!on) {
    const ok = confirm("تأكيد: الـ Extension هيفتح ثاندر ويملي بيانات الشراء تلقائياً.\nانت اللي هتضغط 'مراجعة الطلب' في الآخر.\nموافق؟");
    if (!ok) return;
  }
  await chrome.storage.local.set({ autoExec: !on });
  setAutoExec(!on);
};

async function flashSaved(btn, originalText) {
  btn.textContent = "اتحفظ ✓";
  btn.classList.add("saved");
  setTimeout(() => {
    btn.textContent = originalText;
    btn.classList.remove("saved");
  }, 1200);
}

document.getElementById("saveEgp").onclick = async () => {
  const btn = document.getElementById("saveEgp");
  const input = document.getElementById("egpPerTrade");
  const egpPerTrade = Math.max(MIN_SCALP_CASH_EGP, Number(input.value) || MIN_SCALP_CASH_EGP);
  input.value = egpPerTrade;
  await chrome.storage.local.set({ egpPerTrade });
  flashSaved(btn, "حفظ المبلغ");
};

document.getElementById("saveMax").onclick = async () => {
  const btn = document.getElementById("saveMax");
  const input = document.getElementById("maxPerDay");
  const maxPerDay = Math.max(1, Math.min(50, Number(input.value) || 3));
  input.value = maxPerDay;
  await chrome.storage.local.set({ maxPerDay });
  flashSaved(btn, "حفظ العدد");
};

document.getElementById("qtyMode").onchange = () => {
  const mode = document.getElementById("qtyMode").value === "fixed" ? "fixed" : "auto";
  document.getElementById("fixedQtyWrap").style.display = mode === "fixed" ? "block" : "none";
};

document.getElementById("saveQtyMode").onclick = async () => {
  const btn = document.getElementById("saveQtyMode");
  const mode = document.getElementById("qtyMode").value === "fixed" ? "fixed" : "auto";
  const fixedQtyInput = document.getElementById("fixedQty");
  const fixedQty = Math.max(1, Math.floor(Number(fixedQtyInput.value) || 0));
  fixedQtyInput.value = fixedQty;
  if (mode === "fixed" && !(fixedQty > 0)) {
    btn.textContent = "اكتب عدد أسهم صحيح";
    setTimeout(() => (btn.textContent = "حفظ طريقة الحساب"), 1800);
    return;
  }
  await chrome.storage.local.set({ qtyMode: mode, fixedQty });
  flashSaved(btn, "حفظ طريقة الحساب");
};

document.getElementById("saveTabMode").onclick = async () => {
  const btn = document.getElementById("saveTabMode");
  document.getElementById("alwaysNewTab").value = "true";
  await chrome.storage.local.set({ alwaysNewTab: true });
  flashSaved(btn, "حفظ");
};

// Track which inputs the user is editing so refresh() doesn't overwrite them
const editingInputs = new Set();
["egpPerTrade", "maxPerDay"].forEach((id) => {
  const el = document.getElementById(id);
  el.addEventListener("focus", () => editingInputs.add(id));
  el.addEventListener("blur", () => editingInputs.delete(id));
});

document.getElementById("localTest").onclick = async () => {
  const btn = document.getElementById("localTest");
  btn.textContent = "جاري الاختبار...";
  try {
    const egpInput = document.getElementById("egpPerTrade");
    const egpPerTrade = Math.max(MIN_SCALP_CASH_EGP, Number(egpInput.value) || MIN_SCALP_CASH_EGP);
    egpInput.value = egpPerTrade;
    await chrome.storage.local.set({ egpPerTrade });
    const res = await chrome.runtime.sendMessage({ type: "runLocalOrderTest" });
    btn.textContent = res?.ok ? `اتفتح اختبار ${res.symbol || ""} ✓` : (res?.error || "فشل الاختبار");
  } catch (e) {
    btn.textContent = "فشل الاختبار";
  }
  setTimeout(() => (btn.textContent = "اختبار محلي بسهم من قائمة المراقبة"), 2500);
};

document.getElementById("localSellTest").onclick = async () => {
  const btn = document.getElementById("localSellTest");
  const original = "اختبر البيع (أسهم + الحد الأقصى)";
  const ok = confirm(
    "اختبار بيع: الاكستنشن هتفتح صفحة بيع، تختار 'أسهم'، وتضغط 'الحد الأقصى'.\n" +
    "مش هتضغط مراجعة الطلب — انت اللي تراجع وتضغط بنفسك.\n" +
    "موافق؟"
  );
  if (!ok) return;
  btn.textContent = "جاري اختبار البيع...";
  try {
    const res = await chrome.runtime.sendMessage({ type: "runLocalSellTest" });
    if (res?.ok) {
      btn.textContent = `بيع جاهز ${res.symbol || ""} ✓`;
    } else {
      btn.textContent = res?.stage || res?.error || "فشل الاختبار";
    }
  } catch (e) {
    btn.textContent = "فشل الاختبار";
  }
  setTimeout(() => (btn.textContent = original), 3500);
};

async function refresh() {
  try {
    const [status, cdpStatus] = await Promise.all([
      chrome.runtime.sendMessage({ type: "getStatus" }),
      chrome.runtime.sendMessage({ type: "cdp.getStatus" }).catch(() => null),
    ]);
    if (!status) return;
    const cdpStats = cdpStatus?.stats || {};
    const cdpMapped = Number(cdpStatus?.mappedSymbols) || 0;
    const cdpBuffered = Number(cdpStatus?.buffered) || 0;
    document.getElementById("mapped").textContent = Math.max(Number(status.mappedSymbols) || 0, cdpMapped);
    document.getElementById("buffered").textContent = (Number(status.buffered) || 0) + cdpBuffered;
    document.getElementById("sent").textContent = (Number(status.stats?.sent) || 0) + (Number(cdpStats.ticksSent) || 0);
    document.getElementById("dropped").textContent = (Number(status.stats?.dropped) || 0) + (Number(cdpStats.ticksDropped) || 0);
    const ctd = document.getElementById("crossTabDropped");
    if (ctd) ctd.textContent = status.stats?.crossTabDropped || 0;
    const jc = document.getElementById("jsonpCalls"); if (jc) jc.textContent = status.stats?.jsonpCalls || 0;
    const jf = document.getElementById("jsonpWithFeed"); if (jf) jf.textContent = status.stats?.jsonpWithFeed || 0;
    const wm = document.getElementById("wsMessages"); if (wm) wm.textContent = (Number(status.stats?.wsMessages) || 0) + (Number(cdpStats.framesSeen) || 0);
    const wf = document.getElementById("wsWithFeed"); if (wf) wf.textContent = (Number(status.stats?.wsWithFeed) || 0) + (Number(cdpStats.ticksParsed) || 0);
    const cf = document.getElementById("cdpFrames"); if (cf) cf.textContent = cdpStats.framesSeen || 0;
    const ct = document.getElementById("cdpTicks"); if (ct) ct.textContent = cdpStats.ticksParsed || 0;
    const cq = document.getElementById("cdpQuotes"); if (cq) cq.textContent = (Number(cdpStats.quotesSent) || 0) + (Number(status.quotes?.sent) || 0);
    const cl2 = document.getElementById("cdpL2"); if (cl2) cl2.textContent = cdpStats.l2Sent || 0;
    const ow = document.getElementById("offscreenStatus");
    if (ow) {
      const off = status.offscreen || {};
      ow.textContent = off.lastPingAgeSec == null ? "—" : `${off.lastPingAgeSec}s`;
      ow.style.color = off.lastPingAgeSec != null && off.lastPingAgeSec < 45 ? "#86efac" : "#fde68a";
    }
    const dt = document.getElementById("domTicks"); if (dt) dt.textContent = status.stats?.domTicks || 0;
    const it = document.getElementById("injectedTabs"); if (it) it.textContent = status.stats?.injectedTabs || 0;
    const bp = document.getElementById("backendPolls"); if (bp) bp.textContent = status.stats?.backendPolls || 0;
    const mw = status.marketwatch || {};
    const mwStatus = document.getElementById("mwStatus");
    if (mwStatus) {
      const cdpMwTs = Number(cdpStats.mwLast?.ts) || 0;
      const cdpMwAge = cdpMwTs ? Math.round((Date.now() - cdpMwTs) / 1000) : null;
      const lastOkAge = cdpMwAge ?? (mw.lastOk ? Math.round((Date.now() - Number(mw.lastOk)) / 1000) : null);
      if (cdpMwAge != null) {
        mwStatus.textContent = `Passive شغال — آخر ${cdpMwAge}s`;
        mwStatus.style.color = cdpMwAge <= 75 ? "#86efac" : "#fde68a";
      } else if (cdpStats.mwLastError) {
        mwStatus.textContent = `CDP: ${cdpStats.mwLastError}`;
        const cdpWaiting = String(cdpStats.mwLastError).includes("auto_refresh_watchlist") || String(cdpStats.mwLastError).includes("watchdog_switched_to_watchlist") || String(cdpStats.mwLastError).includes("auto_focus_trade");
        mwStatus.style.color = cdpWaiting ? "#bae6fd" : (String(cdpStats.mwLastError).includes("429") ? "#fde68a" : "#fca5a5");
      } else if (mw.lastError) {
        const waiting = mw.lastError.includes("cdp_marketwatch") || mw.lastError.includes("passive_marketwatch") || mw.lastError.includes("cdp_only") || mw.lastError.includes("passive_only") || mw.lastError.includes("passive-only") || mw.lastError.includes("active_poll_disabled");
        mwStatus.textContent = waiting ? "Passive — يلتقط من شبكة ثاندر" : mw.lastError;
        mwStatus.style.color = waiting ? "#bae6fd" : (mw.lastError.includes("429") || mw.lastError.includes("backoff") ? "#fde68a" : "#fca5a5");
      } else if (lastOkAge != null) {
        mwStatus.textContent = `شغال — آخر ${lastOkAge}s`;
        mwStatus.style.color = lastOkAge <= 60 ? "#86efac" : "#fde68a";
      } else {
        mwStatus.textContent = "Passive — يلتقط من شبكة ثاندر";
        mwStatus.style.color = "#bae6fd";
      }
    }
    const mwAssets = document.getElementById("mwAssets");
    if (mwAssets) {
      const cdpMw = cdpStats.mwLast || null;
      if (cdpMw) mwAssets.textContent = `${cdpMw.assets || 0} / same-day ${cdpMw.sameDay || 0} / saved ${cdpStats.mwSent || 0}`;
      else mwAssets.textContent = `${mw.lastAssets || 0} / same-day ${mw.lastSameDay || 0} / saved ${mw.lastInserted || 0}`;
    }
    const lt = status.stats?.lastTick;
    const cdpLastTick = cdpStats.lastTick;
    const ltEl = document.getElementById("lastTick");
    if (ltEl) {
      if (lt?.symbol) ltEl.textContent = `${lt.symbol} ${lt.price} ${new Date(lt.ts).toLocaleTimeString()}`;
      else if (cdpLastTick?.symbol) ltEl.textContent = `${cdpLastTick.symbol} ${cdpLastTick.price} ${new Date(cdpLastTick.ts).toLocaleTimeString()}`;
      else if ((status.stats?.backendPollRows || 0) > 0) ltEl.textContent = `Backend ${status.stats.backendPollRows} rows`;
      else ltEl.textContent = "—";
    }
    const lf = status.stats?.lastFlush || cdpStats.lastFlush;
    document.getElementById("lastFlush").textContent = lf ? new Date(lf).toLocaleTimeString() : "—";
    document.getElementById("err").textContent = status.stats?.lastError ? "خطأ: " + status.stats.lastError : (status.stats?.injectError ? "حقن: " + status.stats.injectError : (cdpStats.lastError ? "CDP: " + cdpStats.lastError : ""));

    const cdpStatusEl = document.getElementById("cdpStatus");
    if (cdpStatusEl && cdpStatus?.ok) {
      cdpStatusEl.textContent = cdpStats.attached
        ? `✓ متصل — Frames ${cdpStats.framesSeen || 0} / Ticks ${cdpStats.ticksParsed || 0} / Quotes ${cdpStats.quotesSent || 0}`
        : (cdpStatusEl.textContent || "غير متصل");
      cdpStatusEl.style.color = cdpStats.attached ? "#86efac" : cdpStatusEl.style.color;
    }

    document.getElementById("executedToday").textContent = `${status.executedToday || 0} / ${status.maxPerDay ?? 3}`;
    const lp = status.lastOrderPoll;
    document.getElementById("lastOrderPoll").textContent = lp ? new Date(lp).toLocaleTimeString() : "—";
    document.getElementById("orderErr").textContent = status.lastOrderError ? "أوامر: " + status.lastOrderError : "";
  } catch {}
}

load();
refresh();
setInterval(refresh, 1500);

// =================== v4 unified: overlay + CDP toggles ===================

async function loadV4Features() {
  const { v4_features } = await chrome.storage.local.get(["v4_features"]);
  const f = v4_features || { overlay: true, tickCDP: false };
  setOverlayBtn(f.overlay !== false);
  setCdpBtn(f.tickCDP === true);
}

function setL2CycleBtn(on) {
  const btn = document.getElementById("toggleL2Cycle");
  if (!btn) return;
  btn.textContent = on ? "L2 دائرى: شغّال ✓" : "L2 دائرى: متوقف ✗";
  btn.className = on ? "toggle-on" : "toggle-off";
  btn.dataset.on = on ? "1" : "0";
  btn.disabled = false;
}

async function loadL2CycleFlag() {
  const { l2AutoCycleEnabled } = await chrome.storage.local.get(["l2AutoCycleEnabled"]);
  setL2CycleBtn(l2AutoCycleEnabled !== false);
}
loadL2CycleFlag().catch(() => {});

document.getElementById("toggleL2Cycle")?.addEventListener("click", async () => {
  const currentlyOn = document.getElementById("toggleL2Cycle").dataset.on === "1";
  const next = !currentlyOn;
  await chrome.storage.local.set({ l2AutoCycleEnabled: next });
  setL2CycleBtn(next);
});

// ⚡ Instant-Bracket toggle (v4.1.93)
function setInstantBracketBtn(on) {
  const btn = document.getElementById("toggleInstantBracket");
  if (!btn) return;
  btn.textContent = on ? "Instant-Bracket: شغّال ✓" : "Instant-Bracket: متوقف ✗";
  btn.className = on ? "toggle-on" : "toggle-off";
  btn.dataset.on = on ? "1" : "0";
}
chrome.storage.local.get(["instantBracketOnFill"]).then((s) => {
  setInstantBracketBtn(s.instantBracketOnFill === true);
});
document.getElementById("toggleInstantBracket")?.addEventListener("click", async () => {
  const on = document.getElementById("toggleInstantBracket").dataset.on === "1";
  if (!on) {
    const ok = confirm(
      "تفعيل Instant-Bracket:\n\n" +
      "بعد كل عملية شراء يتم تأكيدها من ثاندر، الإكستنشن هيفتح فوراً تاب بيع limit مُحضّرة عند سعر الهدف.\n\n" +
      "أنت مسؤول عن الضغط على 'مراجعة الطلب' + 'أكد الطلب' (نفس السلوك الحالي عند لمس TP).\n\n" +
      "متوقّف افتراضياً — أول مرة جرّبه على صفقة واحدة وتأكد إن الفورم ظهر بالسعر الصحيح.\n\nتفعيل؟"
    );
    if (!ok) return;
  }
  await chrome.storage.local.set({ instantBracketOnFill: !on });
  setInstantBracketBtn(!on);
});

function setOverlayBtn(on) {
  const btn = document.getElementById("toggleOverlay");
  if (!btn) return;
  btn.textContent = on ? "Overlay: شغّال ✓" : "Overlay: متوقف ✗";
  btn.className = on ? "toggle-on" : "toggle-off";
  btn.dataset.on = on ? "1" : "0";
}

function setCdpBtn(on) {
  const btn = document.getElementById("toggleCdp");
  if (!btn) return;
  btn.textContent = on ? "CDP: شغّال ✓" : "CDP: متوقف ✗";
  btn.className = on ? "toggle-on" : "toggle-off";
  btn.dataset.on = on ? "1" : "0";
  const a = document.getElementById("cdpAttach");
  const d = document.getElementById("cdpDetach");
  if (a) a.style.display = on ? "block" : "none";
  if (d) d.style.display = on ? "block" : "none";
}

document.getElementById("toggleOverlay")?.addEventListener("click", async () => {
  const on = document.getElementById("toggleOverlay").dataset.on === "1";
  const { v4_features } = await chrome.storage.local.get(["v4_features"]);
  const f = v4_features || {};
  f.overlay = !on;
  await chrome.storage.local.set({ v4_features: f });
  setOverlayBtn(!on);
});

document.getElementById("toggleCdp")?.addEventListener("click", async () => {
  const on = document.getElementById("toggleCdp").dataset.on === "1";
  if (!on) {
    const ok = confirm(
      "تفعيل CDP سيُظهر شريط أصفر 'is being debugged' أعلى صفحة ثاندر.\n" +
      "هذا طبيعي ولا يمكن إخفاؤه (قيد كروم).\n" +
      "لا تفعّله إلا لو fetch hooks فشلت في قراءة الأسعار.\nموافق؟"
    );
    if (!ok) return;
  } else {
    // Auto-detach when turning off.
    try { await chrome.runtime.sendMessage({ type: "cdp.detach" }); } catch {}
  }
  const { v4_features } = await chrome.storage.local.get(["v4_features"]);
  const f = v4_features || {};
  f.tickCDP = !on;
  await chrome.storage.local.set({ v4_features: f });
  setCdpBtn(!on);
});

document.getElementById("cdpAttach")?.addEventListener("click", async () => {
  const s = document.getElementById("cdpStatus");
  s.textContent = "جاري الاتصال...";
  try {
    const res = await chrome.runtime.sendMessage({ type: "cdp.attachActiveTab" });
    s.textContent = res?.ok ? `✓ متصل بتاب ${res.tabId}` : "✗ " + (res?.error || "فشل");
    s.style.color = res?.ok ? "#86efac" : "#fca5a5";
  } catch (e) { s.textContent = "خطأ: " + (e?.message || e); }
});

document.getElementById("cdpDetach")?.addEventListener("click", async () => {
  const s = document.getElementById("cdpStatus");
  try {
    await chrome.runtime.sendMessage({ type: "cdp.detach" });
    s.textContent = "تم القطع";
    s.style.color = "#94a3b8";
  } catch (e) { s.textContent = "خطأ: " + (e?.message || e); }
});

loadV4Features();

document.getElementById("openTabTest")?.addEventListener("click", async () => {
  const btn = document.getElementById("openTabTest");
  const original = "🧪 اختبار فتح تاب ثاندر فقط (Dry-Run)";
  btn.textContent = "جاري فتح تاب...";
  try {
    const res = await chrome.runtime.sendMessage({ type: "runOpenTabTest" });
    btn.textContent = res?.ok ? `✓ اتفتحت تاب ${res.symbol || ""}` : ("✗ " + (res?.error || "فشل"));
  } catch (e) {
    btn.textContent = "✗ " + (e?.message || e);
  }
  setTimeout(() => (btn.textContent = original), 3500);
});

// =================== Trade Journal ===================

function fmtMoney(n) {
  const v = Number(n) || 0;
  return (v >= 0 ? "+" : "") + v.toFixed(2) + " ج";
}
function fmtTime(ts) {
  if (!ts) return "—";
  try { return new Date(ts).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }); } catch { return "—"; }
}

async function refreshJournal() {
  try {
    const res = await chrome.runtime.sendMessage({ type: "getTradeJournal" });
    if (!res?.ok) return;
    const s = res.summary || {};
    document.getElementById("jCount").textContent = s.count || 0;
    document.getElementById("jOpenClosed").textContent = `${s.openCount || 0} / ${s.closedCount || 0}`;
    document.getElementById("jWinLoss").textContent = `${s.wins || 0} / ${s.losses || 0}`;
    document.getElementById("jFees").textContent = (Number(s.totalFees) || 0).toFixed(2) + " ج";
    const realisedEl = document.getElementById("jRealised");
    const realised = Number(s.realised) || 0;
    realisedEl.textContent = fmtMoney(realised);
    realisedEl.style.color = realised >= 0 ? "#86efac" : "#fca5a5";

    const list = document.getElementById("journalList");
    if (!list) return;
    const rows = res.rows || [];
    if (!rows.length) {
      list.innerHTML = '<div style="color:#64748b;text-align:center;padding:12px">لا توجد صفقات اليوم</div>';
      return;
    }
    list.innerHTML = rows.map((r) => {
      const isClosed = r.status === "closed";
      const pnl = Number(r.pnl) || 0;
      const pnlPct = Number(r.pnl_pct);
      const pnlColor = pnl >= 0 ? "#86efac" : "#fca5a5";
      const statusBadge = isClosed
        ? `<span style="color:${pnlColor};font-weight:700">${fmtMoney(pnl)}${Number.isFinite(pnlPct) ? ` (${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}%)` : ""}</span>`
        : `<span style="color:#fbbf24">⏳ مفتوحة</span>`;
      return `
        <div style="background:#0f172a;border:1px solid #1e293b;border-radius:6px;padding:8px;margin-bottom:6px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <b style="font-size:12px;color:#f1f5f9">${r.symbol}</b>
            ${statusBadge}
          </div>
          <div style="color:#94a3b8;line-height:1.6">
            🛒 شراء: <b style="color:#cbd5e1">${Number(r.buy_qty || 0)} × ${Number(r.buy_price || 0).toFixed(2)}</b> = ${Number(r.buy_value || 0).toFixed(2)} ج
            <span style="color:#64748b">(عمولة ${Number(r.buy_fee || 0).toFixed(2)})</span>
            <span style="color:#64748b">${fmtTime(r.opened_at)}</span>
          </div>
          ${isClosed ? `
          <div style="color:#94a3b8;line-height:1.6">
            💵 بيع: <b style="color:#cbd5e1">${Number(r.sell_qty || 0)} × ${Number(r.sell_price || 0).toFixed(2)}</b> = ${Number(r.sell_value || 0).toFixed(2)} ج
            <span style="color:#64748b">(عمولة ${Number(r.sell_fee || 0).toFixed(2)})</span>
            <span style="color:#64748b">${fmtTime(r.closed_at)}</span>
          </div>
          <div style="color:#94a3b8;border-top:1px dashed #334155;margin-top:4px;padding-top:4px">
            صافي بعد العمولة: <b style="color:${pnlColor}">${fmtMoney(pnl)}</b>
          </div>
          ` : `
          <div style="color:#64748b;font-size:9px;margin-top:2px">إجمالي تكلفة الشراء: ${Number(r.buy_total_cost || 0).toFixed(2)} ج</div>
          `}
        </div>
      `;
    }).join("");
  } catch {}
}

document.getElementById("refreshJournal")?.addEventListener("click", refreshJournal);
refreshJournal();
setInterval(refreshJournal, 5000);

// 🧪 Price simulator — injects a debug price into the active Thunder tab
// so the user can verify trailing rewrites the limit-price field even when
// the market is closed. Auto-expires after 5 minutes. Trailing never clicks
// Review/Confirm in Phase 1, so this can never place a real order.
async function getActiveThunderTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const t = tabs[0];
  if (!t || !t.url || !/thndr\.app/.test(t.url)) return null;
  return t;
}
function setSimStatus(msg, color) {
  const el = document.getElementById("simStatus");
  if (!el) return;
  el.textContent = msg || "";
  el.style.color = color || "#ef4444";
}
document.getElementById("simStart")?.addEventListener("click", async () => {
  const v = Number(document.getElementById("simPrice").value);
  if (!Number.isFinite(v) || v <= 0) { setSimStatus("اكتب سعر صحيح أولاً"); return; }
  const tab = await getActiveThunderTab();
  if (!tab) { setSimStatus("افتح تاب web.thndr.app الأول وخليها نشطة"); return; }
  try {
    const until = Date.now() + 5 * 60_000;
    await chrome.storage.local.set({ thunder_debug_price: v, thunder_debug_price_until: until });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: false },
      world: "ISOLATED",
      func: (price) => {
        window.__thunder_debug_price = price;
        window.__thunder_debug_price_until = Date.now() + 5 * 60_000;
      },
      args: [v],
    });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: false },
      world: "MAIN",
      func: (price) => {
        window.__thunder_debug_price = price;
        window.__thunder_debug_price_until = Date.now() + 5 * 60_000;
        const id = "thunder-sim-banner";
        let b = document.getElementById(id);
        if (!b) {
          b = document.createElement("div");
          b.id = id;
          b.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#dc2626;color:#fff;padding:6px;text-align:center;font:bold 13px sans-serif;direction:rtl";
          document.documentElement.appendChild(b);
        }
        b.textContent = `🧪 محاكي السعر فعّال — سعر وهمي = ${price} ج (ينتهي بعد 5 دقايق)`;
        setTimeout(() => { const el = document.getElementById("thunder-sim-banner"); if (el) el.remove(); }, 5 * 60_000 + 500);
      },
      args: [v],
    });
    setSimStatus(`✓ المحاكي شغّال على ${tab.url.split("?")[0]} بسعر ${v}`, "#10b981");
  } catch (e) { setSimStatus("فشل: " + (e.message || e)); }
});
document.getElementById("simStop")?.addEventListener("click", async () => {
  const tab = await getActiveThunderTab();
  if (!tab) { setSimStatus("افتح تاب ثاندر الأول"); return; }
  try {
    await chrome.storage.local.remove(["thunder_debug_price", "thunder_debug_price_until"]);
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: false },
      world: "ISOLATED",
      func: () => {
        try { delete window.__thunder_debug_price; } catch {}
        try { delete window.__thunder_debug_price_until; } catch {}
      },
    });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: false },
      world: "MAIN",
      func: () => {
        try { delete window.__thunder_debug_price; } catch {}
        try { delete window.__thunder_debug_price_until; } catch {}
        const el = document.getElementById("thunder-sim-banner"); if (el) el.remove();
      },
    });
    setSimStatus("⏹ المحاكي اتوقف", "#94a3b8");
  } catch (e) { setSimStatus("فشل: " + (e.message || e)); }
});

// 🧪 Demo position — injects a fake open trade so the TP/SL progress bars
// render in the floating overlay. Combine with the price simulator above to
// drive the bars. Auto-expires after 15 minutes. Never places any real order.
function setDemoStatus(msg, color) {
  const el = document.getElementById("demoStatus");
  if (!el) return;
  el.textContent = msg || "";
  el.style.color = color || "#ef4444";
}
document.getElementById("demoStart")?.addEventListener("click", async () => {
  const symbol = (document.getElementById("demoSymbol").value || "").trim().toUpperCase();
  const entry = Number(document.getElementById("demoEntry").value);
  const tp = Number(document.getElementById("demoTp").value);
  const sl = Number(document.getElementById("demoSl").value);
  if (!symbol) { setDemoStatus("اكتب رمز السهم"); return; }
  if (!Number.isFinite(entry) || entry <= 0) { setDemoStatus("سعر دخول غير صحيح"); return; }
  if (!Number.isFinite(tp) || tp <= entry) { setDemoStatus("TP لازم يكون أكبر من الدخول"); return; }
  if (!Number.isFinite(sl) || sl >= entry) { setDemoStatus("SL لازم يكون أقل من الدخول"); return; }
  const until = Date.now() + 15 * 60_000;
  try {
    await chrome.storage.local.set({
      v4_demo_position: { symbol, entry, tp, sl, qty: 1, until },
    });
    setDemoStatus(`✓ صفقة تجريبية ${symbol} — افتح أي تاب ثاندر، وحرّك السعر بمحاكي السعر فوق`, "#10b981");
  } catch (e) { setDemoStatus("فشل: " + (e.message || e)); }
});
document.getElementById("demoStop")?.addEventListener("click", async () => {
  try {
    await chrome.storage.local.remove(["v4_demo_position"]);
    setDemoStatus("⏹ الصفقة التجريبية اتمسحت", "#94a3b8");
  } catch (e) { setDemoStatus("فشل: " + (e.message || e)); }
});

// ===== Raw Capture Session =====
function setCapErr(msg, color) { const el = document.getElementById("capErr"); if (el) { el.style.color = color || "#fca5a5"; el.textContent = msg || ""; } }
function fmtTimeCap(ms) { if (!ms) return "—"; const d = new Date(ms); return d.toLocaleTimeString("ar-EG"); }
function classifyUrl(u) {
  const s = String(u || "");
  if (/\/orders(\b|\/|\?)/.test(s)) return s.includes("?") || /\/orders\/\w/.test(s) ? "ordersGet" : "ordersPost";
  if (/\/positions/.test(s)) return "positions";
  if (/\/portfolio|\/accounts?/.test(s)) return "portfolio";
  return "other";
}
async function refreshCap() {
  try {
    const res = await chrome.runtime.sendMessage({ type: "capture.status" });
    const s = res?.session;
    const active = !!s?.active && Date.now() < (s?.expiresAt || 0);
    document.getElementById("capActive").textContent = active ? "▶ شغّالة" : "متوقفة";
    document.getElementById("capActive").style.color = active ? "#10b981" : "#94a3b8";
    document.getElementById("capSym").textContent = s?.symbol || "—";
    const events = s?.events || [];
    document.getElementById("capCount").textContent = events.length;
    let oPost = 0, oGet = 0, pos = 0, port = 0;
    for (const e of events) {
      const c = classifyUrl(e.url);
      if (c === "ordersPost") { if (e.method === "POST") oPost++; else oGet++; }
      else if (c === "ordersGet") oGet++;
      else if (c === "positions") pos++;
      else if (c === "portfolio") port++;
    }
    document.getElementById("capOrdersPost").textContent = oPost;
    document.getElementById("capOrdersGet").textContent = oGet;
    document.getElementById("capPositions").textContent = pos;
    document.getElementById("capPortfolio").textContent = port;
    document.getElementById("capLast").textContent = fmtTimeCap(s?.lastEventAt);
    if (active && s?.expiresAt) {
      const left = Math.max(0, s.expiresAt - Date.now());
      const mm = Math.floor(left / 60000), ss = Math.floor((left % 60000) / 1000);
      document.getElementById("capExpires").textContent = `${mm}م ${ss}ث`;
    } else {
      document.getElementById("capExpires").textContent = "—";
    }
  } catch {}
}
setInterval(refreshCap, 1500);
refreshCap();

document.getElementById("capStart")?.addEventListener("click", async () => {
  const symbol = (document.getElementById("capSymbol").value || "COPR").toUpperCase().trim();
  setCapErr("جاري فتح ثاندر...", "#fbbf24");
  try {
    const res = await chrome.runtime.sendMessage({ type: "capture.start", payload: { symbol } });
    if (!res?.ok) { setCapErr("فشل: " + (res?.error || "غير معروف")); return; }
    if (!res.hasMapping) {
      setCapErr(`⚠️ ${symbol} مش في قائمة المراقبة. ضيفه في ثاندر، اعمل refresh للبوب-أب، ثم اضغط ابدأ تاني.`, "#fbbf24");
    } else {
      setCapErr(`✓ الجلسة بدأت — ${symbol}. اشتري سهم 1 الآن وراجع/أكد.`, "#10b981");
    }
    refreshCap();
  } catch (e) { setCapErr("فشل: " + (e.message || e)); }
});
document.getElementById("capStop")?.addEventListener("click", async () => {
  try {
    await chrome.runtime.sendMessage({ type: "capture.stop" });
    setCapErr("⏹ الجلسة وقفت. اضغط 'صدّر JSON' لمراجعة اللقطات.", "#94a3b8");
    refreshCap();
  } catch (e) { setCapErr("فشل: " + (e.message || e)); }
});
document.getElementById("capExport")?.addEventListener("click", async () => {
  try {
    const res = await chrome.runtime.sendMessage({ type: "capture.status" });
    const s = res?.session;
    if (!s || !(s.events || []).length) { setCapErr("مفيش لقطات لتصديرها."); return; }
    const blob = new Blob([JSON.stringify(s, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `thunder-capture-${s.symbol || "x"}-${new Date(s.startedAt || Date.now()).toISOString().replace(/[:.]/g, "-")}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setCapErr(`✓ تم تنزيل ${s.events.length} حدث (محرّر).`, "#10b981");
  } catch (e) { setCapErr("فشل: " + (e.message || e)); }
});
document.getElementById("capClear")?.addEventListener("click", async () => {
  if (!confirm("مسح كل اللقطات؟")) return;
  try { await chrome.runtime.sendMessage({ type: "capture.clear" }); setCapErr("🗑 اتمسحت.", "#94a3b8"); refreshCap(); }
  catch (e) { setCapErr("فشل: " + (e.message || e)); }
});

// ===== v4.1.89: L2 diagnostics panel =====
function _fmtAge(sec) {
  if (sec == null || !Number.isFinite(sec)) return "—";
  if (sec < 60) return sec + "s";
  const m = Math.floor(sec / 60), s = sec % 60;
  if (m < 60) return `${m}m${s}s`;
  const h = Math.floor(m / 60), mr = m % 60;
  return `${h}h${mr}m`;
}
async function refreshDiag() {
  const listEl = document.getElementById("diagList");
  const sumEl = document.getElementById("diagSummary");
  if (!listEl || !sumEl) return;
  try {
    const r = await chrome.runtime.sendMessage({ type: "l2diag.get" });
    if (!r?.ok) { sumEl.textContent = "فشل جلب التشخيص"; return; }
    const now = r.now || Date.now();
    const live = r.live || [];
    const diag = r.diag || {};
    const off = r.offscreen || {};
    const offText = off.lastPingAgeSec == null ? "offscreen ?" : `offscreen ${off.lastPingAgeSec}s`;
    sumEl.textContent = `تابات مفتوحة: ${live.length}/${r.persistMaxTabs} · إشارات: ${(r.signals||[]).length} · سوق: ${r.marketOpen ? "مفتوح" : "مقفول"} · ${offText}`;
    if (!live.length) { listEl.innerHTML = '<div style="color:#94a3b8;padding:6px">لا توجد تابات L2 مفتوحة حالياً.</div>'; return; }
    const rows = live.map((t) => {
      const d = diag[t.symbol] || {};
      const uptime = _fmtAge(Math.round((now - (t.openedAt || d.openedAt || now)) / 1000));
      const ensAge = _fmtAge(d.lastEnsureAt ? Math.round((now - d.lastEnsureAt) / 1000) : null);
      const snapAge = _fmtAge(d.lastSnapshotAt ? Math.round((now - d.lastSnapshotAt) / 1000) : null);
      const snaps = Number(d.snapshotsSent) || 0;
      const l2Age = Number.isFinite(Number(d.lastAgeMs)) ? Math.round(Number(d.lastAgeMs)/1000) + "s" : "—";
      const rec = Number(d.recoveryCount) || 0;
      const fresh = d.lastFresh === true ? "✓" : d.lastFresh === false ? "✗" : "?";
      const panel = d.panelState || "?";
      // Color: green if snapshot < 60s ago, amber if < 5min, red if none / >5min.
      const snapSecs = d.lastSnapshotAt ? Math.round((now - d.lastSnapshotAt)/1000) : Infinity;
      const bg = snapSecs < 60 ? "#052e16" : snapSecs < 300 ? "#422006" : "#450a0a";
      const fg = snapSecs < 60 ? "#86efac" : snapSecs < 300 ? "#fde68a" : "#fca5a5";
      return `<div style="background:${bg};color:${fg};padding:4px 6px;margin:2px 0;border-radius:4px;line-height:1.5">
        <b>${t.symbol}</b> · up ${uptime} · snaps ${snaps} (last ${snapAge}) · L2 fresh=${fresh} age=${l2Age} · panel=${panel} · ensure ${ensAge} · recovery ${rec}
      </div>`;
    });
    listEl.innerHTML = rows.join("");
  } catch (e) {
    sumEl.textContent = "خطأ: " + (e?.message || e);
  }
}
document.getElementById("refreshDiag")?.addEventListener("click", refreshDiag);
setInterval(refreshDiag, 5000);
refreshDiag();

document.getElementById("mwDiagRun")?.addEventListener("click", async () => {
  const button = document.getElementById("mwDiagRun");
  const verdict = document.getElementById("mwDiagVerdict");
  button.disabled = true;
  button.textContent = "جاري الاختبار…";
  verdict.textContent = "";
  try {
    const tabs = await chrome.tabs.query({ url: ["https://web.thndr.app/*", "https://*.thndr.app/*"] });
    const tab = tabs.find((item) => item.id && /^https:\/\/[^/]*thndr\.app\//i.test(item.url || ""));
    if (!tab?.id) throw new Error("افتح تاب ثاندر X وسجّل الدخول أولاً");
    const result = await chrome.tabs.sendMessage(tab.id, { type: "marketwatch.diagnostic" });
    if (!result?.ok) throw new Error(result?.error || `HTTP ${result?.status || 0}`);
    const fields = result.fields || {};
    document.getElementById("mwdHttp").textContent = `${result.status} / ${result.durationMs}ms`;
    document.getElementById("mwdAssets").textContent = `${result.rawAssets} / ${result.distinctSymbols}`;
    document.getElementById("mwdCore").textContent = `${fields.price} / ${fields.volume} / ${fields.trades}`;
    document.getElementById("mwdBook").textContent = `${fields.bid} / ${fields.ask}`;
    document.getElementById("mwdQty").textContent = `${fields.bidVolume} / ${fields.askVolume}`;
    document.getElementById("mwdRange").textContent = `${fields.high} / ${fields.low}`;
    const complete = result.distinctSymbols >= 270 && [fields.price, fields.volume, fields.trades, fields.bid, fields.ask].every((value) => value >= result.distinctSymbols);
    verdict.textContent = complete
      ? `✅ تغطية كاملة في هذا الرد: ${result.distinctSymbols} رمز، والحقول الأساسية موجودة.`
      : `⚠️ الرد وصل لكن التغطية غير كاملة: ${result.distinctSymbols} رمز. لا تعتبر المشكلة محلولة.`;
    verdict.style.color = complete ? "#86efac" : "#fde68a";
  } catch (error) {
    verdict.textContent = `❌ ${error?.message || error}`;
    verdict.style.color = "#fca5a5";
  } finally {
    button.disabled = false;
    button.textContent = "اختبر الآن";
  }
});

// ---- v4.2.38: اختبار "التاب مش بتنام" ----
function _bpFmt(ms) { return ms == null ? "—" : ms + "ms"; }
async function refreshBgProof() {
  const stEl = document.getElementById("bpState");
  if (!stEl) return;
  try {
    const r = await chrome.runtime.sendMessage({ type: "bgproof.status" });
    if (!r?.ok) return;
    const run = r.run;
    const s = run?.last;
    const fe = r.focusEmu;
    document.getElementById("bpFocus").textContent = !r.cdpAttached
      ? "CDP غير متصل ✗"
      : fe?.ok ? "شغّال ✓" : "فشل: " + (fe?.error || "—");
    if (!run) { stEl.textContent = "لم يبدأ"; document.getElementById("bpVerdict").textContent = ""; return; }
    const now = r.now || Date.now();
    const remaining = Math.max(0, Math.round((run.endsAt - now) / 1000));
    stEl.textContent = s?.finished ? "انتهى" : remaining > 0 ? `شغّال — باقي ${remaining}ث` : "انتهى";
    const elapsed = Math.min(Math.round((now - run.startedAt) / 1000), Math.round(run.durationMs / 1000));
    document.getElementById("bpHidden").textContent =
      `${Number(run.bgSeconds) || 0}ث (المتصفح) · ${s?.hiddenTicks ?? 0} مخفية`;
    document.getElementById("bpTicks").textContent = `${s?.ticks ?? 0} / ${elapsed}`;
    document.getElementById("bpGap").textContent = _bpFmt(s?.maxGapMs);
    document.getElementById("bpFreeze").textContent = `${s?.freezes ?? 0} / ${s?.wasDiscarded ? "نعم" : "لا"}`;
    document.getElementById("bpNet").textContent = String(s?.netRequests ?? 0);
    document.getElementById("bpFrames").textContent = String(r.framesDelta ?? 0);
    const v = r.verdict;
    const box = document.getElementById("bpVerdict");
    const colors = { pass: ["#052e16", "#86efac"], warn: ["#422006", "#fde68a"], fail: ["#450a0a", "#fca5a5"], wait: ["#1e293b", "#94a3b8"] };
    const [bg, fg] = colors[v?.level || "wait"] || colors.wait;
    box.style.background = bg; box.style.color = fg; box.style.padding = "6px"; box.style.borderRadius = "6px";
    box.textContent = v?.text || "";
  } catch {}
}
document.getElementById("bgProofStart")?.addEventListener("click", async () => {
  const mins = Math.max(1, Math.min(30, Number(document.getElementById("bgProofMin").value) || 5));
  const r = await chrome.runtime.sendMessage({ type: "bgproof.start", durationMs: mins * 60_000 });
  const box = document.getElementById("bpVerdict");
  if (!r?.ok) { box.textContent = "❌ " + (r?.error || "فشل البدء"); box.style.color = "#fca5a5"; return; }
  box.textContent = "▶️ بدأ — بدّل دلوقتي لتاب تانية وسيب ثاندر أكس في الخلفية.";
  refreshBgProof();
});
document.getElementById("bgProofClear")?.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "bgproof.clear" });
  refreshBgProof();
});
setInterval(refreshBgProof, 2000);
refreshBgProof();
