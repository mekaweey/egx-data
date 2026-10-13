import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { u as useServerFn, c as createSsrRpc } from "./router-BYsPPCpA.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
import { g as getMarketStatus } from "./market-hours-CyHCW23Z.mjs";
import { T as ThunderConnectionBanner } from "./thunder-connection-banner-hyVTeR9F.mjs";
import "../_libs/sonner.mjs";
import "../_libs/mendable__firecrawl-js.mjs";
import "../_libs/seroval.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-router.mjs";
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
import "./client-DcfJRNR2.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "./client.server-D5ro3rAQ.mjs";
import "node:fs";
import "node:path";
import "node:child_process";
import "./outcome-loop.server-BOECsdkT.mjs";
import "./auto-orchestrator.server-Cobs3ZBw.mjs";
import "./chat-fallback.server-HMcdWJQs.mjs";
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
import "./telegram.server-D6g8flro.mjs";
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
const getSniperSnapshot = createServerFn({
  method: "GET"
}).handler(createSsrRpc("64c6e19884a6c1ec3fefe7cde56570036d605dd7fcf0752d91dfa5e7cca2bb90"));
function fmt(n, d = 2) {
  if (n == null) return "—";
  return n.toLocaleString("en-EG", {
    maximumFractionDigits: d,
    minimumFractionDigits: d
  });
}
function SniperPage() {
  const fetchSnapshot = useServerFn(getSniperSnapshot);
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["sniper-snapshot"],
    queryFn: () => fetchSnapshot(),
    refetchInterval: 15e3
  });
  const status = getMarketStatus();
  if (isLoading) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 text-center text-muted-foreground", children: "جاري التحميل…" });
  if (!data?.pick) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-3xl mx-auto p-6 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold mb-4", children: "🎯 Sniper" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "مفيش سهم مختار النهارده. الاختيار بيتم 9:00 صباحاً." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: status.label })
    ] });
  }
  const p = data.pick;
  const livePrice = data.latest?.price ?? null;
  const movePct = livePrice && p.prev_close ? (livePrice - p.prev_close) / p.prev_close * 100 : null;
  const moveColor = movePct == null ? "text-muted-foreground" : movePct >= 0 ? "text-bull" : "text-bear";
  const decisionBadge = p.orb_decision === "BUY" ? {
    c: "bg-bull text-bull-foreground",
    t: "🟢 شراء بالكامل"
  } : p.orb_decision === "BUY_LIGHT" ? {
    c: "bg-warn text-warn-foreground",
    t: "🟡 شراء مخفّض"
  } : p.orb_decision === "SKIP" ? {
    c: "bg-bear text-bear-foreground",
    t: "🔴 تجاهل"
  } : {
    c: "bg-muted text-muted-foreground",
    t: "⏳ بانتظار قرار ORB (10:30)"
  };
  const conf = p.confidence ?? 0;
  const highConf = conf >= 80;
  const confBadge = highConf ? {
    c: "bg-bull text-bull-foreground",
    t: `⭐ ترشيح قوي · ثقة ${conf}%`
  } : {
    c: "bg-warn/20 text-warn border border-warn/40",
    t: `⚠️ ترشيح ضعيف · ثقة ${conf}% فقط`
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-4xl mx-auto p-6 space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(ThunderConnectionBanner, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold", children: "🎯 Sniper — صفقة اليوم" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
        status.label,
        " · ",
        status.hhmmss
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-6 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `px-4 py-1.5 rounded-full text-sm font-semibold ${confBadge.c}`, children: confBadge.t }),
        !highConf && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground self-center", children: "النظام ما لقاش سهم بثقة 80%+ النهارده، ده أفضل اختيار متاح" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: "السهم المختار" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-4xl font-bold", children: p.name_ar ?? p.symbol }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-muted-foreground mt-1", children: [
            p.symbol,
            " · score ",
            fmt(p.v3_score, 1)
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `px-4 py-2 rounded-full font-semibold ${decisionBadge.c}`, children: decisionBadge.t })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 mt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "السعر الحالي", value: fmt(livePrice), suffix: "ج.م", extra: movePct != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `text-xs ${moveColor}`, children: [
          movePct >= 0 ? "+" : "",
          movePct.toFixed(2),
          "%"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "إقفال أمس", value: fmt(p.prev_close), suffix: "ج.م" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "الهدف (+4%)", value: fmt(p.target_price), suffix: "ج.م", valueClass: "text-bull" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "الستوب (-2%)", value: fmt(p.stop_price), suffix: "ج.م", valueClass: "text-bear" })
      ] }),
      p.orb_high != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 p-4 rounded-xl bg-muted/40", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold mb-2", children: "نافذة Opening Range (10:00 → 10:30)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-4 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            "أعلى: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: fmt(p.orb_high) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            "أدنى: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: fmt(p.orb_low) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            "نسبة الدخول: ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono", children: [
              p.position_pct ?? 0,
              "%"
            ] })
          ] })
        ] })
      ] }),
      p.reasons && p.reasons.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm font-semibold mb-2 text-bull", children: [
          "✅ ",
          highConf ? "أسباب الثقة في الترشيح" : "نقاط القوة المتاحة"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-1.5", children: p.reasons.map((r, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "text-sm px-3 py-1.5 rounded-lg bg-bull/10 text-foreground border border-bull/20", children: r }, i)) })
      ] }),
      p.negative_reasons && p.negative_reasons.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm font-semibold mb-2 text-warn", children: [
          "⚠️ ",
          highConf ? "ملاحظات للحذر" : "أسباب ضعف الثقة في الترشيح ده"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-1.5", children: p.negative_reasons.map((r, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "text-sm px-3 py-1.5 rounded-lg bg-warn/10 text-foreground border border-warn/20", children: r }, i)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", children: "آخر الـ ticks (real-time)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
          data.ticks.length,
          " قراءة · يتجدد كل 15s"
        ] })
      ] }),
      data.ticks.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "لسه ما اتجمعتش ticks. الـ polling بيشتغل من 10:00." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-72 overflow-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right py-1", children: "الوقت" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right py-1", children: "السعر" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right py-1", children: "المصدر" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: [...data.ticks].reverse().slice(0, 30).map((t, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-1 text-muted-foreground", children: new Date(t.ts).toLocaleTimeString("en-EG", {
            hour12: false
          }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-1 font-mono", children: fmt(t.price) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-0.5 rounded bg-muted text-xs", children: t.source }) })
        ] }, i)) })
      ] }) })
    ] })
  ] });
}
function Stat({
  label,
  value,
  suffix,
  valueClass,
  extra
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `text-xl font-bold ${valueClass ?? ""}`, children: [
      value,
      suffix && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground ml-1", children: suffix })
    ] }),
    extra
  ] });
}
export {
  SniperPage as component
};
