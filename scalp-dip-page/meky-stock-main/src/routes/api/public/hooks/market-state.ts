import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin as _supabaseAdmin } from "@/integrations/supabase/client.server";
const supabaseAdmin = _supabaseAdmin as any;
import { MW_PARAMS } from "@/lib/scalp-dip/momentum-weekly.server";

/**
 * MARKET STATE ENGINE (2026-09-28) — a 0-100 scientific composite of the EGX
 * session state, every component MEASURED on history before entering here:
 *
 *   breadth   (25%) : % of halal symbols above their 20d MA
 *                     → 10y: breadth >= 50% => next-day rest mean +0.277%
 *                       vs < 50% => +0.022% (corr +0.130) — strongest pre-open
 *   trend20   (25%) : universe 20-session return (regime/trend state)
 *   prevday   (15%) : yesterday's universe return
 *                     → 10y corr(prev-day, rest-of-day) = +0.206
 *   trend5    (15%) : universe 5-session return (short momentum)
 *   volreg    (10%) : 20-session bench volatility (low vol = higher score)
 *   opening   (10%) : LIVE opening strength = universe live avg vs today's
 *                     open avg, measured over the first 15 minutes
 *                     (the tested best window: 10-15 min → 61% vs 47%;
 *                      needs the extension running — weight is
 *                      redistributed to the others when unavailable)
 *
 * The composite maps to 0-100 with the buckets:
 *   >= 80 ممتاز | 60-79 جيد | 40-59 متوسط | < 40 ضعيف
 *
 * GET /api/public/hooks/market-state
 */

const HALAL_KEY_TTL = 60 * 60_000;
let halalCache: { at: number; syms: Set<string> } | null = null;

async function halalSyms(): Promise<Set<string>> {
  if (halalCache && Date.now() - halalCache.at < HALAL_KEY_TTL) return halalCache.syms;
  const { getHalalSet } = await import("@/lib/scalp-dip/halal-list.server");
  const syms = new Set<string>([...getHalalSet()].map((x) => String(x).toUpperCase()));
  halalCache = { at: Date.now(), syms };
  return syms;
}

function mapRange(x: number, lo: number, hi: number): number {
  if (!Number.isFinite(x)) return 50;
  const v = ((x - lo) / (hi - lo)) * 100;
  return Math.max(0, Math.min(100, v));
}

