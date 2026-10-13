import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTelegram } from "@/lib/notifications/telegram.server";

/**
 * Intraday breakout scanner — V2.1 filters but using live_ticks for intraday high.
 *
 * Filter set (same as backtest):
 *   1) intraday_high > 20-day high (HH20 from daily_candles, prior 20 sessions)
 *   2) close > SMA-50 (from daily_candles)
 *   3) close > SMA-200 (from daily_candles)
 *   4) intraday volume estimate ≥ 1.5 × avg20 volume
 *   5) gap_up ≤ 3%
 *
 * Runs every 10 min during EGX session. Inserts into intraday_breakouts
 * and sends Telegram alert (one per symbol per day).
 */

type DailyRow = { symbol: string; date: string; close: number; high: number; volume: number };

function sma(arr: number[]): number | null {
  if (!arr.length) return null;
  return arr.reduce((s, x) => s + x, 0) / arr.length;
}

export const Route = createFileRoute("/api/public/hooks/intraday-breakout-scan")({
  server: {
    handlers: {
      POST: async () => {
        const cairoNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
        const dow = cairoNow.getDay();
        const hh = cairoNow.getHours();
        const inSession = (dow >= 0 && dow <= 4) && hh >= 10 && (hh < 14 || (hh === 14 && cairoNow.getMinutes() <= 30));
        if (!inSession) return Response.json({ ok: true, skipped: "out_of_session" });

        const todayCairo = cairoNow.toISOString().slice(0, 10);

        const { data: stocks } = await supabaseAdmin
          .from("stocks").select("symbol, name_ar").eq("is_sharia", true);
        const symbols = (stocks ?? []).map(s => s.symbol);
        const nameMap = new Map((stocks ?? []).map(s => [s.symbol, s.name_ar] as const));
        if (!symbols.length) return Response.json({ ok: false, error: "no_symbols" });

        // Skip symbols already alerted today
        const { data: already } = await supabaseAdmin
          .from("intraday_breakouts").select("symbol").eq("trade_date", todayCairo);
        const skip = new Set((already ?? []).map(r => r.symbol));

        // Load last 220 daily candles for each symbol (to compute SMA-200 + HH20)
        const fromDate = new Date(Date.now() - 320 * 86400_000).toISOString().slice(0, 10);
        const rows: DailyRow[] = [];
        for (let f = 0; ; f += 1000) {
          const { data } = await supabaseAdmin.from("daily_candles")
            .select("symbol,date,close,high,volume")
            .in("symbol", symbols).gte("date", fromDate).order("symbol").order("date")
            .range(f, f + 999);
          if (!data?.length) break;
          rows.push(...data.map(r => ({ symbol: r.symbol, date: r.date, close: +r.close, high: +r.high, volume: Number(r.volume) || 0 })));
          if (data.length < 1000) break;
        }
        const bySym = new Map<string, DailyRow[]>();
        for (const r of rows) {
          const a = bySym.get(r.symbol) ?? [];
          a.push(r); bySym.set(r.symbol, a);
        }
        for (const a of bySym.values()) a.sort((x, y) => x.date.localeCompare(y.date));

        // Load today's live ticks for all symbols in one query
        const startOfDay = new Date(`${todayCairo}T00:00:00Z`).toISOString();
        const { data: ticks } = await supabaseAdmin.from("live_ticks")
          .select("symbol, price, volume, ts").in("symbol", symbols).gte("ts", startOfDay)
          .order("ts", { ascending: true });
        const ticksBySym = new Map<string, { price: number; volume: number | null }[]>();
        for (const t of (ticks ?? [])) {
          const a = ticksBySym.get(t.symbol) ?? [];
          a.push({ price: +t.price, volume: t.volume == null ? null : Number(t.volume) });
          ticksBySym.set(t.symbol, a);
        }

        const detected: { symbol: string; price: number; vol_x: number; hh20: number }[] = [];
        const inserts: Record<string, unknown>[] = [];

        for (const sym of symbols) {
          if (skip.has(sym)) continue;
          const hist = bySym.get(sym); if (!hist || hist.length < 220) continue;
          const ticksToday = ticksBySym.get(sym); if (!ticksToday?.length) continue;

          // Use last 220 sessions, EXCLUDING today if present
          const histPrior = hist.filter(r => r.date < todayCairo);
          if (histPrior.length < 220) continue;
          const last20 = histPrior.slice(-20);
          const last50 = histPrior.slice(-50);
          const last200 = histPrior.slice(-200);
          const hh20 = Math.max(...last20.map(r => r.high));
          const sma50 = sma(last50.map(r => r.close))!;
          const sma200 = sma(last200.map(r => r.close))!;
          const vavg20 = sma(last20.map(r => r.volume))!;
          const prevClose = histPrior.at(-1)!.close;

          const intradayHigh = Math.max(...ticksToday.map(t => t.price));
          const currentPrice = ticksToday.at(-1)!.price;
          // Volume estimate: use max(volume) we observed (Mubasher reports cumulative day volume)
          const volsSeen = ticksToday.map(t => t.volume).filter((v): v is number => v != null && v > 0);
          const intradayVol = volsSeen.length ? Math.max(...volsSeen) : 0;
          const volX = vavg20 > 0 ? intradayVol / vavg20 : 0;
          const openPrice = ticksToday[0].price;
          const gapPct = prevClose > 0 ? (openPrice - prevClose) / prevClose * 100 : 0;

          const f_breakout = intradayHigh > hh20;
          const f_sma50    = currentPrice >= sma50;
          const f_sma200   = currentPrice >= sma200;
          const f_vol      = volX >= 1.5;
          const f_gap      = gapPct <= 3;

          if (!(f_breakout && f_sma50 && f_sma200 && f_vol && f_gap)) continue;

          inserts.push({
            symbol: sym, trade_date: todayCairo,
            breakout_price: currentPrice, hh20, sma50, sma200,
            vol_intraday: intradayVol, vol_avg20: vavg20, vol_x: volX,
            prev_close: prevClose, gap_pct: gapPct,
            filters_passed: { f_breakout, f_sma50, f_sma200, f_vol, f_gap },
            telegram_sent: false,
          });
          detected.push({ symbol: sym, price: currentPrice, vol_x: volX, hh20 });
        }

        // Insert all detections
        if (inserts.length) {
          await supabaseAdmin.from("intraday_breakouts").insert(inserts as never);
        }

        // Send one combined Telegram alert
        if (detected.length) {
          const lines = detected.map(d => {
            const name = nameMap.get(d.symbol) ?? d.symbol;
            const upPct = ((d.price - d.hh20) / d.hh20 * 100).toFixed(1);
            return `🎯 <b>${d.symbol}</b> (${name})\n   السعر: ${d.price.toFixed(2)} | فوق قمة 20 يوم بـ +${upPct}% | Vol ${d.vol_x.toFixed(1)}x`;
          });
          const msg = `⚡️ <b>اختراق Intraday — V2.1</b>\n${cairoNow.toLocaleString("ar-EG")}\n\n${lines.join("\n\n")}\n\n📌 الاستراتيجية المعتمدة. ادخل دلوقتي قبل الإقفال لتكسب حركة باقي اليوم.`;
          const sent = await sendTelegram(msg);
          if (sent.ok) {
            await supabaseAdmin.from("intraday_breakouts")
              .update({ telegram_sent: true }).eq("trade_date", todayCairo)
              .in("symbol", detected.map(d => d.symbol));
          }
        }

        return Response.json({ ok: true, scanned: symbols.length, detected: detected.length, symbols: detected.map(d => d.symbol) });
      },
    },
  },
});