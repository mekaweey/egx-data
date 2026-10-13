import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { MW_PARAMS } from "@/lib/scalp-dip/momentum-weekly.server";

/**
 * Public read-only LIVE-PRICE feed probe (2026-09-27).
 *
 * The intraday prices ("الأسعار اللحظية") come from ONE source only: the
 * browser extension writing marketwatch_snapshots / live_ticks. The daily
 * candles/opens/exits come from the TV scanner and work without it. This
 * probe tells the user, honestly and per state, whether the live feed is
 * actually flowing right now:
 *
 *   status "live"   → in session AND fresh snapshots (age ≤ 10 min, ≥30 syms)
 *   status "stale"  → in session but NO fresh snapshots (extension off!)
 *   status "closed" → market closed (Fri/Sat/night) — live absence is normal
 *
 * GET /api/public/hooks/live-price-status
 * → { ok, status, inSession, lastCaptureAt, ageMin, symbolsLast15m, checkedAt }
 */

export const Route = createFileRoute("/api/public/hooks/live-price-status")({
  server: {
    handlers: {
      GET: async () => {
        try {
          // Cairo wall time via Intl (same robust pattern as lastCompletedIdx)
          const parts = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Africa/Cairo",
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).formatToParts(new Date());
          const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
          const wd = get("weekday");
          const dowMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
          const dow = dowMap[wd] ?? 0;
          const hm = get("hour") + ":" + get("minute");
          const [hh, mm] = hm.split(":").map((x) => parseInt(x, 10));
          const mins = (hh || 0) * 60 + (mm || 0);
          const inSession =
            MW_PARAMS.SESSION_DAYS.includes(dow as 0 | 1 | 2 | 3 | 4) && mins >= 9 * 60 + 45 && mins <= 14 * 60 + 45;

          const { data: lastSnap } = await supabaseAdmin
            .from("marketwatch_snapshots")
            .select("captured_at")
            .order("captured_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          const lastCaptureAt: string | null = lastSnap ? String((lastSnap as { captured_at: string }).captured_at) : null;
          let ageMin: number | null = null;
          if (lastCaptureAt) {
            ageMin = Math.round((Date.now() - Date.parse(lastCaptureAt)) / 60_000);
          }

          let symbolsLast15m = 0;
          {
            const since = new Date(Date.now() - 15 * 60_000).toISOString();
            const { data: syms } = await supabaseAdmin
              .from("marketwatch_snapshots")
              .select("symbol")
              .gte("captured_at", since);
            symbolsLast15m = new Set((syms ?? []).map((r: { symbol: string }) => String(r.symbol).toUpperCase())).size;
          }

          let status: "live" | "stale" | "closed" = "closed";
          if (inSession) {
            status = ageMin !== null && ageMin <= 10 && symbolsLast15m >= 30 ? "live" : "stale";
          }

          return Response.json({
            ok: true,
            status,
            inSession,
            lastCaptureAt,
            ageMin,
            symbolsLast15m,
            checkedAt: new Date().toISOString(),
          });
        } catch (e: any) {
          return Response.json({ ok: false, error: e?.message ?? "probe failed" }, { status: 500 });
        }
      },
    },
  },
});
