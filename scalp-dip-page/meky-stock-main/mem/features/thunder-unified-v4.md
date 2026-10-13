---
name: Thunder Unified Extension v4
description: v4.1.80 — أولوية L2 لأسهم الإشارات (70% + 300s dwell)، endpoint /recent-signal-symbols، random 30% + 90s
type: feature
---

## v4.2.44 (2026-08-03) — تشخيص تغطية Marketwatch بعد الإغلاق
- أضيف زر تشخيص يدوي في popup يرسل طلب Marketwatch واحدًا فقط من تاب Thunder X المسجّل دخولها، ويتجاوز بوابة ساعات السوق للاختبار فقط.
- التشخيص لا يرسل الرد للسيرفر ولا يغيّر polling الطبيعي، ويعرض HTTP، زمن الرد، عدد الرموز، واكتمال price/volume/trades/bid/ask/quantities/high/low.
- الدليل من قاعدة البيانات: آخر دورات `marketwatch_snapshots` كانت 276 رمزًا في كل دورة، وكل الحقول الأساسية المذكورة موجودة لـ276/276؛ آخر timestamp المقاس `2026-08-03 11:44:19.314+00` تقريبًا.
- الدليل من HAR الحقيقي: 3 أجسام ردود، كل منها 279 أصلًا؛ parser الحالي قبل 277 رمزًا مميزًا في كل رد، وتغير hash وإجمالي volume/trades بين الردود.
- الحد المؤكد: دورات Marketwatch الفعلية المسجلة كانت كل ~60.2 ثانية، ولذلك لا يجوز وصفها بأنها ثانية‌بثانية. Firebase `live_ticks` غطى 97 رمزًا فقط في نافذة 700 ثانية المنتهية `2026-08-03 11:37:40.114+00`.
- تدقيق الحقول أثبت أن رد HAR يحتوي 16 حقلًا غير ممثل بأعمدة مستقلة، لكنها محفوظة جزئيًا داخل `raw`. لذلك ممنوع قول "كل البيانات" بمعنى كل حقول الرد إلا بعد تدقيق التخزين الكامل.

## v4.2.43 (2026-08-03) — الحل المؤكد لتغطية كل الأسهم
- الدليل من HAR ثاندر X (5 ساعات، 27 يوليو): `GET https://prod.thndr.app/assets-service/assets/marketwatch?market=egypt` استُدعي 188 مرة، متوسط حجم الرد 308KB، median gap 95s، **كل الردود 200 وصفر 429 في التسجيل كله**. الرد يغطي كل أسهم مصر (276 رمز) بكل الحقول (volume/bid/ask/high/low) وهو **مستقل تمامًا عن الصفوف الظاهرة (virtualization)**.
- بديل `krakend-thndr-x/securities/v1/price`: 10 أصول/طلب (2014 بايت) → 28 طلب لكل دورة مقابل طلب واحد للـ marketwatch ⇒ marketwatch أفضل بوضوح. (الـHAR مُنقّى بدون أجسام الردود، فمحتوى price غير مؤكد.)
- التنفيذ: poller نشط داخل `page-script.js` (MAIN world) كل 20 ثانية بنفس الطلب الأصلي (credentials + authorization المُلتقط)، مع backoff تصاعدي عند 429/5xx حتى 5 دقائق، ويعمل فقط داخل ساعات EGX (الأحد–الخميس 09:55–14:40 القاهرة) وفي التاب الأعلى فقط.
- المتبقي على الـFirebase feed (live_ticks) لا يزال محصورًا بالصفوف المشتركة؛ التغطية الكاملة تأتي الآن من marketwatch كل 20 ثانية بدل 60-95 ثانية.
- ZIP: `public/thunder-extension-v4.zip` — SHA256 `5d432518903d13664e0bec518f8290702f1618538d657fa344361343a38b1d98`.

## v4.2.42 (2026-08-02)
- القياس الحي الساعة 10:32 UTC أثبت أن v4.2.41 فشلت: 24 سهم فقط خلال آخر 10 دقائق. السبب أن Thunder X تقيس الـvirtualization من حاوية داخلية ثابتة، وليس `window.innerHeight`.
- الحل الجديد يكتشف حاوية السكرول فعليًا من قياسات DOM، يوسعها في الخلفية، ويسجل `beforeRows` و`mountedRows`. لا سكرول، لا ضغط، ولا طلب HTTP جديد.
- لو الحاوية غير موجودة لا يغير الصفحة ويرجع `watchlist_scroll_container_not_found`. عند إظهار التاب أو فصل CDP يرجع الـinline styles الأصلية.

