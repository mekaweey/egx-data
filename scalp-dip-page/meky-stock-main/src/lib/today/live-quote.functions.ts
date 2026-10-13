import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchEgxSnapshots } from "@/lib/market-data/tradingview.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Freshness window: any live_tick within this many seconds is considered
 * "real-time". Thunder pushes every second when the market moves, so this
 * almost always returns a Thunder tick during session hours; only when
 * Thunder is offline do we fall back to the 5-min TradingView poll.
 */
const REALTIME_WINDOW_SEC = 90;

type FreshTick = { symbol: string; price: number; volume: number | null; source: string; ageSec: number };

async function getFreshestTicks(symbols: string[]): Promise<Map<string, FreshTick>> {
  const out = new Map<string, FreshTick>();
  if (!symbols.length) return out;
  const sinceIso = new Date(Date.now() - REALTIME_WINDOW_SEC * 1000).toISOString();
  const { data } = await supabaseAdmin
    .from("live_ticks")
    .select("symbol,price,volume,source,ts")
    .in("symbol", symbols)
    .gte("ts", sinceIso)
    .order("ts", { ascending: false });
  const now = Date.now();
  for (const r of data ?? []) {
    // .order ensures first seen per symbol is freshest.
    if (out.has(r.symbol)) continue;
    out.set(r.symbol, {
      symbol: r.symbol,
      price: Number(r.price),
      volume: r.volume,
      source: String(r.source),
      ageSec: Math.round((now - new Date(r.ts).getTime()) / 1000),
    });
  }
  return out;
}

export type LiveQuote = {
  symbol: string;
  price: number;
  change_pct: number;
  volume: number;
  rsi14: number | null;
  fetchedAt: string;
  source: string;
  ageSec: number | null;
  // vs current open pick:
  pnlPct: number | null;
  pnlVsEntry: number | null;
  hitTarget: boolean;
  hitStop: boolean;
  liveConfidence: number | null; // adapted confidence based on live move
  recommendation: "hold" | "sell_target" | "sell_stop" | "trail" | "no_pick";
  message: string;
};

/**
 * Live quote for today's open pick. Free real-time feed via TradingView
 * public scanner. Recomputes stop/target status + adaptive confidence
 * so the UI can react second-by-second during market hours.
 */
