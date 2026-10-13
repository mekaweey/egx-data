import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
} as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

function normalize(sym: string) {
  return sym.trim().toUpperCase().replace(/\.(CA|EG|EGX)$/i, "");
}

/**
 * Public read-only: returns the latest strategy recommendation for a symbol
 * plus the freshest live tick, and a verdict telling the user whether the
 * current price is inside the strategy's buy zone.
 *
 * Used by the Thunder extension floating overlay before order review.
 */
export const Route = createFileRoute("/api/public/hooks/strategy-advice")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const rawSymbol = url.searchParams.get("symbol");
        if (!rawSymbol) return json({ ok: false, error: "missing_symbol" }, 400);
        const symbol = normalize(rawSymbol);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const [recoRes, tickRes, sniperRes, scalpRes] = await Promise.all([
          supabaseAdmin
            .from("recommendations")
            .select(
              "symbol,signal,confidence,entry_min,entry_max,target,stop_loss,price_at_reco,rr_ratio,position_size_pct,timeframe_days,reasons_ar,created_at",
            )
            .eq("symbol", symbol)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabaseAdmin
            .from("live_ticks")
            .select("price,source,ts")
            .eq("symbol", symbol)
            .eq("source", "thunder_ext")
            .order("ts", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabaseAdmin
            .from("sniper_picks")
            .select("symbol,entry_price,target_price,stop_price,status,v3_score,created_at")
            .eq("symbol", symbol)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabaseAdmin
            .from("paper_trades")
            .select("symbol,strategy,entry_price,tp_price,sl_price,entry_ts,status")
            .eq("symbol", symbol)
            .in("strategy", ["scalp-mr15-fresh", "scalp-mr15"])
            .order("entry_ts", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        const reco = recoRes.data;
        const tick = tickRes.data;
        const sniper = sniperRes.data;
        const scalp = scalpRes.data as
          | { entry_price: number | string; tp_price: number | string; sl_price: number | string; entry_ts: string; status: string }
          | null;

        // Choose best plan: prefer a FRESH scalp signal (last 3 min, still open) — that's
        // the same plan shown on /scalp-fresh. Else recommendations, else sniper.
        let plan: {
          source: "reco" | "sniper" | "scalp";
          signal: string;
          confidence: number | null;
          buyMin: number | null;
          buyMax: number | null;
          target: number | null;
          stop: number | null;
          createdAt: string;
        } | null = null;

        // Show the Scalp Live signal while the trade is still open
        // (entry/TP/SL exactly as displayed on /scalp & /scalp-fresh).
        const scalpFresh = scalp && scalp.status === "open";

        if (scalpFresh) {
          const e = Number(scalp!.entry_price);
          plan = {
            source: "scalp",
            signal: "buy",
            confidence: null,
            buyMin: e,
            buyMax: e,
            target: Number(scalp!.tp_price),
            stop: Number(scalp!.sl_price),
            createdAt: scalp!.entry_ts,
          };
        } else if (reco) {
          plan = {
            source: "reco",
            signal: reco.signal,
            confidence: reco.confidence ?? null,
            buyMin: reco.entry_min != null ? Number(reco.entry_min) : null,
            buyMax: reco.entry_max != null ? Number(reco.entry_max) : null,
            target: reco.target != null ? Number(reco.target) : null,
            stop: reco.stop_loss != null ? Number(reco.stop_loss) : null,
            createdAt: reco.created_at,
          };
        } else if (sniper) {
          const e = sniper.entry_price != null ? Number(sniper.entry_price) : null;
          plan = {
            source: "sniper",
            signal: "buy",
            confidence: sniper.v3_score != null ? Math.round(Number(sniper.v3_score)) : null,
            buyMin: e,
            buyMax: e,
            target: sniper.target_price != null ? Number(sniper.target_price) : null,
            stop: sniper.stop_price != null ? Number(sniper.stop_price) : null,
            createdAt: sniper.created_at,
          };
        }

        const live = tick
          ? { price: Number(tick.price), source: tick.source, ts: tick.ts, ageSec: Math.round((Date.now() - new Date(tick.ts).getTime()) / 1000) }
          : null;

        // Verdict: is current price safe to buy according to plan?
        let verdict: "safe" | "expensive" | "stop_zone" | "no_plan" | "no_price" = "no_plan";
        let verdictAr = "لا توجد توصية بعد لهذا السهم";
        let upsidePct: number | null = null;
        let downsidePct: number | null = null;

        if (!plan) {
          verdict = "no_plan";
          verdictAr = "لا توجد توصية بعد لهذا السهم — استنى الاستراتيجية تحلله";
        } else if (!live) {
          verdict = "no_price";
          verdictAr = "مفيش سعر لحظي للسهم ده";
        } else {
          const p = live.price;
          if (plan.target) upsidePct = ((plan.target - p) / p) * 100;
          if (plan.stop) downsidePct = ((p - plan.stop) / p) * 100;

          if (plan.stop && p <= plan.stop) {
            verdict = "stop_zone";
            verdictAr = `⛔ السعر ${p} وصل/تحت وقف الخسارة ${plan.stop} — متشتريش`;
          } else if (plan.signal === "sell") {
            verdict = "expensive";
            verdictAr = `⚠️ الاستراتيجية بتقول بيع — متشتريش دلوقتي`;
          } else if (plan.buyMax != null && p > plan.buyMax * 1.005) {
            verdict = "expensive";
            verdictAr = `⚠️ السعر ${p} أعلى من منطقة الشراء (${plan.buyMin}–${plan.buyMax}) — هتشتري غالي`;
          } else if (plan.buyMin != null && plan.buyMax != null && p >= plan.buyMin * 0.995 && p <= plan.buyMax * 1.005) {
            verdict = "safe";
            verdictAr = `✅ السعر ${p} داخل منطقة الشراء (${plan.buyMin}–${plan.buyMax})`;
          } else if (plan.buyMin != null && p < plan.buyMin * 0.995) {
            verdict = "safe";
            verdictAr = `✅ السعر ${p} أقل من منطقة الشراء — فرصة كويسة`;
          } else {
            verdict = plan.signal === "buy" ? "safe" : "expensive";
            verdictAr = plan.signal === "buy" ? `✅ توصية شراء عند ~${p}` : `⚠️ الاستراتيجية مش بتنصح بالشراء دلوقتي`;
          }
        }

        return json({
          ok: true,
          symbol,
          live,
          plan,
          verdict,
          verdictAr,
          upsidePct,
          downsidePct,
          fetchedAt: new Date().toISOString(),
        });
      },
    },
  },
});