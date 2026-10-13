import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { computeMarketBreadth } from "@/lib/market-data/breadth.server";

/**
 * End-of-Day Learn — ingests EVERYTHING about every sharia stock today
 * into `daily_intelligence` so the weekly learner can study patterns.
 * Runs daily at 16:30 Cairo Sun-Thu. Also backfills yesterday's
 * next_day_return_pct field for supervised learning.
 */

type Tick = { price: number; volume: number | null; ts: string };

export const Route = createFileRoute("/api/public/hooks/eod-learn")({
  server: {
    handlers: {
      POST: async () => {
        const cairoNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
        const dow = cairoNow.getDay();
        if (dow < 0 || dow > 4) return Response.json({ ok: true, skipped: "non_trading_day" });

        const today = cairoNow.toISOString().slice(0, 10);
        const dayStartIso = new Date(`${today}T07:00:00Z`).toISOString();
        const dayEndIso = new Date(`${today}T13:00:00Z`).toISOString();

        // 1) Universe
        const { data: stocks } = await supabaseAdmin
          .from("stocks").select("symbol, name_ar")
          .eq("is_sharia", true).eq("is_active", true);
        const universe = stocks ?? [];
        if (!universe.length) return Response.json({ ok: false, error: "no_universe" });
        const symbols = universe.map((s) => s.symbol);
        const nameMap = new Map(universe.map((s) => [s.symbol, s.name_ar ?? s.symbol] as const));

        // 2) Parallel data fetch
        const [breadth, ticksRes, candlesRes, snapsRes, picksRes, newsRes, marketRes, prevCandlesRes] = await Promise.all([
          computeMarketBreadth().catch(() => null as number | null),
          supabaseAdmin.from("live_ticks").select("symbol, price, volume, ts")
            .gte("ts", dayStartIso).lte("ts", dayEndIso).in("symbol", symbols),
          supabaseAdmin.from("daily_candles")
            .select("symbol, open, high, low, close, volume, date")
            .eq("date", today).in("symbol", symbols),
          supabaseAdmin.from("stock_snapshots")
            .select("symbol, rsi14, macd, macd_hist, ema9, ema21, sma50, atr14, vol_ratio, composite_score, ts")
            .gte("ts", dayStartIso).in("symbol", symbols)
            .order("ts", { ascending: false }),
          supabaseAdmin.from("daily_picks")
            .select("symbol, confidence, reasons, status, pnl_pct").eq("pick_date", today),
          supabaseAdmin.from("news_sentiment")
            .select("symbol, sentiment_score, impact_level")
            .gte("published_at", dayStartIso).in("symbol", symbols),
          supabaseAdmin.from("market_snapshots")
            .select("change_pct, trend, regime").eq("date", today)
            .order("created_at", { ascending: false }).limit(1).maybeSingle(),
          supabaseAdmin.from("daily_candles")
            .select("symbol, close").lt("date", today).in("symbol", symbols)
            .order("date", { ascending: false }),
        ]);

        const ticksBySym = new Map<string, Tick[]>();
        for (const t of (ticksRes.data ?? []) as Tick[] & { symbol: string }[]) {
          const arr = ticksBySym.get((t as Tick & { symbol: string }).symbol) ?? [];
          arr.push({ price: Number((t as Tick).price), volume: (t as Tick).volume, ts: (t as Tick).ts });
          ticksBySym.set((t as Tick & { symbol: string }).symbol, arr);
        }
        const candleBySym = new Map((candlesRes.data ?? []).map((c) => [c.symbol, c] as const));
        const snapBySym = new Map<string, Record<string, unknown>>();
        for (const s of snapsRes.data ?? []) if (!snapBySym.has(s.symbol)) snapBySym.set(s.symbol, s as Record<string, unknown>);
        const pickBySym = new Map((picksRes.data ?? []).map((p) => [p.symbol, p] as const));
        const prevCloseBySym = new Map<string, number>();
        for (const c of prevCandlesRes.data ?? []) if (!prevCloseBySym.has(c.symbol)) prevCloseBySym.set(c.symbol, Number(c.close));

        const newsAgg = new Map<string, { count: number; sumScore: number; highImpact: number }>();
        for (const n of newsRes.data ?? []) {
          const a = newsAgg.get(n.symbol) ?? { count: 0, sumScore: 0, highImpact: 0 };
          a.count++;
          a.sumScore += Number(n.sentiment_score ?? 0);
          if (n.impact_level === "high") a.highImpact++;
          newsAgg.set(n.symbol, a);
        }

        const market = marketRes.data as null | { change_pct?: number; trend?: string; regime?: string };

        // 3) Build rows
        const rows = universe.map((s) => {
          const sym = s.symbol;
          const ticks = ticksBySym.get(sym) ?? [];
          const candle = candleBySym.get(sym);
          const snap = snapBySym.get(sym) ?? null;
          const pick = pickBySym.get(sym);
          const news = newsAgg.get(sym);
          const prevClose = prevCloseBySym.get(sym) ?? null;

          let iFirst = null as number | null, iLast = null as number | null;
          let iHigh = -Infinity, iLow = Infinity, iVol = 0;
          let maxUp = 0, maxDown = 0;
          if (ticks.length) {
            iFirst = ticks[0].price; iLast = ticks[ticks.length - 1].price;
            for (const t of ticks) {
              if (t.price > iHigh) iHigh = t.price;
              if (t.price < iLow) iLow = t.price;
              if (t.volume) iVol += t.volume;
              if (iFirst) {
                const pct = ((t.price - iFirst) / iFirst) * 100;
                if (pct > maxUp) maxUp = pct;
                if (pct < maxDown) maxDown = pct;
              }
            }
          }

          const close = candle ? Number(candle.close) : iLast;
          const changePct = close != null && prevClose ? ((close - prevClose) / prevClose) * 100 : null;

          return {
            trade_date: today,
            symbol: sym,
            name_ar: nameMap.get(sym) ?? null,
            open: candle ? Number(candle.open) : iFirst,
            high: candle ? Number(candle.high) : (iHigh === -Infinity ? null : iHigh),
            low: candle ? Number(candle.low) : (iLow === Infinity ? null : iLow),
            close,
            volume: candle ? Number(candle.volume) : null,
            change_pct: changePct,
            prev_close: prevClose,
            intraday_first: iFirst,
            intraday_last: iLast,
            intraday_high: iHigh === -Infinity ? null : iHigh,
            intraday_low: iLow === Infinity ? null : iLow,
            intraday_tick_count: ticks.length,
            intraday_max_drawup_pct: maxUp,
            intraday_max_drawdown_pct: maxDown,
            intraday_volume: iVol || null,
            rsi14: snap ? Number(snap.rsi14 ?? null) : null,
            macd: snap ? Number(snap.macd ?? null) : null,
            macd_hist: snap ? Number(snap.macd_hist ?? null) : null,
            ema9: snap ? Number(snap.ema9 ?? null) : null,
            ema21: snap ? Number(snap.ema21 ?? null) : null,
            sma50: snap ? Number(snap.sma50 ?? null) : null,
            atr14: snap ? Number(snap.atr14 ?? null) : null,
            vol_ratio: snap ? Number(snap.vol_ratio ?? null) : null,
            composite_score: snap ? Number(snap.composite_score ?? null) : null,
            breadth_pct: breadth,
            market_trend: market?.trend ?? null,
            market_regime: market?.regime ?? null,
            egx30_change_pct: market ? Number(market.change_pct ?? null) : null,
            news_count: news?.count ?? 0,
            news_sentiment_avg: news && news.count ? news.sumScore / news.count : null,
            news_high_impact_count: news?.highImpact ?? 0,
            was_picked: !!pick,
            was_candidate: maxUp >= 2,
            pick_confidence: pick ? Number(pick.confidence) : null,
            pick_reasons: (pick?.reasons ?? null) as never,
            pick_outcome: pick?.status ?? null,
            pick_pnl_pct: pick?.pnl_pct != null ? Number(pick.pnl_pct) : null,
          };
        });

        // 4) Upsert
        const { error: upErr } = await supabaseAdmin
          .from("daily_intelligence")
          .upsert(rows as never, { onConflict: "trade_date,symbol" });

        // 5) Backfill yesterday's next_day_return_pct
        const y = new Date(cairoNow); y.setDate(y.getDate() - 1);
        // Walk back to last trading day (skip Fri/Sat → dow 5,6)
        while (y.getDay() === 5 || y.getDay() === 6) y.setDate(y.getDate() - 1);
        const ydayISO = y.toISOString().slice(0, 10);
        const { data: ydayRows } = await supabaseAdmin
          .from("daily_intelligence").select("symbol, close").eq("trade_date", ydayISO);

        let labelsFilled = 0;
        if (ydayRows?.length) {
          const todayCloseBySym = new Map(rows.map((r) => [r.symbol, r.close] as const));
          for (const yrow of ydayRows) {
            const yClose = Number(yrow.close);
            const tClose = todayCloseBySym.get(yrow.symbol);
            if (!yClose || tClose == null) continue;
            const nextRet = ((tClose - yClose) / yClose) * 100;
            await supabaseAdmin.from("daily_intelligence")
              .update({ next_day_return_pct: nextRet })
              .eq("trade_date", ydayISO).eq("symbol", yrow.symbol);
            labelsFilled++;
          }
        }

        return Response.json({
          ok: !upErr,
          error: upErr?.message ?? null,
          trade_date: today,
          rows_upserted: rows.length,
          breadth_pct: breadth,
          labels_backfilled: labelsFilled,
          ticks_total: (ticksRes.data ?? []).length,
          news_total: (newsRes.data ?? []).length,
        });
      },
    },
  },
});