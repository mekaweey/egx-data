import { createFileRoute } from "@tanstack/react-router";

/**
 * فحص صحة تدفق marketwatch من الإكستنشن.
 * يرجع: آخر captured_at، عدد الصفوف والرموز في آخر 60ث/5د،
 * كام سهم فيهم volume > 0، وقائمة أي رموز ناقصة من الـ 107.
 */
export const Route = createFileRoute("/api/public/hooks/marketwatch-health")({
  server: {
    handlers: {
            GET: async () => {
        const { supabaseAdmin: _supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const supabaseAdmin = _supabaseAdmin as any;
        const now = new Date();
        const healthWindowMs = 150_000;
        const t60 = new Date(now.getTime() - healthWindowMs).toISOString();
        // Same 15-minute window for ALL sources in the union metric (fair, no source gets an inflated window)
        const COV_WINDOW_MS = 15 * 60_000;
        const tCov = new Date(now.getTime() - COV_WINDOW_MS).toISOString();
        const t5m = new Date(now.getTime() - 5 * 60_000).toISOString();
        const todayStr = new Date().toISOString().slice(0, 10);

        // Step 1: Get latest captured_at (needed for dependent queries)
        const { data: latestRow } = await supabaseAdmin
          .from("marketwatch_snapshots")
          .select("captured_at")
          .order("captured_at", { ascending: false })
          .limit(1);
        const lastCaptured = latestRow?.[0]?.captured_at ?? null;

        const ageSec = lastCaptured
          ? Math.round((now.getTime() - new Date(lastCaptured).getTime()) / 1000)
          : null;

        // Step 2: Run all independent queries in parallel
        const [
          rawScanRes,
          last60Res,
          rows5mRes,
          liveTickLatestRes,
          liveTicks60Res,
          orderbookLatestRes,
          orderbookRowsRes,
          quoteLatestRes,
          quoteRowsRes,
          shariaStocksRes,
          tvLatestRes,
          tv60Res,
          flagsRowsRes,
          recentLogRes,
          todayLogRes,
          coverageMwRes,
          coverageQuotesRes,
          coverageTicksRes,
        ] = await Promise.all([
          // Raw scan symbols from latest snapshot
          lastCaptured
            ? supabaseAdmin
                .from("marketwatch_snapshots")
                .select("symbol")
                .eq("captured_at", lastCaptured)
            : { data: [] },
          // Full marketwatch data from latest snapshot
          lastCaptured
            ? supabaseAdmin
                .from("marketwatch_snapshots")
                .select("symbol,total_volume,total_trades,last_price,is_same_day,captured_at,highest_bid,lowest_ask,total_bids,total_asks")
                .eq("captured_at", lastCaptured)
            : { data: [] },
          // Count rows from last 5 min
          supabaseAdmin
            .from("marketwatch_snapshots")
            .select("*", { count: "exact", head: true })
            .gte("captured_at", t5m),
          // Last live tick
          supabaseAdmin
            .from("live_ticks")
            .select("ts")
            .order("ts", { ascending: false })
            .limit(1),
          // Live ticks from last 60s
          supabaseAdmin
            .from("live_ticks")
            .select("symbol,price,volume,ts")
            .gte("ts", t60),
          // Latest orderbook
          supabaseAdmin
            .from("orderbook_snapshots")
            .select("ts,symbol,best_bid,best_ask")
            .order("ts", { ascending: false })
            .limit(1),
          // Orderbook rows from last 60s
          supabaseAdmin
            .from("orderbook_snapshots")
            .select("symbol,best_bid,best_ask,ts")
            .gte("ts", t60),
          // Latest quote
          supabaseAdmin
            .from("live_quotes")
            .select("ts,symbol,bid,ask")
            .order("ts", { ascending: false })
            .limit(1),
          // Quote rows from last 60s
          supabaseAdmin
            .from("live_quotes")
            .select("symbol,bid,ask,ts")
            .gte("ts", t60),
          // Sharia stocks universe
          supabaseAdmin
            .from("stocks")
            .select("symbol")
            .eq("is_sharia", true)
            .eq("is_active", true),
          // TV bridge (server-side, no machine needed) — newest tick + last-60s symbols
          supabaseAdmin
            .from("tv_ticks")
            .select("ts")
            .order("ts", { ascending: false })
            .limit(1),
          supabaseAdmin
            .from("tv_ticks")
            .select("symbol,price,ts")
            .gte("ts", t60),
          // Smart exit flags
          supabaseAdmin
            .from("strategy_settings")
            .select("key,enabled")
            .in("key", [
              "scalp-dip-smart-exit",
              "scalp-dip-smart-exit-shadow",
              "scalp-dip-prebuy-volume-filter",
            ]),
          // Recent smart exit log
          supabaseAdmin
            .from("smart_exit_log")
            .select("ts,symbol,rule,action,shadow,price,pnl_pct,seconds_since_entry,mw_trades_5m,mw_volume_5m")
            .order("ts", { ascending: false })
            .limit(15),
          // Today's smart exit counts
          supabaseAdmin
            .from("smart_exit_log")
            .select("rule,action")
            .eq("trade_date", todayStr),
          // True live-price coverage: every source that actually delivers fresh prices
          supabaseAdmin
            .from("marketwatch_snapshots")
            .select("symbol,captured_at")
            .gte("captured_at", tCov),
          supabaseAdmin
            .from("live_quotes")
            .select("symbol,ts")
            .gte("ts", tCov),
          supabaseAdmin
            .from("live_ticks")
            .select("symbol,ts")
            .gte("ts", tCov),
        ]);

        // Extract results
        const rawScanRows = (rawScanRes.data ?? []) as { symbol?: string }[];
        const rawScanCount = new Set(rawScanRows.map(r => r.symbol)).size;
        const last60 = last60Res.data ?? [];
        const { count: rows5m } = rows5mRes;
        const lastLiveTick = liveTickLatestRes.data?.[0]?.ts ?? null;
        const liveTickAgeSec = lastLiveTick
          ? Math.round((now.getTime() - new Date(lastLiveTick).getTime()) / 1000)
          : null;
        const liveTicks60 = liveTicks60Res.data ?? [];
        const liveTickSymbols = new Set<string>();
        const liveTickPriceSymbols = new Set<string>();
        const liveTickVolumeSymbols = new Set<string>();
        for (const r of liveTicks60 ?? []) {
          liveTickSymbols.add(String(r.symbol || "").toUpperCase());
          if ((r.price ?? 0) > 0) liveTickPriceSymbols.add(String(r.symbol || "").toUpperCase());
          if ((r.volume ?? 0) > 0) liveTickVolumeSymbols.add(String(r.symbol || "").toUpperCase());
        }

        // Union live-price coverage across all real sources (marketwatch is primary)
        const covMw = new Set<string>();
        for (const r of coverageMwRes.data ?? []) covMw.add(String(r.symbol || "").toUpperCase());
        const covQ = new Set<string>();
        for (const r of coverageQuotesRes.data ?? []) covQ.add(String(r.symbol || "").toUpperCase());
        const covT = new Set<string>();
        let covTickLatestMs = 0;
        for (const r of coverageTicksRes.data ?? []) {
          covT.add(String(r.symbol || "").toUpperCase());
          const ms = new Date(r.ts as string).getTime();
          if (Number.isFinite(ms) && ms > covTickLatestMs) covTickLatestMs = ms;
        }
        // TV bridge metrics (2026-10-01): the strongest always-on source — must be
        // first-class here, otherwise the page judges freshness by the sparsest feed.
        const tvLastTs = (tvLatestRes.data ?? [])[0]?.ts ?? null;
        const tvAgeSec = tvLastTs ? Math.round((now.getTime() - new Date(tvLastTs).getTime()) / 1000) : null;
        const tvSymbols = new Set<string>();
        for (const r of (tv60Res.data ?? []) as { symbol?: string }[]) {
          const s = String(r.symbol ?? "").toUpperCase();
          if (s) tvSymbols.add(s);
        }
        // freshest price across ALL live sources (ticks + marketwatch + tv bridge)
        const ages = [liveTickAgeSec, ageSec, tvAgeSec].filter((x): x is number => x != null);
        const freshestAgeSec = ages.length ? Math.min(...ages) : null;

        const covAll = new Set<string>([...covMw, ...covQ, ...covT]);
        for (const s of tvSymbols) covAll.add(s);
        let covMwLatestMs = 0;
        for (const r of coverageMwRes.data ?? []) {
          const ms = new Date(r.captured_at as string).getTime();
          if (Number.isFinite(ms) && ms > covMwLatestMs) covMwLatestMs = ms;
        }
        const covAges: number[] = [];
        if (ageSec != null) covAges.push(ageSec);
        if (covMwLatestMs) covAges.push((now.getTime() - covMwLatestMs) / 1000);
        const qLatest = quoteLatestRes.data?.[0]?.ts;
        if (qLatest) covAges.push((now.getTime() - new Date(qLatest).getTime()) / 1000);
        if (covTickLatestMs) covAges.push((now.getTime() - covTickLatestMs) / 1000);
        const livePriceAgeSec = covAges.length ? Math.round(Math.min(...covAges)) : null;

        const symbols = new Set<string>();
        const volumeSymbols = new Set<string>();
        const tradesSymbols = new Set<string>();
        const priceSymbols = new Set<string>();
        const sameDaySymbols = new Set<string>();
        const marketwatchBidSymbols = new Set<string>();
        const marketwatchAskSymbols = new Set<string>();
        const marketwatchBidAskSymbols = new Set<string>();
        for (const r of last60 ?? []) {
          symbols.add(r.symbol);
          if ((r.total_volume ?? 0) > 0) volumeSymbols.add(r.symbol);
          if ((r.total_trades ?? 0) > 0) tradesSymbols.add(r.symbol);
          if ((r.last_price ?? 0) > 0) priceSymbols.add(r.symbol);
          if (r.is_same_day === true) sameDaySymbols.add(r.symbol);
          const hasBid = (r.highest_bid ?? 0) > 0;
          const hasAsk = (r.lowest_ask ?? 0) > 0;
          if (hasBid) marketwatchBidSymbols.add(r.symbol);
          if (hasAsk) marketwatchAskSymbols.add(r.symbol);
          if (hasBid || hasAsk) marketwatchBidAskSymbols.add(r.symbol);
        }

        const { data: orderbookLatest } = await supabaseAdmin
          .from("orderbook_snapshots")
          .select("ts,symbol,best_bid,best_ask")
          .order("ts", { ascending: false })
          .limit(1);
                const lastOrderbook = orderbookLatestRes.data?.[0]?.ts ?? null;
        const orderbookAgeSec = lastOrderbook
          ? Math.round((now.getTime() - new Date(lastOrderbook).getTime()) / 1000)
          : null;
        const orderbookRows = orderbookRowsRes.data ?? [];
        const orderbookSymbols = new Set<string>();
        const orderbookBidSymbols = new Set<string>();
        for (const r of orderbookRows ?? []) {
          const sym = String(r.symbol || "").toUpperCase();
          if (!sym) continue;
          orderbookSymbols.add(sym);
          if ((r.best_bid ?? 0) > 0) orderbookBidSymbols.add(sym);
        }

        const lastQuote = quoteLatestRes.data?.[0]?.ts ?? null;
        const quoteAgeSec = lastQuote
          ? Math.round((now.getTime() - new Date(lastQuote).getTime()) / 1000)
          : null;
                const quoteRows = quoteRowsRes.data ?? [];
        const quoteSymbols = new Set<string>();
        const quoteBidAskSymbols = new Set<string>();
        for (const r of quoteRows ?? []) {
          const sym = String(r.symbol || "").toUpperCase();
          if (!sym) continue;
          quoteSymbols.add(sym);
          if ((r.bid ?? 0) > 0 || (r.ask ?? 0) > 0) quoteBidAskSymbols.add(sym);
        }
        // NOTE (2026-09-17): a previous 'fallback' here merged marketwatch bid/ask
        // symbols into the Firebase badge, which made the Firebase number look
        // healthy when the Firebase feed was actually empty. Removed on purpose:
        // the Firebase metric must show only what the Firebase feed really sends.

        const universe = ((shariaStocksRes.data ?? []) as { symbol?: string }[]).map((s) => String(s.symbol ?? "").toUpperCase());
        const coveredUniverse = universe.filter((s) => symbols.has(s) || tvSymbols.has(s));
        const missing = universe.filter((s) => !symbols.has(s) && !tvSymbols.has(s));

        const expectedRowsPer5m = universe.length * 5; // Thunder marketwatch is passive HTTP, roughly one snapshot / symbol / minute.
        const coveragePct = universe.length > 0
          ? Math.round((coveredUniverse.length / universe.length) * 100)
          : 0;

        // Smart Exit state + recent decisions
        const flagMap = new Map(((flagsRowsRes.data ?? []) as { key?: string; enabled?: boolean }[]).map((r) => [String(r.key), Boolean(r.enabled)]));
        const smartFlags = {
          enabled: flagMap.get("scalp-dip-smart-exit") ?? true,
          shadow: flagMap.get("scalp-dip-smart-exit-shadow") ?? true,
          prebuy: flagMap.get("scalp-dip-prebuy-volume-filter") ?? true,
        };

        const recentLog = recentLogRes.data ?? [];

        const todayCounts = { HARD_FLOOR: 0, VOLUME_DEATH: 0, PREBUY_VOLUME_FILTER: 0 };
        for (const r of todayLogRes.data ?? []) {
          const k = r.rule as keyof typeof todayCounts;
          if (k in todayCounts) todayCounts[k]++;
        }

        const healthWindowSec = Math.round(healthWindowMs / 1000);
        const marketwatchFresh = ageSec != null && ageSec <= healthWindowSec;
        const marketwatchVolumeConfirmed = marketwatchFresh && volumeSymbols.size > 0;
        const marketwatchBidAskConfirmed = marketwatchFresh && marketwatchBidAskSymbols.size > 0;
        // live_ticks is trade/price-event based, not a guaranteed heartbeat.
        // A 15-30s gap can simply mean no price event arrived, while the
        // Thunder marketwatch snapshot still proves live price/volume coverage.
        const priceRecent = liveTickAgeSec != null && liveTickAgeSec <= 90;
        const l2Fresh = orderbookAgeSec != null && orderbookAgeSec <= healthWindowSec && orderbookBidSymbols.size > 0;

        const verdict = (() => {
          if (marketwatchVolumeConfirmed && marketwatchBidAskConfirmed) {
            return `✅ Volume وBid/Ask مؤكدين من marketwatch — ${volumeSymbols.size} سهم volume و${marketwatchBidAskSymbols.size} سهم Bid/Ask في آخر ${healthWindowSec}ث`;
          }
          if (marketwatchVolumeConfirmed && l2Fresh) {
            return `✅ Volume وL2 مؤكدين من ثاندر — ${volumeSymbols.size} سهم عليهم volume و${orderbookSymbols.size} سهم L2 في آخر ${healthWindowSec}ث`;
          }
          if (marketwatchVolumeConfirmed) {
            return priceRecent
              ? `✅ السعر حي والـvolume مؤكد من marketwatch — ${volumeSymbols.size} سهم عليهم volume في آخر ${healthWindowSec}ث`
              : `✅ الـvolume مؤكد من marketwatch — ${volumeSymbols.size} سهم. السعر الحي لم يرسل تحديثات جديدة (${liveTickAgeSec ?? "—"}ث)`;
          }
          if (marketwatchFresh) {
            return "⚠️ marketwatch وصل من ثاندر لكن آخر snapshot لا يحتوي volume مؤكد";
          }
          if (priceRecent) {
            return `⚠️ السعر الحي شغال (${liveTickSymbols.size} سهم/60ث) لكن marketwatch volume لم يصل حتى الآن`;
          }
          if (ageSec == null) return "❌ لا توجد بيانات marketwatch volume مؤكدة حتى الآن";
          return `⚠️ آخر marketwatch من ${ageSec}ث — لا تعتمد عليه للـvolume اللحظي`;
        })();

        return Response.json({
          ok: true,
          raw_scan_count: rawScanCount,
          window_seconds: healthWindowSec,
          now: now.toISOString(),
          last_captured_at: lastCaptured,
          age_seconds: ageSec,
          stale: !marketwatchFresh,
          marketwatch_volume_confirmed: marketwatchVolumeConfirmed,
          live_price_coverage: {
            window_seconds: COV_WINDOW_MS / 1000,
            symbols: covAll.size,
            stocks: [...covAll].filter((s) => !/^(EGX|SHARIAH|EGGOLD|FADG|SPY|QQQ|DIA|EGX35-LV)/.test(s)).length,
            age_seconds: livePriceAgeSec,
            from_marketwatch: covMw.size,
            from_quotes: covQ.size,
            from_ticks: covT.size,
          },
          last_60s: {
            rows: last60?.length ?? 0,
            distinct_symbols: symbols.size,
            with_volume: volumeSymbols.size,
            with_trades: tradesSymbols.size,
            with_price: priceSymbols.size,
            same_day: sameDaySymbols.size,
          },
          last_5m: {
            rows: rows5m ?? 0,
            expected_approx: expectedRowsPer5m,
          },
          tv_bridge: {
            last_ts: tvLastTs,
            age_seconds: tvAgeSec,
            distinct_symbols_60s: tvSymbols.size,
            fresh: tvAgeSec != null && tvAgeSec <= 30,
          },
          freshest_price_age_seconds: freshestAgeSec,
          live_ticks: {
            last_ts: lastLiveTick,
            age_seconds: liveTickAgeSec,
            rows_60s: liveTicks60?.length ?? 0,
            distinct_symbols_60s: liveTickSymbols.size,
            with_price_60s: liveTickPriceSymbols.size,
            with_volume_60s: liveTickVolumeSymbols.size,
            volume_confirmed: liveTickVolumeSymbols.size > 0,
          },
          marketwatch_bid_ask: {
            with_bid: marketwatchBidSymbols.size,
            with_ask: marketwatchAskSymbols.size,
            with_bid_ask: marketwatchBidAskSymbols.size,
          },
          orderbook: {
            last_ts: lastOrderbook,
            age_seconds: orderbookAgeSec,
            rows_window: orderbookRows?.length ?? 0,
            distinct_symbols_window: orderbookSymbols.size,
            with_bid_window: orderbookBidSymbols.size,
          },
          live_quotes: {
            last_ts: lastQuote,
            age_seconds: quoteAgeSec,
            rows_window: quoteRows?.length ?? 0,
            distinct_symbols_window: quoteSymbols.size,
            with_bid_ask_window: quoteBidAskSymbols.size,
          },
          universe: {
            total_sharia: universe.length,
            covered: coveredUniverse.length,
            coverage_pct: coveragePct,
            missing_count: missing.length,
            missing_sample: missing.slice(0, 20),
          },
          smart_exit: {
            flags: smartFlags,
            today_counts: todayCounts,
            recent: recentLog ?? [],
          },
          verdict,
        });
      },
    },
  },
});