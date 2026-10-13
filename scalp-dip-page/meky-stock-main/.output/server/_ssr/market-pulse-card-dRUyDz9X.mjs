import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { u as useServerFn, c as createSsrRpc } from "./router-BYsPPCpA.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
const getMarketPulse = createServerFn({
  method: "GET"
}).handler(createSsrRpc("ae321aca21b282fa97bdcb0be86f9e637bae93ba728073730e4d88f02034c759"));
const COLOR = {
  bull: "border-bull bg-bull/10 text-bull",
  bear: "border-bear bg-bear/10 text-bear",
  warn: "border-warn bg-warn/10 text-warn",
  muted: "border-muted bg-muted/20 text-foreground",
  neutral: "border-border bg-card text-muted-foreground"
};
function MarketPulseCard({ compact = false }) {
  const fetchPulse = useServerFn(getMarketPulse);
  const { data } = useQuery({
    queryKey: ["market-pulse"],
    queryFn: () => fetchPulse(),
    refetchInterval: 6e4
  });
  if (!data) return null;
  const cls = COLOR[data.labelColor] ?? COLOR.neutral;
  const sign = (n) => n >= 0 ? "+" : "";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded-lg border-2 p-4 mb-4 ${cls}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between flex-wrap gap-2 mb-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-bold text-sm", children: [
        "📊 نبض السوق — أول 30 دقيقة (",
        data.date,
        ")"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs opacity-75", children: data.ready ? `${data.active} رمز نشط` : "لسه بدري — التصنيف بعد 10:30 ص" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-3 flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-extrabold", children: data.label }),
      data.ready && data.active > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm tabular-nums opacity-90", children: [
        "متوسط الحركة: ",
        /* @__PURE__ */ jsxRuntimeExports.jsxs("b", { children: [
          sign(data.avgMovePct),
          data.avgMovePct,
          "%"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mx-2", children: "•" }),
        "صاعدة: ",
        /* @__PURE__ */ jsxRuntimeExports.jsxs("b", { children: [
          data.pctUp,
          "%"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mx-2", children: "•" }),
        "هبطت ≥1.5%: ",
        /* @__PURE__ */ jsxRuntimeExports.jsxs("b", { children: [
          data.pctDip,
          "%"
        ] })
      ] })
    ] }),
    data.ready && data.active > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 rounded-md bg-background/60 border p-3 text-sm text-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "المتوقع للاستراتيجية اليوم:" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `text-lg font-bold tabular-nums ${data.expectedPnl >= 0 ? "text-bull" : "text-bear"}`, children: [
          sign(data.expectedPnl),
          data.expectedPnl.toLocaleString(),
          " ج"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
          "(مدى: ",
          data.expectedRange,
          ")"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-baseline gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "توقع إشارات Scalp Live اليوم:" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-base font-bold tabular-nums text-foreground", children: [
          "⚡ ",
          data.expectedSignals
        ] })
      ] }),
      !compact && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1.5 text-xs text-muted-foreground leading-5", children: [
        data.note,
        /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "opacity-70", children: "⚠️ التقدير مبني على 5 أيام بس (07–11/06). الدقة هتتحسّن لما نجمع 20+ يوم." })
      ] })
    ] })
  ] });
}
export {
  MarketPulseCard as M
};
