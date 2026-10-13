import { c as createServerRpc } from "./createServerRpc-BEwYw6bn.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.mjs";
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
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
const getMarketPulse_createServerFn_handler = createServerRpc({
  id: "ae321aca21b282fa97bdcb0be86f9e637bae93ba728073730e4d88f02034c759",
  name: "getMarketPulse",
  filename: "src/lib/market-pulse/pulse.functions.ts"
}, (opts) => getMarketPulse.__executeServer(opts));
const getMarketPulse = createServerFn({
  method: "GET"
}).handler(getMarketPulse_createServerFn_handler, async () => {
  const cairoNow = new Date((/* @__PURE__ */ new Date()).toLocaleString("en-US", {
    timeZone: "Africa/Cairo"
  }));
  const dateStr = cairoNow.toISOString().slice(0, 10);
  const probe = /* @__PURE__ */ new Date(`${dateStr}T12:00:00Z`);
  const cairoMs = new Date(probe.toLocaleString("en-US", {
    timeZone: "Africa/Cairo"
  })).getTime();
  const utcMs = new Date(probe.toLocaleString("en-US", {
    timeZone: "UTC"
  })).getTime();
  const offsetHours = Math.round((cairoMs - utcMs) / 36e5);
  const sh = String(10 - offsetHours).padStart(2, "0");
  const startUtc = `${dateStr}T${sh}:00:00Z`;
  const endUtc = `${dateStr}T${sh}:30:00Z`;
  const ticksBySym = /* @__PURE__ */ new Map();
  const {
    data,
    error
  } = await supabaseAdmin.from("live_ticks").select("symbol,price,ts").gte("ts", startUtc).lt("ts", endUtc).order("ts", {
    ascending: true
  }).limit(2e4);
  if (error) throw error;
  for (const r of data ?? []) {
    const arr = ticksBySym.get(r.symbol) ?? [];
    if (arr.length < 50) {
      arr.push({
        p: +r.price,
        t: new Date(r.ts).getTime()
      });
      ticksBySym.set(r.symbol, arr);
    }
  }
  const ready = cairoNow.getHours() > 10 || cairoNow.getHours() === 10 && cairoNow.getMinutes() >= 30;
  if (ticksBySym.size === 0) {
    return {
      date: dateStr,
      ready,
      active: 0,
      avgMovePct: 0,
      pctUp: 0,
      pctDip: 0,
      label: "—",
      labelColor: "neutral",
      expectedPnl: 0,
      expectedRange: "—",
      expectedSignals: "—",
      note: ready ? "مفيش بيانات لحظية للنهاردة. السوق غالباً مقفول أو الـ feed متوقف." : "نستنى لحد 10:30 ص عشان نقيس نبض السوق."
    };
  }
  let upCount = 0, dipCount = 0, total = 0;
  const moves = [];
  for (const ts of ticksBySym.values()) {
    if (ts.length < 2) continue;
    total++;
    const op = ts[0].p, last = ts[ts.length - 1].p;
    const mv = (last - op) / op;
    moves.push(mv);
    if (mv > 0) upCount++;
    let mx = ts[0].p;
    for (const t of ts) {
      if (t.p > mx) mx = t.p;
      if ((t.p - mx) / mx <= -0.015) {
        dipCount++;
        break;
      }
    }
  }
  const avg = moves.reduce((a, b) => a + b, 0) / Math.max(1, moves.length);
  const avgPct = +(avg * 100).toFixed(2);
  const pctUp = +(upCount / Math.max(1, total) * 100).toFixed(0);
  const pctDip = +(dipCount / Math.max(1, total) * 100).toFixed(0);
  let label = "مقبولة";
  let labelColor = "muted";
  let expectedPnl = 0, expectedRange = "−200 إلى +200";
  let expectedSignals = "5–15 إشارة";
  let note = "";
  if (avgPct >= 0.3 && pctUp >= 60) {
    label = "ممتازة";
    labelColor = "bull";
    expectedPnl = 800;
    expectedRange = "+500 إلى +1,000";
    expectedSignals = "25–40 إشارة";
    note = "السوق صاعد بقوة من أول الجلسة — أعلى احتمال ربح زي يوم 09/6.";
  } else if (avgPct >= 0 && pctUp >= 40) {
    label = "جيدة جداً";
    labelColor = "bull";
    expectedPnl = 300;
    expectedRange = "+100 إلى +500";
    expectedSignals = "15–25 إشارة";
    note = "اتجاه إيجابي مع اتساع مقبول — ربح متوسط محتمل.";
  } else if (avgPct >= -0.3 && pctUp >= 25) {
    label = "مقبولة";
    labelColor = "warn";
    expectedPnl = 0;
    expectedRange = "−300 إلى +300";
    expectedSignals = "8–15 إشارة";
    note = "السوق متذبذب — النتيجة غير مضمونة، ممكن نخسر الرسوم.";
  } else if (avgPct > -0.15 && pctDip < 20) {
    label = "مقبولة";
    labelColor = "muted";
    expectedPnl = 0;
    expectedRange = "−200 إلى +200";
    expectedSignals = "3–8 إشارات";
    note = "السوق هادئ من غير اتجاه واضح — لسه بدري للحكم، استنى شوية.";
  } else {
    label = "سيئة";
    labelColor = "bear";
    expectedPnl = -600;
    expectedRange = "−800 إلى −300";
    expectedSignals = "0–5 إشارات";
    note = "السوق هابط واتساع ضعيف — أعلى احتمال خسارة زي يوم 11/6.";
  }
  return {
    date: dateStr,
    ready,
    active: total,
    avgMovePct: avgPct,
    pctUp,
    pctDip,
    label,
    labelColor,
    expectedPnl,
    expectedRange,
    expectedSignals,
    note
  };
});
export {
  getMarketPulse_createServerFn_handler
};
