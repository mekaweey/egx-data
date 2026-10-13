# Project Memory

## Core
سوق الأسهم المصري (EGX) — توصيات + استراتيجيات scalp/swing. Backend: TanStack Start + Supabase + Lovable Cloud.
**الاستراتيجية النشطة الوحيدة = `scalp-dip`** (ملف: `paper-scalp-dip.ts`، صفحة: `/scalp-dip`، strategy id: `scalp-dip`). أثبتت قابلية بيع لحظي 67% **بدون تجميع L2 نهائياً** عبر فوليوم `live_ticks` التراكمي. الدليل: `scripts/_fill_probability.ts` على 26 يوم حقيقي. النتيجة: +680 إلى +1,674 EGP/يوم صافي. ممنوع نهائياً اقتراح L2 gate أو orderbook_snapshots كشرط شراء/بيع لـ scalp-dip. التفاصيل الكاملة والشروط في `mem://features/active-strategy-scalp-dip` — **اقراه قبل أي رد يخص السكالب أو ثاندر أو L2**.
الذاكرة القديمة `mem://features/scalp-instant-exit-requirement` **مُتَجاوَزة** لـ scalp-dip؛ كانت بتخص scalp-mr15 القديم فقط.
ممنوع تطبيق أي تعديل على كود الاستراتيجية قبل اختباره على live_ticks + recommendations فعلاً. لو محايد/سلبي → ماتطبّقوش.
عمولة ثاندر مصر **مقاسة ومؤكدة**: شراء=بيع= 3 ج ثابت + 0.03% × القيمة، Round-trip= 6 ج + 0.06%. ممنوع اقتراح صفقة سكالب أقل من 3,000 ج. سعر البيع الأدنى للتعادل = P×1.0006 + 6/Q. التفاصيل في features/thunder-commission-formula.
المستخدم مشترك في Thunder (live data + news) — متاح للاستفادة.
أي أتمتة في إضافة Thunder لازم تكون آمنة فقط: ممنوع debugger أو صلاحيات خطرة أو طرق قد تعرض الحساب للخطر.
**قبل أي اقتراح تعديل/تحليل/تعطيل استراتيجية: اقرا `mem://decisions-log` الأول** عشان مكررش قرار قديم اتحل أو اقتراح مرفوض. بعد أي قرار جديد → **حدّث الملف فوراً** قبل ما أقول "خلصت".
`dipbuy-s30-tp3-sl1` متعطلة من 2026-07-01. `scalp-mr15` (paper-scalp.ts القديم) موجود في الكود لكن **مش الاستراتيجية النشطة** — النشط الوحيد `scalp-dip`.
**Thunder-only price mode**: كل الأسعار من ثاندر بس (لحظية). ممنوع نهائياً اقتراح رجوع مباشر/investing/egx كمصدر أسعار — بيتأخروا ~10 دقايق فيكسروا الـ scalp. `live-tick-poll` معطل و constraint DB بيرفض أي source غير `thunder_ext`. volume=0/NULL في live_ticks بعد 22/6 = مقصود مش bug.
**Session Log إجباري (كل رد بدون استثناء)**: قبل أول tool call في أي رد → POST رسالة المستخدم لـ `/api/public/hooks/session-log` (kind=message, role=user). قبل ما أختم أي رد → POST ردي (kind=message, role=assistant) + أي تعديل عملته (kind=edit) + أي ملف قريته (kind=read مع key_findings مختصر). التفاصيل الكاملة في `mem://features/session-log`. لو نسيت مرة، أعتذر واعمل catch-up POST في الرد اللي بعده.
الأولوية المطلقة للمستخدم: أي شيء يحدث بينه وبين المساعد يتسجل تلقائياً. لا تعتبر أي رد مكتمل بدون تسجيل user+assistant في Session Log.
Session Log: تحديث الصفحة كل 10 ثواني ليس تسجيل؛ التسجيل الصحيح عبر endpoint محمي + dedupe + audit + Health tab. الدليل = DB + ظهور الصفحة.
ممنوع أقول إن Session Log اتصلح إلا بعد اختبارين ناجحين: DB فيها آخر user+assistant messages، وPlaywright يثبت إن `/session-log` يعرضهم.
**قبل أي رد مهم (فيه تحليل/تعديل/سؤال معقد): اقرا `mem://features/session-log` واتبع الخطوات، وابحث في `session_reads` و `session_edits` قبل ما أقرا ملف تاني مرة أو أكرر تعديل**.
ممنوع أقترح "استنى أيام تجمع بيانات" كحل. لما تفتقد داتا (زي L2) لازم أعرض 2-3 بدائل من بيانات موجودة أو حلول ديناميكية (probe/canary) الأول. الانتظار = آخر خيار.

