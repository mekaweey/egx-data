// scalp-dip dashboard builder (2026-09-27) - the data layer for the weekly
// operations page, shared by:
//   - the SSR path (the page imports this directly during server rendering)
//   - the plain API route /api/public/hooks/scalp-dip-dashboard (client fetch)
// Replaces the page's createServerFn layer after the vite dev server-fn
// registry broke repeatedly ("Invalid server function ID").
import { supabaseAdmin as _supabaseAdmin } from "@/integrations/supabase/client.server";
const supabaseAdmin = _supabaseAdmin as any;
import { scanDailyCandidates, tradingDaysElapsed, liveSymbolState } from "@/lib/scalp-dip/momentum-weekly.server";
import { getHalalSet } from "@/lib/scalp-dip/halal-list.server";
import { getRecentAuditLogs } from "@/lib/scalp-dip/scalp-dip-signals.server";
import type { SignalRow } from "@/lib/scalp-dip/scalp-dip-signals.server";

const ARABIC_DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export function weeklyRowToSignal(r: any): SignalRow {
  const buy = r.actual_buy_price != null ? Number(r.actual_buy_price) : null;
  const lastClose = Number(r.last_close);
  return {
    id: Number(r.id),
    scan_date: String(r.scan_date),
    symbol: String(r.symbol).toUpperCase(),
    entry_price: buy ?? lastClose,
    gap_pct: buy != null && lastClose > 0 ? buy / lastClose - 1 : 0,
    bid_depth_at_entry: 0,
    position_value: Number(r.position_value) || 0,
    bought: !!r.bought,
    actual_buy_price: buy,
    buy_timestamp: r.buy_timestamp ?? null,
    day1_status: null,
    day1_price: null,
    day2_status: null,
    day2_price: null,
    day3_status: null,
    day3_price: null,
    exit_reason: r.exit_reason ?? null,
    bid_confirmed_at_exit: null,
    extra_hold_used: false,
    shadow_exit_price: null,
    shadow_pnl: null,
    shadow_pnl_pct: null,
    sold: !!r.sold,
    actual_sell_price: r.actual_sell_price != null ? Number(r.actual_sell_price) : null,
    sell_timestamp: r.sell_timestamp ?? null,
    realized_pnl: r.realized_pnl != null ? Number(r.realized_pnl) : null,
    realized_pnl_pct: r.realized_pnl_pct != null ? Number(r.realized_pnl_pct) : null,
    sell_signal: false,
    sell_signal_reason: null,
    created_at: r.created_at ?? null,
    updated_at: r.updated_at ?? null,
  };
}

// The daily plan (scanDailyCandidates) loads the whole universe's candles -
// ~78s cold. It only changes once per day-scan, so: cache in memory (60 min)
// AND persist to disk (survives server restarts - no more 78s first load),
// dedupe concurrent refreshes, and warm in the background at boot.
import * as nodeFs from "node:fs";
const PLAN_CACHE_FILE = ".daily-plan-cache.json";
let planCache: { at: number; plan: any } | null = null;
let planInFlight: Promise<any> | null = null;
const PLAN_TTL = 60 * 60_000;

try {
  const raw = nodeFs.readFileSync(PLAN_CACHE_FILE, "utf8");
  const parsed = JSON.parse(raw);
  if (parsed && parsed.plan && parsed.plan.scanDate) planCache = parsed;
} catch {}

function refreshPlanInBackground(): Promise<any> {
  if (planInFlight) return planInFlight;
  planInFlight = scanDailyCandidates()
    .then((plan) => {
      planCache = { at: Date.now(), plan };
      try { nodeFs.writeFileSync(PLAN_CACHE_FILE, JSON.stringify(planCache)); } catch {}
      planInFlight = null;
      return plan;
    })
    .catch((e) => {
      planInFlight = null;
      throw e;
    });
  return planInFlight;
}

// STALE-WHILE-REVALIDATE (2026-09-27): if ANY cached plan exists (memory or
// disk) it is served INSTANTLY - a refresh older than the TTL triggers a
// background recompute instead of blocking the caller for ~79s. Only the
// very first-ever call (no memory, no disk file) waits for the compute, and
// the boot warm-up makes that a non-user path.
async function ensurePlan(): Promise<any> {
  if (planCache) {
    if (Date.now() - planCache.at > PLAN_TTL) refreshPlanInBackground();
    return planCache.plan;
  }
  if (planInFlight) return planInFlight;
  return refreshPlanInBackground();
}

// background warm-up so the first user visit never waits the cold 78s
setTimeout(() => {
  ensurePlan().catch(() => {});
}, 5_000);

