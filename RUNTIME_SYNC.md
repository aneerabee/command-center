# Runtime Sync

هذا الملف يشرح كيف تتحدث بيانات التحقق داخل `Command Center` بدون تدخل يدوي.

## ما الذي يحدث

- النظام يشغّل السكربت:
  - `/tmp/cc-push/runtime-sync-publish.sh`
- هذا السكربت يقوم بالتسلسل التالي:
  1. تشغيل `node runtime-sync.js`
  2. تحديث `data.runtime.json`
  3. فحص هل تغيّر الملف فعليًا
  4. إذا تغيّر: `commit + push` إلى `main`
  5. إذا لم يتغيّر: ينتهي بدون commit

## من الذي يشغّله

- مشغل النظام هو `launchd` على هذا الماك، وليس جلسة AI.
- ملف الجدولة:
  - `/Users/rabeeshaban/Library/LaunchAgents/com.rabeeshaban.command-center-runtime-publish.plist`

## التوقيت

- الجدولة الحالية: كل 6 ساعات
- الهدف: إبقاء `projects + services + tools + cloud` أقرب إلى الواقع الدوري بقدر checker الحالي

## ما الذي يتحدث تلقائيًا الآن

- `projects`
- `services`
- `tools`
- `cloud`

## ما الذي لا يتحدث تلقائيًا بعد

- `ideas`
- `archive`

المتبقي يدويًا الآن:
- `ideas`
- `archive`

هاتان المنطقتان ما زالتا تعتمدـان على التوثيق اليدوي في `data.js`.

## ملاحظة مهمة

- `data.runtime.json` يمثل آخر نتيجة تحقق محفوظة.
- لا يعني ذلك أن كل عنصر أو كل حقل مغطى بنفس العمق أو بنفس نوع checker.
- بعض العناصر تكون `ok` من HTTP فقط، وبعضها من SSH أو Git أو filesystem، وبعضها يبقى `manual` أو `warn` إذا لم يوجد تحقق كافٍ.

## معنى الحالات

- `ok`
  - تم تأكيد الحالة فعليًا من checker مناسب
- `warn`
  - تم تشغيل checker لكن النتيجة غير مطمئنة أو غير حاسمة
- `manual`
  - لا يوجد تحقق آلي كافٍ لهذا العنصر بعد

## الملفات المهمة

- التعريف اليدوي:
  - `/tmp/cc-push/data.js`
- نتائج آخر فحص:
  - `/tmp/cc-push/data.runtime.json`
- منطق الفحص:
  - `/tmp/cc-push/runtime-sync.js`
- منطق النشر التلقائي:
  - `/tmp/cc-push/runtime-sync-publish.sh`

## التشغيل اليدوي فقط للتشخيص

إذا احتجت اختبارًا يدويًا أو debugging:

```bash
cd /tmp/cc-push
./runtime-sync-publish.sh
```

لكن في الوضع الطبيعي لا حاجة لذلك لأن `launchd` يتولى التشغيل الدوري.