## v4.1.91 (2026-07-09)
- إصلاح `getL2PanelState(trigger, uuid)`: وجود L2 snapshot فريش خلال 30 ثانية يرجّع `panel=open` بسبب أن Thunder لا يرسل market-depth إلا والقائمة مفتوحة فعلاً.
- التغيير لا يضيف selectors ولا ضغط ولا أي طلب جديد لثاندر؛ هو تصحيح تشخيص/قرار فقط قبل DOM fallback.
- كل استدعاءات `getL2PanelState` المهمة في مسار `l2persist.ensure` و `ensureL2SnapshotForUuid` تمرر `uuid` عشان JUFO/GIHD/AFMC وغيرها لا تظهر `unknown` وهي عندها snapshots حديثة.

## v4.1.83 (2026-07-08)

## v4.1.90 (2026-07-09)
- إصلاح مصيدة "unknown → no blind click" (v4.1.88 كانت strict جداً). الفرع الجديد في `ensureL2SnapshotForUuid` dwell loop: لو `state=unknown` **و** ما اتلقّطش أي L2 snapshot طول الـ dwell دي (`Number.isFinite(getL2AgeMs)===false`) **و** مر ≥20s على بداية الـ dwell → ضغط واحد بـ `preciseClick` على نفس `findL2AccordionLink()`. لأن Thunder دايماً بتجيب market-depth لما القائمة تفتح فعلاً، فوجود 0 snapshots دليل قاطع إن القائمة مقفولة حتى لو الـ DOM signals مش موجودة.
- التابات الشغالة (عندها snapshots) عمرها ما بتدخل الفرع ده → صفر أثر عليها.
- rate-limit: نفس `reclickIntervalMs=15s` و `maxReclicks` القديمين. مفيش blind click بإحداثيات، مفيش selector جديد.
- ما اتغيّرش: `getL2PanelState` نفسها، `findL2AccordionLink`، cycle الـ background، `PERSIST_MAX_TABS=25`.
- مشكلة معروفة لسه: ADIB/EFID (القائمة اتقفلت والاكستنشن حاسسها مفتوحة) — محتاج تشخيص live.
- ZIP: `public/thunder-extension-v4.zip` — SHA256 `e9c1e12ddffc87630d14f59c0b43f32b743736e5c265c3f4d743809b1589ee1a`.
- Endpoint `/api/public/hooks/recent-signal-symbols` وسّع: من (30د إشارات) إلى (كل إشارات اليوم since Cairo open + open paper_trades + top-15 day_tradable الأنشط اليوم عبر RPC `top_active_day_tradable_today`).
- RPC: `security invoker`, execute مقصور على `service_role`.
- `PERSIST_MAX_TABS` 20 → **25**. متوسط تابات مضمون **15-23/يوم** (من بيانات آخر 11 يوم).
- ZIP: SHA256 `ad89e6edf1321dff8aa383c0c9795f30fdcdfd575cc7fd5484e8dbba9aeca7b7`.

## v4.1.88 (2026-07-09)
- إصلاح L2 flicker: ممنوع الضغط على trigger بتاع L2 إلا لو DOM يؤكد أن القائمة **مقفولة** (`aria-expanded=false` أو content hidden).
- لو L2 مفتوحة لكن snapshot اتأخر: لا نضغط عليها، لأن الضغط وقتها بيقفلها بالغلط.
- كل تاب persistent يعمل health-check محلي كل ثانية داخل `ensureL2SnapshotForUuid`، والـ background يعمل ensure دوري كل 15ث.
- رد `l2persist.ensure` بيرجع `panelState`, `panelReason`, `ageMs` للتأكد من حالة كل تاب.
- ZIP: `public/thunder-extension-v4.zip` — SHA256 `f95315c2b305676168a16069bc7922d63885819159aecf75ef048729da2f7652`.

## v4.1.80 (2026-07-06)
- Endpoint جديد: `/api/public/hooks/recent-signal-symbols` — يرجع الرموز اللي عليها إشارة `would_open` آخر 30د + مراكز `paper_trades` مفتوحة. Read-only، بدون PII، بدون auth.
- `extension-v4/background.js` → `pickL2CycleUuid()` أصبحت async: 70% تفضيل رموز الإشارات (لما تكون متاحة في `mapping`)، 30% random. Cache للـ endpoint 60s داخل الـ service worker.
- URL hash `#l2cycle-signal` → `keepOpenMs=300_000` (بدل 90s) + failsafe 320s. للـ random لسه 90s + 105s.
- صفر استدعاءات إضافية لثاندر. نفس السقف (30/ساعة)، نفس الـ cooldown (10د/سهم)، نفس التباعد (2-4د بين التابات).
- ZIP: `public/thunder-extension-v4.zip` — SHA256 `abdf2b523b34495aa340f6c18c4dcef9fc9a304214c5c516637918437de563cb`.
- Cron `compute-scalp-feasibility-15m` كل 15د من 8-13 UTC (10ص-3م القاهرة) موجود بالفعل ويعمل.