# Mubasher EGX — Project Handoff (آخر تحديث: 2026-09-14)

استخدم الملف ده لفتح شات جديد بدل المحادثة القديمة (المحادثة الطويلة هي سبب إيرور
BackendAdmissionRejected — سقف السيرفر 200K توكن والمحادثة وصلت 420K).

## الهدف
أرشيف أخبار Mubasher EGX مُتحقق منه في Supabase، واختبار هل الأخبار الموسومة بالكلمات
المفتاحية تتنبأ بعوائد السهم يوم+1 ويوم+3.

## المُنجَز (كله مكتمل ومتحقق منه)
- **الأرشيف**: 5,677 مقال فريد في `public.mubasher_news` (2025-04-30..2026-09-12، 228 صفحة،
  التزام كامل بالـ robots: تأخير 5.5s، صفحات SSR فقط). التحقق A–D كله ناجح
  (0 صفوف ناقصة، 0 تكرارات، 0 فجوات أقل من 5.5s).
- **Stage 3/3B (الوسم)**: 536 صف معرّف بالرمز. الـ tags النهائية:
  profit_positive=803، profit_negative=658، dividends=325، dividends_bonus=174 (جديد)،
  untagged=2,423. صيغ الـ Arabic المضافة: تتحول للربحية/للخسارة، صافي الربح، توزيعات نقدية،
  أسهم مجانية. الـ fuzzy matching اترفض عن قصد (الأخطاء المطبعية الحقيقية = 2 كلمة فقط).
- **دمج الأسعار** (`_mb_stage4a2.cjs`): أولوية لـ ticks الخاصة بنا لكل (symbol,date)،
  والـ CSV بتاع TradingView (221 رمز، 2026-04-26..2026-09-09) يكمل الباقي.
  قاعدة usable للـ TV days: `open_minute<=610 && close_minute>=855 && n_bars>=20`.
  الناتج: `_mb_days.json` = 229 رمز / 92 يوم / 15,829 يوم-رمز usable.
  (النسخة القديمة tick-only محفوظة في `_mb_days_ticksonly.json`).
- **Stage 4B النهائي** (`_mb_stage4b_join.cjs`): 68 حالة قابلة للاختبار
  (كانت 2 قبل توسيع النافذة)، baseline = 15,734 يوم-رمز بدون أخبار، win-rate 39.7%.

## النتيجة النهائية (الصادقة — مفيش تجميل)
- **مفيش أي tag عنده edge مثبت.** profit_positive (n=26): متوسط يوم+1 = −0.93%،
  win-rate 34.6% (أقل من الـ baseline 39.7%) — الأرباح الإيجابية priced-in يوم الإعلان
  واليوم التالي بيعدي بتصحيح.
- profit_negative (n=21): −0.83% يوم+1. dividends (n=3): +0.22%.
- **dividends_bonus (n=3 فقط!)**: +3.24% يوم+1 / +6.86% يوم+3 / win 67% —
  الرقم الوحيد المثير لكن 3 مشاهدات غير كافية لأي قرار.
- باقي التags: n ≤ 3 لكل واحد (share_listing=1، ma_deal=1، contract_win=1،
  stake_change=3، treasury_shares=1، ipo=0) — لا استنتاج ممكن.

## الملفات النهائية للتسليم
- `news_signal_summary.csv` (37 سطر) و `news_signal_test_results.csv` (68 حالة كاملة)
- `_mb_stage4b.out` (اللوج النهائي)

## الملفات الأساسية
- سكربتات: `_mb_stage4a2.cjs` (دمج الأسعار)، `_mb_stage4b_join.cjs` (الانضمام+الإحصاء)،
  `_mb_stage3b_tags.cjs` (الوسم)
- بيانات: `_mb_archive_cache.jsonl` (5,677)، `_mb_tags.json`، `_mb_symbol_map.json`،
  `_mb_days.json`، `D:\egx_daily_prices_tradingview.csv` (مدخل خارجي)
- DB: `supabase/migrations/20260912000000_mubasher_news_archive.sql` (قابل لإعادة التشغيل)

## لإعادة التشغيل
```
node _mb_stage4a2.cjs
node _mb_stage4b_join.cjs   # يكتب _mb_stage4b.out + news_signal_*.csv
```

## القرار المفتوح الوحيد
توسيع عينة dividends_bonus (174 زوج موسم في الأرشيف، 3 بس ليهم أسعار usable):
يحتاج تاريخ أسعار أقدم من 2026-04-26 من TradingView، أو الانتظار والتراكم.
جلب نصوص المقالات كاملة: **غير مبرر** بالنتائج الحالية.

## قواعد الشغل المتفق عليها
- صدق كامل: أرقام حقيقية حتى لو سالبة، ولا تضخيم لعينات صغيرة.
- أولوية الحقيقة: tick data الخاصة بنا > أي مصدر خارجي.
- لا تعديلات على الـ DB بدون migration قابل لإعادة التشغيل.
