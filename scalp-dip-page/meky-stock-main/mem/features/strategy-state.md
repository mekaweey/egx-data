---
name: strategy-state
description: الحالة النهائية للاستراتيجية المعتمدة في المشروع وقواعد الـ backtest
type: feature
---
## النسخة النهائية المعتمدة
**V2.2-breadth** هي النسخة المعتمدة (walk-forward verified على 10 نوافذ × 6 شهور، sharia stocks):
- SMA-200 filter (long-term uptrend) — من V2.1
- April size ×0.5 — من V2.1
- **Breadth filter جديد**: مينفعش شراء لو أقل من 40% من الأسهم فوق SMA-50
- النتيجة (10 نوافذ، بدون عمولة):
  - median +87%, متوسط +68%, **أسوأ -4.8%** (كان -21.6% بدون الفلتر)
  - max DD متوسط 12.0% (كان 15.1%)
  - الفلتر بيتنفذ في `src/lib/scan/rule-gate.server.ts` كـ HARD rule
  - الـ breadth بيتحسب في `src/lib/market-data/breadth.server.ts` (cache 30 دقيقة)

**V2.2 (Partial Exit + Breakeven Trailing) مرفوضة** — walk-forward أثبت إنها بتقلل CAGR من 86.5% لـ 63.4% (-23%). الـ partial عند +5% بيقطع winners اللي بتوصل +10%. ممنوع تطبيقها كقاعدة آلية.

**ملاحظة:** smart-exit hook بيبعت **اقتراح** تليجرام للمستخدم يبيع نص يدوياً — ده آمن (المستخدم يقرر)، مش نفس الـ partial الآلي اللي اتختبر هنا.

## قواعد الـ Backtest
- **ممنوع أي عمولة** - Thunder ببلاش، المستخدم أكد ده أكتر من مرة.
- **ممنوع أي شيء تقديري** - كل اختبار لازم يكون حقيقي على بيانات `daily_candles` فعلية.
- **Compound** - أي ربح يتحط في اليوم التالي (تجربة 100 ألف جنيه).
- Walk-forward فقط، ممنوع in-sample optimization.

## السكريبتات الأساسية
- `scripts/walk-forward-v21.ts` - الاختبار اللي أكد V2.1
- `scripts/wf-v22.ts` - الاختبار اللي رفض V2.2 (CAGR -23%)
- `scripts/wf-breadth-filter.ts` - الاختبار اللي أكد V2.2-breadth (10 نوافذ × 4 thresholds)
- `scripts/real-compound-sim.ts` - محاكاة compound حقيقية

## السوق المستهدف
EGX (السوق المصري) - 54 سهم تقريباً.