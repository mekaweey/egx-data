import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { c as createSsrRpc } from "./router-BYsPPCpA.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import "../_libs/mendable__firecrawl-js.mjs";
import "../_libs/sonner.mjs";
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
const getSupervisorState = createServerFn({
  method: "GET"
}).handler(createSsrRpc("ff247ed1bf7b334e0d2e9a50f023bd88824e683bb4c20d7334b4a355a35d4a23"));
const getSystemFacts = createServerFn({
  method: "GET"
}).handler(createSsrRpc("90b85236a77d50db8e2a9db999a9488a327b6db75cca05c530bd5001e068aeb6"));
function SupervisorPage() {
  const stateQ = useQuery({
    queryKey: ["supervisor-state"],
    queryFn: () => getSupervisorState(),
    refetchInterval: 3e4
  });
  const factsQ = useQuery({
    queryKey: ["supervisor-facts"],
    queryFn: () => getSystemFacts(),
    refetchInterval: 6e4
  });
  const v = stateQ.data?.verdict ?? null;
  const history = stateQ.data?.history ?? [];
  const facts = factsQ.data;
  const levelColor = v?.level === "CRITICAL" ? "text-red-400" : v?.level === "WARN" ? "text-amber-400" : "text-emerald-400";
  const levelBg = v?.level === "CRITICAL" ? "bg-red-950/40 border-red-700" : v?.level === "WARN" ? "bg-amber-950/30 border-amber-700" : "bg-emerald-950/30 border-emerald-700";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 md:p-6 max-w-6xl mx-auto space-y-4", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-wrap items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-black", children: "🛡️ المشرف الذكي — مراقبة النظام" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "مراقبة لحظية للنظام: الموقع، البيانات، الصفقات، الإشارات، الأخبار، الـ cron jobs — تتحدث كل 30 ثانية" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => stateQ.refetch(), className: "rounded px-3 py-1.5 text-xs font-semibold bg-muted hover:bg-muted/70", children: "تحديث الآن" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: `rounded-lg border p-4 ${levelBg}`, children: stateQ.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm", children: "جاري تحميل حالة المشرف…" }) : !v ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-muted-foreground", children: [
      "مفيش تقرير مشرف لسه. شغّل ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "font-mono text-xs", children: "node scripts/supervisor.cjs" }),
      " من مجلد المشروع، أو استنى تشغيل الـ cron القادم."
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-lg font-black ${levelColor}`, children: v.level === "CRITICAL" ? "🔴 حرج" : v.level === "WARN" ? "🟡 تحذير" : "🟢 سليم" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
          "آخر فحص: ",
          new Date(v.time).toLocaleString("ar-EG"),
          " • النافذة:",
          " ",
          v.window === "pre-open" ? "قبل الافتتاح" : v.window === "entry" ? "نافذة الدخول" : v.window === "eod" ? "نافذة الخروج" : v.window === "session" ? "الجلسة" : "خارج الجلسة"
        ] })
      ] }),
      v.critical?.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "text-sm space-y-1", children: v.critical.map((c, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "text-red-300", children: [
        "⛔ ",
        c
      ] }, i)) }),
      v.warns?.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "text-sm space-y-1", children: v.warns.map((w, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "text-amber-300", children: [
        "⚠️ ",
        w
      ] }, i)) }),
      v.oks?.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("details", { className: "text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("summary", { className: "cursor-pointer", children: [
          "الفحوصات السليمة (",
          v.oks.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-1 space-y-0.5", children: v.oks.map((o, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          "✅ ",
          o
        ] }, i)) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "grid grid-cols-2 md:grid-cols-4 gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "مراكز مفتوحة", value: String(facts?.openPositions ?? "—") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "إشارات اليوم", value: String(facts?.todaySignals ?? "—") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "صفقات مقفولة", value: String(facts?.closedTrades ?? "—") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "تحديث كل", value: "30 ثانية" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-lg border bg-card p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-base font-bold mb-3", children: "📜 سجل قرارات المشرف (آخر 40 فحص)" }),
      history.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "السجل هيتعبى تلقائيًا مع كل تشغيل للمشرف (كل 30 دقيقة خلال ساعات التداول)." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1 max-h-96 overflow-y-auto", children: history.map((h, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs border-b border-border/40 pb-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: h.level === "CRITICAL" ? "text-red-400 font-bold" : h.level === "WARN" ? "text-amber-400" : "text-emerald-400", children: h.level }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: new Date(h.time).toLocaleString("ar-EG") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 truncate", children: h.critical?.length ? h.critical.join(" • ") : h.warns?.length ? h.warns.join(" • ") : "كله سليم" })
      ] }, i)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-lg border bg-muted/20 p-4 text-xs text-muted-foreground space-y-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold text-foreground", children: "ماذا يراقب المشرف؟ (حسب وقت الجلسة)" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        "🕘 ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "قبل الافتتاح (8:30-9:55):" }),
        " جاهزية الموقع والبيانات والأرشيف"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        "🔥 ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "نافذة الدخول (9:55-10:30):" }),
        " ظهور الإشارات — إن لم تظهر بعد 10:30 = إنذار حرج"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        "📊 ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "الجلسة (10:00-14:30):" }),
        " تدفق البيانات اللحظية — توقفها 10 دقايق = إنذار حرج"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        "🏁 ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "نافذة الخروج (14:15-14:50):" }),
        " تنفيذ الخروجات — صفقة عالقة 4+ أيام = إنذار حرج"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        "🛡️ ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "دايمًا:" }),
        " سلامة المراكز (SL صحيح) • التكرارات • الـ cron jobs • حجم الداتابيز • الأرشيف"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "rounded-lg border border-warn/50 bg-warn/10 p-3 text-xs", children: "⚠️ وضع PAPER TRADING فقط. المشرف بيراقب ويُبلغ — مفيش أي تنفيذ تداول حقيقي أوتوماتيكي." })
  ] });
}
function Stat({
  label,
  value
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border bg-card p-3 text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-bold font-mono mt-1", children: value })
  ] });
}
export {
  SupervisorPage as component
};
