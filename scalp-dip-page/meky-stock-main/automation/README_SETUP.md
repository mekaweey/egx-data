# إعداد التغذية الأوتوماتيكية للبيانات (بدون جهاز، مجاني)

## الفكرة
نداء HTTP واحد لـ TradingView scanner يجلب **السوق المصري كله** (~296 سهم) بـ:
افتتاح/أعلى/أدنى/إغلاق/حجم — ويكتبها في جدول `daily_candles` مباشرة.
سعر الافتتاح محفوظ عند البورصة — التوقيت المتأخر لا يؤثر على صحته.

## خطوات الإعداد على GitHub (مرة واحدة — 5 دقائق)
1. أنشئ **مستودع خاص (Private)** جديداً على GitHub (مثلاً `egx-data-sync`).
2. ارفع إليه الملفين: `automation/tv_market_sync.cjs` و `automation/momentum-weekly-cron.yml`
   (انسخ الـ yml داخل `.github/workflows/` في المستودع — GitHub يشغل الـ workflows من هناك فقط):
   ```
   egx-data-sync/
   ├── .github/workflows/momentum-weekly-cron.yml
   └── tv_market_sync.cjs
   ```
3. في المستودع: Settings → Secrets and variables → Actions → **New repository secret**:
   - الاسم: `SUPABASE_URL` والقيمة: نفس قيمة `.env` في المشروع
   - الاسم: `SUPABASE_SERVICE_ROLE_KEY` والقيمة: نفس قيمة `.env` في المشروع
4. تبويب **Actions** → فعّل workflows (يشتغل تلقائياً حسب الجدول).
5. اختبار يدوي فوري: Actions → اختر الـworkflow → **Run workflow** → شغّله وراقب
   النتيجة: `DONE <date>: 296 candles upserted`.

## الجدولة (مدمجة في ملف الـyml)
- **الأحد-الخميس 12:45 UTC** = بعد إغلاق البورصة في توقيت الصيف والشتاء → شمعة الإغلاق
- **الأحد 08:40 UTC** = بعد افتتاح البورصة في التوقيتين → لقطة الافتتاح لقاعدة الفجوة

## البدائل المحلية (اختياري)
- **Task Scheduler على ويندوز** (لو الجهاز شغال يكفي): شغّل `register-weekly-sync-task.ps1` مرة واحدة.
- **الاستقصاء اللحظي كل 5 دقائق أثناء الجلسة**: نفس سكريبت المزامنة بمهمة متكررة —
  مجاني، ويغطي "شبه-اللحظية" للسوق كله.

## مصادر البيانات الثلاثة (احتياط متبادل لنفس الجدول)
1. TradingView scanner (الأساس — نداء واحد للسوق كله)
2. الإكستنشن (marketwatch/live_ticks) — يملأ فقط ما فات السكانر
3. تصدير TradingView اليدوي (`backfill_from_tv.cjs`) — لسد أي فجوة تاريخية
