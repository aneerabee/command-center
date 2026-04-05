# DESIGN REBUILD TODO

## 1. Audit الحقيقة والمحتوى
- [x] مراجعة `DATA_TRUST_MODEL` والتأكد أن كل claim يطابق ما يعمل فعليًا
- [x] مراجعة نصوص `summary/desc/info/dt` في `projects`
- [x] مراجعة نصوص `services` وربطها بمالك واضح ومسار واضح
- [x] مراجعة نصوص `bots/tools/cloud/archive/ideas` وحذف أي مبالغة أو غموض
- [x] توحيد اللغة: تعريف سريع، لماذا مهم، أين يوجد، كيف يُحدَّث

## 2. إغلاق فجوات الثقة والتحديث
- [x] تصحيح أي عنصر يعلن تحديثًا آليًا بينما ما زال يدويًا
- [x] توحيد wording داخل صناديق الثقة في كل أنواع التفاصيل
- [x] توضيح ما الذي يحدث آليًا الآن وما الذي يبقى catalog/manual

## 3. إعادة بناء الصفحة الرئيسية
- [x] تحويل `home` إلى brief تشغيلي أقوى بصريًا
- [x] فصل الجرد الثابت عن التحقق الحي بصريًا ونصيًا
- [x] إعطاء AI CLI والـ runtime system مكانًا أوضح
- [x] إبراز ما يحتاج انتباهًا وما هو مستقر

## 4. إعادة تطوير الأقسام الأساسية
- [x] `projects`: portfolio أوضح وأكثر قوة
- [x] `map`: خريطة تشغيل فعلية بدل listing
- [x] `auto`: timeline + ownership + source clarity
- [x] `server`: console تشغيلية أوضح
- [x] `bots`: agent profiles أكثر تميزًا
- [x] `tools`: workbench مقسم حسب الفئات
- [x] `cloud`: شبكة/سطح خدمات أوضح
- [x] `ideas`: strategy board أنظف وأكثر فائدة
- [x] `archive`: shelf/catalog يميز المؤرشف عن المرجعي

## 5. إعادة تطوير الـ detail views
- [x] توحيد hierarchy لكل أنواع التفاصيل
- [x] جعل intro / relations / trust / access / references أوضح
- [x] تقليل التكرار البصري في الصناديق
- [x] إبراز نوع الكيان بصريًا بدون إرباك

## 6. اللمسات النهائية والتحقق
- [x] تحسين typography, spacing, density, contrast
- [x] فحص JS syntax
- [x] تشغيل runtime sync
- [ ] فحص desktop/mobile
- [ ] فحص console errors
- [ ] تنظيف نهائي ثم commit/push
