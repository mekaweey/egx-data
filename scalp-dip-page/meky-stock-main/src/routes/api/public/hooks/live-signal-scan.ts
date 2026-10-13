import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { computeMarketBreadth } from "@/lib/market-data/breadth.server";
import { notifyNewPick } from "@/lib/notifications/pick-alerts.server";

/**
 * Live intraday signal scanner — runs every 2 minutes from 10:00 to 14:30
 * Cairo. Reads the freshest tick per sharia stock from `live_ticks` and
 * fires a breakout rule: price ≥ +2% vs today's first tick with no existing
 * open pick. Each new signal is written to daily_picks (source=live_intraday)
 * and pushed to Telegram + realtime UI. De-duped by `daily_picks` UPSERT on
 * (symbol, pick_date).
 */

type Tick = { symbol: string; price: number; volume: number | null; ts: string };

export const Route = createFileRoute("/api/public/hooks/live-signal-scan")({
  server: {
    handlers: {
      POST: async () => {
        // Cairo session gate
        const cairoNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
        const dow = cairoNow.getDay();
        const hh = cairoNow.getHours();
        const mm = cairoNow.getMinutes();
        const inSession = dow >= 0 && dow <= 4 && hh >= 10 && (hh < 14 || (hh === 14 && mm <= 30));
        if (!inSession) {
          return Response.json({ ok: true, skipped: "out_of_session" });
        }

        // Breadth gate (V2.2)
        const breadth = await computeMarketBreadth().catch(() => null);
        if (breadth != null && breadth < 40) {
          return Response.json({ ok: true, skipped: "weak_breadth", breadth });
        }

        const today = cairoNow.toISOString().slice(0, 10);
        const dayStart = new Date(`${today}T07:00:00Z`).toISOString(); // ~10:00 Cairo UTC

        // Pull today's ticks
        const { data: rows } = await supabaseAdmin
          .from("live_ticks")
          .select("symbol, price, volume, ts")
          .gte("ts", dayStart)
          .order("ts", { ascending: true });

        const ticks = (rows ?? []) as Tick[];
        if (!ticks.length) {
          return Response.json({ ok: true, ticks: 0 });
        }

        // Build first + last tick per symbol
        const firstBySym = new Map<string, Tick>();
        const lastBySym = new Map<string, Tick>();
        const volSumBySym = new Map<string, number>();
        for (const t of ticks) {
          if (!firstBySym.has(t.symbol)) firstBySym.set(t.symbol, t);
          lastBySym.set(t.symbol, t);
          if (t.volume) volSumBySym.set(t.symbol, (volSumBySym.get(t.symbol) ?? 0) + Number(t.volume));
        }

        // Sharia universe
        const { data: stocks } = await supabaseAdmin
          .from("stocks")
          .select("symbol, name_ar")
          .eq("is_sharia", true)
          .eq("is_active", true);
        const sharia = new Map((stocks ?? []).map((s) => [s.symbol, s.name_ar ?? s.symbol]));

        // Existing pick today (UNIQUE per pick_date → at most one row)
        const { data: existing } = await supabaseAdmin
          .from("daily_picks")
          .select("id, symbol, score, entry_price, status")
          .eq("pick_date", today)
          .maybeSingle();

        // Find candidates: ≥ +2% intraday with positive last vs first
        type Candidate = { symbol: string; name_ar: string; open: number; last: number; pct: number };
        const candidates: Candidate[] = [];
        for (const [sym, first] of firstBySym) {
          if (!sharia.has(sym)) continue;
          if (existing && existing.symbol === sym) continue; // skip same symbol
          const last = lastBySym.get(sym)!;
          if (!first.price || !last.price) continue;
          const pct = ((last.price - first.price) / first.price) * 100;
          if (pct < 2) continue;
          candidates.push({
            symbol: sym,
            name_ar: sharia.get(sym)!,
            open: first.price,
            last: last.price,
            pct,
          });
        }

        candidates.sort((a, b) => b.pct - a.pct);

        // Boost score with fresh news sentiment (last 6h) for top candidates
        if (candidates.length > 0) {
          const since = new Date(Date.now() - 6 * 3600 * 1000).toISOString();
          const topSymbols = candidates.slice(0, 10).map((c) => c.symbol);
          const { data: news } = await supabaseAdmin
            .from("news_sentiment")
            .select("symbol, sentiment_score, impact_level, headline, published_at")
            .in("symbol", topSymbols)
            .gte("published_at", since)
            .order("published_at", { ascending: false });

          const newsBySym = new Map<string, { score: number; impact: string; headline: string }>();
          for (const n of news ?? []) {
            if (!newsBySym.has(n.symbol)) {
              newsBySym.set(n.symbol, {
                score: Number(n.sentiment_score) || 0,
                impact: n.impact_level ?? "low",
                headline: n.headline ?? "",
              });
            }
          }

          for (const c of candidates) {
            const n = newsBySym.get(c.symbol);
            if (!n) continue;
            const impactMult = n.impact === "high" ? 1.5 : n.impact === "medium" ? 1 : 0.5;
            const boost = n.score * impactMult; // -1..+1.5 → pp added to score
            (c as Candidate & { news_boost?: number; news_headline?: string }).news_boost = boost;
            (c as Candidate & { news_boost?: number; news_headline?: string }).news_headline = n.headline;
            c.pct += boost;
          }
          candidates.sort((a, b) => b.pct - a.pct);
        }

        const top = candidates[0] as (Candidate & { news_boost?: number; news_headline?: string }) | undefined;

        // No new candidate → nothing to do
        if (!top) {
          return Response.json({ ok: true, breadth, ticks: ticks.length, candidates: 0, action: "none" });
        }

        const target = +(top.last * 1.05).toFixed(2);
        const stop = +(top.last * 0.98).toFixed(2);
        const confidence = Math.min(85, 60 + top.pct * 5);
        const reasons = [
          `breakout لحظي +${top.pct.toFixed(2)}% من فتح اليوم`,
          `حجم تراكمي: ${(volSumBySym.get(top.symbol) ?? 0).toLocaleString("en-US")}`,
          `breadth: ${breadth?.toFixed(1) ?? "N/A"}%`,
        ];
        if (top.news_headline) {
          reasons.push(`📰 خبر: ${top.news_headline.slice(0, 80)} (تأثير ${top.news_boost?.toFixed(2)})`);
        }
        const payload = {
          pick_date: today,
          symbol: top.symbol,
          name_ar: top.name_ar,
          entry_price: top.last,
          target_price: target,
          stop_price: stop,
          target_pct: 5,
          stop_pct: 2,
          max_hold_days: 5,
          confidence,
          kelly_pct: 0,
          score: top.pct,
          reasons: reasons as never,
          status: "open",
        };

        let action: "inserted" | "upgraded" | "kept" = "kept";

        if (!existing) {
          const { error } = await supabaseAdmin.from("daily_picks").insert(payload);
          if (error) {
            console.error("[live-signal-scan] insert failed", top.symbol, error.message);
          } else {
            action = "inserted";
          }
        } else {
          // Upgrade only if meaningfully better (score = intraday pct)
          const currentScore = Number(existing.score ?? 0);
          const UPGRADE_MARGIN = 2; // +2pp better
          if (top.pct >= currentScore + UPGRADE_MARGIN && existing.status === "open") {
            const { error } = await supabaseAdmin
              .from("daily_picks")
              .update({ ...payload, reasons: [...reasons, `ترقية من ${existing.symbol} (score ${currentScore.toFixed(2)} → ${top.pct.toFixed(2)})`] as never })
              .eq("id", existing.id);
            if (error) {
              console.error("[live-signal-scan] upgrade failed", top.symbol, error.message);
            } else {
              action = "upgraded";
            }
          }
        }

        if (action !== "kept") {
          await notifyNewPick({
            pick_date: today,
            symbol: top.symbol,
            name_ar: top.name_ar,
            entry: top.last,
            target,
            stop,
            confidence,
            reasons: action === "upgraded"
              ? [`ترقية: السهم ده أقوى من الترشيح الحالي`, `breakout +${top.pct.toFixed(2)}%`]
              : [`breakout لحظي +${top.pct.toFixed(2)}%`, `breadth ${breadth?.toFixed(1) ?? "N/A"}%`],
            source: "today",
          }).catch((e) => console.error("[live-signal-scan] notify failed", e));
        }

        return Response.json({
          ok: true,
          breadth,
          ticks: ticks.length,
          candidates: candidates.length,
          action,
          top: { symbol: top.symbol, pct: +top.pct.toFixed(2) },
          existing: existing ? { symbol: existing.symbol, score: Number(existing.score) } : null,
        });
      },
    },
  },
});