export async function buildDashboard() {
  const plan = await ensurePlan();
  const today = plan.scanDate;

  // 1) Paper trades history
  const { data: trades } = await supabaseAdmin
    .from("paper_trades")
    .select("id, symbol, entry_price, entry_ts, exit_price, exit_ts, exit_reason, pnl, pnl_pct, status, trade_date, capital")
    .eq("strategy", "scalp-dip")
    .order("entry_ts", { ascending: false })
    .limit(200);

  // 2) Latest WEEKLY batch + live tracking per row
  const { data: weeklyBatchRows } = await supabaseAdmin
    .from("momentum_weekly_signals")
    .select("*")
    .order("scan_date", { ascending: false })
    .order("position_value", { ascending: false })
    .limit(80);

  const batchScanDate = weeklyBatchRows?.length ? String(weeklyBatchRows[0].scan_date) : today;
  const batchSignals = (weeklyBatchRows ?? []).filter((r: any) => String(r.scan_date) === batchScanDate);
  const liveCache = new Map<string, Awaited<ReturnType<typeof liveSymbolState>>>();
  const liveTracked: any[] = [];
  for (const r of batchSignals) {
    const row = weeklyRowToSignal(r);
    const sym = row.symbol;
    let st = liveCache.get(sym);
    if (!st) {
      st = await liveSymbolState(sym);
      liveCache.set(sym, st);
    }
    const entry = row.entry_price;
    const refClose = Number(r.last_close) > 0 ? Number(r.last_close) : null;
    liveTracked.push({
      ...row,
      _halal: getHalalSet().has(sym),
      livePrice: st.price,
      liveTs: st.ts,
      livePct: st.price != null && entry > 0 ? st.price / entry - 1 : null,
      batchScanDate,
      _bandLo: refClose != null ? refClose * 0.97 : null,
      _bandHi: refClose != null ? refClose * 1.02 : null,
    });
  }

  // 3) Open bought positions (weekly table)
  const { data: openSignals } = await supabaseAdmin
    .from("momentum_weekly_signals")
    .select("*")
    .eq("selected", true)
    .eq("bought", true)
    .eq("sold", false)
    .order("entry_date", { ascending: false });

  const enrichedOpen: any[] = await Promise.all(
    (openSignals ?? []).map(async (raw: any) => {
      const s = weeklyRowToSignal(raw);
      const live = await liveSymbolState(s.symbol);
      const buyPrice = Number(s.actual_buy_price ?? s.entry_price);
      const curPrice = live.price ?? buyPrice;
      const shares = Number(raw.shares) || Math.max(1, Math.floor(Number(s.position_value) / buyPrice));
      const pnlEgp = (curPrice - buyPrice) * shares;
      const pnlPct = buyPrice > 0 ? (curPrice - buyPrice) / buyPrice : 0;
      const entryISO = String(raw.entry_date);
      const exitISO = String(raw.exit_date);
      const daysHeld = tradingDaysElapsed(entryISO, today);
      const isScheduledExit = daysHeld >= 5;
      const exitDow = new Date(`${exitISO}T00:00:00Z`).getUTCDay();

      return {
        ...s,
        scan_date: entryISO,
        currentPrice: curPrice,
        pnlEgp,
        pnlPct,
        daysHeld,
        daysRemaining: Math.max(0, 5 - daysHeld),
        exitDate: exitISO,
        exitDayName: ARABIC_DAY_NAMES[exitDow],
        isScheduledExit,
        isAnomaly: false,
        shares,
      };
    }),
  );

  // 4) Historical signals
  const { data: recentSignals } = await supabaseAdmin
    .from("scalp_dip_signals")
    .select("*")
    .lt("scan_date", today)
    .order("scan_date", { ascending: false })
    .order("gap_pct", { ascending: true })
    .limit(80);

  // 5) Active sell alerts
  const { data: sellAlerts } = await supabaseAdmin
    .from("scalp_dip_signals")
    .select("*")
    .eq("sell_signal", true)
    .eq("sold", false);

  // 6) Recent decision audit logs
  const auditLogs = await getRecentAuditLogs(40);

  return {
    plan,
    halalList: [...getHalalSet()],
    trades: (trades ?? []) as any[],
    todaySignals: liveTracked,
    batchScanDate,
    openPositions: enrichedOpen,
    recentSignals: (recentSignals ?? []) as any[],
    sellAlerts: (sellAlerts ?? []) as any[],
    auditLogs: (auditLogs ?? []) as any[],
  };
}
