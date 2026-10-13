import { c as createServerRpc } from "./createServerRpc-BEwYw6bn.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:http";
import "node:stream";
import "node:stream/promises";
import "node:https";
import "node:http2";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "async_hooks";
import "stream";
import "crypto";
import "../_libs/isbot.mjs";
function getCairoMinutes(d) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(d);
  const wd = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const dayMap = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6
  };
  return {
    day: dayMap[wd] ?? 0,
    minutes: h * 60 + m,
    hhmm: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
  };
}
const getThunderLive_createServerFn_handler = createServerRpc({
  id: "cabe748d209f45feb625090dbcc2e7cabd23b876e346db4bc8e9403b4e1abeda",
  name: "getThunderLive",
  filename: "src/lib/live/thunder-live.functions.ts"
}, (opts) => getThunderLive.__executeServer(opts));
const getThunderLive = createServerFn({
  method: "GET"
}).handler(getThunderLive_createServerFn_handler, async () => {
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.mjs");
  const now = /* @__PURE__ */ new Date();
  const cairo = getCairoMinutes(now);
  const isWeekday = cairo.day >= 0 && cairo.day <= 4;
  const marketOpen = isWeekday && cairo.minutes >= 600 && cairo.minutes < 870;
  const marketLabel = marketOpen ? "السوق مفتوح" : isWeekday && cairo.minutes < 600 ? `مغلق · يفتح بعد ${Math.floor((600 - cairo.minutes) / 60)}س ${(600 - cairo.minutes) % 60}د` : "السوق مغلق";
  const since24h = new Date(now.getTime() - 24 * 3600 * 1e3).toISOString();
  const since1h = new Date(now.getTime() - 3600 * 1e3).toISOString();
  const {
    data: ticks24,
    error
  } = await supabaseAdmin.from("live_ticks").select("symbol,price,source,ts").eq("source", "thunder_ext").gte("ts", since24h).order("ts", {
    ascending: false
  }).limit(1e4);
  if (error) throw new Error(error.message);
  const rows = ticks24 ?? [];
  const nowMs = now.getTime();
  const ts1m = nowMs - 6e4;
  const ts5m = nowMs - 5 * 6e4;
  const ts15m = nowMs - 15 * 6e4;
  const ts1h = nowMs - 60 * 6e4;
  let ticks1m = 0, ticks5m = 0, ticks15m = 0, ticks1h_count = 0;
  const symbolsSet = /* @__PURE__ */ new Set();
  const perSymbolMap = /* @__PURE__ */ new Map();
  const flushTsSet = /* @__PURE__ */ new Set();
  for (const r of rows) {
    const tsMs = new Date(r.ts).getTime();
    const price = Number(r.price);
    if (tsMs >= ts1h) {
      ticks1h_count++;
      symbolsSet.add(r.symbol);
      flushTsSet.add(Math.floor(tsMs / 1e3));
    }
    if (tsMs >= ts15m) ticks15m++;
    if (tsMs >= ts5m) ticks5m++;
    if (tsMs >= ts1m) ticks1m++;
    const prev = perSymbolMap.get(r.symbol);
    if (!prev) {
      perSymbolMap.set(r.symbol, {
        price,
        ts: r.ts,
        tsMs,
        ticks1h: tsMs >= ts1h ? 1 : 0,
        prevPrice: null
      });
    } else {
      if (prev.prevPrice == null && price !== prev.price) prev.prevPrice = price;
      if (tsMs >= ts1h) prev.ticks1h++;
    }
  }
  const flushSecondsSorted = Array.from(flushTsSet).sort((a, b) => a - b);
  const gaps = [];
  for (let i = 1; i < flushSecondsSorted.length; i++) {
    gaps.push(flushSecondsSorted[i] - flushSecondsSorted[i - 1]);
  }
  const avgFlushIntervalSec = gaps.length ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length * 10) / 10 : null;
  const gapBuckets = {
    "<5s": 0,
    "5-15s": 0,
    "15-60s": 0,
    "1-5m": 0,
    ">5m": 0
  };
  for (const g of gaps) {
    if (g < 5) gapBuckets["<5s"]++;
    else if (g < 15) gapBuckets["5-15s"]++;
    else if (g < 60) gapBuckets["15-60s"]++;
    else if (g < 300) gapBuckets["1-5m"]++;
    else gapBuckets[">5m"]++;
  }
  const flushPerMin = /* @__PURE__ */ new Map();
  for (const sec of flushSecondsSorted) {
    const minuteIdx = Math.floor((sec * 1e3 - ts1h) / 6e4);
    if (minuteIdx >= 0 && minuteIdx < 60) flushPerMin.set(minuteIdx, (flushPerMin.get(minuteIdx) ?? 0) + 1);
  }
  const flushBuckets = [];
  for (let i = 0; i < 60; i++) {
    const ms = ts1h + i * 6e4;
    const d = new Date(ms);
    const hh = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Cairo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(d);
    flushBuckets.push({
      minute: hh,
      count: flushPerMin.get(i) ?? 0
    });
  }
  const perSymbol = Array.from(perSymbolMap.entries()).map(([symbol, v]) => ({
    symbol,
    price: v.price,
    ts: v.ts,
    ageSec: Math.floor((nowMs - v.tsMs) / 1e3),
    prevPrice: v.prevPrice,
    changePct: v.prevPrice && v.prevPrice > 0 ? (v.price - v.prevPrice) / v.prevPrice * 100 : null,
    ticks1h: v.ticks1h
  })).sort((a, b) => a.ageSec - b.ageSec).slice(0, 200);
  const topMovers = perSymbol.filter((s) => s.changePct != null).slice().sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct)).slice(0, 8).map((s) => ({
    symbol: s.symbol,
    price: s.price,
    changePct: s.changePct
  }));
  const {
    data: srcRows
  } = await supabaseAdmin.from("live_ticks").select("source,ts").gte("ts", since1h).limit(1e4);
  const srcCount = /* @__PURE__ */ new Map();
  for (const r of srcRows ?? []) srcCount.set(r.source, (srcCount.get(r.source) ?? 0) + 1);
  const sourceBreakdown = Array.from(srcCount.entries()).map(([source, count]) => ({
    source,
    count
  })).sort((a, b) => b.count - a.count);
  const lastFlushTs = rows[0]?.ts ?? null;
  const lastFlushAgoSec = lastFlushTs ? Math.floor((nowMs - new Date(lastFlushTs).getTime()) / 1e3) : null;
  let verdict;
  if (!lastFlushTs) {
    verdict = {
      isLive: false,
      label: "لا توجد بيانات",
      reason: "لم يصل أي tick من Thunder خلال آخر 24 ساعة.",
      confidence: "high"
    };
  } else if (marketOpen) {
    if (lastFlushAgoSec < 30 && ticks1m > 5) {
      verdict = {
        isLive: true,
        label: "بيانات لحظية فعلاً",
        reason: `آخر flush من ${lastFlushAgoSec}ث + ${ticks1m} tick في آخر دقيقة.`,
        confidence: "high"
      };
    } else if (lastFlushAgoSec < 120) {
      verdict = {
        isLive: true,
        label: "لحظي لكن متباطئ",
        reason: `آخر flush من ${lastFlushAgoSec}ث — السوق مفتوح، تأكد إن Thunder شغال.`,
        confidence: "medium"
      };
    } else {
      verdict = {
        isLive: false,
        label: "البيانات قديمة!",
        reason: `آخر flush من ${Math.floor(lastFlushAgoSec / 60)} دقيقة والسوق مفتوح — Extension غالباً متفصل.`,
        confidence: "high"
      };
    }
  } else {
    if (lastFlushAgoSec < 300 && ticks1m > 0) {
      verdict = {
        isLive: true,
        label: "Extension متصل (السوق مغلق)",
        reason: `بيانات تصل لكن السوق مغلق — هذه أسعار آخر إغلاق.`,
        confidence: "high"
      };
    } else {
      verdict = {
        isLive: false,
        label: "السوق مغلق — لا بيانات لحظية",
        reason: `آخر snapshot من ${lastFlushAgoSec ? Math.floor(lastFlushAgoSec / 60) + "د" : "—"}. ستبدأ البيانات اللحظية مع فتح السوق.`,
        confidence: "high"
      };
    }
  }
  return {
    now: now.toISOString(),
    marketOpen,
    marketLabel,
    cairoHHMM: cairo.hhmm,
    summary: {
      lastFlushTs,
      lastFlushAgoSec,
      ticks1m,
      ticks5m,
      ticks15m,
      ticks1h: ticks1h_count,
      ticks24h: rows.length,
      uniqueSymbols1h: symbolsSet.size,
      distinctFlushes1h: flushSecondsSorted.length,
      avgFlushIntervalSec
    },
    verdict,
    flushBuckets,
    gapHistogram: Object.entries(gapBuckets).map(([label, count]) => ({
      label,
      count
    })),
    perSymbol,
    sourceBreakdown,
    topMovers
  };
});
export {
  getThunderLive_createServerFn_handler
};
