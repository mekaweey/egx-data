---
name: Bump and publish extension version every release
description: لما أعمل أي تعديل على الاكستنشن أو أقول "نسخة جديدة"، لازم أبومت manifest.json + popup.html + صفحة /thunder وأعيد بناء الـ zip في public/ قبل ما أقول للمستخدم نزّل
type: preference
---
لما أعمل أي تعديل على extension-v4/ أو أعلن إصدار جديد (vX.Y.Z):

1. حدّث `extension-v4/manifest.json` → `"version"` للرقم الجديد.
2. حدّث `extension-v4/popup.html` → الـ `<h1>` للرقم الجديد وأي نصوص إعدادات اتغيرت.
3. حدّث صفحة التحميل `src/routes/thunder.tsx` → `v4Version` وأي وصف ظاهر للمستخدم.
4. أعد بناء الزيب: `cd extension-v4 && nix run nixpkgs#zip -- -r /dev-server/public/thunder-extension-v4.zip .`
5. تأكد إن `public/thunder-extension-v4.zip` اتعمله rebuild (شوف تاريخ الملف).
6. افتح/افحص صفحة `/thunder` أو السورس وتأكد إن رقم النسخة الظاهر للمستخدم مطابق للـ manifest والـ popup والـ zip.
7. **إلزامي:** شغّل `bash scripts/check-extension-version.sh` قبل ما تقول للمستخدم "خلاص". لو رجّع ❌ ما تكملش قبل ما تصلّح.

**ممنوع** أقول للمستخدم "نزّل v4.1.XX" قبل ما أتأكد إن النسخة دي فعلاً في الزيب المنشور وصفحة `/thunder` ظاهرة بنفس الرقم. لو نسيت أي خطوة من دول، المستخدم هيفتح الصفحة/الـ popup ويلاقي رقم قديم أو وصف غلط وهيغضب — وده حصل مرات كتير قبل كده (آخرها: v4.1.81 في manifest/popup بس thunder.tsx فضل 4.1.80).

**السبب الجذري للأخطاء المتكررة:** نسيان تحديث `src/routes/thunder.tsx` تحديداً. الحل: دايماً استخدم سكربت الفحص كخطوة أخيرة قبل الإعلان.