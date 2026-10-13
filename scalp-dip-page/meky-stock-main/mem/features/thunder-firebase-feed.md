---
name: Thunder Firebase Realtime Feed
description: قنوات Firebase LP اللي ثاندر بيبعت عليها بيانات لحظية وما هو غير موجود
type: feature
---

# مصدر البيانات اللحظية عند ثاندر (Firebase Long-Polling)

مثبت من HAR ملتقط 2026-07-20 على `s-gke-usc1-nssi3-29.firebaseio.com/.lp` (211 frame، 420 path فريد، namespace `thndr-api`).

## الحقول اللي بتوصل لحظياً عبر Firebase (push)
كل sub على `marketFeed/<uuid>/<field>`. الحقول اللي ظهرت فعلياً:
- `price`
- `highest_bid`  ← موجود لحظياً
- `lowest_ask`   ← موجود لحظياً
- `previous_close`

يعني الـBid/Ask top-of-book متاحين push من Firebase بدون أي polling — نفس آلية `price`.

## الحقول اللي مش موجودة في Firebase (صفر ظهور في 211 frame)
- `total_volume` / `volume`
- `total_trades`
- `total_value`
- `total_bids` / `total_asks` (الأعداد الإجمالية)
- أي L2 depth

## نتيجة عملية
- Volume + trade counts + L2 depth: مفيش feed لحظي عند ثاندر. الوسيلة الوحيدة هي HTTP `/assets-service/marketwatch` كل ~60ث لما صفحة الـwatchlist مفتوحة. عشان كده v4.2.22 (auto-refresh عند stale) هو أفضل ما يمكن.
- Bid/Ask top-of-book: ممكن نضيف subscriptions لـ`highest_bid` و `lowest_ask` في `page-script.js` بنفس آلية الـprice — feed لحظي بدون refresh، صفر polling، صفر خطر 429.

## HAR reference
- 482 entry إجمالي، 211 Firebase LP، صفر WebSocket (Firebase بيستخدم LP)
- URL نمطي: `s-gke-usc1-nssi3-29.firebaseio.com/.lp?id=...&pw=...&ser=...&ns=thndr-api`
- المسارات كلها تحت `marketFeed/<uuid>/{price|highest_bid|lowest_ask|previous_close}`
