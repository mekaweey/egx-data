import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
const fmt = (n, d = 2) => n == null || Number.isNaN(n) ? "—" : n.toLocaleString("en-EG", { maximumFractionDigits: d, minimumFractionDigits: d });
const HISTORY = /* @__PURE__ */ new Map();
const MAX_POINTS = 90;
function pushSample(symbol, q) {
  if (!q || q.price <= 0) return HISTORY.get(symbol) ?? [];
  const arr = HISTORY.get(symbol) ?? [];
  const t = new Date(q.fetchedAt).getTime();
  const last = arr[arr.length - 1];
  if (!last || last.t !== t) {
    arr.push({ t, p: q.price });
    if (arr.length > MAX_POINTS) arr.splice(0, arr.length - MAX_POINTS);
    HISTORY.set(symbol, arr);
  }
  return arr;
}
function Sparkline({
  samples,
  height = 56,
  bullish
}) {
  if (samples.length < 2) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "flex items-center justify-center text-[10px] text-muted-foreground",
        style: { height },
        children: "جاري تجميع نقاط لايف…"
      }
    );
  }
  const w = 240;
  const h = height;
  const xs = samples.map((s) => s.t);
  const ys = samples.map((s) => s.p);
  const xmin = Math.min(...xs);
  const xmax = Math.max(...xs);
  const ymin = Math.min(...ys);
  const ymax = Math.max(...ys);
  const xr = Math.max(xmax - xmin, 1);
  const yr = Math.max(ymax - ymin, 1e-4);
  const pts = samples.map((s) => {
    const x = (s.t - xmin) / xr * (w - 6) + 3;
    const y = h - 4 - (s.p - ymin) / yr * (h - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const color = bullish ? "hsl(var(--bull, 142 70% 45%))" : "hsl(var(--bear, 0 70% 55%))";
  const stroke = bullish ? "var(--bull, #16a34a)" : "var(--bear, #dc2626)";
  const last = samples[samples.length - 1];
  const lastX = (last.t - xmin) / xr * (w - 6) + 3;
  const lastY = h - 4 - (last.p - ymin) / yr * (h - 8);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: `0 0 ${w} ${h}`, className: "w-full", style: { height }, preserveAspectRatio: "none", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "polyline",
      {
        fill: "none",
        stroke,
        strokeWidth: 1.6,
        strokeLinejoin: "round",
        strokeLinecap: "round",
        points: pts
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: lastX, cy: lastY, r: 3, fill: stroke }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("circle", { cx: lastX, cy: lastY, r: 6, fill: color, opacity: 0.25, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("animate", { attributeName: "r", values: "3;9;3", dur: "1.6s", repeatCount: "indefinite" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("animate", { attributeName: "opacity", values: "0.4;0;0.4", dur: "1.6s", repeatCount: "indefinite" })
    ] })
  ] });
}
function MarketBadge({ open }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "span",
    {
      className: `inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${open ? "bg-bull/15 text-bull" : "bg-muted text-muted-foreground"}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `relative inline-flex h-2 w-2 rounded-full ${open ? "bg-bull" : "bg-muted-foreground"}`, children: open && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute inset-0 animate-ping rounded-full bg-bull/70" }) }),
        open ? "السوق مفتوح" : "السوق مغلق"
      ]
    }
  );
}
function LivePriceCard({
  symbol,
  quote,
  entry,
  marketOpen,
  size = "lg"
}) {
  const [, force] = reactExports.useState(0);
  const buf = reactExports.useRef(HISTORY.get(symbol) ?? []);
  reactExports.useEffect(() => {
    buf.current = pushSample(symbol, quote);
    force((n) => n + 1);
  }, [symbol, quote?.fetchedAt, quote?.price]);
  const price = quote?.price ?? 0;
  const dayPct = quote?.change_pct ?? 0;
  const dayDelta = quote && quote.open > 0 ? quote.price - quote.open : 0;
  const pnlPct = entry && entry > 0 && price > 0 ? (price - entry) / entry * 100 : null;
  const bullish = (pnlPct ?? dayPct) >= 0;
  const big = size === "lg";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `rounded-2xl border bg-card ${big ? "p-4" : "p-3"} ${bullish ? "border-bull/40" : "border-bear/40"}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground", children: "سعر آخر تداول" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-0.5 flex items-baseline gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: `tabular-nums ${big ? "text-3xl" : "text-xl"}`, children: fmt(price) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "ج.م" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: `mt-1 flex items-center gap-1 text-xs font-bold tabular-nums ${dayPct >= 0 ? "text-bull" : "text-bear"}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: dayPct >= 0 ? "↗" : "↘" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                    "(",
                    dayPct >= 0 ? "+" : "",
                    fmt(dayPct, 2),
                    "%)"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
                    fmt(Math.abs(dayDelta), 2),
                    " ج.م"
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-end", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MarketBadge, { open: marketOpen }),
            pnlPct != null && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: `mt-2 rounded-md px-2 py-0.5 text-[11px] font-bold tabular-nums ${pnlPct >= 0 ? "bg-bull/15 text-bull" : "bg-bear/15 text-bear"}`,
                title: "ربح/خسارة من سعر الدخول",
                children: [
                  "vs دخول ",
                  pnlPct >= 0 ? "+" : "",
                  fmt(pnlPct, 2),
                  "%"
                ]
              }
            ),
            quote?.fetchedAt && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-[10px] tabular-nums text-muted-foreground", children: new Date(quote.fetchedAt).toLocaleTimeString("ar-EG", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit"
            }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkline, { samples: buf.current, bullish, height: big ? 64 : 40 }) }),
        quote && quote.high > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex justify-between text-[10px] text-muted-foreground tabular-nums", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "أقل ",
            fmt(quote.low)
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "فتح ",
            fmt(quote.open)
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "أعلى ",
            fmt(quote.high)
          ] })
        ] })
      ]
    }
  );
}
export {
  LivePriceCard as L,
  MarketBadge as M
};
