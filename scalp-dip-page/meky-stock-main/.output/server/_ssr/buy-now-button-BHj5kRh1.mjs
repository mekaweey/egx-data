import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useServerFn, o as openPosition } from "./router-BYsPPCpA.mjs";
import { u as useQueryClient, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
function BuyNowButton({
  symbol,
  name,
  entry,
  target,
  stop,
  maxHoldDays,
  recommendationId,
  defaultShares = 0,
  disabled = false,
  disabledReason = ""
}) {
  const [open, setOpen] = reactExports.useState(false);
  const [shares, setShares] = reactExports.useState(defaultShares > 0 ? defaultShares : 100);
  const [price, setPrice] = reactExports.useState(entry);
  const open_ = useServerFn(openPosition);
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: () => open_({
      data: {
        symbol,
        entry_price: price,
        quantity: shares,
        stop_loss: stop ?? null,
        target_price: target ?? null,
        max_hold_days: maxHoldDays ?? 30,
        recommendation_id: recommendationId ?? null,
        notes: null
      }
    }),
    onSuccess: () => {
      toast.success(`✅ تم تسجيل صفقة ${name ?? symbol}`, {
        description: `الكميه ${shares.toLocaleString("en-EG")} سهم · بسعر ${price.toFixed(2)} ج.م — هنبعتلك إشعار لما يحين البيع`
      });
      qc.invalidateQueries({ queryKey: ["positions"] });
      setOpen(false);
    },
    onError: (e) => toast.error(`فشل: ${e.message}`)
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => {
          if (!disabled) setOpen(true);
        },
        disabled,
        title: disabled ? disabledReason : void 0,
        className: "rounded-lg bg-bull px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
        children: disabled ? "⏰ التنفيذ مغلق" : "✋ اشتريت ده — تابعه ليّا"
      }
    ),
    open && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        role: "dialog",
        "aria-modal": "true",
        className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4",
        onClick: () => setOpen(false),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl",
            onClick: (e) => e.stopPropagation(),
            dir: "rtl",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-lg font-extrabold", children: [
                "سجّل صفقتك في ",
                name ?? symbol
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "هنتابع السعر اللحظي ونبعتلك إشعار في الصفحة وعلى التليجرام لما يحين البيع (هدف / ستوب / تريلينج)." }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid grid-cols-2 gap-3 text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex flex-col gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "سعر الدخول الفعلي" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "number",
                      step: "0.01",
                      value: price,
                      onChange: (e) => setPrice(Math.max(0, Number(e.target.value) || 0)),
                      className: "rounded-lg border border-border bg-background px-3 py-2 font-bold tabular-nums"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex flex-col gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "عدد الأسهم" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "number",
                      step: "1",
                      value: shares,
                      onChange: (e) => setShares(Math.max(1, Math.floor(Number(e.target.value) || 0))),
                      className: "rounded-lg border border-border bg-background px-3 py-2 font-bold tabular-nums"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 rounded-lg bg-muted/40 p-3 text-xs", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "إجمالي التكلفة" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("b", { className: "tabular-nums", children: [
                    (price * shares).toLocaleString("en-EG", { maximumFractionDigits: 0 }),
                    " ج.م"
                  ] })
                ] }),
                target != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between mt-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "الهدف" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("b", { className: "tabular-nums text-bull", children: target.toFixed(2) })
                ] }),
                stop != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between mt-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "وقف الخسارة" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("b", { className: "tabular-nums text-bear", children: stop.toFixed(2) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: () => setOpen(false),
                    className: "flex-1 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted",
                    children: "إلغاء"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: () => mut.mutate(),
                    disabled: mut.isPending || price <= 0 || shares <= 0,
                    className: "flex-1 rounded-lg bg-bull px-4 py-2 text-sm font-bold text-white disabled:opacity-50",
                    children: mut.isPending ? "جاري الحفظ…" : "✅ احفظ وتابع"
                  }
                )
              ] })
            ]
          }
        )
      }
    )
  ] });
}
export {
  BuyNowButton as B
};
