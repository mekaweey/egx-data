import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useQueryClient, a as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { u as useServerFn, c as createSsrRpc } from "./router-BYsPPCpA.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
import "../_libs/mendable__firecrawl-js.mjs";
import "../_libs/sonner.mjs";
import "../_libs/seroval.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "async_hooks";
import "stream";
import "crypto";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__query-core.mjs";
import "./market-hours-CyHCW23Z.mjs";
import "./client.server-D5ro3rAQ.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "./telegram.server-D6g8flro.mjs";
import "./chat-fallback.server-HMcdWJQs.mjs";
import "./client-DcfJRNR2.mjs";
import "node:fs";
import "node:path";
import "node:child_process";
import "./outcome-loop.server-BOECsdkT.mjs";
import "./auto-orchestrator.server-Cobs3ZBw.mjs";
import "./tier-k-intelligence.server-IqAM99dH.mjs";
import "./run-scan.server-C7KKLuW0.mjs";
import "./tradingview.server-ASbxwkih.mjs";
import "./levels.server-DPpGzyqT.mjs";
import "../_libs/technicalindicators.mjs";
import "./yahoo.server-Coiq-pQ8.mjs";
import "../_libs/ai.mjs";
import "../_libs/ai-sdk__gateway.mjs";
import "../_libs/ai-sdk__provider-utils.mjs";
import "../_libs/ai-sdk__provider.mjs";
import "../_libs/eventsource-parser.mjs";
import "../_libs/zod.mjs";
import "../_libs/@vercel/oidc.mjs";
import "path";
import "fs";
import "os";
import "../_libs/opentelemetry__api.mjs";
import "./news.server-DBo8FnwV.mjs";
import "../_libs/ai-sdk__openai-compatible.mjs";
import "./pattern-memory.server-BKGG6vXj.mjs";
import "./tier-i-intelligence.server-Ddugl3s6.mjs";
import "./isotonic-calibration.server-CgJbsL0r.mjs";
import "node:zlib";
import "./self-calibration.server-DafiNwz-.mjs";
import "./engine.server-K_Mwkd4b.mjs";
import "./strategy.server-BM-ZfGqV.mjs";
import "./blocklist-BkSBV-pn.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:http";
import "node:stream/promises";
import "node:https";
import "node:http2";
import "../_libs/axios.mjs";
import "../_libs/form-data.mjs";
import "../_libs/combined-stream.mjs";
import "../_libs/delayed-stream.mjs";
import "http";
import "https";
import "url";
import "../_libs/mime-types.mjs";
import "../_libs/mime-db.mjs";
import "../_libs/asynckit.mjs";
import "../_libs/es-set-tostringtag.mjs";
import "../_libs/get-intrinsic.mjs";
import "../_libs/es-object-atoms.mjs";
import "../_libs/es-errors.mjs";
import "../_libs/math-intrinsics.mjs";
import "../_libs/gopd.mjs";
import "../_libs/es-define-property.mjs";
import "../_libs/has-symbols.mjs";
import "../_libs/get-proto.mjs";
import "../_libs/dunder-proto.mjs";
import "../_libs/call-bind-apply-helpers.mjs";
import "../_libs/function-bind.mjs";
import "../_libs/hasown.mjs";
import "../_libs/has-tostringtag.mjs";
import "../_libs/proxy-from-env.mjs";
import "http2";
import "../_libs/follow-redirects.mjs";
import "assert";
import "../_libs/debug.mjs";
import "../_libs/ms.mjs";
import "tty";
import "../_libs/supports-color.mjs";
import "../_libs/has-flag.mjs";
import "zlib";
import "events";
import "../_libs/zod-to-json-schema.mjs";
const runBacktest = createServerFn({
  method: "POST"
}).inputValidator((data) => ({
  minConfidence: Math.max(40, Math.min(90, data.minConfidence ?? 60)),
  warmup: Math.max(30, Math.min(60, data.warmup ?? 50)),
  maxHold: Math.max(2, Math.min(10, data.maxHold ?? 7))
})).handler(createSsrRpc("00a96a009289aa42bb1ca19f6183c3184794f4d679f7dd48ec17d2b2540741b7"));
const listBacktests = createServerFn({
  method: "GET"
}).handler(createSsrRpc("08c8b1cbfdbd42b293a0423a4f7d51de6d827ba4ab5b7f9507892bca94f465b2"));
const getBacktest = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("5af943b8b32763e0f2bfccac0bb6ec580f791358a27536f4e4a4c81d628fabee"));
const backfillHistory = createServerFn({
  method: "POST"
}).inputValidator((data) => ({
  days: Math.max(90, Math.min(1825, data.days ?? 500)),
  offset: Math.max(0, data.offset ?? 0),
  limit: Math.max(1, Math.min(50, data.limit ?? 8))
})).handler(createSsrRpc("1f75c18c43fd28bd74efbba404efd867f3259ecd3f053417930575bb5e3795e2"));
const getCandlesStats = createServerFn({
  method: "GET"
}).handler(createSsrRpc("7a97a910bb1aec56b156c1156917563a3616faef409a2a5be91477bf1d4f9f83"));
function fmt(n, d = 2) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString("en-EG", {
    maximumFractionDigits: d,
    minimumFractionDigits: d
  });
}
function MetricCard({
  label,
  value,
  suffix,
  tone
}) {
  const cls = tone === "good" ? "text-bull" : tone === "bad" ? "text-bear" : "text-foreground";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `mt-1 text-2xl font-bold tabular-nums ${cls}`, children: [
      value,
      suffix && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ms-1 text-sm font-normal text-muted-foreground", children: suffix })
    ] })
  ] });
}
function emptyBucket(label) {
  return {
    label,
    count: 0,
    wins: 0,
    losses: 0,
    sumWin: 0,
    sumLoss: 0,
    sumAll: 0
  };
}
function addToBucket(b, pnl) {
  b.count += 1;
  b.sumAll += pnl;
  if (Math.abs(pnl) < 0.1) return;
  if (pnl > 0) {
    b.wins += 1;
    b.sumWin += pnl;
  } else if (pnl < 0) {
    b.losses += 1;
    b.sumLoss += -pnl;
  }
}
function groupBy(trades, keyFn, order) {
  const map = /* @__PURE__ */ new Map();
  for (const t of trades) {
    const k = keyFn(t);
    if (k == null) continue;
    const pnl = Number(t.pnl_pct);
    if (!Number.isFinite(pnl)) continue;
    if (!map.has(k)) map.set(k, emptyBucket(k));
    addToBucket(map.get(k), pnl);
  }
  const arr = Array.from(map.values());
  if (order) {
    arr.sort((a, b) => {
      const ia = order.indexOf(a.label);
      const ib = order.indexOf(b.label);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
  } else {
    arr.sort((a, b) => b.count - a.count);
  }
  return arr;
}
function BreakdownTable({
  title,
  hint,
  buckets
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-b border-border px-4 py-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-bold", children: title }),
      hint && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 text-xs text-muted-foreground", children: hint })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/40 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-end", children: "الشريحة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-end", children: "عدد" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-end", children: "% من الكل" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-end", children: "WR" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-end", children: "PF" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-end", children: "Avg PnL" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-end", children: "إجمالي PnL" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: (() => {
        const grandTotal = buckets.reduce((s, b) => s + b.count, 0) || 1;
        return buckets.map((b) => {
          const decisive = b.wins + b.losses;
          const wr = decisive ? b.wins / decisive * 100 : 0;
          const pf = b.sumLoss > 0 ? b.sumWin / b.sumLoss : b.sumWin > 0 ? 999 : 0;
          const avg = b.count ? b.sumAll / b.count : 0;
          const wrTone = decisive === 0 ? "" : wr >= 50 ? "text-bull" : wr >= 40 ? "" : "text-bear";
          const pfTone = pf === 0 ? "" : pf >= 1.3 ? "text-bull" : pf >= 1 ? "" : "text-bear";
          const avgTone = avg > 0 ? "text-bull" : avg < 0 ? "text-bear" : "";
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-xs", children: b.label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 tabular-nums", children: b.count }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-3 py-2 tabular-nums text-xs text-muted-foreground", children: [
              (b.count / grandTotal * 100).toFixed(0),
              "%"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `px-3 py-2 tabular-nums ${wrTone}`, children: decisive ? `${wr.toFixed(1)}%` : "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `px-3 py-2 tabular-nums ${pfTone}`, children: pf === 0 ? "—" : pf >= 999 ? "∞" : pf.toFixed(2) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: `px-3 py-2 tabular-nums ${avgTone}`, children: [
              avg > 0 ? "+" : "",
              avg.toFixed(2),
              "%"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: `px-3 py-2 tabular-nums text-xs ${avgTone}`, children: [
              b.sumAll > 0 ? "+" : "",
              b.sumAll.toFixed(1),
              "%"
            ] })
          ] }, b.label);
        });
      })() })
    ] }) })
  ] });
}
function BacktestPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listBacktests);
  const runFn = useServerFn(runBacktest);
  const getFn = useServerFn(getBacktest);
  const backfillFn = useServerFn(backfillHistory);
  const statsFn = useServerFn(getCandlesStats);
  const [minConf, setMinConf] = reactExports.useState(75);
  const [maxHold, setMaxHold] = reactExports.useState(6);
  const [selectedId, setSelectedId] = reactExports.useState(null);
  const list = useQuery({
    queryKey: ["backtests"],
    queryFn: () => listFn()
  });
  const stats = useQuery({
    queryKey: ["candles-stats"],
    queryFn: () => statsFn()
  });
  const detail = useQuery({
    queryKey: ["backtest", selectedId],
    queryFn: () => getFn({
      data: {
        id: selectedId
      }
    }),
    enabled: !!selectedId
  });
  const run = useMutation({
    mutationFn: () => runFn({
      data: {
        minConfidence: minConf,
        maxHold
      }
    }),
    onSuccess: (res) => {
      qc.invalidateQueries({
        queryKey: ["backtests"]
      });
      setSelectedId(res.backtestId);
    }
  });
  const [backfillProgress, setBackfillProgress] = reactExports.useState(null);
  const backfill = useMutation({
    mutationFn: async (days) => {
      let offset = 0;
      let total = 0;
      let processed = 0;
      let candles = 0;
      const failed = [];
      const providers = {};
      setBackfillProgress({
        processed: 0,
        total: 0,
        candles: 0,
        failed: [],
        providers: {}
      });
      while (true) {
        const r = await backfillFn({
          data: {
            days,
            offset,
            limit: 8
          }
        });
        total = r.symbolsTotal;
        processed += r.symbolsProcessed;
        candles += r.candlesInserted;
        failed.push(...r.failed);
        for (const [p, n] of Object.entries(r.providerBreakdown ?? {})) {
          providers[p] = (providers[p] ?? 0) + n;
        }
        setBackfillProgress({
          processed,
          total,
          candles,
          failed: [...failed],
          providers: {
            ...providers
          }
        });
        if (r.done) {
          return {
            symbolsTotal: total,
            symbolsProcessed: processed,
            candlesInserted: candles,
            failed,
            daysRequested: days,
            providerBreakdown: providers
          };
        }
        offset = r.nextOffset;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["candles-stats"]
      });
    }
  });
  const hasData = (stats.data?.totalCandles ?? 0) > 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { dir: "rtl", className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "border-b border-border bg-card/60 backdrop-blur", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold", children: "Backtesting — اختبار الاستراتيجية" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "محاكاة قرارات الشراء على البيانات التاريخية لقياس الأداء الحقيقي" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted", children: "← الرئيسية" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "mx-auto max-w-7xl px-6 py-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mb-6 rounded-xl border border-border bg-card p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-base font-bold", children: "📥 البيانات التاريخية" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "الـ Backtest محتاج بيانات OHLC يومية للأسهم. كل ما البيانات أكتر، كل ما النتيجة أدق." }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-wrap gap-4 text-sm tabular-nums", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "إجمالي الشموع: ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: fmt(stats.data?.totalCandles ?? 0, 0) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "عدد الأسهم المغطاة: ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: fmt(stats.data?.distinctSymbols ?? 0, 0) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
                "الفترة: ",
                stats.data?.minDate ?? "—",
                " → ",
                stats.data?.maxDate ?? "—"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => backfill.mutate(500), disabled: backfill.isPending, className: "rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50", children: backfill.isPending ? `جاري الجلب... ${backfillProgress?.processed ?? 0}/${backfillProgress?.total ?? "?"}` : "📥 جلب آخر سنتين" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => backfill.mutate(1e3), disabled: backfill.isPending, className: "rounded-lg border border-border px-4 py-2 text-xs hover:bg-muted disabled:opacity-50", children: "أو جلب 4 سنوات (أبطأ)" })
          ] })
        ] }),
        !hasData && !backfill.isPending && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 rounded-lg bg-bear/10 px-3 py-2 text-sm text-bear", children: [
          "⚠️ مفيش بيانات تاريخية لسة. اضغط ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: '"جلب آخر سنتين"' }),
          " قبل ما تشغّل أي Backtest."
        ] }),
        backfill.data && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 rounded-lg bg-bull/10 px-3 py-2 text-sm text-bull", children: [
          "✅ تم بنجاح: ",
          backfill.data.symbolsProcessed,
          "/",
          backfill.data.symbolsTotal,
          " سهم،",
          " ",
          fmt(backfill.data.candlesInserted, 0),
          " شمعة.",
          backfill.data.failed.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: [
            "فشل في: ",
            backfill.data.failed.join(", ")
          ] }),
          backfill.data.providerBreakdown && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: [
            "المصادر: ",
            Object.entries(backfill.data.providerBreakdown).map(([p, n]) => `${p}: ${n}`).join(" · ")
          ] }),
          backfill.data.providerBreakdown?.synthetic > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 rounded bg-amber-500/10 px-2 py-1 text-xs text-amber-500", children: "⚠️ تنبيه: ياهو محظور حالياً (429 Rate Limit) وتم استخدام بيانات تركيبية كملاذ أخير لبعض الأسهم. نتائج الـ Backtest على هذه الأسهم تقديرية وليست دقيقة 100%." })
        ] }),
        backfill.isError && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 rounded-lg bg-bear/10 px-3 py-2 text-sm text-bear", children: [
          "فشل الجلب: ",
          backfill.error.message
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border bg-card p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-base font-bold", children: "تشغيل محاكاة جديدة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "تستخدم آخر بيانات تاريخية محفوظة (يومية). لكل يوم تحسب المؤشرات بدون نظرة مستقبلية، تفلتر بالاستراتيجية، تفتح صفقة عند فتح اليوم التالي، وتتابع حتى يضرب الهدف أو وقف الخسارة أو تنتهي مدة الاحتفاظ." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "الحد الأدنى للثقة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", min: 70, max: 90, value: minConf, onChange: (e) => setMinConf(Math.max(70, Math.min(90, Number(e.target.value) || 75))), className: "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 tabular-nums" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "أقصى مدة احتفاظ (أيام)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", min: 2, max: 10, value: maxHold, onChange: (e) => setMaxHold(Math.max(2, Math.min(10, Number(e.target.value) || 5))), className: "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 tabular-nums" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-end", children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => run.mutate(), disabled: run.isPending, className: "w-full rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50", children: run.isPending ? "جاري المحاكاة..." : "شغّل المحاكاة" }) })
        ] }),
        run.isError && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-3 rounded-lg bg-bear/10 px-3 py-2 text-sm text-bear", children: [
          "فشل: ",
          run.error.message
        ] })
      ] }),
      detail.data && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-3 text-base font-bold", children: "نتيجة المحاكاة" }),
        detail.data.dataSource && (detail.data.dataSource.syntheticPct > 0 || detail.data.dataSource.unknownTrades > 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200", children: [
          "⚠️ ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "تحذير مصدر البيانات:" }),
          " ",
          detail.data.dataSource.syntheticPct,
          "% من الصفقات على بيانات ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "اصطناعية مولّدة" }),
          " ",
          "(",
          detail.data.dataSource.syntheticTrades,
          " صفقة) — مش تداول حقيقي من البورصة المصرية.",
          detail.data.dataSource.realPct > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            " ",
            detail.data.dataSource.realPct,
            "% بيانات حقيقية من Yahoo/Firecrawl (",
            detail.data.dataSource.realTrades,
            " صفقة)."
          ] }),
          detail.data.dataSource.unknownTrades > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            " ",
            detail.data.dataSource.unknownTrades,
            " صفقة مصدرها غير معروف."
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mb-3 text-xs text-muted-foreground", children: [
          "💰 جميع النتائج محسوبة على أساس ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "عمولة تداول 0%" }),
          "؛ لا يتم خصم أي عمولة ثابتة من الصفقات."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-3 text-xs text-muted-foreground", children: "نسبة النجاح تُحسب من الصفقات الحاسمة فقط (ربح أو خسارة فعلية). صفقات التعادل ⚖️ لا تُحسب ضمن الخسائر." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mb-3 text-xs text-muted-foreground", children: [
          "العائد التراكمي و Max Drawdown محسوبين على أساس ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "10% من المحفظة لكل صفقة" }),
          " (واقعي). متوسط الربح/الخسارة لكل صفقة فردياً."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(MetricCard, { label: "عدد الصفقات", value: fmt(detail.data.backtest.total_trades, 0) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(MetricCard, { label: "نسبة النجاح", value: fmt(detail.data.backtest.win_rate, 1), suffix: "%", tone: (detail.data.backtest.win_rate ?? 0) >= 55 ? "good" : (detail.data.backtest.win_rate ?? 0) >= 45 ? "neutral" : "bad" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(MetricCard, { label: "صفقات تعادل", value: fmt(detail.data.trades.filter((t) => t.exit_reason === "breakeven").length, 0), tone: "neutral" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(MetricCard, { label: "العائد التراكمي", value: fmt(detail.data.backtest.total_return_pct, 1), suffix: "%", tone: (detail.data.backtest.total_return_pct ?? 0) > 0 ? "good" : "bad" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(MetricCard, { label: "Profit Factor", value: fmt(detail.data.backtest.profit_factor, 2), tone: (detail.data.backtest.profit_factor ?? 0) >= 1.5 ? "good" : (detail.data.backtest.profit_factor ?? 0) >= 1 ? "neutral" : "bad" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(MetricCard, { label: "Expectancy / صفقة", value: fmt(detail.data.backtest.expectancy_pct, 2), suffix: "%", tone: (detail.data.backtest.expectancy_pct ?? 0) > 0 ? "good" : "bad" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(MetricCard, { label: "Max Drawdown", value: fmt(detail.data.backtest.max_drawdown_pct, 1), suffix: "%", tone: (detail.data.backtest.max_drawdown_pct ?? 0) > 0 ? "bad" : "neutral" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(MetricCard, { label: "متوسط الربح", value: fmt(detail.data.backtest.avg_win_pct, 2), suffix: "%", tone: "good" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(MetricCard, { label: "متوسط الخسارة", value: fmt(detail.data.backtest.avg_loss_pct, 2), suffix: "%", tone: "bad" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(MetricCard, { label: "Sharpe (per trade)", value: fmt(detail.data.backtest.sharpe, 2) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(MetricCard, { label: "أفضل صفقة", value: fmt(detail.data.backtest.best_trade_pct, 2), suffix: "%", tone: "good" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(MetricCard, { label: "أسوأ صفقة", value: fmt(detail.data.backtest.worst_trade_pct, 2), suffix: "%", tone: "bad" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(MetricCard, { label: "متوسط أيام الاحتفاظ", value: fmt(detail.data.backtest.avg_days_held, 1) })
        ] }),
        (() => {
          const trades = detail.data.trades;
          const reasonLabels = {
            target_hit: "🎯 هدف",
            stop_hit: "🛑 وقف",
            breakeven: "⚖️ تعادل",
            max_hold: "⏱ مدة",
            early_exit: "🚪 خروج مبكر",
            open: "مفتوحة"
          };
          const byReason = groupBy(trades, (t) => reasonLabels[t.exit_reason ?? "open"] ?? t.exit_reason ?? "—", ["🎯 هدف", "🛑 وقف", "🚪 خروج مبكر", "⏱ مدة", "⚖️ تعادل", "مفتوحة"]);
          const byRegime = groupBy(trades, (t) => t.market_regime ?? "—");
          const bySignal = groupBy(trades, (t) => t.signal ?? "—");
          const byConf = groupBy(trades, (t) => {
            const c = Number(t.confidence);
            if (!Number.isFinite(c)) return null;
            if (c < 65) return "60-65";
            if (c < 70) return "65-70";
            if (c < 75) return "70-75";
            if (c < 80) return "75-80";
            if (c < 85) return "80-85";
            return "85+";
          }, ["60-65", "65-70", "70-75", "75-80", "80-85", "85+"]);
          const byDays = groupBy(trades, (t) => {
            const d = Number(t.days_held);
            if (!Number.isFinite(d)) return null;
            if (d <= 1) return "0-1 يوم";
            if (d <= 2) return "2 أيام";
            if (d <= 3) return "3 أيام";
            if (d <= 4) return "4 أيام";
            if (d <= 5) return "5 أيام";
            return "6+ أيام";
          }, ["0-1 يوم", "2 أيام", "3 أيام", "4 أيام", "5 أيام", "6+ أيام"]);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-2 text-base font-bold", children: "🔬 تحليل الخسائر — فين بالظبط النزيف" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-3 text-xs text-muted-foreground", children: "تقسيم الصفقات حسب أبعاد مختلفة عشان نعرف أنهي شريحة فعلاً بتكسب وأنهي بتخسر — قبل أي تعديل جديد. PF أقل من 1 = شريحة خاسرة. الصفقات داخل ±0.1% تُعتبر تعادل ولا تدخل WR." }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 lg:grid-cols-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(BreakdownTable, { title: "حسب سبب الخروج", hint: "أهم شريحة. لو max_hold خسران → نحتاج early exit.", buckets: byReason }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(BreakdownTable, { title: "حسب حالة السوق", hint: "هل ranging أو trending_up أفضل؟", buckets: byRegime }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(BreakdownTable, { title: "حسب نوع الإشارة", hint: "strong_buy لازم يتفوق على buy.", buckets: bySignal }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(BreakdownTable, { title: "حسب مستوى الثقة", hint: "الثقة الأعلى لازم تجيب PF أعلى.", buckets: byConf }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(BreakdownTable, { title: "حسب أيام الاحتفاظ", hint: "هل الصفقات الطويلة بتسحب من الميزة؟", buckets: byDays })
            ] })
          ] });
        })(),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 overflow-hidden rounded-xl border border-border bg-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-border px-4 py-3 text-sm font-bold", children: "آخر 50 صفقة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/40 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-end", children: "السهم" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-end", children: "دخول" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-end", children: "سعر" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-end", children: "وقف" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-end", children: "هدف" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-end", children: "خروج" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-end", children: "سبب" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-end", children: "ربح/خسارة" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-end", children: "R" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-end", children: "أيام" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-end", children: "السوق" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: detail.data.trades.slice(-50).reverse().map((t) => {
              const pnl = Number(t.pnl_pct);
              const isBE = t.exit_reason === "breakeven";
              const tone = isBE ? "text-muted-foreground" : pnl > 0 ? "text-bull" : pnl < 0 ? "text-bear" : "";
              const reasonLabel = {
                target_hit: "🎯 هدف",
                stop_hit: "🛑 وقف",
                breakeven: "⚖️ تعادل",
                max_hold: "⏱ مدة",
                early_exit: "🚪 خروج مبكر",
                open: "مفتوحة"
              };
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border hover:bg-muted/30", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 font-bold", children: t.symbol }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 tabular-nums", children: t.entry_date }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 tabular-nums", children: fmt(t.entry_price) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 tabular-nums text-bear", children: fmt(t.stop_loss) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 tabular-nums text-bull", children: fmt(t.target) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 tabular-nums", children: t.exit_price != null ? fmt(t.exit_price) : "—" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-xs", children: reasonLabel[t.exit_reason ?? "open"] ?? t.exit_reason }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `px-3 py-2 font-bold tabular-nums ${tone}`, children: t.pnl_pct != null ? `${pnl > 0 ? "+" : ""}${fmt(t.pnl_pct)}%` : "—" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `px-3 py-2 tabular-nums ${tone}`, children: t.r_multiple != null ? `${Number(t.r_multiple) > 0 ? "+" : ""}${fmt(t.r_multiple)}` : "—" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 tabular-nums", children: t.days_held }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-xs text-muted-foreground", children: t.market_regime ?? "—" })
              ] }, t.id);
            }) })
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-3 text-base font-bold", children: "المحاكاة السابقة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-xl border border-border bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/40 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-end", children: "التاريخ" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-end", children: "الفترة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-end", children: "حد الثقة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-end", children: "عدد الصفقات" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-end", children: "نسبة النجاح" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-end", children: "العائد" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-end", children: "PF" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
            (list.data ?? []).map((bt) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border hover:bg-muted/30", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 tabular-nums", children: new Date(bt.started_at).toLocaleString("ar-EG") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-3 py-2 tabular-nums text-xs", children: [
                bt.from_date,
                " → ",
                bt.to_date
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 tabular-nums", children: bt.min_confidence }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 tabular-nums", children: bt.total_trades }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `px-3 py-2 tabular-nums ${Number(bt.win_rate) >= 50 ? "text-bull" : "text-bear"}`, children: bt.win_rate != null ? `${fmt(bt.win_rate, 1)}%` : "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `px-3 py-2 tabular-nums ${Number(bt.total_return_pct) >= 0 ? "text-bull" : "text-bear"}`, children: bt.total_return_pct != null ? `${Number(bt.total_return_pct) > 0 ? "+" : ""}${fmt(bt.total_return_pct, 1)}%` : "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 tabular-nums", children: fmt(bt.profit_factor, 2) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setSelectedId(bt.id), className: "rounded-md border border-border px-2 py-1 text-xs hover:bg-muted", children: "عرض" }) })
            ] }, bt.id)),
            (list.data ?? []).length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 8, className: "px-3 py-8 text-center text-sm text-muted-foreground", children: "لا توجد محاكاة سابقة. شغّل أول محاكاة لرؤية النتائج." }) })
          ] })
        ] }) })
      ] })
    ] })
  ] });
}
export {
  BacktestPage as component
};