export const getLiveQuote = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({ symbol: z.string().min(1).max(20).regex(/^[A-Z0-9.]+$/i) }).parse(d),
  )
  .handler(async ({ data }): Promise<LiveQuote> => {
    const bare = data.symbol.replace(/\.CA$/i, "").toUpperCase();
    // Prefer the freshest live_ticks row (Thunder real-time when available).
    const fresh = (await getFreshestTicks([bare])).get(bare) ?? null;
    // TradingView snapshot still provides change_pct/high/low/volume context
    // that a single tick lacks. Fetch it only when needed for those fields
    // or as fallback price when no fresh tick exists.
    const snaps = await fetchEgxSnapshots([bare]).catch(() => new Map());
    const snap = snaps.get(bare);

    const livePrice = fresh?.price ?? snap?.close ?? null;
    const liveSource = fresh?.source ?? (snap ? "tradingview" : "none");
    const liveAge = fresh?.ageSec ?? null;

    if (livePrice == null) {
      return {
        symbol: bare,
        price: 0,
        change_pct: 0,
        volume: 0,
        rsi14: null,
        fetchedAt: new Date().toISOString(),
        source: "none",
        ageSec: null,
        pnlPct: null,
        pnlVsEntry: null,
        hitTarget: false,
        hitStop: false,
        liveConfidence: null,
        recommendation: "no_pick",
        message: "تعذر جلب السعر اللحظي — السوق ممكن يكون مغلق",
      };
    }

    // find today's open pick for this symbol
    const today = new Date().toISOString().slice(0, 10);
    const { data: pick } = await supabaseAdmin
      .from("daily_picks")
      .select("*")
      .eq("symbol", data.symbol)
      .eq("status", "open")
      .order("pick_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    let pnlPct: number | null = null;
    let pnlVsEntry: number | null = null;
    let hitTarget = false;
    let hitStop = false;
    let liveConfidence: number | null = null;
    let recommendation: LiveQuote["recommendation"] = "no_pick";
    let message = "السعر اللحظي محدّث";

    if (pick) {
      const entry = Number(pick.entry_price);
      const target = Number(pick.target_price);
      const stop = Number(pick.stop_price);
      const baseConf = Number(pick.confidence);

      pnlPct = ((livePrice - entry) / entry) * 100;
      pnlVsEntry = livePrice - entry;

      // Prefer intraday high/low from TradingView snapshot for stop/target
      // detection (single tick can miss a wick). Fall back to live price.
      hitTarget = (snap?.high ?? livePrice) >= target;
      hitStop = (snap?.low ?? livePrice) <= stop;

      // adaptive confidence: shift baseline based on intraday move
      // +1% move ≈ +5 conf, -1% move ≈ -8 conf (asymmetric — losses hurt more)
      const adj = pnlPct >= 0 ? pnlPct * 5 : pnlPct * 8;
      liveConfidence = Math.max(0, Math.min(100, baseConf + adj));

      if (hitTarget) {
        recommendation = "sell_target";
        message = `🎯 وصل الهدف ${target.toFixed(2)} — بيع فوراً`;
      } else if (hitStop) {
        recommendation = "sell_stop";
        message = `🛑 ضرب الستوب ${stop.toFixed(2)} — اخرج فوراً لحماية رأس المال`;
      } else if (pnlPct >= 5) {
        recommendation = "trail";
        const newStop = livePrice * 0.97;
        message = `📈 ربح +${pnlPct.toFixed(2)}% — حرّك الستوب لـ ${newStop.toFixed(2)} (3% تحت السعر)`;
      } else if (pnlPct <= -2) {
        recommendation = "hold";
        message = `⚠️ خسارة ${pnlPct.toFixed(2)}% — الستوب لسه ${stop.toFixed(2)} · استنى`;
      } else {
        recommendation = "hold";
        message = `الصفقة شغّالة (${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}%) — احتفظ`;
      }
    }

    return {
      symbol: bare,
      price: livePrice,
      change_pct: snap?.change_pct ?? 0,
      volume: fresh?.volume ?? snap?.volume ?? 0,
      rsi14: snap?.rsi14 ?? null,
      fetchedAt: new Date().toISOString(),
      source: liveSource,
      ageSec: liveAge,
      pnlPct,
      pnlVsEntry,
      hitTarget,
      hitStop,
      liveConfidence,
      recommendation,
      message,
    };
  });

export type LiveQuoteLite = {
  symbol: string;
  price: number;
  change_pct: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  fetchedAt: string;
  source: string;
  ageSec: number | null;
};

/**
 * Batch live quotes for many symbols at once. Used by the today page to
 * show a continuously-updating row for every open/recent pick.
 */
export const getLiveQuotes = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        symbols: z
          .array(z.string().min(1).max(20).regex(/^[A-Z0-9.]+$/i))
          .min(1)
          .max(150),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<LiveQuoteLite[]> => {
    const bares = Array.from(
      new Set(data.symbols.map((s) => s.replace(/\.CA$/i, "").toUpperCase())),
    );
    // Pull freshest ticks (Thunder when available) AND TradingView snapshot
    // in parallel. Thunder gives latest price; TV provides change_pct/OHLC.
    const [fresh, snaps] = await Promise.all([
      getFreshestTicks(bares),
      fetchEgxSnapshots(bares).catch(() => new Map()),
    ]);
    const fetchedAt = new Date().toISOString();
    return bares.map((s) => {
      const f = fresh.get(s);
      const snap = snaps.get(s);
      const price = f?.price ?? snap?.close ?? 0;
      return {
        symbol: s,
        price,
        change_pct: snap?.change_pct ?? 0,
        open: snap?.open ?? 0,
        high: snap?.high ?? price,
        low: snap?.low ?? price,
        volume: f?.volume ?? snap?.volume ?? 0,
        fetchedAt,
        source: f?.source ?? (snap ? "tradingview" : "none"),
        ageSec: f?.ageSec ?? null,
      };
    });
  });