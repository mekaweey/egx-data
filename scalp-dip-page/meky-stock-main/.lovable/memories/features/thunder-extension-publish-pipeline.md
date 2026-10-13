---
name: Thunder extension publish pipeline
description: قواعد إجبارية لنشر أي إصدار جديد من إكستنشن Thunder بدون ما يظهر إصدار قديم
type: feature
---
## المشكلة اللي حصلت (26 يوليو 2026)
المستخدم كان بيشوف v4.2.28 بعد النشر رغم إن manifest.json عليه v4.2.29.

## السببان:
1. **اسم ملف الزيب مختلف عن اللي بتنزّله الصفحة.** صفحة `/thunder` بتعمل fetch لـ `/thunder-extension-v4.zip` بينما كنت بأحزم على `/thunder-unified-v4.zip` — الملف اللي بينزّله المستخدم كان قديم من يوليو.
2. **رقم الإصدار hardcoded في `src/routes/thunder.tsx` منفصل عن `extension-v4/manifest.json`** — تحديث واحد بدون التاني = عرض غلط.

## القواعد الإجبارية للمستقبل:
- **الملف الوحيد المرفوع =** `public/thunder-extension-v4.zip`، وأي رابط توافق مثل `public/thunder-unified-v4.zip` لازم يكون **نسخة ملف عادية copy وليس symlink** لأن النشر يفشل مع symlink داخل `dist`.
- **مصدر الحقيقة للإصدار =** `extension-v4/manifest.json` فقط. الصفحة `src/routes/thunder.tsx` بتعمل `import manifest from "../../extension-v4/manifest.json"` وبتقرأ `manifest.version` — ممنوع hardcode للرقم في الصفحة.
- **أمر الحزم الصحيح:**
  ```bash
  rm -f public/thunder-extension-v4.zip public/thunder-unified-v4.zip && \
    cd extension-v4 && \
    nix run nixpkgs#zip -- -r /dev-server/public/thunder-extension-v4.zip . && \
    cp /dev-server/public/thunder-extension-v4.zip /dev-server/public/thunder-unified-v4.zip
  ```
- **التحقق قبل الرد على المستخدم:** `unzip -p public/thunder-extension-v4.zip manifest.json | grep version` لازم يطابق `manifest.json` في المشروع.
- **التذكير بالنشر:** أي تغيير في `public/` أو `src/` مش هيظهر على `meky-stock.lovable.app` قبل ما المستخدم يضغط Publish/Update.