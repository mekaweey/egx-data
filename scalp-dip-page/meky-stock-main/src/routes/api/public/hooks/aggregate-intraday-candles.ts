import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * EOD aggregator: groups today's live_ticks into 1-minute OHLC bars
 * and persists them in intraday_candles for permanent historical use.
 * Runs daily 14:35 Cairo (5 min after market close).
 * Idempotent via UNIQUE(symbol,bucket_ts,interval_min) + ON CONFLICT.
 * Optional body: { date: "YYYY-MM-DD" } to re-aggregate a past day.
 */
export const Route = createFileRoute("/api/public/hooks/aggregate-intraday-candles")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let targetDate: string | null = null;
        try {
          const body = (await request.json().catch(() => ({}))) as { date?: string };
          targetDate = body?.date ?? null;
        } catch {/* no body */}

        // Default = "today" in Cairo
        const cairoNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
        const yyyy = cairoNow.getFullYear();
        const mm = String(cairoNow.getMonth() + 1).padStart(2, "0");
        const dd = String(cairoNow.getDate()).padStart(2, "0");
        const dateStr = targetDate ?? `${yyyy}-${mm}-${dd}`;

        // Window: 07:00Z → 13:30Z covers 10:00→14:30 Cairo (UTC+3 in summer / UTC+2 winter)
        const fromIso = `${dateStr}T06:30:00.000Z`;
        const toIso = `${dateStr}T13:30:00.000Z`;

        // Stream ticks in pages (keep memory bounded)
        // The Data API caps each page at 1000 rows. Using 5000 made the loop
        // stop after the first capped page, so EOD candles only covered ~1000 ticks.
        const PAGE = 1000;
        let offset = 0;
        const bars = new Map<string, {
          symbol: string; bucket_ts: string; open: number; high: number; low: number;
          close: number; volume: number | null; tick_count: number; firstTs: number; lastTs: number;
        }>();

        while (true) {
          const { data, error } = await supabaseAdmin
            .from("live_ticks")
            .select("symbol,price,volume,ts")
            .gte("ts", fromIso)
            .lte("ts", toIso)
            .order("ts", { ascending: true })
            .range(offset, offset + PAGE - 1);
          if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
          if (!data || data.length === 0) break;

          for (const r of data) {
            const t = new Date(r.ts as string);
            // Bucket to the minute (UTC)
            const bucket = new Date(Date.UTC(
              t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate(),
              t.getUTCHours(), t.getUTCMinutes(), 0, 0,
            ));
            const key = `${r.symbol}|${bucket.toISOString()}`;
            const price = Number(r.price);
            const vol = r.volume == null ? null : Number(r.volume);
            const tsMs = t.getTime();
            const existing = bars.get(key);
            if (!existing) {
              bars.set(key, {
                symbol: r.symbol as string,
                bucket_ts: bucket.toISOString(),
                open: price, high: price, low: price, close: price,
                volume: vol, tick_count: 1,
                firstTs: tsMs, lastTs: tsMs,
              });
            } else {
              if (price > existing.high) existing.high = price;
              if (price < existing.low) existing.low = price;
              if (tsMs < existing.firstTs) { existing.firstTs = tsMs; existing.open = price; }
              if (tsMs > existing.lastTs)  { existing.lastTs = tsMs;  existing.close = price; }
              if (vol != null) existing.volume = vol; // last known cumulative volume
              existing.tick_count++;
            }
          }
          if (data.length < PAGE) break;
          offset += PAGE;
        }

        if (bars.size === 0) {
          return Response.json({ ok: true, date: dateStr, bars: 0, note: "no_ticks" });
        }

        const rows = Array.from(bars.values()).map(b => ({
          symbol: b.symbol,
          trade_date: dateStr,
          bucket_ts: b.bucket_ts,
          interval_min: 1,
          open: b.open, high: b.high, low: b.low, close: b.close,
          volume: b.volume, tick_count: b.tick_count,
        }));

        let inserted = 0;
        for (let i = 0; i < rows.length; i += 500) {
          const chunk = rows.slice(i, i + 500);
          const { error } = await supabaseAdmin
            .from("intraday_candles")
            .upsert(chunk, { onConflict: "symbol,bucket_ts,interval_min" });
          if (error) return Response.json({ ok: false, error: error.message, inserted }, { status: 500 });
          inserted += chunk.length;
        }

        return Response.json({
          ok: true,
          date: dateStr,
          bars: rows.length,
          symbols: new Set(rows.map(r => r.symbol)).size,
        });
      },
    },
  },
});