import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { u as useServerFn, j as evaluatePositions, l as closePosition, k as acknowledgeAlert, h as positionsQO, i as dailyPnlQO, o as openPosition } from "./router-BYsPPCpA.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { c as useSuspenseQuery, u as useQueryClient, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import "../_libs/mendable__firecrawl-js.mjs";
import "../_libs/sonner.mjs";
import "../_libs/seroval.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
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
import "./server-BpMZvK1r.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:http";
import "node:stream/promises";
import "node:https";
import "node:http2";
import "../_libs/react-dom.mjs";
import "util";
import "async_hooks";
import "stream";
import "crypto";
import "../_libs/isbot.mjs";
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
function fmt(n, d = 2) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-EG", {
    maximumFractionDigits: d,
    minimumFractionDigits: d
  });
}
function PositionsPage() {
  const {
    data
  } = useSuspenseQuery(positionsQO);
  const {
    data: pnlData
  } = useSuspenseQuery(dailyPnlQO);
  const qc = useQueryClient();
  const evaluate = useServerFn(evaluatePositions);
  const close = useServerFn(closePosition);
  const ack = useServerFn(acknowledgeAlert);
  const evalMut = useMutation({
    mutationFn: () => evaluate({
      data: void 0
    }),
    onSuccess: () => qc.invalidateQueries({
      queryKey: ["positions"]
    })
  });
  const ackMut = useMutation({
    mutationFn: (alert_id) => ack({
      data: {
        alert_id
      }
    }),
    onSuccess: () => qc.invalidateQueries({
      queryKey: ["positions"]
    })
  });
  const open = data.positions.filter((p) => p.status === "open");
  const closed = data.positions.filter((p) => p.status === "closed");
  const totalPnl = closed.reduce((s, p) => s + (p.pnl_pct ?? 0), 0);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background text-foreground", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "border-b border-border bg-card/50 px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex max-w-6xl items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-extrabold", children: "💰 مراكزي" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "تتبّع الأسهم اللي اشتريتها — السيستم يقولّك امتى تبيع" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted", children: "← الرئيسية" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => evalMut.mutate(), disabled: evalMut.isPending, className: "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50", children: evalMut.isPending ? "جاري التقييم…" : "🔄 تقييم المراكز الآن" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-6xl space-y-6 px-6 py-6", children: [
      evalMut.data && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm", children: [
        "تم تقييم ",
        evalMut.data.evaluated,
        " مركز — ",
        evalMut.data.alerts_created,
        " إشعار بيع جديد"
      ] }),
      data.alerts.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "mb-3 text-lg font-bold", children: [
          "🔔 إشعارات البيع (",
          data.alerts.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: data.alerts.map((a) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 rounded-lg border border-warn/40 bg-warn/10 p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold", children: a.message_ar }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: [
              "السعر المقترح: ",
              fmt(a.suggested_exit_price),
              " | الربح/الخسارة: ",
              fmt(a.pnl_pct),
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => ackMut.mutate(a.id), className: "rounded-md border border-border px-3 py-1 text-xs hover:bg-muted", children: "تجاهل" })
        ] }, a.id)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "mb-3 text-lg font-bold", children: [
          "📂 مراكز مفتوحة (",
          open.length,
          ")"
        ] }),
        open.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground", children: "مفيش مراكز مفتوحة. ابدأ بإضافة سهم اشتريته من النموذج تحت 👇" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 md:grid-cols-2", children: open.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(OpenCard, { p, onClose: (exit_price) => close({
          data: {
            position_id: p.id,
            exit_price,
            exit_reason: "manual"
          }
        }).then(() => qc.invalidateQueries({
          queryKey: ["positions"]
        })) }, p.id)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AddPositionForm, { onAdded: () => qc.invalidateQueries({
        queryKey: ["positions"]
      }) }),
      pnlData.days.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-3 text-lg font-bold", children: "📅 الربح اليومي المُحقَّق" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto rounded-lg border border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/50 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "اليوم" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "عدد الصفقات" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "صافي الربح (ج.م)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "متوسط %" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "الأسهم" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: pnlData.days.map((d) => {
            const pos = d.realized_egp >= 0;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-semibold", children: d.day }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 tabular-nums", children: d.trades }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: `p-2 font-bold tabular-nums ${pos ? "text-bull" : "text-bear"}`, children: [
                pos ? "+" : "",
                fmt(d.realized_egp)
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: `p-2 tabular-nums ${d.avg_pnl_pct >= 0 ? "text-bull" : "text-bear"}`, children: [
                d.avg_pnl_pct >= 0 ? "+" : "",
                fmt(d.avg_pnl_pct),
                "%"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-xs text-muted-foreground", children: d.symbols.join("، ") })
            ] }, d.day);
          }) })
        ] }) })
      ] }),
      closed.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "mb-3 text-lg font-bold", children: [
          "📕 مراكز مغلقة (",
          closed.length,
          ") —",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: totalPnl >= 0 ? "text-bull" : "text-bear", children: [
            "إجمالي: ",
            totalPnl >= 0 ? "+" : "",
            fmt(totalPnl),
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto rounded-lg border border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/50 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "السهم" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "دخول" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "خروج" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "الربح %" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "السبب" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "وقت البيع" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: closed.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-semibold", children: p.name_ar || p.symbol }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 tabular-nums", children: fmt(p.entry_price) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 tabular-nums", children: fmt(p.exit_price) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: `p-2 font-bold tabular-nums ${(p.pnl_pct ?? 0) >= 0 ? "text-bull" : "text-bear"}`, children: [
              (p.pnl_pct ?? 0) >= 0 ? "+" : "",
              fmt(p.pnl_pct),
              "%"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-xs text-muted-foreground", children: p.exit_reason }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-xs", children: p.exit_at ? new Date(p.exit_at).toLocaleString("ar-EG", {
              dateStyle: "short",
              timeStyle: "short"
            }) : p.exit_date })
          ] }, p.id)) })
        ] }) })
      ] })
    ] })
  ] });
}
function OpenCard({
  p,
  onClose
}) {
  const [exit, setExit] = reactExports.useState(p.current_price ?? p.entry_price);
  const pnlPos = (p.pnl_pct ?? 0) >= 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-card p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold", children: p.name_ar || p.symbol }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: p.symbol })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `text-lg font-extrabold tabular-nums ${pnlPos ? "text-bull" : "text-bear"}`, children: [
        pnlPos ? "+" : "",
        fmt(p.pnl_pct),
        "%"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        "الدخول: ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold tabular-nums", children: fmt(p.entry_price) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        "الحالي: ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold tabular-nums", children: fmt(p.current_price) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        "الهدف: ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold tabular-nums text-bull", children: fmt(p.target_price) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        "وقف الخسارة: ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold tabular-nums text-bear", children: fmt(p.stop_loss) })
      ] }),
      p.trailing_stop != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2 text-warn", children: [
        "🔒 Trailing: ",
        fmt(p.trailing_stop)
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2 text-muted-foreground", children: [
        "الكمية: ",
        fmt(p.quantity, 0),
        " | اشتريت: ",
        new Date(p.entry_at).toLocaleString("ar-EG", {
          dateStyle: "short",
          timeStyle: "short"
        })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", step: "0.01", value: exit, onChange: (e) => setExit(parseFloat(e.target.value)), className: "w-24 rounded border border-border bg-background px-2 py-1 text-sm tabular-nums" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => onClose(exit), className: "rounded bg-bear px-3 py-1 text-sm font-semibold text-bear-foreground hover:opacity-90", children: "إغلاق المركز" })
    ] })
  ] });
}
function AddPositionForm({
  onAdded
}) {
  const openFn = useServerFn(openPosition);
  const [symbol, setSymbol] = reactExports.useState("");
  const [entry, setEntry] = reactExports.useState("");
  const [qty, setQty] = reactExports.useState("1");
  const [sl, setSl] = reactExports.useState("");
  const [tp, setTp] = reactExports.useState("");
  const [err, setErr] = reactExports.useState(null);
  const [ok, setOk] = reactExports.useState(false);
  const mut = useMutation({
    mutationFn: async () => {
      const entryNum = parseFloat(entry);
      return openFn({
        data: {
          symbol: symbol.trim().toUpperCase(),
          entry_price: entryNum,
          quantity: parseFloat(qty) || 1,
          stop_loss: sl ? parseFloat(sl) : null,
          target_price: tp ? parseFloat(tp) : null
        }
      });
    },
    onSuccess: () => {
      setOk(true);
      setErr(null);
      setSymbol("");
      setEntry("");
      setSl("");
      setTp("");
      setQty("1");
      onAdded();
      setTimeout(() => setOk(false), 2500);
    },
    onError: (e) => setErr(e.message)
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-lg border border-border bg-card p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-3 font-bold", children: "➕ إضافة مركز جديد" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3 md:grid-cols-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { placeholder: "الرمز (COMI)", value: symbol, onChange: (e) => setSymbol(e.target.value), className: "rounded border border-border bg-background px-3 py-2 text-sm" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { placeholder: "سعر الشراء", type: "number", step: "0.01", value: entry, onChange: (e) => setEntry(e.target.value), className: "rounded border border-border bg-background px-3 py-2 text-sm tabular-nums" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { placeholder: "الكمية", type: "number", value: qty, onChange: (e) => setQty(e.target.value), className: "rounded border border-border bg-background px-3 py-2 text-sm tabular-nums" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { placeholder: "وقف الخسارة", type: "number", step: "0.01", value: sl, onChange: (e) => setSl(e.target.value), className: "rounded border border-border bg-background px-3 py-2 text-sm tabular-nums" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { placeholder: "الهدف", type: "number", step: "0.01", value: tp, onChange: (e) => setTp(e.target.value), className: "rounded border border-border bg-background px-3 py-2 text-sm tabular-nums" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => mut.mutate(), disabled: mut.isPending || !symbol || !entry, className: "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50", children: mut.isPending ? "جاري الحفظ…" : "حفظ" }),
      ok && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-bull", children: "✓ تم الحفظ" }),
      err && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-bear", children: err })
    ] })
  ] });
}
export {
  PositionsPage as component
};
