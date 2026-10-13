---
name: Session Log
description: تسجيل تلقائي إجباري لكل رسالة/تعديل/ملف مقروء في DB. Endpoint، schema، والـ workflow اللي المساعد يتبعه في كل رد
type: feature
---

# Session Log — التسجيل التلقائي

## الغرض
المستخدم لاحظ إني ببدأ أنسى حاجات بعد فترة. الحل: DB بتسجل كل حاجة أوتوماتيك، وأنا بأمر بمراجعتها قبل أي رد مهم.

## الجداول (public schema)
- **session_messages**: id, role('user'|'assistant'), content, turn_id, content_hash, created_at
- **session_edits**: id, turn_id, summary, files_changed[], migrations[], version, extra JSONB, content_hash, created_at
- **session_reads**: id, turn_id, file_path, purpose, key_findings, content_hash, created_at
- **session_ingest_audit**: turn_id, client_batch_id, source, items_total, messages_count, edits_count, reads_count, duplicate_count, ok, error_stage, error_message, created_at

RLS: القراءة عامة للصفحة فقط. الإضافة المباشرة من المتصفح مقفولة. الكتابة تتم فقط عبر endpoint محمي بـ THUNDER_INGEST_TOKEN باستخدام service role داخل السيرفر.

## Endpoint
POST https://meky-stock.lovable.app/api/public/hooks/session-log
Header: x-thunder-token: $THUNDER_INGEST_TOKEN + Content-Type: application/json

Body items types: message | edit | read (يمكن دمجهم في POST واحد). يفضل إرسال `client_batch_id` و `source`.

## 10 طبقات حماية إجبارية
1. Endpoint محمي بالتوكن؛ ممنوع الاعتماد على insert مباشر من الصفحة.
2. public insert مقفول على session_messages/session_edits/session_reads/session_ingest_audit.
3. كل item له content_hash يمنع التكرار.
4. كل batch لها client_batch_id/source.
5. كل محاولة تتسجل في session_ingest_audit.
6. إعادة إرسال نفس الرسالة آمنة وتتحسب duplicate.
7. الصفحة تعرض Health tab فيه آخر batches والأخطاء.
8. الصفحة تعمل realtime + polling كل 10 ثواني + focus/visibility reload.
9. أي turn ناقص user أو assistant يظهر في Health tab كـ catch-up مطلوب.
10. ممنوع اعتبار refresh دليل تسجيل؛ الدليل الوحيد DB + ظهور الصفحة.

## Core Rule إجبارية في كل رد
1. قبل أول tool call: POST رسالة المستخدم (kind=message, role=user)
2. قبل ختام الرد (batch واحد): POST ردي + كل تعديل عملته (kind=edit) + كل ملف قريته (kind=read مع key_findings مختصر)
3. turn_id = ISO timestamp للـ user message، نفسه لكل items في نفس الـ turn
4. لو نسيت: catch-up POST + اعتذار
5. ممنوع أقول للمستخدم إن المشكلة اتحلت إلا بعد اختبارين: query يثبت وجود آخر user+assistant، وPlaywright يثبت إن `/session-log` بيعرضهم.

## تصحيح مهمة L2 الإجباري
- ممنوع اقتراح شراء أي إشارة، تقليل إشارات، أو اختيار 2-3 صفقات/يوم قبل حل شرط L2 قبل الشراء.
- وجود إشارات كتير أو قليلة غير مهم الآن؛ المستخدم لن يعتمد على أي إشارة قبل إثبات أن L2 snapshot موجود قبل الدخول ويكفي للبيع عند target.
- أي shortlist أو tabs أو alerts هي تجارب coverage فقط، وليست حل شراء ولا قرار تنفيذ.
- الترتيب الوحيد: إثبات L2 coverage قبل الإشارة من الداتا → اختبار bid depth الحقيقي → الرقم النهائي → ثم قرار التنفيذ.

## المراجعة قبل الرد (زيادة الذكاء)
قبل أي رد مهم:
- ابحث في session_reads عن نفس الملف قبل ما أقراه تاني
- ابحث في session_edits عن نفس التعديل قبل ما أكرره
- ابحث في session_messages عن keywords من سؤال المستخدم

## طريقة الـ POST من sandbox
curl -s -X POST https://meky-stock.lovable.app/api/public/hooks/session-log \
  -H "x-thunder-token: $THUNDER_INGEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"client_batch_id":"...","source":"lovable-agent","items":[...]}'

بديل: SQL insert مباشر عبر psql لو الـ endpoint فشل.

## الصفحة
/session-log — tabs: المهمة / صحة التسجيل / رسايل / تعديلات / ملفات مقروءة + بحث + realtime + polling