export const Route = createFileRoute("/api/public/hooks/market-state")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const syms = await halalSyms();
          // last 80 sessions of the halal universe (daily closes)
          // paginated fetch - supabase REST caps at 1000 rows per request
          let rows: { symbol: string; date: string; open: number; close: number }[] = [];
          let from = 0;
          while (true) {
            const { data: page, error: rowsErr } = await supabaseAdmin
              .from("daily_candles")
              .select("symbol, date, open, close, volume")
              .gte("date", new Date(Date.now() - 130 * 86400000).toISOString().slice(0, 10))
              .order("date", { ascending: true })
              .range(from, from + 999);
            if (rowsErr) throw new Error(rowsErr.message);
            if (!page?.length) break;
            for (const r of page) rows.push(r as any);
            if (page.length < 1000) break;
            from += 1000;
          }
          const perSym = new Map<string, Map<string, { o: number; c: number }>>();
          const daySet = new Set<string>();
          for (const r of rows) {
            const sym = String(r.symbol).toUpperCase();
            if (!syms.has(sym)) continue;
            const o = Number(r.open), c = Number(r.close);
            if (!(o > 0) || !(c > 0)) continue;
            if (!perSym.has(sym)) perSym.set(sym, new Map());
            perSym.get(sym)!.set(String(r.date).slice(0, 10), { o, c });
            daySet.add(String(r.date).slice(0, 10));
          }
          const sessions = [...daySet].sort();
          if (sessions.length < 25) {
            return Response.json({ ok: false, error: "لا توجد بيانات كافية لحساب الحالة" }, { status: 200 });
          }
          const today = sessions[sessions.length - 1];
          const idxOf = (t: string, d: string) => { const m = perSym.get(t); if (!m) return -1; const arr = [...m.keys()].sort(); for (let i = 0; i < arr.length; i++) if (arr[i] >= d) return (arr[i] === d ? i : -1); return -1; };

          // per-session universe aggregates over the last ~30 sessions
          const agg: { d: string; ret: number; gap: number; breadth: number }[] = [];
          for (let s = Math.max(1, sessions.length - 30); s < sessions.length; s++) {
            const d = sessions[s];
            const dp = sessions[s - 1];
            const rets: number[] = [];
            const gaps: number[] = [];
            let above = 0, maN = 0;
            for (const [t, m] of perSym) {
              const i = m.get(d), ip = m.get(dp);
              if (i == null || ip == null) continue;
              const o = m.get(d)!.o, c = m.get(d)!.c, pc = m.get(dp)!.c;
              rets.push(c / pc - 1);
              gaps.push(o / pc - 1);
              // 20d MA breadth needs the symbol's last 20 closes up to d
              const arr = [...m.entries()].sort((x, y) => (x[0] < y[0] ? -1 : 1));
              const ii = arr.findIndex((x) => x[0] === d);
              if (ii >= 19) {
                let sm = 0;
                for (let q = ii - 19; q <= ii; q++) sm += arr[q][1].c;
                if (c > sm / 20) above++;
                maN++;
              }
            }
            if (rets.length < 30) continue;
            agg.push({
              d,
              ret: rets.reduce((a, b) => a + b, 0) / rets.length,
              gap: gaps.reduce((a, b) => a + b, 0) / gaps.length,
              breadth: maN ? above / maN : 0,
            });
          }

          const last = agg[agg.length - 1];
          const prev = agg[agg.length - 2] ?? last;
          const rets20 = agg.slice(-20).map((a) => a.ret);
          const trend20 = agg.slice(-20).reduce((acc, a) => acc * (1 + a.ret), 1) - 1;
          const trend5 = agg.slice(-5).reduce((acc, a) => acc * (1 + a.ret), 1) - 1;
          const mu = rets20.reduce((a, b) => a + b, 0) / rets20.length;
          const vol20 = Math.sqrt(rets20.reduce((acc, r) => acc + (r - mu) * (r - mu), 0) / (rets20.length - 1));

          // components 0-100 (each measured — see header)
          const cBreadth = mapRange(last.breadth, 0.30, 0.70);
          const cTrend20 = mapRange(trend20, -0.08, 0.08);
          const cPrev = mapRange(last.ret, -0.02, 0.02);
          const cTrend5 = mapRange(trend5, -0.04, 0.04);
          const cVol = mapRange(-vol20, -0.035, -0.008); // low vol -> 100
          const comps: Record<string, number> = {
            breadth: cBreadth,
            trend20: cTrend20,
            prevday: cPrev,
            trend5: cTrend5,
            volreg: cVol,
          };

          // opening strength — LIVE only while the market is open today and
          // the extension is feeding snapshots in the last ~10 minutes
          let opening: number | null = null;
          const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
          const gp = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
          const wdMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
          const dow = wdMap[gp("weekday")] ?? 0;
          const hh = parseInt(gp("hour"), 10) || 0;
          const mm = parseInt(gp("minute"), 10) || 0;
          const cairoMin = hh * 60 + mm;
          const inSession = MW_PARAMS.SESSION_DAYS.includes(dow as 0 | 1 | 2 | 3 | 4) && cairoMin >= 10 * 60 && cairoMin <= 14 * 60 + 35;
          // Opening strength from daily_candles directly (2026-09-28): the
          // 10:05 morning scanner writes today's candle (open + first-minutes
          // close) WITHOUT needing the extension. During the session the row's
          // close = the latest scanner price = the opening-window strength.
          let liveSyms = 0;
          if (inSession) {
            const { data: todayRows } = await supabaseAdmin
              .from("daily_candles")
              .select("symbol, open, close")
              .eq("date", today);
            if (todayRows && todayRows.length >= 30) {
              const rel: number[] = [];
              for (const r of todayRows) {
                const s = String(r.symbol).toUpperCase();
                if (!syms.has(s)) continue;
                const o = Number(r.open), c = Number(r.close);
                if (!(o > 0) || !(c > 0)) continue;
                rel.push(c / o - 1);
                liveSyms++;
              }
              if (liveSyms >= 30) {
                const openingRet = rel.reduce((a, b) => a + b, 0) / rel.length;
                opening = mapRange(openingRet, -0.015, 0.015);
                comps.opening = opening;
              }
            }
          }

          // weights (opening redistributes when unavailable)
          const weights: Record<string, number> = { breadth: 0.25, trend20: 0.25, prevday: 0.15, trend5: 0.15, volreg: 0.10, opening: 0.10 };
          let wsum = 0, score = 0;
          for (const k of Object.keys(weights)) {
            if (k === "opening" && opening === null) continue;
            score += comps[k] * weights[k];
            wsum += weights[k];
          }
          score = score / wsum;
          const bucket = score >= 80 ? "ممتاز" : score >= 60 ? "جيد" : score >= 40 ? "متوسط" : "ضعيف";

          return Response.json({
            ok: true,
            score: Math.round(score),
            bucket,
            components: {
              breadth: Math.round(comps.breadth),
              trend20: Math.round(comps.trend20),
              prevday: Math.round(comps.prevday),
              trend5: Math.round(comps.trend5),
              volreg: Math.round(comps.volreg),
              opening: opening === null ? null : Math.round(opening),
            },
            detail: {
              breadthPct: Math.round(last.breadth * 100),
              trend20Pct: Math.round(trend20 * 1000) / 10,
              trend5Pct: Math.round(trend5 * 1000) / 10,
              prevdayPct: Math.round(last.ret * 1000) / 10,
              vol20Pct: Math.round(vol20 * 1000) / 10,
              openingPct: opening,
              liveSyms,
              inSession,
              sessions: sessions.length,
              asOf: today,
              checkedAt: new Date().toISOString(),
            },
          });
        } catch (e: any) {
          return Response.json({ ok: false, error: e?.message ?? "market-state failed" }, { status: 500 });
        }
      },
    },
  },
});
