import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTelegram } from "@/lib/notifications/telegram.server";
import { escapeHtml } from "@/lib/utils/html-escape";

/**
 * News Watchdog — مراقب مستمر للأخبار:
 *  1. بيراجع آخر 60 دقيقة من الأخبار + التنبؤات.
 *  2. لو لقى خبر إيجابي قوي على سهم محدد → بيبعت **توصية شراء فورية**.
 *  3. لو لقى أخبار حروب/جيوسياسية → بيبعت **تنبيه مخاطر** على البورصة.
 *
 *  Additive 100% — بيقرأ بس، مفيش حذف أو تعديل لأي بيانات.
 *  Fail-open: أي خطأ → بيكمل، مفيش تأثير سلبي.
 *
 *  استخدام البيانات الموجودة فقط (news_sentiment + news_impact_forecasts)
 *  بدون استدعاءات AI إضافية — سريع و رخيص.
 */

// كلمات مفتاحية لأخبار الحروب و الجيوسياسة الي بتأثر على البورصة
const WAR_KEYWORDS = [
  "حرب", "حروب", "قصف", "غارة", "غارات", "تصعيد", "اشتباك", "اشتباكات",
  "صاروخ", "صواريخ", "هجوم", "عسكري", "احتلال", "غزو", "جيش",
  "إسرائيل", "غزة", "لبنان", "إيران", "اليمن", "الحوثي", "حزب الله",
  "البحر الأحمر", "قناة السويس", "ميناء", "حصار",
  "war", "strike", "missile", "attack", "invasion", "military",
  "israel", "gaza", "iran", "lebanon", "yemen", "houthi", "red sea", "suez",
];

const MACRO_RISK_KEYWORDS = [
  "تضخم", "ركود", "أزمة", "انهيار", "تخفيض تصنيف", "احتياطي",
  "سعر صرف", "تعويم", "أسعار الفائدة", "رفع الفائدة",
  "inflation", "recession", "crisis", "downgrade", "rate hike",
];

function hasAny(text: string, keywords: string[]): string | null {
  const lower = text.toLowerCase();
  for (const kw of keywords) {
    if (lower.includes(kw.toLowerCase())) return kw;
  }
  return null;
}

