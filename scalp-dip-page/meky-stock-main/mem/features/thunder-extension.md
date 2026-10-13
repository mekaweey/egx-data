---
name: Thunder Chrome Extension Plan
description: Full architecture and safety plan for Chrome extension that reads live Thunder prices and (later) automates buy/sell orders for same-session sharia stocks
type: feature
---

# Thunder Extension — خطة كاملة

## الهدف
حل مشكلة الـ slippage والتأخير اليدوي في تنفيذ صفقات الـ scalp على الأسهم اللي عليها "بيع نفس الجلسة" في تطبيق ثاندر. الـ Extension يقرأ الأسعار اللحظية وينفذ الأوامر تلقائياً بسرعة بشرية (4-10 ثواني، مش 50ms عشان مايتمسكش).

## معمارية الاتصال مع ثاندر
ثاندر بيستخدم **Long-Polling** (مش WebSocket):
- Endpoint: `lp?id=379190&pw=<token>&ser=<counter>&ns=...`
- الـ `ser` بيزيد +1 كل request
- الـ response فيه كل الـ 100 سهم في كل round
- **طريقة الـ interception:** override `window.fetch` في content script، اقرأ الـ response قبل ما يوصل للـ frontend

## المراحل الثلاث

### مرحلة 1 — Read-Only (صفر مخاطرة، 2-3 أيام)
- content script يـ intercept long-polling responses
- يبعت كل tick للسيرفر عبر WebSocket
- يتخزن في `live_ticks` table
- الاستراتيجية تستخدمه للـ backtest الأدق

### مرحلة 2 — Semi-Auto مع Telegram confirmation (مخاطرة منخفضة جداً، 3-4 أيام)
- لما تجي إشارة → Extension يفتح نافذة الشراء بكل البيانات (مش يضغط)
- يبعت Telegram: "اضغط /confirm خلال 30 ثانية"
- لو وافقت → يضغط شراء بحركة ماوس طبيعية

### مرحلة 3 — Full-Auto بكل الحمايات (مخاطرة منخفضة، 4-5 أيام)
- نفس مرحلة 2 بدون تأكيد يدوي
- بكل safety guards (تحت)

## Human Mimicry (عشان مياخدش بان)
- تأخير عشوائي 1.5-4.5 ثانية بين كل خطوة
- حركة الماوس بـ Bezier curve (مكتبة ghost-cursor)
- الكتابة حرف-حرف كل 80-200ms
- نافذة تنفيذ مرنة (إشارة 9:30 → تنفيذ بين 9:30 و 9:33 عشوائي)
- أقصى 3 صفقات/يوم
- ميشتغلش أول 5 دقايق ولا آخر 5 دقايق من السوق
- استخدم نفس البروفايل الطبيعي للمستخدم

## Safety Guards (لا يمكن إلغاؤها)
1. **Kill switch** — زرار في popup يوقف كل شيء
2. **Telegram /stop** — رسالة توقف الـ Extension
3. **Daily limits** — max 3 trades, max 3% daily loss, max 30% capital/trade
4. **Whitelist صارمة** — قائمة الأسهم المسموحة (الـ "بيع نفس الجلسة") فقط
5. **Pre-trade sanity checks:**
   - السعر اللي بيشتري بيه ±2% من السوق
   - الكمية × السعر < الحد الأقصى
   - اسم السهم في الـ form == المطلوب
   - الرصيد كافي (يقرأه من الواجهة)
6. **Pre-trade Telegram 5s window** — يقدر يلغي
7. **Audit log + screenshot** لكل عملية
8. **End-of-day force-sell** — cron 14:00 يبيع كل المراكز المفتوحة

## Error Recovery
- WebSocket heartbeat كل 30s
- Queue في extension storage للإشارات لو النت قطع
- Fallback: قراءة مباشرة من Supabase كل 5s لو السيرفر فاصل
- AI self-healing للـ selectors (Gemini يقرأ HTML ويحدد الزرار)
- Wait-for-selector with timeout + retries
- Auto-detect modals/popups ويقفلهم
- Verify state change بعد كل click، retry مرة واحدة
- Pre-flight check: يجيب المراكز المفتوحة وقت التشغيل
- Auto-restart لو crash + state persistence

## معلومات لسه ناقصة من المستخدم (قبل البدء)
1. ~~Response sample من `lp?id=...`~~ ✅ JSONP `pRTLPCB(serial, [{t:"d", d:{b:{p:"marketFeed/<uuid>/price", d:<value>}}}])`
2. URL: `web.thndr.app/ar/assets/<uuid>` — صفحة كل سهم بالـ UUID
3. ~~Watchlist mapping~~ ✅ `GET watchlist?market=egypt` يرجع array فيه `{id(uuid), symbol, name, feed:{...}}` لكل سهم. الحقول المهمة في feed: `price`, `previous_close`, `min_price_limit`, `max_price_limit`, `day_tradable` (الفلتر الرسمي لـ "بيع نفس الجلسة"), `round_digits`, `market_id`, `day_trade_limit`
4. ~~نافذة الشراء/البيع~~ ✅ Sidebar من اليمين، فيها: عنوان "شراء/بيع <SYMBOL>"، الرصيد المتاح، dropdown "نوع الطلب" (3 خيارات: سعر السوق / سعر محدد / طلبات متقدمة)، زرار "مراجعة الطلب" أسود، "إلغاء الطلب"
5. Screenshot الفورم بعد اختيار "سعر السوق" (المتغيرات: input كمية أو مبلغ) — لسه
6. ~~Screenshot modal "مراجعة الطلب"~~ ✅ كارت فيه: عنوان "شراء/بيع <SYMBOL>"، بانر "تبقى لديك عملية تداول مجانية"، الكمية (مثلا "1 اسهم @ 7.84 جنيه")، نوع الطلب، رسوم Thndr (مشطوبة + EGP 0.00)، رسوم الأطراف الأخرى، المجموع التقديري، زرار **"أكد الطلب"** أسود (التأكيد النهائي)، "إلغاء الطلب"
   ثم success card أخضر: "تم إرسال الطلب بنجاح!" + زرار "تم!"
7. Screenshot صفحة "الطلبات" (من النافبار فوق) — لسه

**ملحوظة:** قائمة "بيع نفس الجلسة" مش محتاجة قائمة يدوية — `feed.day_tradable === true` هو الفلتر الرسمي من ثاندر نفسه.

## DOM Selectors (من الـ screenshots)
- زرار شراء: أسود `<button>` نص "شراء" — في أعلى الصفحة
- زرار بيع: white outlined `<button>` نص "بيع"
- Dropdown نوع الطلب: نص placeholder "اختار"
- زرار التنفيذ: أسود نص "مراجعة الطلب"
- ملاحظة: ثاندر بيستخدم React (SPA) — الـ selectors محتاجة data-testid أو aria-label. لو مفيش هنعتمد على text content + tag (`button:has-text("شراء")`)

## Stack
- **Extension:** Manifest V3, content script + background service worker + popup
- **Backend:** TanStack Start server fn + WebSocket route + Supabase (live_ticks جاهز)
- **Telegram:** عبر الكونيكتور الموجود (TELEGRAM_API_KEY)
- **Self-healing AI:** Gemini عبر LOVABLE_API_KEY

## مخاطر معترف بها (Honest)
- شروط استخدام ثاندر بتحظر "automated trading" — في احتمال (ضعيف) للـ ban
- التخفيف: human mimicry + حدود يومية محافظة + مرحلة semi-auto الأولاً
- مفيش ضمان 100% — الضمان الوحيد للصفر هو API رسمي (مش موجود)