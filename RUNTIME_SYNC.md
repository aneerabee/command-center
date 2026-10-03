# Runtime Sync

هذا الملف يشرح كيف تتحدث بيانات التحقق داخل `Command Center` في الوضع الطبيعي بدون تدخل يدوي مستمر.

## ما الذي يحدث

- النظام يشغّل السكربت:
  - `/Users/rabeeshaban/.local/bin/cc-runtime-sync.sh`
  - يعمل من `/Users/rabeeshaban/.local/share/command-center`، ويجلب آخر نسخة قبل الفحص.
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
- الهدف: إبقاء `projects + services + tools + cloud + bots + archive` أقرب إلى الواقع الدوري بقدر checker الحالي

## ما الذي يتحدث تلقائيًا الآن

- `projects`
- `services`
- `tools`
- `cloud`
- `bots`
- `archive`

## ما الذي لا يتحدث تلقائيًا بعد

- `ideas`

المتبقي يدويًا الآن:
- `ideas`

هذه المنطقة ما زالت تعتمد على التوثيق اليدوي في `data.js`.

## ملاحظة مهمة

- `data.runtime.json` يمثل آخر نتيجة تحقق محفوظة.
- لا يعني ذلك أن كل عنصر أو كل حقل مغطى بنفس العمق أو بنفس نوع checker.
- بعض العناصر تكون `ok` من HTTP فقط، وبعضها من SSH أو Git أو filesystem، وبعضها يبقى `manual` أو `warn` إذا لم يوجد تحقق كافٍ.
- `archive` أصبح له existence-check دوري للمسارات المعروفة، لكن معنى المحتوى وسياقه يبقيان مرجعيين ويحتاجان مراجعة بشرية عند الحاجة.

## معنى الحالات

- `ok`
  - تم تأكيد الحالة فعليًا من checker مناسب
- `warn`
  - تم تشغيل checker لكن النتيجة غير مطمئنة أو غير حاسمة
- `manual`
  - لا يوجد تحقق آلي كافٍ لهذا العنصر بعد

## الملفات المهمة

- التعريف اليدوي:
  - `data.js` داخل نسخة العمل
- نتائج آخر فحص:
  - `data.runtime.json` داخل نسخة العمل
- منطق الفحص:
  - `runtime-sync.js` داخل نسخة العمل
- منطق النشر التلقائي:
  - `/Users/rabeeshaban/.local/bin/cc-runtime-sync.sh`

## التشغيل اليدوي فقط للتشخيص

إذا احتجت اختبارًا يدويًا أو debugging:

```bash
cd /Users/rabeeshaban/Developer/command-center
node runtime-sync.js
```

هذا الأمر يفحص ويحدّث ملف النتائج فقط، ولا ينشر أو يعيد تشغيل أي مشروع. الجدولة تتولى النشر الدوري من نسخة العمل المستقلة.
