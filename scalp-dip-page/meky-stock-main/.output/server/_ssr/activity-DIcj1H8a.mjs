import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useServerFn, d as deletePosition, a as activityQO } from "./router-BYsPPCpA.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { c as useSuspenseQuery, u as useQueryClient, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import "../_libs/mendable__firecrawl-js.mjs";
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
function fmtDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ar-EG", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return iso;
  }
}
function ActivityPage() {
  const {
    data
  } = useSuspenseQuery(activityQO);
  const qc = useQueryClient();
  const del = useServerFn(deletePosition);
  const delMut = useMutation({
    mutationFn: (id) => del({
      data: {
        position_id: id
      }
    }),
    onSuccess: () => {
      toast.success("تم الحذف — اعتبرنا الصفقة دي ما حصلتش");
      qc.invalidateQueries({
        queryKey: ["activity"]
      });
      qc.invalidateQueries({
        queryKey: ["positions"]
      });
    },
    onError: (e) => toast.error(`فشل الحذف: ${e.message}`)
  });
  const items = data.items;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-background p-4 sm:p-6", dir: "rtl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-3xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-extrabold", children: "📜 سجل النشاط والإشعارات" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "كل اللي قلتلي عليه + كل الإشعارات اللي وصلتك. تقدر تلغي أي صفقة دخلتها بالغلط." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-muted", children: "← الرئيسية" })
    ] }),
    items.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground", children: "مفيش أي نشاط لحد دلوقتي." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-3", children: items.map((it) => {
      const positionId = it.kind === "position_open" ? it.id.replace(/^pos-open-/, "") : null;
      const hasSymbol = !!it.symbol && it.symbol !== "—";
      const color = it.kind === "position_open" ? "border-bull/40 bg-bull/5" : it.kind === "position_close" ? "border-border bg-muted/30" : it.kind === "sell_alert" ? "border-amber-500/40 bg-amber-500/5" : "border-primary/30 bg-primary/5";
      return /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: `rounded-xl border ${color} p-4 shadow-sm`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
        hasSymbol ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/stock/$symbol", params: {
          symbol: it.symbol
        }, className: "min-w-0 flex-1 -m-1 rounded-lg p-1 hover:bg-muted/40 transition", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-bold", children: it.title }),
          it.detail && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xs text-muted-foreground break-words", children: it.detail }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 text-[11px] text-muted-foreground tabular-nums", children: [
            fmtDate(it.ts),
            " · ",
            it.symbol,
            " · اضغط للفتح ←"
          ] })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-bold", children: it.title }),
          it.detail && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xs text-muted-foreground break-words", children: it.detail }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 text-[11px] text-muted-foreground tabular-nums", children: [
            fmtDate(it.ts),
            " · ",
            it.symbol
          ] })
        ] }),
        positionId && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (confirm("متأكد إنك عايز تلغي تسجيل الصفقة دي؟ (هنحذفها خالص من السجل وكأنها ما حصلتش)")) {
            delMut.mutate(positionId);
          }
        }, disabled: delMut.isPending, className: "shrink-0 rounded-lg border border-bear/40 px-3 py-1.5 text-xs font-bold text-bear hover:bg-bear/10 disabled:opacity-50", children: "🗑️ إلغاء" })
      ] }) }, it.id);
    }) })
  ] }) });
}
export {
  ActivityPage as component
};