## Memories
- [Execution restriction](mem/preferences/execution-restriction.md) — منع تنفيذ أي تعديلات تقنية دون طلب صريح من المستخدم
- [Session Log](mem://features/session-log) — الجداول، الـ endpoint، الـ token، شكل الـ POST، الـ Core rule الإجبارية، وخطوات المراجعة قبل كل رد
- [Thunder Commission Formula](mem://features/thunder-commission-formula) — المعادلة المؤكدة بالقياس الحقيقي (3 ج + 0.03% لكل اتجاه)، break-even formula، جدول الكفاءة لأحجام مختلفة، قواعد إجبارية للتوصيات
- [Thunder Extension Plan](mem://features/thunder-extension) — Chrome extension لقراءة الأسعار اللحظية وأتمتة الصفقات، 3 مراحل (read-only → semi-auto → full-auto)، Long-polling interception، human mimicry، safety guards
- [Thunder Orders API](mem://features/thunder-orders-api) — شكل POST/Response الحقيقي لـ orders endpoint (PENDING/NO_FILL captured)، الحقول المهمة، واللي لسه ناقص (FILLED response لما السوق يفتح)
- [Thunder Smart Trade Ledger](mem://features/thunder-smart-trade-ledger) — تتبع صفقات Scalp Live داخل إضافة ثاندر عبر الصفحات والجلسات، وتجهيز البيع وسعر peak-0.01 مع حد أمان
- [Bump and publish version](mem://preferences/bump-and-publish-version) — قاعدة إجبارية: بومت manifest+popup+صفحة /thunder، أعد بناء zip، وتحقق من تطابقهم قبل ما أقول "نزّل"
- [Thunder L2 Endpoint](mem://features/thunder-l2-endpoint) — market-depth URL المؤكد، شكل الـ response، قواعد القراءة السلبية الآمنة (v4.1.64+)
- [Scalp Instant Exit Requirement](mem://features/scalp-instant-exit-requirement) — قرار الشراء = قرار قابلية البيع. فلتر pre-buy L2 إجباري: مافيش L2 مثبت للخروج اللحظي → مافيش شراء
- [Active Strategy scalp-dip (NO L2)](mem://features/active-strategy-scalp-dip) — ⚠️ الاستراتيجية النشطة الوحيدة. أثبتت 67% قابلية بيع بدون L2. شروط الدخول/الخروج، النتائج المختبرة، والكود المتعارض اللي محتاج علاج
- [Decisions Log](mem://decisions-log) — سجل دائم لكل قرار مطبق، اقتراح مرفوض، وحقائق ثابتة. يتحدث بعد كل قرار ويتقرا قبل كل اقتراح تعديل
- [No waiting for data](mem://preferences/no-waiting-for-data) — ممنوع اقتراح انتظار جمع بيانات؛ فكّر في بدائل من بيانات موجودة أو حلول أحسن من المصدر الناقص
- [No flip conclusions](mem://preferences/no-flip-conclusions) — ممنوع أقلب استنتاج سابق بدون دليل أعمق على نفس السؤال الأصلي
- [Thunder Firebase feed](mem://features/thunder-firebase-feed) — الحقول اللحظية push (price/highest_bid/lowest_ask) وإن volume/L2 مش في Firebase
- [No Look-ahead Confirmation](mem/preferences/no-lookahead-confirmation.md) — أي فلتر تأكيد لحظي (بعد X دقيقة) يجب أن يستخدم سعر الدخول الفعلي في لحظة التأكيد وليس سعر الافتتاح منعاً للـ Look-ahead bias

