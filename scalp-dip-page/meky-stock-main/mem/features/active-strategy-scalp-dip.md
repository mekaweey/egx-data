---
name: Active Strategy — scalp-dip (NO L2)
description: الاستراتيجية الوحيدة المعتمدة والمُختبَرة على 26 يوم live_ticks حقيقية. لا تعتمد على تجميع L2 نهائياً. أثبتت 67%+ قابلية بيع لحظي عبر فوليوم live_ticks التراكمي.
type: feature
---

# ⚠️ ⚠️ ⚠️ اقرا ده قبل أي رد يخص السكالب أو ثاندر أو L2 ⚠️ ⚠️ ⚠️

## الاستراتيجية النشطة الوحيدة = `scalp-dip`

**الملف:** `src/routes/api/public/hooks/paper-scalp-dip.ts`
**الصفحة:** `/scalp-dip`
**strategy id في DB:** `scalp-dip`

## القاعدة الذهبية (ممنوع نسيانها أبداً)

**الاستراتيجية دي أثبتت قابلية البيع اللحظي بنسبة ~67% بدون أي تجميع لـ L2 orderbook_snapshots.**

الدليل: `scripts/_fill_probability.ts` — بيقرأ من `live_ticks` (السعر + الفوليوم التراكمي من ثاندر) ويسأل: بعد ما التارجت اتلمس، الفوليوم اللي اتداول عند سعر ≥ TP كام سهم فعلاً؟ لو ≥ 2× حجم مركزنا (20K ÷ سعر الدخول) → البيع اللحظي ممكن. النتيجة على 26 يوم حقيقي: ~67% من إشارات TP-touched قابلة للبيع.

**يعني:**
- ❌ ممنوع اقتراح "لازم L2 قبل الشراء" لـ scalp-dip.
- ❌ ممنوع الاعتماد على `orderbook_snapshots` كشرط شراء/بيع.
- ❌ ممنوع افتراض إن الاكستنشن محتاجة تفتح "معلومات السوق عن المستوى الثاني".
- ✅ الفوليوم التراكمي في `live_ticks` (اللي أصلاً بيتجمع من ثاندر عبر long-polling) هو الدليل الوحيد المطلوب.

## شروط الدخول (validated)
- Universe: `is_sharia = true AND day_tradable = true`
- Warmup: تجاهل أول 5 دقايق (10:00 → 10:05 القاهرة)
- Entry trigger: آخر سعر ثاندر **3% إلى 8%** تحت سعر افتتاح اليوم
- Capital: 20,000 EGP لكل صفقة

## شروط الخروج (validated)
- TP: entry × 1.020 (+2%)
- SL: entry × 0.996 (−0.4%)
- Trail: لما الربح يوصل +0.6% → SL يترفع لـ peak × (1 − 0.4%)
- Time stop: 60 دقيقة
- EOD stop: 14:25 القاهرة أي صفقة مفتوحة تتقفل
- Grace: أول 120 ثانية بعد الدخول ما نطبقش SL/trailing (بيرفع win-rate من 67% → 78%)
- Fill-defense: TP يتحسب "تم" فقط بعد 3 ticks عند/فوق سعر TP

## النتيجة المُختبَرة (26 يوم حقيقي، 2026-06-07 → 2026-07-13)
- سيناريو أسوأ (0.25% slippage): **+680 EGP/يوم صافي**
- سيناريو بدون slippage: **+1,674 EGP/يوم صافي**
- Net of عمولة ثاندر (3 EGP + 0.03% لكل جهة)

## اللي الاكستنشن محتاجة تعمله فعلاً
1. تلقط `live_ticks` من ثاندر long-polling (شغال بالفعل).
2. تشتري لما إشارة `scalp-dip` تظهر.
3. تبيع لما TP/SL/Trail/Time-stop/EOD يتحقق.

**مش محتاجة:** L2 cycle، فتح 25 تاب، market-depth، pre-buy-gate، runTargetSellL2Gate.

## الكود اللي لسه بيتعارض مع الاستراتيجية (تناقض معروف يوم 2026-07-15)
المسارات دي لسه بتفرض L2 gate رغم إن scalp-dip مش محتاجاه:
- `src/routes/api/public/hooks/thunder-positions.ts` سطر ~242 → `runTargetSellL2Gate` عند البيع
- `src/routes/api/public/hooks/sell-watcher.ts` سطر ~53 → نفس الشي
- `src/lib/positions/positions.functions.ts` سطر ~145 → `runPreBuyL2Gate` عند الشراء
- `extension-v4/background.js` سطر ~1906-2001 → L2 cycle بيفتح تابات

**قرار العلاج لسه ما اتاخدش من المستخدم.** لما يجي وقت العلاج: يا نلغي L2 gate من مسارات scalp-dip، يا نخلي strategy id يحدد هل يعدي على gate ولا لأ.

## الاستراتيجيات القديمة (متجمدة، مش نشطة)
- `scalp-mr15` — كانت نشطة قبل scalp-dip؛ محتفظة في الكود لكن مش هي المعتمدة.
- `paper-scalp.ts` (`scalp-mr15`) — بيستخدم L2 gate؛ ده كود قديم مش الاستراتيجية النشطة.
- `dipbuy-s30-tp3-sl1` — متعطلة من 2026-07-01.

## الذاكرة القديمة المُتَجاوَزة
`mem://features/scalp-instant-exit-requirement` كانت بتقول "L2 قبل الشراء إجباري". دي كانت صحيحة **قبل** ما نثبت الـ 67% عبر live_ticks. بعد إثبات scalp-dip، الشرط ده **مش مطبق على scalp-dip**. الذاكرة القديمة محتفظة كأرشيف لـ paper-scalp/scalp-mr15 القديم فقط.