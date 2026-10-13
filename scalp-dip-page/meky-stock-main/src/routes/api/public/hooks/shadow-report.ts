import { createFileRoute } from "@tanstack/react-router";

/**
 * Shadow Report — يقيّم قرارات Smart Exit بمقارنتها بحركة السعر الفعلية بعدها.
 *
 * لكل قرار في smart_exit_log:
 *  - نجيب live_ticks للسهم من لحظة القرار إلى +30 دقيقة
 *  - نحسب: min/max بعد القرار، أسعار عند +5د / +15د / +30د
 *  - نصنّف: correct / wrong / neutral حسب نوع القرار
 *
 * تصنيف HARD_FLOOR & VOLUME_DEATH (خروج):
 *   - correct: max_15m ≤ exit_price * 1.003 (السعر ما اتعافاش) — الخروج كان في محله
 *   - wrong:   max_15m ≥ exit_price * 1.008 (السعر ارتفع +0.8%) — خرجنا بدري
 *   - neutral: بين الاثنين
 *
 * تصنيف PREBUY_VOLUME_FILTER (تجاهل إشارة):
 *   - correct: max_30m < skip_price * 1.015 (ما وصلش لـ TP) — كويس تجاهلنا
 *   - wrong:   وصل لـ skip_price * 1.02 (TP فعلي) قبل ما ينزل -0.4%
 *   - neutral: باقي الحالات
 */
export const Route = createFileRoute("/api/public/hooks/shadow-report")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const url = new URL(request.url);
        const days = Math.max(1, Math.min(30, Number(url.searchParams.get("days") ?? 7)));
        const since = new Date(Date.now() - days * 86400_000).toISOString();

        const { data: logs } = await supabaseAdmin
          .from("smart_exit_log")
          .select("id,ts,symbol,rule,action,shadow,price,entry_price,pnl_pct,seconds_since_entry,mw_trades_5m,mw_volume_5m")
          .gte("ts", since)
          .order("ts", { ascending: false })
          .limit(500);

        const decisions = logs ?? [];
        const evaluated: Array<Record<string, unknown>> = [];

        for (const d of decisions) {
          const refPrice = Number(d.price ?? 0);
          if (!refPrice || !d.ts) {
            evaluated.push({ ...d, verdict: "no_price" });
            continue;
          }
          const t0 = new Date(d.ts).getTime();
          const t30 = new Date(t0 + 30 * 60_000).toISOString();

          const { data: ticks } = await supabaseAdmin
            .from("live_ticks")
            .select("price,ts")
            .eq("symbol", d.symbol)
            .gte("ts", d.ts)
            .lte("ts", t30)
            .order("ts", { ascending: true });

          const rows = (ticks ?? []).map((t) => ({
            p: Number(t.price),
            dt: (new Date(t.ts).getTime() - t0) / 1000,
          }));

          if (rows.length === 0) {
            evaluated.push({ ...d, verdict: "no_ticks", ticks_count: 0 });
            continue;
          }

          let minP = rows[0].p;
          let maxP = rows[0].p;
          let minPBefore15m = rows[0].p;
          let maxPBefore15m = rows[0].p;
          let p5m: number | null = null;
          let p15m: number | null = null;
          let p30m: number | null = null;
          let hitTP = false;
          let hitSL = false;
          const tpLine = refPrice * 1.02;
          const slLine = refPrice * 0.996;
          let firstHit: "TP" | "SL" | null = null;

          for (const r of rows) {
            if (r.p < minP) minP = r.p;
            if (r.p > maxP) maxP = r.p;
            if (r.dt <= 900) {
              if (r.p < minPBefore15m) minPBefore15m = r.p;
              if (r.p > maxPBefore15m) maxPBefore15m = r.p;
            }
            if (p5m == null && r.dt >= 300) p5m = r.p;
            if (p15m == null && r.dt >= 900) p15m = r.p;
            if (p30m == null && r.dt >= 1800) p30m = r.p;
            if (!firstHit) {
              if (r.p >= tpLine) { firstHit = "TP"; hitTP = true; }
              else if (r.p <= slLine) { firstHit = "SL"; hitSL = true; }
            }
          }

          let verdict: "correct" | "wrong" | "neutral" = "neutral";
          let wouldHaveBeenPnlPct: number | null = null;

          if (d.rule === "PREBUY_VOLUME_FILTER") {
            // تجاهلنا إشارة شراء — نقيس هل كنا هنكسب لو دخلنا
            if (firstHit === "TP") verdict = "wrong";
            else if (maxP < refPrice * 1.015) verdict = "correct";
            else verdict = "neutral";
            wouldHaveBeenPnlPct = ((maxP - refPrice) / refPrice) * 100;
          } else {
            // خروج (HARD_FLOOR / VOLUME_DEATH / MOMENTUM_FADE / …)
            const recoverPct = ((maxPBefore15m - refPrice) / refPrice) * 100;
            if (recoverPct >= 0.8) verdict = "wrong";
            else if (recoverPct <= 0.3) verdict = "correct";
            else verdict = "neutral";
            wouldHaveBeenPnlPct = ((maxPBefore15m - refPrice) / refPrice) * 100;
          }

          evaluated.push({
            ...d,
            verdict,
            ticks_count: rows.length,
            min_after: minP,
            max_after: maxP,
            max_15m: maxPBefore15m,
            min_15m: minPBefore15m,
            p_5m: p5m,
            p_15m: p15m,
            p_30m: p30m,
            recover_pct: ((maxPBefore15m - refPrice) / refPrice) * 100,
            would_have_pnl_pct: wouldHaveBeenPnlPct,
            first_hit: firstHit,
          });
        }

        // ملخص لكل قاعدة
        const byRule = new Map<string, {
          rule: string;
          total: number;
          correct: number;
          wrong: number;
          neutral: number;
          no_ticks: number;
          shadow: number;
          live: number;
        }>();
        for (const e of evaluated) {
          const rule = String(e.rule);
          if (!byRule.has(rule)) {
            byRule.set(rule, { rule, total: 0, correct: 0, wrong: 0, neutral: 0, no_ticks: 0, shadow: 0, live: 0 });
          }
          const b = byRule.get(rule)!;
          b.total++;
          if (e.verdict === "correct") b.correct++;
          else if (e.verdict === "wrong") b.wrong++;
          else if (e.verdict === "neutral") b.neutral++;
          else if (e.verdict === "no_ticks" || e.verdict === "no_price") b.no_ticks++;
          if (e.shadow) b.shadow++; else b.live++;
        }
        const summary = [...byRule.values()].map((b) => ({
          ...b,
          accuracy_pct:
            b.total - b.no_ticks - b.neutral > 0
              ? Math.round((b.correct / (b.total - b.no_ticks - b.neutral)) * 1000) / 10
              : null,
        }));

        return Response.json({
          ok: true,
          window_days: days,
          since,
          total_decisions: decisions.length,
          summary,
          decisions: evaluated,
        });
      },
    },
  },
});