export const Route = createFileRoute("/api/public/hooks/news-watchdog")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();

          // 1. اجلب آخر ساعة من الأخبار
          const { data: news } = await supabaseAdmin
            .from("news_sentiment")
            .select("id, symbol, headline, sentiment, sentiment_score, impact_level, published_at, created_at")
            .gte("created_at", since)
            .order("created_at", { ascending: false })
            .limit(200);

          if (!news || news.length === 0) {
            return Response.json({ ok: true, reviewed: 0, message: "no fresh news" });
          }

          // 2. اجلب آخر التنبؤات لنفس الأخبار (لو موجودة)
          const newsIds = news.map((n) => n.id);
          const { data: forecasts } = await supabaseAdmin
            .from("news_impact_forecasts")
            .select("news_id, symbol, category, horizon, expected_direction, expected_magnitude_pct, confidence, baladi_summary, is_rights_related")
            .in("news_id", newsIds);

          const fcByNewsId = new Map<string, NonNullable<typeof forecasts>[number]>();
          for (const f of forecasts ?? []) {
            if (f.news_id) fcByNewsId.set(f.news_id, f);
          }

          // 3. حدد فرص الشراء الفورية:
          //    - sentiment إيجابي قوي (>=0.6) OR impact_level=high مع sentiment موجب
          //    - أو forecast direction=up مع ثقة >=70%
          type BuyOpp = {
            symbol: string; headline: string; score: number;
            reason: string; baladi: string | null; magnitude: number | null;
          };
          const buyOpps: BuyOpp[] = [];
          const seenSymbols = new Set<string>();

          for (const n of news) {
            if (!n.symbol || n.symbol === "EGX30" || n.symbol === "MARKET") continue;
            if (seenSymbols.has(n.symbol)) continue;

            const fc = fcByNewsId.get(n.id);
            const sentScore = Number(n.sentiment_score ?? 0);
            const isHighImpact = n.impact_level === "high";

            let qualifies = false;
            let reason = "";
            let score = 0;

            if (fc && fc.expected_direction === "up" && Number(fc.confidence ?? 0) >= 70) {
              qualifies = true;
              score = Number(fc.confidence);
              reason = `تنبؤ صعود بثقة ${fc.confidence}% (${fc.category}, ${fc.horizon})`;
            } else if (sentScore >= 0.6 && (isHighImpact || sentScore >= 0.75)) {
              qualifies = true;
              score = Math.round(sentScore * 100);
              reason = `خبر إيجابي قوي (sentiment ${sentScore.toFixed(2)}${isHighImpact ? ", تأثير عالي" : ""})`;
            }

            if (qualifies) {
              buyOpps.push({
                symbol: n.symbol,
                headline: n.headline ?? "",
                score,
                reason,
                baladi: fc?.baladi_summary ?? null,
                magnitude: fc?.expected_magnitude_pct != null ? Number(fc.expected_magnitude_pct) : null,
              });
              seenSymbols.add(n.symbol);
            }
          }
          buyOpps.sort((a, b) => b.score - a.score);

          // 4. حدد مخاطر الحرب/الجيوسياسة
          type RiskItem = { headline: string; symbol: string; matched: string; category: "war" | "macro"; sentScore: number };
          const risks: RiskItem[] = [];
          const seenHeadlines = new Set<string>();
          for (const n of news) {
            const headline = (n.headline ?? "").trim();
            if (!headline || seenHeadlines.has(headline)) continue;

            const warHit = hasAny(headline, WAR_KEYWORDS);
            const macroHit = !warHit ? hasAny(headline, MACRO_RISK_KEYWORDS) : null;

            if (warHit || macroHit) {
              risks.push({
                headline,
                symbol: n.symbol ?? "MARKET",
                matched: (warHit ?? macroHit)!,
                category: warHit ? "war" : "macro",
                sentScore: Number(n.sentiment_score ?? 0),
              });
              seenHeadlines.add(headline);
            }
            if (risks.length >= 8) break;
          }

          // 5. ابعت تليجرام (لو في حاجة تستاهل)
          let telegram: { ok: boolean; error?: string } | null = null;
          if (buyOpps.length === 0 && risks.length === 0) {
            return Response.json({
              ok: true, reviewed: news.length, buys: 0, risks: 0,
              message: "no actionable signals",
            });
          }

          const lines: string[] = [];
          lines.push("🛡️ <b>مراقب الأخبار</b> — تحليل فوري");
          lines.push("");

          if (buyOpps.length) {
            lines.push("🎯 <b>فرص شراء محتملة (من الأخبار):</b>");
            for (const b of buyOpps.slice(0, 5)) {
              const mag = b.magnitude != null ? ` · متوقع ${b.magnitude > 0 ? "+" : ""}${b.magnitude.toFixed(1)}%` : "";
              lines.push(`🟢 <b>${escapeHtml(b.symbol)}</b> — قوة ${b.score}%${mag}`);
              lines.push(`  📰 ${escapeHtml(b.headline.slice(0, 110))}`);
              lines.push(`  💡 ${escapeHtml(b.reason)}`);
              if (b.baladi) lines.push(`  🗣️ <i>${escapeHtml(b.baladi.slice(0, 130))}</i>`);
            }
            lines.push("");
            lines.push("<i>⚠️ ده ترشيح أولي من الأخبار بس — راجع الفني و الـ daily-pick قبل الشراء.</i>");
            lines.push("");
          }

          if (risks.length) {
            const warRisks = risks.filter((r) => r.category === "war");
            const macroRisks = risks.filter((r) => r.category === "macro");

            if (warRisks.length) {
              lines.push("⚠️ <b>تنبيه مخاطر جيوسياسية (قد تأثر على البورصة):</b>");
              for (const r of warRisks.slice(0, 5)) {
                lines.push(`🔴 ${escapeHtml(r.headline.slice(0, 130))}`);
                lines.push(`   <i>كلمة مفتاحية: ${escapeHtml(r.matched)}</i>`);
              }
              lines.push("");
            }
            if (macroRisks.length) {
              lines.push("📉 <b>تنبيه مخاطر كلية (Macro):</b>");
              for (const r of macroRisks.slice(0, 5)) {
                lines.push(`🟠 ${escapeHtml(r.headline.slice(0, 130))}`);
                lines.push(`   <i>كلمة مفتاحية: ${escapeHtml(r.matched)}</i>`);
              }
              lines.push("");
            }
            lines.push("<i>🛡️ راجع مراكزك المفتوحة و خذ بالك من stop-loss.</i>");
          }

          telegram = await sendTelegram(lines.join("\n"));

          return Response.json({
            ok: true,
            reviewed: news.length,
            buys: buyOpps.length,
            risks: risks.length,
            telegram,
          });
        } catch (e) {
          console.error("[news-watchdog] error", e);
          // Fail-open
          return Response.json({ ok: false, error: (e as Error).message }, { status: 200 });
        }
      },
    },
  },
});