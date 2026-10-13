/* Runs in the page's MAIN world so it can override window.fetch and
 * intercept Thunder's long-polling + watchlist responses. It posts
 * sanitized events to the content script via window.postMessage. */
(function () {
  const PAGE_SCRIPT_VERSION = "v4.2.43-active-marketwatch";
  if (window.__thunderTickHooked === PAGE_SCRIPT_VERSION) return;
  window.__thunderTickHooked = PAGE_SCRIPT_VERSION;

  const origFetch = window.fetch.bind(window);

  function send(type, payload) {
    try {
      window.postMessage({ __thunder: true, type, payload }, "*");
    } catch (_) {}
  }

  function readHeaderValue(headers, name) {
    try {
      if (!headers) return "";
      const wanted = String(name || "").toLowerCase();
      if (typeof headers.get === "function") return headers.get(name) || headers.get(wanted) || "";
      if (Array.isArray(headers)) {
        for (const [k, v] of headers) if (String(k).toLowerCase() === wanted) return String(v || "");
        return "";
      }
      if (typeof headers === "object") {
        const key = Object.keys(headers).find((k) => k.toLowerCase() === wanted);
        return key ? String(headers[key] || "") : "";
      }
    } catch {}
    return "";
  }

  let __thunderAuthHeader = "";
  function captureThunderAuth(url, headers) {
    try {
      if (String(url || "").indexOf("thndr.app") === -1) return;
      const auth = readHeaderValue(headers, "authorization");
      if (auth && String(auth).toLowerCase().indexOf("bearer ") === 0) {
        __thunderAuthHeader = String(auth);
        send("authToken", { token: String(auth), url: String(url || "") });
      }
    } catch {}
  }

  function normalizeMwNumber(v) {
    if (v === "" || v == null) return null;
    if (typeof v === "string") {
      const n = Number(v.replace(/,/g, "").trim());
      return Number.isFinite(n) ? n : null;
    }
    return Number.isFinite(Number(v)) ? Number(v) : null;
  }

  function mwInteger(v) {
    const n = normalizeMwNumber(v);
    return n == null ? null : Math.round(n);
  }

  function pickMarketwatchSymbol(a) {
    const s = String(a?.reuters || a?.symbol_code || a?.stock_id || a?.symbol || a?.ticker || a?.code || "").trim().toUpperCase();
    if (!/^[A-Z0-9._-]{2,16}$/.test(s)) return "";
    if (/^EG[A-Z0-9]{8,}$/i.test(s)) return "";
    return s;
  }

  function firstMwNumber(a, keys) {
    for (const k of keys) {
      const n = normalizeMwNumber(a?.[k]);
      if (n != null) return n;
    }
    return null;
  }

  function shapeMarketwatchAssets(assets) {
    if (!Array.isArray(assets) || assets.length < 10 || assets.length > 500) return null;
    const shaped = [];
    let sameDay = 0;
    let rawSampleCount = 0;
    for (const a of assets) {
      if (!a || typeof a !== "object") continue;
      const hasMarketFields =
        Object.prototype.hasOwnProperty.call(a, "total_volume") ||
        Object.prototype.hasOwnProperty.call(a, "totalVolume") ||
        Object.prototype.hasOwnProperty.call(a, "volume") ||
        Object.prototype.hasOwnProperty.call(a, "total_trades") ||
        Object.prototype.hasOwnProperty.call(a, "totalTrades") ||
        Object.prototype.hasOwnProperty.call(a, "total_value") ||
        Object.prototype.hasOwnProperty.call(a, "last_trade_price") ||
        Object.prototype.hasOwnProperty.call(a, "lastTradePrice") ||
        Object.prototype.hasOwnProperty.call(a, "last_price") ||
        Object.prototype.hasOwnProperty.call(a, "avg_change_prc");
      if (!hasMarketFields) continue;
      const symbol = pickMarketwatchSymbol(a);
      if (!symbol) continue;
      if (a.is_same_day === true || a.isSameDay === true) sameDay++;
      let rawSample = null;
      if (rawSampleCount < 5) {
        try {
          rawSample = JSON.parse(JSON.stringify(a));
          rawSampleCount++;
        } catch { rawSample = null; }
      }
      shaped.push({
        symbol,
        asset_id: a.asset_id != null ? String(a.asset_id) : (a.assetId != null ? String(a.assetId) : null),
        ref_price: firstMwNumber(a, ["ref_price", "refPrice", "reference_price", "referencePrice"]),
        last_price: firstMwNumber(a, ["last_trade_price", "lastTradePrice", "last_price", "lastPrice", "price", "ltp"]),
        avg_change_prc: firstMwNumber(a, ["avg_change_prc", "avgChangePrc", "change_percent", "changePercent"]),
        total_volume: mwInteger(firstMwNumber(a, ["total_volume", "totalVolume", "volume", "traded_volume", "tradedVolume", "cumVolume"])),
        total_trades: mwInteger(firstMwNumber(a, ["total_trades", "totalTrades", "trades", "trade_count", "tradeCount"])),
        total_value: firstMwNumber(a, ["total_value", "totalValue", "value", "traded_value", "tradedValue"]),
        total_bids: mwInteger(firstMwNumber(a, ["total_bids", "totalBids"])),
        total_asks: mwInteger(firstMwNumber(a, ["total_asks", "totalAsks"])),
        total_buy: mwInteger(firstMwNumber(a, ["total_buy", "totalBuy"])),
        total_sell: mwInteger(firstMwNumber(a, ["total_sell", "totalSell"])),
        high_price_limit: firstMwNumber(a, ["high_price_limit", "highPriceLimit"]),
        low_price_limit: firstMwNumber(a, ["low_price_limit", "lowPriceLimit"]),
        avg_5_day: firstMwNumber(a, ["avg_5_day", "avg5Day"]),
        avg_30_day: firstMwNumber(a, ["avg_30_day", "avg30Day"]),
        avg_90_day: firstMwNumber(a, ["avg_90_day", "avg90Day"]),
        is_same_day: a.is_same_day ?? a.isSameDay ?? null,
        highest_bid: firstMwNumber(a, ["highest_bid", "highestBid", "best_bid", "bestBid", "bid_price", "bidPrice", "bid"]),
        lowest_ask: firstMwNumber(a, ["lowest_ask", "lowestAsk", "best_ask", "bestAsk", "ask_price", "askPrice", "ask", "offer_price", "offerPrice"]),
        highest_bid_qty: mwInteger(firstMwNumber(a, ["highest_bid_qty", "highestBidQty", "bid_qty", "bidQty", "bid_size", "bidSize", "bid_volume", "bidVolume"])),
        lowest_ask_qty: mwInteger(firstMwNumber(a, ["lowest_ask_qty", "lowestAskQty", "ask_qty", "askQty", "ask_size", "askSize", "offer_qty", "offerQty", "ask_volume", "askVolume"])),
        high_price: firstMwNumber(a, ["high_price", "highPrice", "day_high", "dayHigh"]),
        low_price: firstMwNumber(a, ["low_price", "lowPrice", "day_low", "dayLow"]),
        last_trade_volume: firstMwNumber(a, ["last_trade_volume", "lastTradeVolume"]),
        last_change_prc: firstMwNumber(a, ["last_change_prc", "lastChangePrc", "change_prc", "changePrc"]),
        symbol_state: (a.symbol_state ?? a.symbolState ?? null) != null ? String(a.symbol_state ?? a.symbolState) : null,
        trade_rec_serial: mwInteger(firstMwNumber(a, ["trade_rec_serial", "tradeRecSerial", "symbols_rec_serial", "symbolsRecSerial"])),
        last_trade_date: (a.last_trade_date ?? a.lastTradeDate ?? null) != null ? String(a.last_trade_date ?? a.lastTradeDate) : null,
        open_price: firstMwNumber(a, ["open_price", "openPrice"]),
        previous_close: firstMwNumber(a, ["previous_close", "previousClose", "prev_close", "prevClose"]),
        close_price: firstMwNumber(a, ["close_price", "closePrice"]),
        high_52_week: firstMwNumber(a, ["high_52_week", "high52Week", "week_52_high", "yearHigh"]),
        low_52_week: firstMwNumber(a, ["low_52_week", "low52Week", "week_52_low", "yearLow"]),
        listed_shares: firstMwNumber(a, ["listed_shares", "listedShares", "outstanding_shares", "outstandingShares"]),
        avg_180_day: firstMwNumber(a, ["avg_180_day", "avg180Day"]),
        raw: rawSample,
      });
    }
    const usefulRows = shaped.filter((a) =>
      (Number(a.total_volume) || 0) > 0 ||
      (Number(a.total_trades) || 0) > 0 ||
      (Number(a.total_value) || 0) > 0
    ).length;
    return shaped.length >= 10 && usefulRows > 0 ? { assets: shaped, sameDay } : null;
  }

  function findMarketwatchAssets(json) {
    try {
      if (!json || typeof json !== "object") return null;
      const direct = shapeMarketwatchAssets(Array.isArray(json) ? json : json.assets);
      if (direct) return direct;
      const queue = [json];
      const seen = new WeakSet();
      let visits = 0;
      while (queue.length && visits < 120) {
        const node = queue.shift();
        if (!node || typeof node !== "object") continue;
        if (seen.has(node)) continue;
        seen.add(node);
        visits++;
        if (Array.isArray(node)) {
          const shaped = shapeMarketwatchAssets(node);
          if (shaped) return shaped;
          for (const child of node.slice(0, 30)) if (child && typeof child === "object") queue.push(child);
        } else {
          for (const child of Object.values(node)) if (child && typeof child === "object") queue.push(child);
        }
      }
    } catch (_) {}
    return null;
  }

  function scanMarketwatchPayload(json, url, source) {
    try {
      const found = findMarketwatchAssets(json);
      if (!found?.assets?.length) return;
      send("marketwatch", {
        captured_at: new Date().toISOString(),
        assets: found.assets,
        source: source || "passive-thunder-x",
        page_url: location.href,
        response_url: String(url || "").slice(0, 240),
        same_day: found.sameDay,
      });
    } catch (_) {}
  }

  // ---- Active marketwatch poll (v4.2.43) ----
  // Thunder's own page calls GET /assets-service/assets/marketwatch?market=egypt
  // (~every 60-95s, verified in a 5h HAR capture: 188 calls, 0x HTTP 429).
  // That single call returns EVERY Egypt symbol with volume/bid/ask/high/low,
  // completely independent of which rows the virtualized watchlist mounted.
  // We repeat the SAME request at a higher cadence from the page itself, so the
  // request is byte-identical to Thunder's own (same origin, same headers) and
  // covers all symbols with zero DOM tricks.
  const MW_ACTIVE_URL = "https://prod.thndr.app/assets-service/assets/marketwatch?market=egypt";
  const MW_POLL_MS = 65_000;
  const MW_MAX_BACKOFF_MS = 300_000;
  let mwBackoffMs = 0;
  let mwNextAllowedAt = 0;
  let mwPollInFlight = false;

  function egxLikelyOpen() {
    // Check Cairo time: Sunday-Thursday 10:00-14:35
    try {
      const now = new Date();
      const cairo = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
      const day = cairo.getDay(); // 0=Sun, 1=Mon...
      const hour = cairo.getHours();
      const min = cairo.getMinutes();
      const isWorkDay = (day >= 0 && day <= 4); // Sun-Thu
      if (!isWorkDay) return false;
      const totalMin = hour * 60 + min;
      return totalMin >= 600 && totalMin <= 875; // 10:00 - 14:35
    } catch {
      return true; // Fallback if TZ logic fails
    }
  }

  function randomCorrelationId() {
    try {
      if (crypto?.randomUUID) return crypto.randomUUID();
    } catch {}
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  async function activeMarketwatchPoll() {
    if (mwPollInFlight) return;
    if (Date.now() < mwNextAllowedAt) return;
    if (!egxLikelyOpen()) return;
    mwPollInFlight = true;
    try {
      const headers = {
        accept: "application/json, text/plain, */*",
        "x-correlation-id": randomCorrelationId(),
      };
      if (__thunderAuthHeader) headers.authorization = __thunderAuthHeader;
      const res = await origFetch(MW_ACTIVE_URL, {
        method: "GET",
        credentials: "include",
        headers,
      });
      if (res.status === 429 || res.status >= 500) {
        mwBackoffMs = Math.min(mwBackoffMs ? mwBackoffMs * 2 : 60_000, MW_MAX_BACKOFF_MS);
        mwNextAllowedAt = Date.now() + mwBackoffMs;
        send("marketwatchStatus", { lastError: `active_poll_http_${res.status}`, backoffUntil: mwNextAllowedAt, page: location.hostname });
        return;
      }
      if (!res.ok) {
        mwNextAllowedAt = Date.now() + 60_000;
        send("marketwatchStatus", { lastError: `active_poll_http_${res.status}`, backoffUntil: mwNextAllowedAt, page: location.hostname });
        return;
      }
      mwBackoffMs = 0;
      const json = await res.json().catch(() => null);
      if (json) scanMarketwatchPayload(json, MW_ACTIVE_URL, "active-poll-x");
    } catch (e) {
      mwNextAllowedAt = Date.now() + 30_000;
    } finally {
      mwPollInFlight = false;
    }
  }

  async function diagnoseMarketwatchOnce() {
    const startedAt = Date.now();
    try {
      const headers = {
        accept: "application/json, text/plain, */*",
        "x-correlation-id": randomCorrelationId(),
      };
      if (__thunderAuthHeader) headers.authorization = __thunderAuthHeader;
      const res = await origFetch(MW_ACTIVE_URL, {
        method: "GET",
        credentials: "include",
        headers,
      });
      if (!res.ok) {
        return { ok: false, status: res.status, error: `http_${res.status}`, durationMs: Date.now() - startedAt };
      }
      const json = await res.json().catch(() => null);
      const assets = findMarketwatchAssets(json) || [];
      const shaped = shapeMarketwatchAssets(assets) || [];
      const symbols = new Set(shaped.map((asset) => asset.symbol).filter(Boolean));
      const hasValue = (value) => value !== null && value !== undefined && value !== "";
      const count = (key) => assets.filter((asset) => hasValue(asset?.[key])).length;
      return {
        ok: true,
        status: res.status,
        durationMs: Date.now() - startedAt,
        rawAssets: assets.length,
        parsedAssets: shaped.length,
        distinctSymbols: symbols.size,
        usefulRows: shaped.filter((asset) =>
          (Number(asset.total_volume) || 0) > 0 ||
          (Number(asset.total_trades) || 0) > 0 ||
          (Number(asset.total_value) || 0) > 0
        ).length,
        fields: {
          price: count("last_trade_price"),
          volume: count("total_volume"),
          trades: count("total_trades"),
          bid: count("bid_price"),
          ask: count("ask_price"),
          bidVolume: count("bid_volume"),
          askVolume: count("ask_volume"),
          high: count("high_price"),
          low: count("low_price"),
        },
      };
    } catch (error) {
      return { ok: false, status: 0, error: String(error?.message || error), durationMs: Date.now() - startedAt };
    }
  }

  try {
    if (window.top === window && /(^|\.)thndr\.app$/i.test(location.hostname) && !window.__thunderMwActivePoll) {
      window.__thunderMwActivePoll = true;
      setTimeout(activeMarketwatchPoll, 5_000);
      setInterval(activeMarketwatchPoll, MW_POLL_MS);
    }
  } catch {}

  // ---- Raw capture for FILLED verification session ----
  // When window.__thunderCapture === true, every Thunder market-service call
  // (orders, positions, portfolio, accounts, assets) is forwarded raw to the
  // background with full body + headers. Redaction happens in background.
  const CAPTURE_URL_RE = /\.thndr\.app\/(market-service|account-service|portfolio-service)\//i;
  const MAX_CAP_BODY = 60_000;

  function shouldCapture(url) {
    try { return window.__thunderCapture === true && CAPTURE_URL_RE.test(String(url || "")); }
    catch { return false; }
  }

  function truncateText(s) {
    if (typeof s !== "string") return s;
    return s.length > MAX_CAP_BODY ? s.slice(0, MAX_CAP_BODY) + "...[truncated]" : s;
  }

  function captureFetch(input, init, resp) {
    try {
      const url = typeof input === "string" ? input : (input?.url || "");
      if (!shouldCapture(url)) return;
      const method = (init?.method || (typeof input !== "string" && input?.method) || "GET").toUpperCase();
      let reqBody = null;
      try {
        if (init?.body != null) {
          reqBody = typeof init.body === "string" ? init.body : null;
        }
      } catch {}
      const headers = {};
      try { resp.headers.forEach((v, k) => { headers[k] = v; }); } catch {}
      const status = resp.status;
      const clone = resp.clone();
      clone.text().then((txt) => {
        send("captureEvent", {
          ts_ms: Date.now(),
          source: "fetch",
          method,
          url,
          status,
          req_body: truncateText(reqBody),
          resp_headers: headers,
          resp_body: truncateText(txt),
          page_url: location.href,
        });
      }).catch(() => {});
    } catch {}
  }

  function captureXHR(xhr, method, url, reqBody) {
    try {
      if (!shouldCapture(url)) return;
      const headers = {};
      try {
        const raw = xhr.getAllResponseHeaders ? xhr.getAllResponseHeaders() : "";
        for (const line of String(raw).split(/\r?\n/)) {
          const idx = line.indexOf(":");
          if (idx > 0) headers[line.slice(0, idx).trim().toLowerCase()] = line.slice(idx + 1).trim();
        }
      } catch {}
      send("captureEvent", {
        ts_ms: Date.now(),
        source: "xhr",
        method: String(method || "GET").toUpperCase(),
        url,
        status: xhr.status,
        req_body: truncateText(typeof reqBody === "string" ? reqBody : null),
        resp_headers: headers,
        resp_body: truncateText(xhr.responseText || ""),
        page_url: location.href,
      });
    } catch {}
  }

  function isLongPollUrl(url) {
    const u = String(url || "");
    return u.includes("/lp?") || /[?&](id|ser)=/.test(u);
  }

  // ---- Passive Level-2 order book capture (v4.1.64) ----
  // Thunder itself calls GET /assets-service/market-depth/{uuid} whenever the
  // user has the "معلومات السوق عن المستوى الثاني" panel open (or on any
  // page that renders depth). We do NOT trigger this request ourselves — we
  // only read the response passively, exactly like the price interceptor.
  // Zero new network activity → zero detection surface for Thunder.
  const L2_CAPTURE_ENABLED = true;
  const MARKET_DEPTH_RE = /\/market-depth\/([0-9a-fA-F-]{36})/;
  const TRADES_BOOK_RE = /\/market-depth\/v2\/trades-book\/([0-9a-fA-F-]{36})/;
  const MARKETWATCH_URL_RE = /\/assets-service\/assets\/marketwatch(?:\?|$)/i;

  function normalizeTapeSide(v) {
    const s = String(v || "").trim().toUpperCase();
    if (s === "B" || s === "BUY" || /شراء/.test(s)) return "BUY";
    if (s === "S" || s === "SELL" || /بيع/.test(s)) return "SELL";
    return s || null;
  }

  function shapeTapeTrades(json) {
    const candidates = [];
    const push = (arr) => { if (Array.isArray(arr)) candidates.push(arr); };
    if (json && typeof json === "object") {
      push(json.data);
      push(json.trades);
      push(json.results);
      if (Array.isArray(json)) push(json);
    }
    for (const arr of candidates) {
      const out = [];
      for (const t of arr) {
        if (!t || typeof t !== "object") continue;
        const cursor = t.cursor ?? t.id ?? t.trade_id ?? t.sequence ?? t.seq;
        const cursorNum = Number(cursor);
        if (!Number.isFinite(cursorNum)) continue;
        const price = normalizeMwNumber(t.order_price ?? t.price ?? t.trade_price);
        const volume = normalizeMwNumber(t.volume_traded ?? t.volume ?? t.qty ?? t.quantity);
        const value = normalizeMwNumber(t.value ?? t.trade_value);
        out.push({
          cursor: cursorNum,
          side: normalizeTapeSide(t.order_side ?? t.side ?? t.trade_side),
          price,
          volume,
          value,
          time: t.trade_date ?? t.time ?? t.trade_time ?? t.timestamp ?? null,
        });
      }
      if (out.length) return out;
    }
    return [];
  }

  function scanTapePayload(url, json) {
    try {
      const m = TRADES_BOOK_RE.exec(String(url || ""));
      const assetId = String(m?.[1] || "").toLowerCase();
      if (!assetId) return;
      const trades = shapeTapeTrades(json);
      if (!trades.length) return;
      send("tape", {
        asset_id: assetId,
        captured_at: new Date().toISOString(),
        trades: trades.slice(0, 500),
        source: "passive-thunder-x-page",
        response_url: String(url || "").slice(0, 240),
      });
    } catch (_) {}
  }

  function scanMarketDepth(url, txt) {
    if (L2_CAPTURE_ENABLED !== true) return;
    try {
      const m = MARKET_DEPTH_RE.exec(String(url || ""));
      if (!m) return;
      const uuid = m[1].toLowerCase();
      const json = typeof txt === "string" ? JSON.parse(txt) : txt;
      const rawAsks = Array.isArray(json?.asks_per_price) ? json.asks_per_price : [];
      const rawBids = Array.isArray(json?.bids_per_price) ? json.bids_per_price : [];
      if (!rawAsks.length && !rawBids.length) return;
      // Defensive self-sort (do not rely on Thunder's ordering):
      // asks ascending (best = lowest), bids descending (best = highest).
      const asks = rawAsks
        .map((a) => ({ price: Number(a?.order_price), qty: Number(a?.volume_traded) || 0 }))
        .filter((a) => a.price > 0)
        .sort((a, b) => a.price - b.price)
        .slice(0, 5);
      const bids = rawBids
        .map((b) => ({ price: Number(b?.order_price), qty: Number(b?.volume_traded) || 0 }))
        .filter((b) => b.price > 0)
        .sort((a, b) => b.price - a.price)
        .slice(0, 5);
      send("l2Snapshot", {
        uuid,
        ts: Date.now(),
        bestBid: bids[0]?.price ?? null,
        bestBidQty: bids[0]?.qty ?? null,
        bestAsk: asks[0]?.price ?? null,
        bestAskQty: asks[0]?.qty ?? null,
        spread: (bids[0]?.price && asks[0]?.price) ? +(asks[0].price - bids[0].price).toFixed(4) : null,
        asks, bids,
        totalBids: Number(json?.total_bids_and_asks?.total_bids) || null,
        totalAsks: Number(json?.total_bids_and_asks?.total_asks) || null,
      });
    } catch (_) {}
  }

  // Firebase Realtime Database long-polling executes JSONP scripts inside a
  // hidden same-origin iframe. The top page hook never sees that iframe global,
  // so install the same read-only callback wrapper in every accessible frame.
  const hookedWindows = new WeakSet();

  function installFrameLongPollHooks(targetWindow) {
    try {
      if (!targetWindow || hookedWindows.has(targetWindow)) return;
      hookedWindows.add(targetWindow);
      hookJsonpCallback(targetWindow, "pRTLPCB");
      hookScriptInsertion(targetWindow);
    } catch (_) {}
  }

  function hookJsonpCallback(targetWindow, callbackName) {
    const marker = `__thunder_${callbackName}_hooked`;
    try {
      if (targetWindow[marker] === PAGE_SCRIPT_VERSION) return;
      Object.defineProperty(targetWindow, marker, { value: PAGE_SCRIPT_VERSION, configurable: true });
    } catch (_) {}

    let originalCallback = null;
    try {
      const cur = targetWindow[callbackName];
      originalCallback = typeof cur === "function" && cur.__thunderWrappedJsonp !== true ? cur : null;
    } catch (_) {}

    const wrappedCallback = function (...args) {
      try {
        const txt = (() => { try { return JSON.stringify(args); } catch { return String(args); } })();
        send("jsonp", { len: txt.length, hasFeed: txt.indexOf("marketFeed/") !== -1 });
      } catch (_) {}
      scanLongPollPayload(args);
      if (typeof originalCallback === "function") return originalCallback.apply(this, args);
    };
    try { Object.defineProperty(wrappedCallback, "name", { value: callbackName, configurable: true }); } catch (_) {}
    try { Object.defineProperty(wrappedCallback, "__thunderWrappedJsonp", { value: true, configurable: true }); } catch (_) {}
    try {
      Object.defineProperty(targetWindow, callbackName, {
        configurable: true,
        get() { return wrappedCallback; },
        set(fn) { originalCallback = typeof fn === "function" && fn.__thunderWrappedJsonp !== true ? fn : null; },
      });
    } catch (_) {}
  }

  function patchIframeElement(iframe) {
    const run = () => {
      try { installFrameLongPollHooks(iframe.contentWindow); } catch (_) {}
    };
    run();
    try { iframe.addEventListener("load", run, true); } catch (_) {}
    setTimeout(run, 0);
    setTimeout(run, 50);
    setTimeout(run, 250);
    setTimeout(run, 1000);
  }

  function scanAccessibleFrames(rootWindow = window) {
    try {
      for (const iframe of Array.from(rootWindow.document?.querySelectorAll?.("iframe") || [])) {
        patchIframeElement(iframe);
      }
    } catch (_) {}
  }

  function hookScriptInsertion(targetWindow) {
    try {
      const NodeProto = targetWindow.Node?.prototype;
      const DocumentProto = targetWindow.Document?.prototype;
      if (!NodeProto || NodeProto.__thunderFrameHooked === PAGE_SCRIPT_VERSION) return;
      Object.defineProperty(NodeProto, "__thunderFrameHooked", { value: PAGE_SCRIPT_VERSION, configurable: true });

      const originalAppendChild = NodeProto.appendChild;
      const originalInsertBefore = NodeProto.insertBefore;
      const originalReplaceChild = NodeProto.replaceChild;

      const beforeInsert = (node) => {
        try {
          if (node?.tagName?.toLowerCase?.() === "iframe") patchIframeElement(node);
          if (node?.tagName?.toLowerCase?.() === "script" && isLongPollUrl(node.src || node.getAttribute?.("src"))) {
            installFrameLongPollHooks(targetWindow);
          }
        } catch (_) {}
      };
      const afterInsert = (node) => {
        try { if (node?.tagName?.toLowerCase?.() === "iframe") patchIframeElement(node); } catch (_) {}
      };

      NodeProto.appendChild = function patchedAppendChild(node) {
        beforeInsert(node);
        const result = originalAppendChild.apply(this, arguments);
        afterInsert(node);
        return result;
      };
      NodeProto.insertBefore = function patchedInsertBefore(node) {
        beforeInsert(node);
        const result = originalInsertBefore.apply(this, arguments);
        afterInsert(node);
        return result;
      };
      NodeProto.replaceChild = function patchedReplaceChild(node) {
        beforeInsert(node);
        const result = originalReplaceChild.apply(this, arguments);
        afterInsert(node);
        return result;
      };

      if (DocumentProto?.createElement && DocumentProto.__thunderCreateElementHooked !== PAGE_SCRIPT_VERSION) {
        Object.defineProperty(DocumentProto, "__thunderCreateElementHooked", { value: PAGE_SCRIPT_VERSION, configurable: true });
        const originalCreateElement = DocumentProto.createElement;
        DocumentProto.createElement = function patchedCreateElement(name, options) {
          const el = originalCreateElement.apply(this, arguments);
          try { if (String(name || "").toLowerCase() === "iframe") setTimeout(() => patchIframeElement(el), 0); } catch (_) {}
          return el;
        };
      }

      try {
        const mo = new targetWindow.MutationObserver((mutations) => {
          for (const m of mutations) {
            for (const node of Array.from(m.addedNodes || [])) {
              if (node?.tagName?.toLowerCase?.() === "iframe") patchIframeElement(node);
              if (node?.querySelectorAll) for (const iframe of Array.from(node.querySelectorAll("iframe"))) patchIframeElement(iframe);
            }
          }
        });
        const startObserver = () => {
          try { mo.observe(targetWindow.document.documentElement || targetWindow.document, { childList: true, subtree: true }); } catch (_) {}
        };
        if (targetWindow.document?.documentElement) startObserver(); else targetWindow.addEventListener?.("DOMContentLoaded", startObserver, { once: true });
      } catch (_) {}
    } catch (_) {}
  }

  installFrameLongPollHooks(window);
  setInterval(() => scanAccessibleFrames(window), 1000);

  function isVisible(el) {
    if (!el || el.nodeType !== 1) return false;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.display !== "none" && s.visibility !== "hidden";
  }

  function isDisabled(el) {
    if (!el || el.nodeType !== 1) return true;
    const s = getComputedStyle(el);
    return el.disabled || el.getAttribute("aria-disabled") === "true" || s.pointerEvents === "none";
  }

  function clickTargets(hit) {
    const out = [];
    const add = (node) => {
      if (node && node.nodeType === 1 && !out.includes(node) && isVisible(node) && !isDisabled(node)) out.push(node);
    };
    add(hit);
    add(hit?.closest?.(".ant-select:not(.ant-select-disabled) .ant-select-selector, .ant-select:not(.ant-select-disabled), button, [role='button'], [role='combobox'], a, input, label, [tabindex], [onclick]"));
    let cur = hit?.parentElement;
    for (let i = 0; cur && i < 7; i++, cur = cur.parentElement) {
      const s = getComputedStyle(cur);
      const r = cur.getBoundingClientRect();
      if (cur.matches?.(".ant-select:not(.ant-select-disabled), .ant-select-selector, button, [role='button'], [role='combobox'], a, input, label, [tabindex], [onclick]") || s.cursor === "pointer" || (r.width >= 52 && r.width <= 440 && r.height >= 28 && r.height <= 110 && s.backgroundColor !== "rgba(0, 0, 0, 0)")) add(cur);
    }
    return out;
  }

  function makeReactLikeEvent(target, x, y) {
    return {
      bubbles: true,
      cancelable: true,
      composed: true,
      defaultPrevented: false,
      isTrusted: true,
      target,
      currentTarget: target,
      nativeEvent: { detail: 1, isTrusted: true, clientX: x, clientY: y, button: 0, buttons: 0 },
      clientX: x,
      clientY: y,
      button: 0,
      buttons: 0,
      detail: 1,
      preventDefault() { this.defaultPrevented = true; },
      stopPropagation() {},
      persist() {},
      isDefaultPrevented() { return this.defaultPrevented; },
      isPropagationStopped() { return false; },
    };
  }

  function invokeReactClick(target, x, y) {
    let ok = false;
    let cur = target;
    const called = new Set();
    for (let depth = 0; cur && depth < 8; depth++, cur = cur.parentElement) {
      const keys = Object.keys(cur);
      const propsKey = keys.find((k) => k.startsWith("__reactProps$") || k.startsWith("__reactEventHandlers$"));
      const fiberKey = keys.find((k) => k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$"));
      const handlers = [];
      const props = propsKey ? cur[propsKey] : null;
      if (typeof props?.onClick === "function") handlers.push(props.onClick);
      let fiber = fiberKey ? cur[fiberKey] : null;
      for (let i = 0; fiber && i < 8; i++, fiber = fiber.return) {
        if (typeof fiber.memoizedProps?.onClick === "function") handlers.push(fiber.memoizedProps.onClick);
      }
      for (const handler of handlers) {
        if (called.has(handler)) continue;
        called.add(handler);
        try {
          handler(makeReactLikeEvent(cur, x, y));
          ok = true;
        } catch (_) {}
      }
    }
    return ok;
  }

  function invokeReactHandlers(target, handlerNames, eventLike) {
    let ok = false;
    let cur = target;
    const called = new Set();
    for (let depth = 0; cur && depth < 8; depth++, cur = cur.parentElement) {
      const keys = Object.keys(cur);
      const propsKey = keys.find((k) => k.startsWith("__reactProps$") || k.startsWith("__reactEventHandlers$"));
      const fiberKey = keys.find((k) => k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$"));
      const props = propsKey ? cur[propsKey] : null;
      const handlers = [];
      for (const name of handlerNames) if (typeof props?.[name] === "function") handlers.push(props[name]);
      let fiber = fiberKey ? cur[fiberKey] : null;
      for (let i = 0; fiber && i < 8; i++, fiber = fiber.return) {
        for (const name of handlerNames) if (typeof fiber.memoizedProps?.[name] === "function") handlers.push(fiber.memoizedProps[name]);
      }
      for (const handler of handlers) {
        if (called.has(handler)) continue;
        called.add(handler);
        try { handler({ ...eventLike, currentTarget: cur }); ok = true; } catch (_) {}
      }
    }
    return ok;
  }

  function dispatchClick(target, x, y) {
    try { target.focus?.({ preventScroll: true }); } catch (_) {}
    const base = { bubbles: true, cancelable: true, composed: true, view: window, clientX: x, clientY: y, screenX: x, screenY: y, button: 0, buttons: 1, detail: 1 };
    try {
      if (typeof PointerEvent !== "undefined") {
        target.dispatchEvent(new PointerEvent("pointerover", { ...base, pointerId: 1, pointerType: "mouse", isPrimary: true }));
        target.dispatchEvent(new PointerEvent("pointerenter", { ...base, pointerId: 1, pointerType: "mouse", isPrimary: true, bubbles: false }));
        target.dispatchEvent(new PointerEvent("pointermove", { ...base, pointerId: 1, pointerType: "mouse", isPrimary: true }));
        target.dispatchEvent(new PointerEvent("pointerdown", { ...base, pointerId: 1, pointerType: "mouse", isPrimary: true }));
        target.dispatchEvent(new PointerEvent("pointerup", { ...base, pointerId: 1, pointerType: "mouse", isPrimary: true, buttons: 0 }));
      }
      target.dispatchEvent(new MouseEvent("mouseover", base));
      target.dispatchEvent(new MouseEvent("mouseenter", { ...base, bubbles: false }));
      target.dispatchEvent(new MouseEvent("mousemove", base));
      target.dispatchEvent(new MouseEvent("mousedown", base));
      target.dispatchEvent(new MouseEvent("mouseup", { ...base, buttons: 0 }));
      target.dispatchEvent(new MouseEvent("click", { ...base, buttons: 0 }));
      if (typeof target.click === "function") target.click();
      return true;
    } catch (_) {
      return false;
    }
  }

  function dispatchOneClickAt(x, y, preferredTarget) {
    const hit = document.elementFromPoint(x, y);
    const semanticTarget = preferredTarget && isVisible(preferredTarget) && !isDisabled(preferredTarget)
      ? preferredTarget
      : (hit?.closest?.(".ant-select:not(.ant-select-disabled) .ant-select-selector, .ant-select:not(.ant-select-disabled), [role='combobox'], button, [role='button'], a, input, label, [tabindex], [onclick]") || hit);
    const antWrap = semanticTarget?.closest?.(".ant-select:not(.ant-select-disabled)");
    const target = antWrap?.querySelector?.(".ant-select-selector") || semanticTarget;
    if (!target || !isVisible(target) || isDisabled(target)) return false;
    try { target.scrollIntoView?.({ block: "nearest", inline: "nearest", behavior: "instant" }); } catch (_) {}
    try { target.focus?.({ preventScroll: true }); } catch (_) {}
    const base = { bubbles: true, cancelable: true, composed: true, view: window, clientX: x, clientY: y, screenX: x, screenY: y, button: 0, buttons: 1, detail: 1 };
    try {
      invokeReactHandlers(target, ["onPointerMove", "onPointerDown", "onMouseDown"], makeReactLikeEvent(target, x, y));
      if (typeof PointerEvent !== "undefined") {
        target.dispatchEvent(new PointerEvent("pointerover", { ...base, pointerId: 1, pointerType: "mouse", isPrimary: true }));
        target.dispatchEvent(new PointerEvent("pointermove", { ...base, pointerId: 1, pointerType: "mouse", isPrimary: true }));
        target.dispatchEvent(new PointerEvent("pointerdown", { ...base, pointerId: 1, pointerType: "mouse", isPrimary: true }));
        target.dispatchEvent(new PointerEvent("pointerup", { ...base, pointerId: 1, pointerType: "mouse", isPrimary: true, buttons: 0 }));
      }
      target.dispatchEvent(new MouseEvent("mouseover", base));
      target.dispatchEvent(new MouseEvent("mousemove", base));
      target.dispatchEvent(new MouseEvent("mousedown", base));
      target.dispatchEvent(new MouseEvent("mouseup", { ...base, buttons: 0 }));
      target.dispatchEvent(new MouseEvent("click", { ...base, buttons: 0 }));
      invokeReactHandlers(target, ["onPointerUp", "onMouseUp", "onClick"], makeReactLikeEvent(target, x, y));
      if (antWrap && !antWrap.classList.contains("ant-select-open")) {
        const input = antWrap.querySelector("input");
        try { (input || target).focus?.({ preventScroll: true }); } catch (_) {}
        for (const key of ["ArrowDown", "Enter"]) {
          const active = document.activeElement && antWrap.contains(document.activeElement) ? document.activeElement : (input || target);
          const code = key;
          const eventLike = { bubbles: true, cancelable: true, composed: true, key, code, target: active, currentTarget: active, nativeEvent: { key, code }, preventDefault() {}, stopPropagation() {} };
          invokeReactHandlers(active, ["onKeyDown"], eventLike);
          active.dispatchEvent(new KeyboardEvent("keydown", { key, code, bubbles: true, cancelable: true, composed: true }));
          invokeReactHandlers(active, ["onKeyUp"], eventLike);
          active.dispatchEvent(new KeyboardEvent("keyup", { key, code, bubbles: true, cancelable: true, composed: true }));
          if (antWrap.classList.contains("ant-select-open")) break;
        }
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  function openDropdownAt(x, y) {
    const hit = document.elementFromPoint(x, y);
    const antWrap = hit?.closest?.(".ant-select:not(.ant-select-disabled)");
    if (antWrap && isVisible(antWrap) && !isDisabled(antWrap)) {
      const selector = antWrap.querySelector(".ant-select-selector") || antWrap;
      const r = selector.getBoundingClientRect();
      const sx = r.left + r.width / 2;
      const sy = r.top + r.height / 2;
      dispatchOneClickAt(sx, sy, selector);
      const input = antWrap.querySelector("input") || selector;
      try { input.focus?.({ preventScroll: true }); } catch (_) {}
      for (const key of ["ArrowDown", "Enter"]) {
        const code = key;
        const eventLike = { bubbles: true, cancelable: true, composed: true, key, code, target: input, currentTarget: input, nativeEvent: { key, code }, preventDefault() {}, stopPropagation() {} };
        invokeReactHandlers(input, ["onKeyDown"], eventLike);
        input.dispatchEvent(new KeyboardEvent("keydown", { key, code, bubbles: true, cancelable: true, composed: true }));
        invokeReactHandlers(input, ["onKeyUp"], eventLike);
        input.dispatchEvent(new KeyboardEvent("keyup", { key, code, bubbles: true, cancelable: true, composed: true }));
        if (antWrap.classList.contains("ant-select-open")) break;
      }
      return true;
    }
    return dispatchOneClickAt(x, y);
  }

  function normalizeArabicText(text) {
    return String(text || "")
      .replace(/[\u064B-\u065F\u0670]/g, "")
      .replace(/[إأآا]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeDigits(text) {
    return String(text || "")
      .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
      .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
  }

  function normalizeSettlementText(text) {
    return normalizeArabicText(normalizeDigits(text)).replace(/[＋]/g, "+").toLowerCase();
  }

  function settlementDigits(text) {
    const t = normalizeSettlementText(text)
      .replace(/t\s*(?:[+\-]\s*)?([012])/gi, " T$1 ")
      .replace(/([012])\s*(?:نفس|ذات)?\s*الجلسه/g, " T$1 ");
    return Array.from(t.matchAll(/(?:^|[^a-z0-9])t\s*(?:[+\-]\s*)?([012])(?=[^0-9]|$)/gi)).map((m) => Number(m[1]));
  }

  function settlementTextHasDigit(text, digit) {
    return settlementDigits(text).includes(digit);
  }

  function settlementTextHasT0(text) {
    return settlementTextHasDigit(text, 0);
  }

  function settlementTextHasNonT0(text) {
    return settlementTextHasDigit(text, 1) || settlementTextHasDigit(text, 2);
  }

  function firstSettlementDigit(text) {
    return settlementDigits(text)[0] ?? null;
  }

  function settlementTextLooksT0(text) {
    const t = normalizeSettlementText(text);
    if (/(نفس|ذات)\s*الجلسه|بيع\s*نفس\s*الجلسه|same[\s-]*(day|session)|day[\s-]*trade|intraday/i.test(t)) return true;
    if (!settlementTextHasT0(text)) return false;
    if (!settlementTextHasNonT0(text)) return true;
    return firstSettlementDigit(text) === 0;
  }

  function settlementValueLooksT0(value) {
    const v = normalizeSettlementText(value).replace(/[\s_\-]+/g, "");
    return /^(0|t0|t\+0|sameday|samesession|daytrade|intraday)$/.test(v);
  }

  function cleanText(el) {
    const visibleText = typeof el?.innerText === "string" ? el.innerText : (el?.textContent || "");
    return (visibleText + " " + (el?.value || "") + " " + (el?.getAttribute?.("value") || "") + " " + (el?.getAttribute?.("data-value") || "") + " " + (el?.getAttribute?.("aria-label") || "") + " " + (el?.getAttribute?.("title") || "") + " " + (el?.getAttribute?.("data-testid") || ""))
      .replace(/\s+/g, " ")
      .trim();
  }

  function rectsOverlap(a, b) {
    if (!a || !b) return false;
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  }

  function scoreVisibleTextOption(el, labels, avoidRect, excludeText) {
    if (!el || !isVisible(el) || isDisabled(el)) return Infinity;
    const r = el.getBoundingClientRect();
    if (r.width < 24 || r.height < 12 || r.width > Math.min(820, window.innerWidth - 12) || r.height > 180) return Infinity;
    if (avoidRect && rectsOverlap(r, avoidRect)) return Infinity;
    const s = getComputedStyle(el);
    if (Number(s.opacity || "1") < 0.08 || s.pointerEvents === "none") return Infinity;
    const text = cleanText(el);
    if (!text || text.length > 180) return Infinity;
    const normalized = normalizeArabicText(text).toLowerCase();
    const wantsMarketOrder = labels.some((label) => /سعر\s*السوق|market/i.test(normalizeArabicText(label).toLowerCase()));
    if (wantsMarketOrder && /معلومات\s*(?:ال)?سوق|(?:ال)?مستوي\s*(?:ال)?ثاني|(?:ال)?مستوى\s*(?:ال)?ثاني|level\s*(?:2|ii)|market\s*depth|depth\s*of\s*market/i.test(normalized)) return Infinity;
    const wanted = labels.some((label) => normalized.includes(normalizeArabicText(label).toLowerCase()));
    if (!wanted) return Infinity;
    let exclude = /سعر محدد|limit|advanced|الطلبات المتقدمه/i;
    if (typeof excludeText === "string" && excludeText.length) {
      try { exclude = new RegExp(excludeText, "i"); } catch (_) { /* keep default */ }
    } else if (excludeText === null) {
      exclude = null;
    }
    if (exclude && exclude.test(normalized)) return Infinity;
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const hit = document.elementFromPoint(cx, cy);
    if (!hit || !(el === hit || el.contains(hit) || hit.contains(el))) return Infinity;
    const semantic = el.matches?.("[role='option'], [role='menuitem'], [role='menuitemradio'], li, [data-value]") ? 0 : 22;
    const exact = labels.some((label) => normalized === normalizeArabicText(label).toLowerCase()) ? 0 : 18;
    const near = avoidRect ? Math.max(0, r.top - avoidRect.bottom) / 4 + Math.abs(cx - (avoidRect.left + avoidRect.width / 2)) / 10 : 40;
    return semantic + exact + near + Math.max(0, r.height - 54) + Math.max(0, r.width - 280) / 12;
  }

  function selectVisibleText(labels, avoidRect, excludeText) {
    const selectors = "[role='option'], [role='menuitem'], [role='menuitemradio'], [role='listbox'] *, [data-radix-popper-content-wrapper] *, li[tabindex], li[role], [data-value], li, button, [role='button'], div, span, p";
    const seen = new Set();
    const best = Array.from(document.querySelectorAll(selectors))
      .flatMap((raw) => [raw.closest?.("[role='option'], [role='menuitem'], [role='menuitemradio'], li[tabindex], li[role], [data-value], li, button") || raw, raw])
      .filter((el) => el && !seen.has(el) && seen.add(el))
      .map((el) => ({ el, score: scoreVisibleTextOption(el, labels, avoidRect, excludeText) }))
      .filter((item) => item.score < Infinity)
      .sort((a, b) => a.score - b.score)[0]?.el;
    if (!best) return false;
    const r = best.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const reactPointer = invokeReactHandlers(best, ["onPointerMove", "onPointerDown", "onPointerUp", "onMouseDown", "onMouseUp", "onClick"], makeReactLikeEvent(best, x, y));
    const pointed = dispatchOneClickAt(x, y, best);
    try { best.focus?.({ preventScroll: true }); } catch (_) {}
    for (const key of ["Enter", " "]) {
      try {
        const code = key === " " ? "Space" : "Enter";
        const keyEvent = { bubbles: true, cancelable: true, composed: true, key, code, target: best, currentTarget: best, nativeEvent: { key, code }, preventDefault() {}, stopPropagation() {} };
        invokeReactHandlers(best, ["onKeyDown", "onKeyUp"], keyEvent);
        best.dispatchEvent(new KeyboardEvent("keydown", { key, code, bubbles: true, cancelable: true, composed: true }));
        best.dispatchEvent(new KeyboardEvent("keyup", { key, code, bubbles: true, cancelable: true, composed: true }));
        return true;
      } catch (_) {}
    }
    return reactPointer || pointed || invokeReactClick(best, x, y);
  }

  function scoreSettlementT0Option(el, avoidRect) {
    if (!el || !isVisible(el) || isDisabled(el)) return Infinity;
    const r = el.getBoundingClientRect();
    if (r.width < 24 || r.height < 12 || r.width > Math.min(900, window.innerWidth - 12) || r.height > 220) return Infinity;
    if (avoidRect && rectsOverlap(r, avoidRect)) return Infinity;
    const s = getComputedStyle(el);
    if (Number(s.opacity || "1") < 0.08 || s.pointerEvents === "none") return Infinity;
    const text = cleanText(el);
    if (!text || text.length > 220) return Infinity;
    if (!settlementTextLooksT0(text) && !settlementValueLooksT0(`${el.getAttribute?.("data-value") || ""} ${el.getAttribute?.("value") || ""}`)) return Infinity;
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const hit = document.elementFromPoint(cx, cy);
    if (!hit || !(el === hit || el.contains(hit) || hit.contains(el))) return Infinity;
    const semantic = el.matches?.("[role='option'], [role='menuitem'], [role='menuitemradio'], li, [data-value]") ? 0 : 18;
    const exact = /^t\s*(?:[+\-]\s*)?0$/i.test(normalizeSettlementText(text)) ? 0 : 20;
    const near = avoidRect ? Math.max(0, r.top - avoidRect.bottom) / 3 + Math.abs(cx - (avoidRect.left + avoidRect.width / 2)) / 12 : 35;
    return semantic + exact + near + Math.max(0, r.height - 58) + Math.max(0, r.width - 320) / 12;
  }

  function selectSettlementT0(avoidRect) {
    // FAST PATH: Ant Design dropdown options have label="T0" attribute.
    const antBest = Array.from(document.querySelectorAll(
      ".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option[label='T0']"
    )).find((el) => isVisible(el) && !isDisabled(el));
    if (antBest) {
      const r0 = antBest.getBoundingClientRect();
      const x0 = r0.left + r0.width / 2;
      const y0 = r0.top + r0.height / 2;
      invokeReactHandlers(antBest, ["onPointerMove", "onPointerDown", "onPointerUp", "onMouseDown", "onMouseUp", "onClick"], makeReactLikeEvent(antBest, x0, y0));
      dispatchOneClickAt(x0, y0, antBest);
      try { antBest.focus?.({ preventScroll: true }); } catch (_) {}
      return true;
    }
    const selectors = "[role='option'], [role='menuitem'], [role='menuitemradio'], [role='listbox'] *, [data-radix-popper-content-wrapper] *, li[tabindex], li[role], [data-value], li, button, [role='button'], div, span, p";
    const seen = new Set();
    const best = Array.from(document.querySelectorAll(selectors))
      .flatMap((raw) => [raw.closest?.("[role='option'], [role='menuitem'], [role='menuitemradio'], li[tabindex], li[role], [data-value], li, button") || raw, raw])
      .filter((el) => el && !seen.has(el) && seen.add(el))
      .map((el) => ({ el, score: scoreSettlementT0Option(el, avoidRect) }))
      .filter((item) => item.score < Infinity)
      .sort((a, b) => a.score - b.score)[0]?.el;
    if (!best) return false;
    const r = best.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const reactPointer = invokeReactHandlers(best, ["onPointerMove", "onPointerDown", "onPointerUp", "onMouseDown", "onMouseUp", "onClick"], makeReactLikeEvent(best, x, y));
    const pointed = dispatchOneClickAt(x, y, best);
    try { best.focus?.({ preventScroll: true }); } catch (_) {}
    for (const key of ["Enter", " "]) {
      try {
        const code = key === " " ? "Space" : "Enter";
        const keyEvent = { bubbles: true, cancelable: true, composed: true, key, code, target: best, currentTarget: best, nativeEvent: { key, code }, preventDefault() {}, stopPropagation() {} };
        invokeReactHandlers(best, ["onKeyDown", "onKeyUp"], keyEvent);
        best.dispatchEvent(new KeyboardEvent("keydown", { key, code, bubbles: true, cancelable: true, composed: true }));
        best.dispatchEvent(new KeyboardEvent("keyup", { key, code, bubbles: true, cancelable: true, composed: true }));
        return true;
      } catch (_) {}
    }
    return reactPointer || pointed || invokeReactClick(best, x, y);
  }

  function keyCodeFor(key) {
    if (key === " ") return "Space";
    if (key === "0") return "Digit0";
    if (key.length === 1) return `Key${key.toUpperCase()}`;
    return key;
  }

  function dispatchSelectKey(target, key) {
    if (!target || !isVisible(target) || isDisabled(target)) return false;
    const code = keyCodeFor(key);
    const eventLike = { bubbles: true, cancelable: true, composed: true, key, code, target, currentTarget: target, nativeEvent: { key, code }, preventDefault() {}, stopPropagation() {} };
    invokeReactHandlers(target, ["onKeyDown"], eventLike);
    target.dispatchEvent(new KeyboardEvent("keydown", { key, code, bubbles: true, cancelable: true, composed: true }));
    invokeReactHandlers(target, ["onKeyUp"], eventLike);
    target.dispatchEvent(new KeyboardEvent("keyup", { key, code, bubbles: true, cancelable: true, composed: true }));
    return true;
  }

  function keyboardSelectSettlementT0(avoidRect, keys) {
    const x = avoidRect ? avoidRect.left + avoidRect.width / 2 : window.innerWidth / 2;
    const y = avoidRect ? avoidRect.top + avoidRect.height / 2 : window.innerHeight / 2;
    let target = document.elementFromPoint(x, y)?.closest?.("button, [role='button'], [role='combobox'], input, [tabindex]") || document.activeElement;
    if (!target || !isVisible(target) || isDisabled(target)) return false;
    try { target.focus?.({ preventScroll: true }); } catch (_) {}
    // Thunder's settlement dropdown may expose only the current value (T2) to the
    // DOM while the menu is portaled. Keyboard selection is safer here: current
    // sell forms default to T2, so Home/ArrowUp navigates to the first option T0.
    const sequence = Array.isArray(keys) && keys.length ? keys : ["Home", "Enter"];
    sequence.forEach((key, index) => {
      setTimeout(() => {
        const active = document.activeElement && isVisible(document.activeElement) ? document.activeElement : target;
        dispatchSelectKey(active, key) || dispatchSelectKey(target, key);
        target = document.activeElement && isVisible(document.activeElement) ? document.activeElement : target;
      }, index * 120);
    });
    return true;
  }

  function typeIntoAt(x, y, text) {
    let el = document.elementFromPoint(x, y);
    // Safety: never fall back to document.activeElement. In Thunder forms the
    // active element is often the shares/quantity field after clicking "Max";
    // if the point misses the intended price input, falling back would type the
    // safe price into quantity. Return false instead so the isolated script can
    // type into the exact element it already identified.
    el = el?.closest?.("input:not([type='hidden']), textarea, [contenteditable='true']") || null;
    if (!el || !isVisible(el) || isDisabled(el)) return false;
    try { el.focus(); } catch (_) {}
    try {
      el.dispatchEvent(new KeyboardEvent("keydown", { key: "a", code: "KeyA", ctrlKey: true, bubbles: true, cancelable: true, composed: true }));
      el.dispatchEvent(new KeyboardEvent("keyup", { key: "a", code: "KeyA", ctrlKey: true, bubbles: true, cancelable: true, composed: true }));
    } catch (_) {}
    if (el.isContentEditable) {
      el.textContent = String(text);
      el.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true, composed: true, inputType: "insertText", data: String(text) }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }
    const proto = Object.getPrototypeOf(el);
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (setter) setter.call(el, ""); else el.value = "";
    el.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true, composed: true, inputType: "deleteContentBackward", data: null }));
    if (setter) setter.call(el, String(text)); else el.value = String(text);
    el.dispatchEvent(new InputEvent("beforeinput", { bubbles: true, cancelable: true, composed: true, inputType: "insertText", data: String(text) }));
    el.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true, composed: true, inputType: "insertText", data: String(text) }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    try { el.blur(); el.focus(); } catch (_) {}
    return true;
  }

  window.addEventListener("message", (event) => {
    const msg = event.data;
    if (event.source !== window || !msg || msg.__thunderMainCommand !== true) return;
    let ok = false;
    let result = null;
    try {
      if (msg.action === "clickAt") {
        const x = Number(msg.payload?.x);
        const y = Number(msg.payload?.y);
        const hit = document.elementFromPoint(x, y);
        const targets = clickTargets(hit);
        for (const target of targets) ok = invokeReactClick(target, x, y) || ok;
        for (const target of targets) ok = dispatchClick(target, x, y) || ok;
      } else if (msg.action === "preciseClickAt") {
        ok = dispatchOneClickAt(Number(msg.payload?.x), Number(msg.payload?.y));
      } else if (msg.action === "openDropdownAt") {
        ok = openDropdownAt(Number(msg.payload?.x), Number(msg.payload?.y));
      } else if (msg.action === "selectVisibleText") {
        ok = selectVisibleText(
          Array.isArray(msg.payload?.labels) ? msg.payload.labels : [],
          msg.payload?.avoidRect || null,
          Object.prototype.hasOwnProperty.call(msg.payload || {}, "excludeText") ? msg.payload.excludeText : undefined,
        );
      } else if (msg.action === "selectSettlementT0") {
        ok = selectSettlementT0(msg.payload?.avoidRect || null);
      } else if (msg.action === "keyboardSelectSettlementT0") {
        ok = keyboardSelectSettlementT0(msg.payload?.avoidRect || null, msg.payload?.keys || null);
      } else if (msg.action === "typeAt") {
        ok = typeIntoAt(Number(msg.payload?.x), Number(msg.payload?.y), msg.payload?.text ?? "");
      } else if (msg.action === "diagnoseMarketwatchOnce") {
        diagnoseMarketwatchOnce().then((diagnostic) => {
          window.postMessage({ __thunderMainResult: true, id: msg.id, ok: diagnostic?.ok === true, result: diagnostic }, "*");
        });
        return;
      }
    } catch (_) {}
    window.postMessage({ __thunderMainResult: true, id: msg.id, ok, result }, "*");
  });

  // JSONP-ish payloads are not stable: sometimes the price object is
  // {p:"marketFeed/<uuid>/price", d:<value>}, sometimes the path/value order
  // changes, and sometimes it arrives as an already-parsed object. Parse both
  // structured payloads and text windows around the marketFeed path.
  function parseLongPoll(payload) {
    const out = [];
    const seen = new Set();
    const symbolByUuid = new Map();
    const feedState = window.__thunderFeedState || (window.__thunderFeedState = Object.create(null));
    const ts = new Date().toISOString();
    const feedPathRe = /marketFeed\/([0-9a-f-]{36})\/([^"'\s\\/?]+)\b/i;

    function normalizeSymbol(value) {
      const s = String(value || "").trim().toUpperCase();
      if (!/^[A-Z0-9._-]{2,16}$/.test(s)) return "";
      if (/^EG[A-Z0-9]{8,}$/i.test(s)) return "";
      if (["EGP", "USD", "ETF", "NULL", "TRUE", "FALSE"].includes(s)) return "";
      return s;
    }

    function isPriceField(field) {
      return /^(price|last|last_price|lastPrice|lastTradePrice|value|close|currentPrice|current_price)$/i.test(String(field || ""));
    }

    function isVolumeField(field) {
      return /^(volume|vol|qty|quantity|size|v|lastSize|tradeQty|trade_qty|total_volume|totalVolume)$/i.test(String(field || ""));
    }

    function isSymbolField(field) {
      return /^(symbol|ticker|code|stock|stock_id|stockSymbol|reutersCode)$/i.test(String(field || ""));
    }

    function isBidField(field) {
      return /^(highest_bid|highestBid|best_bid|bestBid|bid|bidPrice|bid_price)$/i.test(String(field || ""));
    }

    function isAskField(field) {
      return /^(lowest_ask|lowestAsk|best_ask|bestAsk|ask|askPrice|ask_price|offer|offerPrice)$/i.test(String(field || ""));
    }

    const quotesOut = [];
    const quotesSeen = new Set();
    function emitQuote(uuid, side, rawValue) {
      if (!uuid) return;
      const value = Number(String(rawValue ?? "").replace(/[^0-9.\-]/g, ""));
      if (!(value > 0 && value < 100000)) return;
      const state = feedState[uuid] || (feedState[uuid] = {});
      if (side === "bid") { state.bid = value; state.bidTs = Date.now(); }
      else if (side === "ask") { state.ask = value; state.askTs = Date.now(); }
      else return;
      const bid = state.bid || null;
      const ask = state.ask || null;
      const key = `${uuid}:${bid ?? ""}:${ask ?? ""}`;
      if (quotesSeen.has(key)) return;
      quotesSeen.add(key);
      quotesOut.push({ uuid, bid, ask, ts });
    }

    function rememberSymbol(uuid, rawSymbol) {
      const sym = normalizeSymbol(rawSymbol);
      if (uuid && sym) symbolByUuid.set(uuid, sym);
    }

    function normalizeVolume(rawVolume) {
      if (rawVolume == null || rawVolume === "") return null;
      const n = Number(String(rawVolume).replace(/[^0-9.\-]/g, ""));
      return Number.isFinite(n) && n >= 0 && n < 1e12 ? n : null;
    }

    function rememberVolume(uuid, rawVolume) {
      const volume = normalizeVolume(rawVolume);
      if (!uuid || volume == null) return;
      const state = feedState[uuid] || (feedState[uuid] = {});
      state.volume = volume;
      state.volumeTs = Date.now();
      if (state.price > 0) add(uuid, state.price, volume, "volume");
    }

    function pickVolume(obj) {
      if (!obj || typeof obj !== "object") return null;
      for (const [k, v] of Object.entries(obj)) {
        if (isVolumeField(k)) {
          const n = normalizeVolume(v);
          if (n != null) return n;
        }
      }
      return null;
    }

    function add(uuid, rawPrice, rawVolume = null, reason = "price") {
      const price = Number(String(rawPrice ?? "").replace(/[^0-9.\-]/g, ""));
      const state = uuid ? (feedState[uuid] || (feedState[uuid] = {})) : {};
      if (uuid && price > 0 && price < 100000) {
        state.price = price;
        state.priceTs = Date.now();
      }
      const volume = rawVolume != null ? normalizeVolume(rawVolume) : normalizeVolume(state.volume);
      const key = `${uuid}:${price}:${volume ?? ""}:${reason}`;
      if (uuid && price > 0 && price < 100000 && !seen.has(key)) {
        seen.add(key);
        out.push({ uuid, price, volume, ts });
      }
    }

    function scanText(text) {
      if (!text || text.indexOf("marketFeed/") === -1) return;
      const pathRe = /marketFeed\/([0-9a-f-]{36})\/([A-Za-z0-9_.$-]+)\b/ig;
      let m;
      while ((m = pathRe.exec(text)) !== null) {
        const uuid = m[1];
        const field = m[2];
        const after = text.slice(m.index, m.index + 280);
        const before = text.slice(Math.max(0, m.index - 220), m.index);
        if (isSymbolField(field)) {
          const sym = after.match(/(?:"d"|\bd\b|"value"|\bvalue\b|"symbol"|\bsymbol\b|"ticker"|\bticker\b|"code"|\bcode\b)\s*[:=]\s*"([A-Z0-9._-]{2,16})"/i)?.[1];
          if (sym) rememberSymbol(uuid, sym);
          continue;
        }
        if (isVolumeField(field)) {
          const afterValue = after.match(/(?:"d"|\bd\b|"value"|\bvalue\b|"volume"|\bvolume\b|"vol"|\bvol\b|"qty"|\bqty\b|"quantity"|\bquantity\b)\s*[:=]\s*"?([0-9]+(?:\.[0-9]+)?)"?/i)?.[1];
          if (afterValue) rememberVolume(uuid, afterValue);
          continue;
        }
        if (isBidField(field) || isAskField(field)) {
          const afterValue = after.match(/(?:"d"|\bd\b|"value"|\bvalue\b|"price"|\bprice\b)\s*[:=]\s*"?([0-9]+(?:\.[0-9]+)?)"?/i)?.[1];
          if (afterValue) emitQuote(uuid, isBidField(field) ? "bid" : "ask", afterValue);
          continue;
        }
        if (isPriceField(field)) {
          const afterValue = after.match(/(?:"d"|\bd\b|"value"|\bvalue\b|"price"|\bprice\b|"last"|\blast\b|"lastPrice"|\blastPrice\b)\s*[:=]\s*"?([0-9]+(?:\.[0-9]+)?)"?/i)?.[1];
          if (afterValue) { add(uuid, afterValue); continue; }
          const beforeValues = Array.from(before.matchAll(/(?:"d"|\bd\b|"value"|\bvalue\b|"price"|\bprice\b|"last"|\blast\b|"lastPrice"|\blastPrice\b)\s*[:=]\s*"?([0-9]+(?:\.[0-9]+)?)"?/ig));
          const beforeValue = beforeValues[beforeValues.length - 1]?.[1];
          if (beforeValue) add(uuid, beforeValue);
        }
      }
    }

    function visit(node, depth = 0) {
      if (node == null || depth > 18) return;
      if (typeof node === "string") { scanText(node); return; }
      if (typeof node !== "object") return;
      if (Array.isArray(node)) { for (const x of node) visit(x, depth + 1); return; }

      for (const [key, value] of Object.entries(node)) {
        const keyMatch = String(key).match(feedPathRe);
        if (keyMatch) {
          if (isPriceField(keyMatch[2])) add(keyMatch[1], value);
          else if (isVolumeField(keyMatch[2])) rememberVolume(keyMatch[1], value);
          else if (isSymbolField(keyMatch[2])) rememberSymbol(keyMatch[1], value);
          else if (isBidField(keyMatch[2])) emitQuote(keyMatch[1], "bid", value);
          else if (isAskField(keyMatch[2])) emitQuote(keyMatch[1], "ask", value);
        }
      }

      const path = typeof node.p === "string" ? node.p : typeof node.path === "string" ? node.path : "";
      const pathMatch = path.match(feedPathRe);
      if (pathMatch) {
        if (isPriceField(pathMatch[2])) add(pathMatch[1], node.d ?? node.value ?? node.val ?? node.price ?? node.last ?? node.lastPrice, pickVolume(node));
        else if (isVolumeField(pathMatch[2])) rememberVolume(pathMatch[1], node.d ?? node.value ?? node.val ?? node.volume ?? node.qty ?? node.quantity);
        else if (isSymbolField(pathMatch[2])) rememberSymbol(pathMatch[1], node.d ?? node.value ?? node.val ?? node.symbol ?? node.ticker ?? node.code);
        else if (isBidField(pathMatch[2])) emitQuote(pathMatch[1], "bid", node.d ?? node.value ?? node.val ?? node.price);
        else if (isAskField(pathMatch[2])) emitQuote(pathMatch[1], "ask", node.d ?? node.value ?? node.val ?? node.price);
      }
      else {
        const parentMatch = path.match(/marketFeed\/([0-9a-f-]{36})\b/i);
        if (parentMatch && node.d && typeof node.d === "object") {
          add(parentMatch[1], node.d.price ?? node.d.last ?? node.d.last_price ?? node.d.value, pickVolume(node.d));
          rememberSymbol(parentMatch[1], node.d.symbol ?? node.d.ticker ?? node.d.code ?? node.d.stock_id);
          const b = node.d.highest_bid ?? node.d.highestBid ?? node.d.best_bid ?? node.d.bestBid ?? node.d.bid;
          const a = node.d.lowest_ask ?? node.d.lowestAsk ?? node.d.best_ask ?? node.d.bestAsk ?? node.d.ask;
          if (b != null) emitQuote(parentMatch[1], "bid", b);
          if (a != null) emitQuote(parentMatch[1], "ask", a);
        }
      }

      for (const value of Object.values(node)) visit(value, depth + 1);
    }

    try { visit(payload); } catch {}
    try { if (!out.length && typeof payload !== "string") scanText(JSON.stringify(payload)); } catch {}
    const ticks = out.map((tick) => ({ ...tick, symbol: symbolByUuid.get(tick.uuid) || undefined }));
    const quotes = quotesOut.map((q) => ({ ...q, symbol: symbolByUuid.get(q.uuid) || undefined }));
    return { ticks, quotes };
  }

  function scanLongPollPayload(payload, source = "jsonp") {
    try {
      const text = typeof payload === "string" ? payload : JSON.stringify(payload);
      if (!text || text.indexOf("marketFeed/") === -1) return;
      if (source !== "ws") {
        const mapping = parseWatchlist(payload);
        if (mapping.length) send("watchlist", mapping);
      }
      const parsed = parseLongPoll(payload);
      // Backwards-compat: parseLongPoll used to return an array of ticks.
      const ticks = Array.isArray(parsed) ? parsed : parsed.ticks;
      const quotes = Array.isArray(parsed) ? [] : parsed.quotes;
      if (ticks && ticks.length) send("ticks", ticks);
      if (quotes && quotes.length) send("quotes", quotes);
    } catch {}
  }

  try {
    window.__thunderDebugInjectPayload = (payload) => {
      scanLongPollPayload(payload);
      return true;
    };
  } catch {}

  // Thunder loads live ticks as JSONP script tags:
  // pRTLPCB(serial, [{ t:"d", d:{ b:{ p:"marketFeed/<uuid>/price", d:<price> }, a:"d" }}])
  // fetch/XHR hooks cannot see <script src=".../lp?..."> responses, so the
  // callback hook above is installed in both the top page and hidden iframes.

  function parseWatchlist(json) {
    if (!json) return [];
    // Walk any JSON structure and collect every object that looks like an asset:
    // has a uuid-like id AND a symbol-like ticker string.
    const out = [];
    const seen = new Set();
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    function visit(node) {
      if (!node) return;
      if (Array.isArray(node)) { for (const x of node) visit(x); return; }
      if (typeof node !== "object") return;
      const uuid = node.id || node.uuid || node.asset_id || node.assetId;
      const symbol = node.symbol || node.ticker || node.code;
      if (uuid && symbol && typeof uuid === "string" && uuidRe.test(uuid) && !seen.has(uuid)) {
        seen.add(uuid);
        const feed = (node && typeof node === "object" ? node.feed : null) || {};
        out.push({
          uuid,
          symbol: String(symbol).toUpperCase(),
          name: node.name ?? node.name_ar ?? node.name_en ?? null,
          day_tradable: !!(feed?.day_tradable ?? node?.day_tradable),
          feed_price: Number(feed?.price ?? node?.price) || null,
          previous_close: Number(feed?.previous_close ?? node?.previous_close) || null,
          min_price_limit: Number(feed?.min_price_limit ?? node?.min_price_limit) || null,
          max_price_limit: Number(feed?.max_price_limit ?? node?.max_price_limit) || null,
          day_trade_limit: Number(feed?.day_trade_limit ?? node?.day_trade_limit) || null,
          round_digits: Number.isFinite(Number(feed?.round_digits ?? node?.round_digits))
            ? Number(feed?.round_digits ?? node?.round_digits) : null,
          market_id: (feed?.market_id ?? node?.market_id) ? String(feed?.market_id ?? node?.market_id) : null,
        });
      }
      for (const k of Object.keys(node)) {
        const v = node[k];
        if (v && typeof v === "object") visit(v);
      }
    }
    try { visit(json); } catch {}
    return out;
  }

  // Narrow, safe detector: extract objects that look like a CONFIRMED BUY fill
  // from any JSON response Thunder returns. Required fields per object:
  //   - symbol/stock_id/ticker
  //   - order_status / execution_type that don't look like NO_FILL/pending/cancel
  //   - amount_filled > 0 AND avg_filled_price > 0
  //   - side inferred as buy (not sell)
  // Anything outside this is ignored — no portfolio sniffing.
  function parseFilledBuys(json) {
    if (!json) return [];
    const out = [];
    const seen = new Set();
    const lower = (s) => String(s || "").toLowerCase();
    const read = (obj, keys) => {
      if (!obj || typeof obj !== "object") return undefined;
      for (const k of keys) {
        if (Object.prototype.hasOwnProperty.call(obj, k)) return obj[k];
        const actual = Object.keys(obj).find((name) => name.toLowerCase() === k.toLowerCase());
        if (actual) return obj[actual];
      }
      return undefined;
    };
    const readNum = (obj, keys) => {
      for (const k of keys) {
        const raw = read(obj, [k]);
        if (raw === null || raw === undefined || raw === "") continue;
        const n = Number(String(raw).replace(/[^0-9.\-]/g, ""));
        if (Number.isFinite(n) && n > 0) return n;
      }
      return 0;
    };
    const readStr = (obj, keys) => {
      const raw = read(obj, keys);
      return raw === null || raw === undefined ? "" : String(raw).trim();
    };
    const okSymbol = (s) => {
      const v = String(s || "").trim().toUpperCase();
      if (!/^[A-Z0-9._-]{2,16}$/.test(v)) return "";
      if (/^EG[A-Z0-9]{8,}$/i.test(v)) return ""; // ISIN-like, not a ticker
      return v;
    };
    function visit(node) {
      if (!node) return;
      if (Array.isArray(node)) { for (const x of node) visit(x); return; }
      if (typeof node !== "object") return;

      const sym = okSymbol(readStr(node, ["stock_id", "symbol", "ticker", "code"]));
      if (sym) {
        const sideRaw = lower(readStr(node, ["order_type", "side", "transaction_type", "direction", "action", "operation"]));
        const status = lower(`${readStr(node, ["order_status", "status", "state"])} ${readStr(node, ["execution_type", "execution_status", "fill_status"])} ${readStr(node, ["rejection_reason"])}`);
        const isSell = /sell|sale|sold|بيع/.test(sideRaw);
        const isBuy  = /buy|bought|purchase|شراء/.test(sideRaw) || (!isSell && /buy/.test(status));
        const looksOrder = ["order_status", "execution_type", "amount_filled", "filled_quantity", "filled_qty", "order_number"]
          .some((k) => Object.keys(node).some((kk) => kk.toLowerCase() === k));
        const blocked = /no_fill|pending|submit|reject|cancel|expire|failed/.test(status);
        if (looksOrder && isBuy && !isSell && !blocked) {
          const qty   = readNum(node, ["amount_filled", "filled_amount", "filled_quantity", "filled_qty", "executed_quantity", "executed_qty"]);
          const price = readNum(node, ["avg_filled_price", "average_filled_price", "filled_avg_price", "executed_price", "execution_price", "fill_price"]);
          if (qty > 0 && price > 0) {
            const key = `${sym}:${Math.floor(qty)}:${price.toFixed(4)}`;
            if (!seen.has(key)) {
              seen.add(key);
              out.push({ symbol: sym, qty, entry_price: price, source: "thunder_fill" });
            }
          }
        }
      }
      for (const k of Object.keys(node)) {
        const v = node[k];
        if (v && typeof v === "object") visit(v);
      }
    }
    try { visit(json); } catch {}
    return out;
  }

  // Same narrow detector for confirmed SELL fills — used only to close the
  // local extension ledger after the user has actually sold.
  function parseFilledSells(json) {
    if (!json) return [];
    const out = [];
    const seen = new Set();
    const lower = (s) => String(s || "").toLowerCase();
    const read = (obj, keys) => {
      if (!obj || typeof obj !== "object") return undefined;
      for (const k of keys) {
        if (Object.prototype.hasOwnProperty.call(obj, k)) return obj[k];
        const actual = Object.keys(obj).find((name) => name.toLowerCase() === k.toLowerCase());
        if (actual) return obj[actual];
      }
      return undefined;
    };
    const readNum = (obj, keys) => {
      for (const k of keys) {
        const raw = read(obj, [k]);
        if (raw === null || raw === undefined || raw === "") continue;
        const n = Number(String(raw).replace(/[^0-9.\-]/g, ""));
        if (Number.isFinite(n) && n > 0) return n;
      }
      return 0;
    };
    const readStr = (obj, keys) => {
      const raw = read(obj, keys);
      return raw === null || raw === undefined ? "" : String(raw).trim();
    };
    const okSymbol = (s) => {
      const v = String(s || "").trim().toUpperCase();
      if (!/^[A-Z0-9._-]{2,16}$/.test(v)) return "";
      if (/^EG[A-Z0-9]{8,}$/i.test(v)) return "";
      return v;
    };
    function visit(node) {
      if (!node) return;
      if (Array.isArray(node)) { for (const x of node) visit(x); return; }
      if (typeof node !== "object") return;

      const sym = okSymbol(readStr(node, ["stock_id", "symbol", "ticker", "code"]));
      if (sym) {
        const sideRaw = lower(readStr(node, ["order_type", "side", "transaction_type", "direction", "action", "operation"]));
        const status = lower(`${readStr(node, ["order_status", "status", "state"])} ${readStr(node, ["execution_type", "execution_status", "fill_status"])} ${readStr(node, ["rejection_reason"])}`);
        const isSell = /sell|sale|sold|بيع/.test(sideRaw);
        const looksOrder = ["order_status", "execution_type", "amount_filled", "filled_quantity", "filled_qty", "order_number"]
          .some((k) => Object.keys(node).some((kk) => kk.toLowerCase() === k));
        const blocked = /no_fill|pending|submit|reject|cancel|expire|failed/.test(status);
        if (looksOrder && isSell && !blocked) {
          const qty   = readNum(node, ["amount_filled", "filled_amount", "filled_quantity", "filled_qty", "executed_quantity", "executed_qty"]);
          const price = readNum(node, ["avg_filled_price", "average_filled_price", "filled_avg_price", "executed_price", "execution_price", "fill_price"]);
          if (qty > 0) {
            const key = `${sym}:${Math.floor(qty)}:${price.toFixed(4)}`;
            if (!seen.has(key)) {
              seen.add(key);
              out.push({ symbol: sym, qty, exit_price: price, source: "thunder_sell_fill" });
            }
          }
        }
      }
      for (const k of Object.keys(node)) {
        const v = node[k];
        if (v && typeof v === "object") visit(v);
      }
    }
    try { visit(json); } catch {}
    return out;
  }

  function parseThunderPositions(json, url) {
    const out = [];
    const seen = new Set();
    const urlLooksLikePortfolio = /portfolio|position|holding|holdings|custody|investment|balances?/i.test(String(url || ""));

    const keyNames = (obj) => Object.keys(obj || {}).map((k) => k.toLowerCase());
    const hasAnyKey = (obj, keys) => {
      const names = keyNames(obj);
      return keys.some((k) => names.includes(k.toLowerCase()));
    };
    const read = (obj, keys) => {
      if (!obj || typeof obj !== "object") return undefined;
      for (const k of keys) {
        if (Object.prototype.hasOwnProperty.call(obj, k)) return obj[k];
        const actual = Object.keys(obj).find((name) => name.toLowerCase() === k.toLowerCase());
        if (actual) return obj[actual];
      }
      return undefined;
    };
    const readNumber = (obj, keys) => {
      for (const k of keys) {
        const raw = read(obj, [k]);
        if (raw === null || raw === undefined || raw === "") continue;
        const n = Number(String(raw).replace(/[^0-9.\-]/g, ""));
        if (Number.isFinite(n) && n > 0) return n;
      }
      return 0;
    };
    const readText = (obj, keys) => {
      const raw = read(obj, keys);
      return raw === null || raw === undefined ? "" : String(raw).trim();
    };
    const normalizeSymbol = (value) => {
      const s = String(value || "").trim().toUpperCase();
      if (!/^[A-Z0-9._-]{2,16}$/.test(s)) return "";
      if (/^EG[A-Z0-9]{8,}$/i.test(s)) return "";
      return s;
    };
    const inferSide = (obj) => {
      const side = readText(obj, ["side", "order_side", "transaction_type", "direction", "action", "operation"]);
      const norm = normalizeArabicText(side).toLowerCase();
      if (/sell|sale|sold|بيع/.test(norm)) return "sell";
      if (/buy|bought|purchase|شراء/.test(norm)) return "buy";
      return "unknown";
    };
    const add = (symbol, qty, entryPrice, source) => {
      const sym = normalizeSymbol(symbol);
      const q = Number(qty);
      const price = Number(entryPrice);
      if (!sym || !(q > 0) || !(price > 0)) return;
      const key = `${sym}:${Math.floor(q)}:${price.toFixed(4)}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ symbol: sym, qty: q, entry_price: price, source });
    };

    function visit(node) {
      if (!node) return;
      if (Array.isArray(node)) { for (const x of node) visit(x); return; }
      if (typeof node !== "object") return;

      const symbol = normalizeSymbol(readText(node, ["stock_id", "symbol", "ticker", "stock", "code"]));
      const status = `${readText(node, ["order_status", "status", "state"])} ${readText(node, ["execution_type", "execution_status", "fill_status"])} ${readText(node, ["rejection_reason", "rejection_reason_value"])}`.toLowerCase();
      const orderLike = hasAnyKey(node, ["order_status", "execution_type", "amount_filled", "filled_quantity", "filled_qty", "order_number", "time_in_force"]);
      const explicitlyNotFilled = /no_fill|pending|submit|reject|cancel|expire|failed/.test(status);
      const filledQty = readNumber(node, ["amount_filled", "filled_amount", "filled_quantity", "filled_qty", "executed_quantity", "executed_qty"]);
      const fillPrice = readNumber(node, ["avg_filled_price", "average_filled_price", "filled_avg_price", "executed_price", "execution_price", "fill_price", "price", "market_price"]);

      if (orderLike && symbol) {
        if (!explicitlyNotFilled && filledQty > 0 && fillPrice > 0 && inferSide(node) !== "sell") {
          add(symbol, filledQty, fillPrice, "filled_order");
        }
      } else if (symbol) {
        const portfolioMarker = urlLooksLikePortfolio || hasAnyKey(node, ["average_price", "avg_price", "average_cost", "avg_cost", "average_buy_price", "owned_quantity", "sellable_quantity", "available_quantity", "available_for_sell", "quantity_owned", "shares", "units"]);
        const qty = readNumber(node, ["owned_quantity", "sellable_quantity", "available_quantity", "available_for_sell", "quantity_owned", "quantity", "qty", "shares", "units", "amount"]);
        const entry = readNumber(node, ["average_buy_price", "average_price", "avg_price", "average_cost", "avg_cost", "entry_price", "cost_price", "book_price", "purchase_price"]);
        if (portfolioMarker && qty > 0 && entry > 0) add(symbol, qty, entry, "portfolio_position");
      }

      for (const k of Object.keys(node)) {
        const v = node[k];
        if (v && typeof v === "object") visit(v);
      }
    }

    try { visit(json); } catch {}
    return out;
  }

  window.fetch = async function patchedFetch(input, init) {
    const resp = await origFetch(input, init);
    try {
      try { captureFetch(input, init, resp); } catch {}
      const url = typeof input === "string" ? input : input?.url || "";
      if (!url) return resp;
      try { captureThunderAuth(url, init?.headers || input?.headers); } catch {}

      // Long-polling endpoint: contains "/lp?" with serial id
      if (url.includes("/lp?") || /[?&](id|ser)=/.test(url)) {
        const clone = resp.clone();
        clone.text().then((txt) => {
            scanLongPollPayload(txt);
        }).catch(() => {});
      }
      // Any JSON response: scan for {uuid, symbol} pairs.
      else {
        const clone = resp.clone();
        const ct = (resp.headers.get("content-type") || "").toLowerCase();
        if (ct.includes("json") || MARKETWATCH_URL_RE.test(url) || TRADES_BOOK_RE.test(url) || (L2_CAPTURE_ENABLED === true && MARKET_DEPTH_RE.test(url))) {
          clone.text().then((txt) => {
            if (TRADES_BOOK_RE.test(url)) {
              try { scanTapePayload(url, JSON.parse(txt)); } catch {}
              return;
            }
            // Passive L2 depth capture — cheap URL check first.
            if (L2_CAPTURE_ENABLED === true && MARKET_DEPTH_RE.test(url)) { scanMarketDepth(url, txt); return; }
            let json;
            try { json = JSON.parse(txt); } catch { return; }
            scanMarketwatchPayload(json, url);
            const mapping = parseWatchlist(json);
            if (mapping.length) send("watchlist", mapping);
            // Narrow detector ONLY: real BUY fills (orderLike + amount_filled
            // > 0 + avg_filled_price > 0). Portfolio sniffing stays disabled.
            try {
              const fills = parseFilledBuys(json);
              if (fills.length) send("buyFill", fills);
            } catch (_) {}
            try {
              const sells = parseFilledSells(json);
              if (sells.length) send("sellFill", sells);
            } catch (_) {}
          }).catch(() => {});
        }
      }
    } catch (_) {}
    return resp;
  };

  // Also hook XMLHttpRequest — Thunder may use XHR for watchlist/assets.
  const OrigXHR = window.XMLHttpRequest;
  function HookedXHR() {
    const xhr = new OrigXHR();
    let _xhrMethod = null, _xhrUrl = null, _xhrBody = null, _xhrHeaders = {};
    try {
      const origOpen = xhr.open;
      xhr.open = function (m, u) { _xhrMethod = m; _xhrUrl = u; return origOpen.apply(xhr, arguments); };
      const origSetRequestHeader = xhr.setRequestHeader;
      xhr.setRequestHeader = function (k, v) {
        try { _xhrHeaders[String(k || "")] = String(v || ""); } catch {}
        return origSetRequestHeader.apply(xhr, arguments);
      };
      const origSend = xhr.send;
      xhr.send = function (body) { _xhrBody = body; return origSend.apply(xhr, arguments); };
    } catch {}
    xhr.addEventListener("load", function () {
      try {
        try { captureXHR(xhr, _xhrMethod, _xhrUrl || xhr.responseURL, _xhrBody); } catch {}
        const url = xhr.responseURL || "";
        try { captureThunderAuth(_xhrUrl || url, _xhrHeaders); } catch {}
        const ct = (xhr.getResponseHeader && xhr.getResponseHeader("content-type") || "").toLowerCase();
        const txt = xhr.responseText;
        if (!txt) return;
        if (url.includes("/lp?") || /[?&](id|ser)=/.test(url)) {
          scanLongPollPayload(txt);
        } else if (ct.includes("json") || MARKETWATCH_URL_RE.test(url) || TRADES_BOOK_RE.test(url) || txt.trim().startsWith("{") || txt.trim().startsWith("[")) {
          if (TRADES_BOOK_RE.test(url)) {
            try { scanTapePayload(url, JSON.parse(txt)); } catch {}
            return;
          }
          if (L2_CAPTURE_ENABLED === true && MARKET_DEPTH_RE.test(url)) { scanMarketDepth(url, txt); return; }
          try {
            const json = JSON.parse(txt);
            scanMarketwatchPayload(json, url);
            const mapping = parseWatchlist(json);
            if (mapping.length) send("watchlist", mapping);
            try {
              const fills = parseFilledBuys(json);
              if (fills.length) send("buyFill", fills);
            } catch (_) {}
            try {
              const sells = parseFilledSells(json);
              if (sells.length) send("sellFill", sells);
            } catch (_) {}
          } catch {}
        }
      } catch {}
    });
    return xhr;
  }
  HookedXHR.prototype = OrigXHR.prototype;
  try { window.XMLHttpRequest = HookedXHR; } catch {}

  // ---- WebSocket sniffer (read-only, no outbound sockets from the extension) ----
  // We do not create any WebSocket ourselves, so this does not add CSP failures.
  // We only wrap Thunder-created sockets and read incoming messages.
  try {
    const NativeWebSocket = window.WebSocket;
    if (NativeWebSocket && NativeWebSocket.__thunderWrappedWs !== true) {
      function HookedWebSocket(url, protocols) {
        const ws = protocols === undefined ? new NativeWebSocket(url) : new NativeWebSocket(url, protocols);
        try {
          ws.addEventListener("message", (event) => {
            const data = event?.data;
            if (typeof data !== "string") return;
            send("ws", { len: data.length, hasFeed: data.indexOf("marketFeed/") !== -1 });
            scanLongPollPayload(data, "ws");
          });
        } catch (_) {}
        return ws;
      }
      HookedWebSocket.prototype = NativeWebSocket.prototype;
      Object.setPrototypeOf(HookedWebSocket, NativeWebSocket);
      Object.defineProperty(HookedWebSocket, "__thunderWrappedWs", { value: true, configurable: true });
      window.WebSocket = HookedWebSocket;
    }
  } catch {}

  // ---- BroadcastChannel sniffer (read-only) ----
  // ثاندر بيستخدم Service Worker + BroadcastChannel للأسعار اللحظية
  // (RTS: shouldLoadV2 — sw:true, bc:true). الـ SW بياخد الـ feed وبيبعت
  // الأسعار للصفحة عبر BroadcastChannel، فـ window.fetch/XHR/WS مش بيشوفوها.
  // بنعمل hook لكل BroadcastChannel بيتفتح ونسمع لرسائله. نفس الـ regex.
  try {
    const OrigBC = window.BroadcastChannel;
    if (OrigBC) {
      function scanBcData(data) {
        try {
          scanLongPollPayload(data);
        } catch {}
      }
      function HookedBC(name) {
        const bc = new OrigBC(name);
        try {
          bc.addEventListener("message", (ev) => scanBcData(ev?.data));
        } catch {}
        return bc;
      }
      HookedBC.prototype = OrigBC.prototype;
      window.BroadcastChannel = HookedBC;
    }
  } catch {}

  // ---- Service Worker message sniffer (read-only) ----
  // طريقة تانية: الـ SW ممكن يبعت برسائل postMessage مباشرة للـ clients.
  try {
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener("message", (ev) => {
        try {
          const data = ev?.data;
          scanLongPollPayload(data);
        } catch {}
      });
    }
  } catch {}
})();