---
name: Never report fake or inflated profits
description: Any profit number must be verified on real tick data, not estimated; admit uncertainty instead of guessing
type: preference
---
المستخدم اتضرر مرات كتير من أرقام ربح طلعت غلط (overfitting, bug, تقدير خيالي).

القواعد:
1. ممنوع أقول "هتكسب X جنيه" إلا لو الرقم متحقق منه على live_ticks حقيقية لنفس اليوم.
2. أي backtest تقديري (Monte Carlo, BB, OHLC-based) = تقديري وبيتقال للمستخدم بوضوح إنه تقديري ومش مضمون.
3. لو الرقم جاي من يوم واحد فقط = مش كافي، لازم أقول كده.
4. لو لقيت bug في اختبار سابق، أعترف فوراً وأقول الرقم الصح.
5. data quality أولاً قبل أي ادعاء بالأرباح: لو الـ data ناقصة/مش متطابقة، النتيجة مش موثوقة.
6. ممنوع أطبق أي استراتيجية على الكود قبل ما أتأكد إنها مش هتضر.

**Why:** كل مرة بقول رقم ربح بيطلع غلط بعدها، والمستخدم بيخسر ثقة.