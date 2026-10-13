import { createServerFn } from "@tanstack/react-start";

// Comprehensive read-only overview of every extension data pipeline.
// Zero writes, zero side effects on the extension. Aggregates from:
//   - extension_tab_telemetry  (per-tab health, last 10 min)
//   - live_ticks (source=thunder_ext)  (price ticks)
//   - orderbook_snapshots  (L2 snapshots)
//   - thunder_watchlist_snapshots  (watchlist state)
// Plus a live call to /recent-signal-symbols so the page shows exactly
// what the extension is about to open.

export const getExtensionOverview = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const now = Date.now();
  const iso = (ms: number) => new Date(ms).toISOString();
  const since10m = iso(now - 10 * 60_000);
  const since5m = iso(now - 5 * 60_000);
  const since1h = iso(now - 60 * 60_000);

  const [
    tabsRes,
    ticks5mRes,
    ticks1hRes,
    lastTickRes,
    snap5mRes,
    snap1hRes,
    lastSnapRes,
    watchlistRes,
    signalsRes,
  ] = await Promise.all([
    supabaseAdmin
      .from("extension_tab_telemetry")
      .select("ts, client_id, symbol, uuid, uptime_sec, last_l2_fresh, last_l2_age_sec, panel_state, has_trigger, snapshots_sent, last_snapshot_age_sec, last_ensure_age_sec, extras")
      .gte("ts", since10m)
      .order("ts", { ascending: false })
      .limit(2000),
    supabaseAdmin
      .from("live_ticks")
      .select("symbol, ts, price")
      .eq("source", "thunder_ext")
      .gte("ts", since5m)
      .order("ts", { ascending: false })
      .limit(5000),
    supabaseAdmin
      .from("live_ticks")
      .select("symbol", { count: "exact", head: true })
      .eq("source", "thunder_ext")
      .gte("ts", since1h),
    supabaseAdmin
      .from("live_ticks")
      .select("ts, symbol, price")
      .eq("source", "thunder_ext")
      .order("ts", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("orderbook_snapshots")
      .select("symbol, ts, best_bid, best_ask")
      .gte("ts", since5m)
      .order("ts", { ascending: false })
      .limit(2000),
    supabaseAdmin
      .from("orderbook_snapshots")
      .select("symbol", { count: "exact", head: true })
      .gte("ts", since1h),
    supabaseAdmin
      .from("orderbook_snapshots")
      .select("ts, symbol")
      .order("ts", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("thunder_watchlist_snapshots")
      .select("symbol", { count: "exact", head: true })
      .gte("ts", since1h),
    fetch("https://meky-stock.lovable.app/api/public/hooks/recent-signal-symbols")
      .then((r) => r.json())
      .catch(() => ({ ok: false, symbols: [] as string[] })),
  ]);

  // De-dup tabs per (client_id, symbol) — keep newest row.
  const seen = new Map<string, NonNullable<typeof tabsRes.data>[number]>();
  for (const row of tabsRes.data || []) {
    const key = `${row.client_id}::${row.symbol}`;
    if (!seen.has(key)) seen.set(key, row);
  }
  const tabs = Array.from(seen.values());

  // Aggregate ticks per symbol (last 5 min): count + last price + last ts.
  const ticksBySym = new Map<string, { count: number; lastPrice: number | null; lastTs: string }>();
  for (const t of (ticks5mRes.data || []) as Array<{ symbol: string; ts: string; price: number }>) {
    const cur = ticksBySym.get(t.symbol);
    if (!cur) {
      ticksBySym.set(t.symbol, { count: 1, lastPrice: Number(t.price) || null, lastTs: t.ts });
    } else {
      cur.count += 1;
    }
  }

  // Snapshots per symbol (last 5 min).
  const snapsBySym = new Map<string, { count: number; lastTs: string; bid: number | null; ask: number | null }>();
  for (const s of (snap5mRes.data || []) as Array<{ symbol: string; ts: string; best_bid: number | null; best_ask: number | null }>) {
    const cur = snapsBySym.get(s.symbol);
    if (!cur) {
      snapsBySym.set(s.symbol, { count: 1, lastTs: s.ts, bid: s.best_bid, ask: s.best_ask });
    } else {
      cur.count += 1;
    }
  }

  const signalSymbols: string[] = Array.isArray(signalsRes?.symbols) ? signalsRes.symbols : [];
  const openSymbols = new Set(tabs.map((t) => t.symbol));
  const missingSignals = signalSymbols.filter((s) => !openSymbols.has(String(s).toUpperCase()));

  // Cairo market hours check (10:00 - 14:30 Sun–Thu).
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const wd = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hh = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const mm = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4 };
  const isWeekday = wd in dayMap;
  const minutes = hh * 60 + mm;
  const marketOpen = isWeekday && minutes >= 600 && minutes < 870;

  return {
    ok: true as const,
    now: iso(now),
    marketOpen,
    summary: {
      tabsCount: tabs.length,
      ticks5m: (ticks5mRes.data || []).length,
      ticks1h: ticks1hRes.count ?? 0,
      snaps5m: (snap5mRes.data || []).length,
      snaps1h: snap1hRes.count ?? 0,
      watchlist1h: watchlistRes.count ?? 0,
      signalsCount: signalSymbols.length,
      lastTickTs: lastTickRes.data?.ts ?? null,
      lastTickSymbol: lastTickRes.data?.symbol ?? null,
      lastSnapTs: lastSnapRes.data?.ts ?? null,
      lastSnapSymbol: lastSnapRes.data?.symbol ?? null,
    },
    tabs: tabs.map((t) => ({
      symbol: t.symbol,
      client_id: t.client_id,
      uuid: t.uuid ?? null,
      ts: t.ts,
      uptime_sec: t.uptime_sec ?? null,
      snapshots_sent: t.snapshots_sent ?? 0,
      last_snapshot_age_sec: t.last_snapshot_age_sec ?? null,
      last_l2_fresh: t.last_l2_fresh ?? null,
      last_l2_age_sec: t.last_l2_age_sec ?? null,
      panel_state: t.panel_state ?? null,
      has_trigger: t.has_trigger ?? null,
      last_ensure_age_sec: t.last_ensure_age_sec ?? null,
    })),
    ticksPerSymbol: Array.from(ticksBySym.entries())
      .map(([symbol, v]) => ({ symbol, count: v.count, lastPrice: v.lastPrice, lastTs: v.lastTs }))
      .sort((a, b) => b.count - a.count),
    snapsPerSymbol: Array.from(snapsBySym.entries())
      .map(([symbol, v]) => ({ symbol, count: v.count, lastTs: v.lastTs, bid: v.bid, ask: v.ask }))
      .sort((a, b) => b.count - a.count),
    signals: signalSymbols,
    missingSignals,
  };
});