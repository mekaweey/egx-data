import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTelegram } from "@/lib/notifications/telegram.server";
import { escapeHtml } from "@/lib/utils/html-escape";
import { explainNewsBaladi } from "@/lib/notifications/baladi-explain.server";

// نبضة كل ساعة: ملخّص بكل النشاط في آخر 60 دقيقة + آخر 24 ساعة حتى لا تظهر الرسالة "فاضية" وقت السكون.
export const Route = createFileRoute("/api/public/hooks/hourly-pulse")({
  server: {
    handlers: {
      POST: async () => {
        const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const lastDay = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const [
          newsHourRes,
          newsDayRes,
          scansHourRes,
          recsHourRes,
          recsDayRes,
          alertsHourRes,
          picksHourRes,
          picksDayRes,
          cronRes,
          latestScanRes,
        ] = await Promise.all([
          supabaseAdmin
            .from("news_sentiment")
            .select("id, symbol, headline, sentiment_score, published_at", { count: "exact" })
            .gte("created_at", since)
            .order("sentiment_score", { ascending: false })
            .limit(3),
          supabaseAdmin
            .from("news_sentiment")
            .select("id, symbol, headline, sentiment, sentiment_score, published_at, created_at", { count: "exact" })
            .gte("created_at", lastDay)
            .order("created_at", { ascending: false })
            .limit(8),
          supabaseAdmin
            .from("scans")
            .select("id, started_at, finished_at, status, stocks_count, ai_count, error_message", { count: "exact", head: false })
            .gte("started_at", since)
            .order("started_at", { ascending: false })
            .limit(1),
          supabaseAdmin
            .from("recommendations")
            .select("symbol, signal, confidence, created_at", { count: "exact" })
            .gte("created_at", since)
            .in("signal", ["buy", "strong_buy"])
            .eq("rejected_by_rules", false)
            .order("confidence", { ascending: false })
            .limit(3),
          supabaseAdmin
            .from("recommendations")
            .select("symbol, signal, confidence, reasons_ar, entry_min, entry_max, target, stop_loss, expected_next_day_pct, created_at", { count: "exact" })
            .gte("created_at", lastDay)
            .in("signal", ["buy", "strong_buy"])
            .eq("rejected_by_rules", false)
            .order("confidence", { ascending: false })
            .limit(5),
          supabaseAdmin
            .from("sell_alerts")
            .select("symbol, message_ar, alert_type, created_at", { count: "exact" })
            .gte("created_at", since)
            .order("created_at", { ascending: false })
            .limit(3),
          supabaseAdmin
            .from("daily_picks")
            .select("symbol, confidence, created_at", { count: "exact" })
            .gte("created_at", since)
            .order("confidence", { ascending: false })
            .limit(3),
          supabaseAdmin
            .from("daily_picks")
            .select("symbol, confidence, created_at", { count: "exact" })
            .gte("created_at", lastDay)
            .order("confidence", { ascending: false })
            .limit(3),
          supabaseAdmin.rpc("get_cron_runs", { p_limit: 80 }),
          supabaseAdmin
            .from("scans")
            .select("id, started_at, finished_at, status, stocks_count, ai_count, error_message")
            .gte("started_at", lastDay)
            .order("started_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        const newsCount = newsHourRes.count ?? 0;
        const newsDayCount = newsDayRes.count ?? 0;
        const scansCount = scansHourRes.count ?? 0;
        const recsCount = recsHourRes.count ?? 0;
        const recsDayCount = recsDayRes.count ?? 0;
        const alertsCount = alertsHourRes.count ?? 0;
        const picksCount = picksHourRes.count ?? 0;
        const picksDayCount = picksDayRes.count ?? 0;

        type Run = { jobname: string | null; status: string; start_time: string };
        const runs = ((cronRes.data ?? []) as Run[]).filter(
          (r) => new Date(r.start_time).toISOString() >= since,
        );
        const okJobs = runs.filter((r) => r.status === "succeeded").length;
        const failJobs = runs.filter((r) => r.status !== "succeeded");

        const lines: string[] = [];
        lines.push("📡 <b>نبضة الساعة</b> — حالة النظام والتحليل");
        lines.push("");
        lines.push("✅ النظام شغال تلقائيًا وبيفحص المهام والخلفية.");
        lines.push(`📰 أخبار جديدة: <b>${newsCount}</b> آخر ساعة · <b>${newsDayCount}</b> آخر 24 ساعة`);
        lines.push(`🔍 فحوصات سوق: <b>${scansCount}</b> آخر ساعة`);
        lines.push(`🎯 توصيات شراء: <b>${recsCount}</b> آخر ساعة · <b>${recsDayCount}</b> آخر 24 ساعة`);
        lines.push(`⭐ ترشيحات اليوم: <b>${picksCount}</b> آخر ساعة · <b>${picksDayCount}</b> آخر 24 ساعة`);
        lines.push(`🚨 تنبيهات بيع: <b>${alertsCount}</b>`);
        lines.push(`⚙️ مهام تلقائية ناجحة: <b>${okJobs}</b>`);

        const latestScan = latestScanRes.data;
        if (latestScan) {
          const startedAt = latestScan.started_at
            ? new Date(latestScan.started_at).toLocaleString("ar-EG", { timeZone: "Africa/Cairo" })
            : "غير معروف";
          lines.push("");
          lines.push("━━━━━━━━━━━━━━━");
          lines.push("🔎 <b>آخر مسح كامل:</b>");
          lines.push(`• الحالة: <b>${latestScan.status}</b>`);
          lines.push(`• وقت البدء: ${startedAt}`);
          lines.push(`• أسهم تم فحصها: <b>${latestScan.stocks_count ?? 0}</b> · تحليلات AI: <b>${latestScan.ai_count ?? 0}</b>`);
          if (latestScan.error_message) {
            const err = String(latestScan.error_message ?? "");
            const aiFallback = /Payment Required|Too Many Requests|AI|بوابة/i.test(err);
            if (aiFallback) {
              lines.push("• حالة AI: استخدم النظام الاحتياطي/التقليل الذكي لبعض الأسهم بسبب ضغط أو رصيد المزود.");
            }
            // اختصار رسائل الفشل المتكررة (rate-limit) لعدد الرموز بدل سرد كل واحد
            const rateLimitSymbols = Array.from(
              new Set((err.match(/([A-Z]{3,5}):\s*Failed after \d+ attempts/g) ?? []).map(s => s.split(":")[0])),
            );
            const driftMatch = err.match(/انحراف[^|]+/);
            const cleanNotes: string[] = [];
            if (driftMatch) cleanNotes.push(driftMatch[0].trim());
            if (rateLimitSymbols.length) {
              cleanNotes.push(`فشل مؤقت في جلب أخبار ${rateLimitSymbols.length} سهم (Rate-Limit): ${rateLimitSymbols.slice(0, 5).join("، ")}${rateLimitSymbols.length > 5 ? "…" : ""} — هيُعاد المحاولة تلقائياً.`);
            }
            if (cleanNotes.length) {
              lines.push(`• ملاحظات: ${escapeHtml(cleanNotes.join(" | ").slice(0, 320))}`);
            }
          }
        } else {
          lines.push("");
          lines.push("🔎 لم يتم العثور على مسح كامل خلال آخر 24 ساعة.");
        }

        // شرح "ليه مفيش توصيات" لو الأخبار موجودة و المسح اشتغل بس مفيش ترشيحات
        if (recsDayCount === 0 && picksDayCount === 0) {
          lines.push("");
          lines.push("━━━━━━━━━━━━━━━");
          lines.push("ℹ️ <b>ليه مفيش توصيات دلوقتي؟</b>");
          lines.push("الأخبار بتتجمع و بتتحلل تلقائياً، لكن التوصيات بتطلع من المسح الكامل و بشرط:");
          lines.push("• الثقة في السهم > 70% • إشارة فنية واضحة • ما يكونش مرفوض من قواعد المخاطرة.");
          lines.push(`النهارده ${newsDayCount} خبر اتحللوا، بس ولا سهم وصل لمعايير الشراء — السوق في وضع انتظار.`);
        }

        if ((recsDayRes.data ?? []).length) {
          lines.push("");
          lines.push("━━━━━━━━━━━━━━━");
          lines.push("🎯 <b>أبرز توصيات الشراء خلال 24 ساعة:</b>");
          for (const r of (recsDayRes.data ?? []) as Array<{
            symbol: string;
            confidence: number;
            expected_next_day_pct: number | null;
            reasons_ar: unknown;
          }>) {
            const reasons = Array.isArray(r.reasons_ar) ? r.reasons_ar.map(String).slice(0, 2) : [];
            const expected = r.expected_next_day_pct != null ? ` · متوقع بكرا ${Number(r.expected_next_day_pct).toFixed(1)}%` : "";
            lines.push(`• <b>${escapeHtml(r.symbol)}</b> — ثقة ${r.confidence}%${expected}`);
            for (const reason of reasons) lines.push(`  - ${escapeHtml(reason.slice(0, 95))}`);
          }
        }

        if ((newsDayRes.data ?? []).length) {
          lines.push("");
          lines.push("━━━━━━━━━━━━━━━");
          lines.push("📰 <b>آخر الأخبار التي دخلت التحليل:</b>");
          type NewsRow = { symbol: string; headline: string; sentiment: string; sentiment_score: number; impact_level?: string };
          const topNews = (newsDayRes.data ?? []).slice(0, 5) as unknown as NewsRow[];
          // رتّب حسب |sentiment_score| لأخذ أقوى خبرين للشرح البلدي
          const ranked = [...topNews].sort(
            (a, b) => Math.abs(b.sentiment_score ?? 0) - Math.abs(a.sentiment_score ?? 0),
          );
          const explainSet = new Set(ranked.slice(0, 2).map((n) => `${n.symbol}::${n.headline}`));

          for (const n of topNews) {
            const head = escapeHtml((n.headline ?? "").slice(0, 110));
            const icon = n.sentiment === "positive" ? "📈" : n.sentiment === "negative" ? "⚠️" : "📰";
            lines.push(`${icon} <b>${escapeHtml(n.symbol)}</b>: ${head} <i>(${n.sentiment_score?.toFixed(2)})</i>`);
            if (explainSet.has(`${n.symbol}::${n.headline}`)) {
              const baladi = await explainNewsBaladi({
                symbol: n.symbol,
                headline: n.headline ?? "",
                sentiment: n.sentiment,
                impact_level: n.impact_level ?? null,
                sentiment_score: n.sentiment_score,
              });
              if (baladi) lines.push(`   🗣️ <i>${escapeHtml(baladi)}</i>`);
            }
          }
        } else {
          lines.push("");
          lines.push("📰 لا توجد أخبار مخزنة آخر 24 ساعة — سيتم اعتبار ده مشكلة لو استمر بعد تشغيل مهمة الأخبار القادمة.");
        }

        if ((alertsHourRes.data ?? []).length) {
          lines.push("");
          lines.push("━━━━━━━━━━━━━━━");
          lines.push("🚨 <b>تنبيهات بيع:</b>");
          for (const a of (alertsHourRes.data ?? []) as Array<{ symbol: string; message_ar: string }>) {
            lines.push(`• ${escapeHtml(a.symbol)} — ${escapeHtml((a.message_ar ?? "").slice(0, 80))}`);
          }
        }

        if (failJobs.length) {
          lines.push("");
          lines.push("━━━━━━━━━━━━━━━");
          lines.push(`⚠️ مهام فشلت: <b>${failJobs.length}</b>`);
          for (const f of failJobs.slice(0, 3)) {
            lines.push(`• ${escapeHtml(f.jobname ?? "?")} (${escapeHtml(f.status)})`);
          }
        }

        const telegram = await sendTelegram(lines.join("\n"));

        return Response.json({
          ok: true,
          telegram,
          news: newsCount,
          news_24h: newsDayCount,
          scans: scansCount,
          recs: recsCount,
          recs_24h: recsDayCount,
          alerts: alertsCount,
          picks: picksCount,
          picks_24h: picksDayCount,
          jobs_ok: okJobs,
          jobs_failed: failJobs.length,
        });
      },
    },
  },
});