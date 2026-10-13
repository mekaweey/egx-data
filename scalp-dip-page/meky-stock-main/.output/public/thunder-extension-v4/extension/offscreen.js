(() => {
  const VERSION = "v4.2.1-offscreen-watchdog";
  let worker = null;

  function ping() {
    try {
      chrome.runtime.sendMessage({ type: "offscreen.ping", ts: Date.now(), version: VERSION }, () => {
        void chrome.runtime.lastError;
      });
    } catch {}
  }

  function ensureWorker() {
    try {
      if (worker) return;
      const source = `setInterval(() => postMessage({ts: Date.now()}), 15000); postMessage({ts: Date.now()});`;
      const blob = new Blob([source], { type: "text/javascript" });
      const url = URL.createObjectURL(blob);
      worker = new Worker(url);
      URL.revokeObjectURL(url);
      worker.onmessage = ping;
      worker.onerror = () => {
        try { worker.terminate(); } catch {}
        worker = null;
        setTimeout(ensureWorker, 3000);
      };
    } catch {
      worker = null;
    }
  }

  ping();
  ensureWorker();
  setInterval(() => {
    ping();
    ensureWorker();
  }, 15000);
})();