import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
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
const getModelLearningHealth = createServerFn({
  method: "GET"
}).handler(createSsrRpc("5eb484aabbe9499860497c5f2e1afe2ec7f74ff5f8294c7e42329652b0e8c5eb"));
const STATUS = {
  cold: {
    label: "بارد",
    cls: "bg-bear/20 text-bear"
  },
  learning: {
    label: "بيتعلم",
    cls: "bg-yellow-500/20 text-yellow-500"
  },
  trained: {
    label: "متدرّب",
    cls: "bg-primary/20 text-primary"
  },
  mature: {
    label: "ناضج",
    cls: "bg-bull/20 text-bull"
  }
};
function ago(iso) {
  if (!iso) return "—";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1e3);
  if (s < 60) return `${s}ث`;
  if (s < 3600) return `${Math.floor(s / 60)}د`;
  if (s < 86400) return `${Math.floor(s / 3600)}س`;
  return `${Math.floor(s / 86400)}ي`;
}
function LearnerCard({
  h
}) {
  const s = STATUS[h.status];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold", children: h.name_ar }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-0.5 text-[11px] text-muted-foreground", children: [
          h.samples.toLocaleString("en"),
          " عينة • آخر تحديث ",
          ago(h.last_update)
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded-full px-2 py-0.5 text-[10px] font-bold ${s.cls}`, children: s.label })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 h-2 w-full overflow-hidden rounded-full bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-full rounded-full ${h.level_pct >= 80 ? "bg-bull" : h.level_pct >= 50 ? "bg-primary" : h.level_pct >= 20 ? "bg-yellow-500" : "bg-bear"}`, style: {
      width: `${h.bar_pct}%`
    } }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex items-center justify-between text-[10px] text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        "الدورة ",
        h.cycle.toLocaleString("en")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        h.level_pct.toLocaleString("en"),
        "٪ • القادم عند ",
        h.next_milestone.toLocaleString("en"),
        " عينة"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 space-y-1.5 text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-bear", children: "⚠️ الضعف:" }),
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: h.weakness_ar })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: "🎯 محتاج:" }),
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: h.need_ar })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-bull", children: "💡 الحل:" }),
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: h.fix_ar })
      ] })
    ] })
  ] });
}
async function requestInstantTraining() {
  const r = await fetch("/api/public/hooks/instant-train", {
    method: "POST"
  });
  const text = await r.text();
  let j = {};
  try {
    j = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`رد غير متوقع من السيرفر (${r.status})`);
  }
  if (!r.ok || j?.ok === false) {
    throw new Error(j?.error || j?.hint || `HTTP ${r.status}`);
  }
  return j;
}
function LearningPage() {
  const fetchHealth = useServerFn(getModelLearningHealth);
  const {
    data,
    isLoading,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ["model-learning-health"],
    queryFn: () => fetchHealth()
  });
  const [training, setTraining] = reactExports.useState(false);
  const [trainMsg, setTrainMsg] = reactExports.useState(null);
  const [megaRunning, setMegaRunning] = reactExports.useState(false);
  const [megaStep, setMegaStep] = reactExports.useState(0);
  const [megaTotal, setMegaTotal] = reactExports.useState(0);
  const [megaEta, setMegaEta] = reactExports.useState(null);
  const [megaMsg, setMegaMsg] = reactExports.useState(null);
  const [autoTrain, setAutoTrain] = reactExports.useState(false);
  const [autoCount, setAutoCount] = reactExports.useState(0);
  reactExports.useRef(false);
  async function runInstantTrain() {
    setTraining(true);
    setTrainMsg("جاري التدريب الفوري السريع على كل الموديلات...");
    try {
      const j = await requestInstantTraining();
      const rules = j?.adversarial?.rules_added ?? 0;
      const models = j?.weights?.models ?? 0;
      const isoN = j?.isotonic?.samples ?? 0;
      const sym = j?.symbol_memory?.symbols ?? 0;
      const cycle = j?.cycle ? ` • دورة #${Number(j.cycle).toLocaleString("en")}` : "";
      setTrainMsg(`✅ ${models} موديل أُعيد توزينه • ${rules} قاعدة فشل جديدة • ${isoN} عينة معايرة • ${sym} سهم في الذاكرة${cycle}`);
      await refetch();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setTrainMsg(`❌ فشل التدريب — ${msg}`);
    } finally {
      setTraining(false);
    }
  }
  reactExports.useEffect(() => {
    if (!autoTrain) return;
    let cancelled = false;
    (async () => {
      while (!cancelled) {
        try {
          const j = await requestInstantTraining();
          if (cancelled) break;
          const cycle = j?.cycle ? ` • دورة #${Number(j.cycle).toLocaleString("en")}` : "";
          setAutoCount((n) => n + 1);
          setTrainMsg(`🔁 تدريب دائم يعمل${cycle}`);
          await refetch();
        } catch (e) {
          if (cancelled) break;
          const msg = e instanceof Error ? e.message : String(e);
          setTrainMsg(`⚠️ تدريب دائم — ${msg} (إعادة المحاولة بعد 3ث)`);
          await new Promise((r) => setTimeout(r, 3e3));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [autoTrain, refetch]);
  async function runMegaFix() {
    const TOTAL = 5;
    setMegaRunning(true);
    setMegaStep(0);
    setMegaTotal(TOTAL);
    setMegaEta(null);
    setMegaMsg("جاري تشغيل الحل الشامل...");
    const started = Date.now();
    let totalRules = 0, totalModels = 0, totalIso = 0, totalSym = 0, lastCycle = 0;
    try {
      for (let i = 1; i <= TOTAL; i++) {
        const j = await requestInstantTraining();
        totalRules += Number(j?.adversarial?.rules_added ?? 0);
        totalModels = Math.max(totalModels, Number(j?.weights?.models ?? 0));
        totalIso = Math.max(totalIso, Number(j?.isotonic?.samples ?? 0));
        totalSym = Math.max(totalSym, Number(j?.symbol_memory?.symbols ?? 0));
        lastCycle = Number(j?.cycle ?? lastCycle);
        setMegaStep(i);
        const elapsed = (Date.now() - started) / 1e3;
        const perStep = elapsed / i;
        setMegaEta(Math.round(perStep * (TOTAL - i)));
        await refetch();
      }
      setMegaMsg(`✅ تم! ${TOTAL} دورات تدريب • ${totalModels} موديل • ${totalRules} قاعدة فشل جديدة • ${totalIso} عينة معايرة • ${totalSym} سهم • آخر دورة #${lastCycle.toLocaleString("en")}`);
      setMegaEta(0);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setMegaMsg(`❌ فشل الحل الشامل — ${msg}`);
    } finally {
      setMegaRunning(false);
    }
  }
  const megaPct = megaTotal ? Math.round(megaStep / megaTotal * 100) : 0;
  const overall = data?.overall_pct ?? 0;
  const overallBar = data?.overall_bar_pct ?? Math.min(100, overall);
  const overallCycle = data?.overall_cycle ?? 1;
  const overallS = data ? STATUS[data.overall_status] : null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-5xl px-4 py-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold", children: "🧠 مستوى تعلّم الموديلات" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "تشخيص لحظي لكل learner — نقاط الضعف والحلول." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: runMegaFix, disabled: megaRunning || training, className: "rounded-lg bg-gradient-to-r from-bull to-primary text-primary-foreground px-4 py-2 text-sm font-bold hover:opacity-90 disabled:opacity-50", children: megaRunning ? `يحلّ... ${megaPct}٪` : "🚀 حل شامل" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: runInstantTrain, disabled: training, className: "rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold hover:opacity-90 disabled:opacity-50", children: training ? "يتعلّم..." : "⚡ تعلّم فوري" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setAutoTrain((v) => !v), className: `rounded-lg px-4 py-2 text-sm font-bold hover:opacity-90 ${autoTrain ? "bg-bull text-primary-foreground animate-pulse" : "border border-border bg-card"}`, children: autoTrain ? `🔁 تدريب دائم: شغّال (${autoCount.toLocaleString("en")})` : "♾️ تدريب دائم" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => refetch(), disabled: isFetching, className: "rounded-lg border border-border bg-card px-4 py-2 text-sm hover:border-primary", children: isFetching ? "..." : "تحديث" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/daily", className: "rounded-lg border border-border bg-card px-4 py-2 text-sm hover:border-primary", children: "صفقة اليوم" })
      ] })
    ] }),
    (megaRunning || megaMsg) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 rounded-lg border border-border bg-card p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: "🚀 الحل الشامل" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: megaRunning ? `الخطوة ${megaStep.toLocaleString("en")} من ${megaTotal.toLocaleString("en")}${megaEta !== null ? ` • متبقي ~${megaEta.toLocaleString("en")} ث` : ""}` : megaEta === 0 ? "اكتمل" : "" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 h-2 w-full overflow-hidden rounded-full bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full rounded-full bg-gradient-to-r from-bull to-primary transition-all duration-500", style: {
        width: `${megaPct}%`
      } }) }),
      megaMsg && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 text-sm", children: megaMsg })
    ] }),
    trainMsg && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 rounded-lg border border-border bg-card px-4 py-2 text-sm", children: trainMsg }),
    isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center text-muted-foreground", children: "جاري التحميل..." }),
    data && overallS && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-card p-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "المستوى الإجمالي للنظام" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-3xl font-bold", children: [
            overall.toLocaleString("en"),
            "٪"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: [
            "تدريب مستمر • الدورة ",
            overallCycle.toLocaleString("en")
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded-full px-3 py-1 text-sm font-bold ${overallS.cls}`, children: overallS.label })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 h-3 w-full overflow-hidden rounded-full bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-full rounded-full ${overall >= 80 ? "bg-bull" : overall >= 50 ? "bg-primary" : overall >= 20 ? "bg-yellow-500" : "bg-bear"}`, style: {
        width: `${overallBar}%`
      } }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: data.summary_ar })
    ] }),
    data && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: data.learners.map((h) => /* @__PURE__ */ jsxRuntimeExports.jsx(LearnerCard, { h }, h.key)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 rounded-xl border border-border bg-muted/20 p-4 text-xs leading-6 text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-foreground", children: "📊 كيف تقرأ هذه الصفحة:" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "mt-2 list-disc space-y-1 ps-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "المستوى" }),
          " غير محدود: 100٪ تعني دورة تدريب كاملة، و200٪ تعني دورتين، وهكذا."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "بارد" }),
          " (0-20٪): يعطي قرارات افتراضية فقط. ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "بيتعلم" }),
          " (20-50٪): تحسّن ملحوظ كل تشغيل."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "متدرّب" }),
          " (50-80٪): قرارات موثوقة. ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "ناضج" }),
          " (≥80٪): استقرار طويل المدى."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          "زرّ ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "⚡ تعلّم فوري" }),
          " يضيف دورة تدريب جديدة ولا يقفل التعلم عند 100٪."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "التدريب التلقائي يعمل عدة مرات يومياً ويدوّر إعدادات backtest مختلفة عشان يزود الخبرة بدون سقف." })
      ] })
    ] })
  ] });
}
export {
  LearningPage as component
};
