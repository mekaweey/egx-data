// Lovable Chat Logger — content script
// يراقب DOM صفحة الشات ويستخرج كل رسالة (user/assistant) لحظياً.
// عند استقرار الرسالة (لا تتغير لمدة SETTLE_MS) يبعتها لـ background.

(() => {
  if (window.__lovableChatLoggerLoaded) return;
  window.__lovableChatLoggerLoaded = true;

  const SETTLE_MS = 2500; // انتظر 2.5s بعد آخر تغيير قبل ما تعتبر الرسالة كاملة
  const MAX_LEN = 200000;

  // memory: msgId -> { role, lastText, lastChangeAt, sentHash, timer, turnId }
  const state = new Map();
  // last user msgId seen (in DOM order) → لتربط الـ assistant بيه كـ turn_id
  let lastUserTurnId = null;

  function parseRole(id) {
    if (!id) return null;
    if (id.includes("#usr:")) return "user";
    if (id.includes("#ast:")) return "assistant";
    return null;
  }

  async function sha256(text) {
    const buf = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  function extractText(node) {
    // نستخدم innerText عشان يحترم الـ line breaks المرئية
    const t = (node.innerText || node.textContent || "").trim();
    return t.slice(0, MAX_LEN);
  }

  async function flush(msgId) {
    const s = state.get(msgId);
    if (!s) return;
    const text = s.lastText;
    if (!text) return;
    const hash = await sha256(`${s.role}|${msgId}|${text}`);
    if (hash === s.sentHash) return; // فعلاً اتبعت
    s.sentHash = hash;
    chrome.runtime.sendMessage({
      type: "chat-message",
      payload: {
        role: s.role,
        content: text,
        turn_id: s.turnId || msgId,
        msg_id: msgId,
        captured_at: new Date().toISOString(),
      },
    }).catch(() => {});
  }

  function scheduleFlush(msgId) {
    const s = state.get(msgId);
    if (!s) return;
    if (s.timer) clearTimeout(s.timer);
    s.timer = setTimeout(() => flush(msgId), SETTLE_MS);
  }

  function handleNode(node) {
    if (!(node instanceof Element)) return;
    // ابحث عن كل [data-message-id] داخل الـ node (شامل الـ node نفسه)
    const candidates = [];
    if (node.hasAttribute && node.hasAttribute("data-message-id")) candidates.push(node);
    if (node.querySelectorAll) {
      node.querySelectorAll("[data-message-id]").forEach(el => candidates.push(el));
    }
    for (const el of candidates) {
      const id = el.getAttribute("data-message-id");
      const role = parseRole(id);
      if (!role) continue;
      const text = extractText(el);
      let s = state.get(id);
      if (!s) {
        // رسالة جديدة
        const turnId = role === "user" ? id : (lastUserTurnId || id);
        if (role === "user") lastUserTurnId = id;
        s = { role, lastText: text, lastChangeAt: Date.now(), sentHash: null, timer: null, turnId };
        state.set(id, s);
      } else if (text !== s.lastText) {
        s.lastText = text;
        s.lastChangeAt = Date.now();
      } else {
        continue; // no change
      }
      scheduleFlush(id);
    }
  }

  function scanAll() {
    document.querySelectorAll("[data-message-id]").forEach(handleNode);
  }

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach(handleNode);
      if (m.type === "characterData" || m.type === "childList") {
        // لو التغيير جوه رسالة موجودة، نلقى الـ ancestor
        let n = m.target;
        while (n && n.nodeType === Node.ELEMENT_NODE) {
          if (n.hasAttribute && n.hasAttribute("data-message-id")) { handleNode(n); break; }
          n = n.parentElement;
        }
      }
    }
  });

  function start() {
    if (!document.body) { setTimeout(start, 200); return; }
    scanAll();
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    // إعادة scan دوري كـ safety net (لو virtualized scroller خبى رسالة)
    setInterval(scanAll, 5000);
  }
  start();

  // health ping للـ popup
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg && msg.type === "get-stats") {
      sendResponse({
        tracked: state.size,
        url: location.href,
        title: document.title,
      });
    }
  });
})();