# brix-mailops

أداة إدارة بريد **brixtravel** عبر IMAP/SMTP على Hostinger.
تعيش داخل ريبو `command-center` لكنها مشروع Node مستقل بذاته داخل مجلد `brix-mailops/`.

> **النسخة الواحدة الحقيقية = هذا الريبو على GitHub.**
> تشتغل عليها من أي مكان مربوط بالريبو: الديسكتوب المحلي، جلسة سحابية، أو جلسة جديدة — الكل يسحب/يدفع لنفس الكود.

## قاعدة الأمان الذهبية

**لا تضع أي كلمة مرور في الكود أو في git.** كل الأسرار تأتي من متغيرات البيئة:
- محليًا: `export ...` أو ملف `.env` (متجاهَل في `.gitignore`).
- سحابيًا: تُحفظ كـ **environment secrets** في إعدادات البيئة، لا في الريبو.

ملف `.env.example` يوضّح المتغيرات المطلوبة — انسخه إلى `.env` واملأه محليًا فقط.

## التشغيل المحلي (الديسكتوب / Terminal)

```bash
cd brix-mailops
npm install                      # أول مرة: imapflow + nodemailer

cp .env.example .env             # ثم املأ IMAP_PASS و SMTP_PASS
npm run phase0:env               # يقرأ المتغيرات من .env
# أو بدون ملف:
#   export IMAP_PASS='...'; export SMTP_PASS='...'; npm run phase0
```

اقرأ السطر الأخير: 🟢 أخضر / 🟡 أصفر / 🔴 أحمر.

لتفعيل اختبار الإرسال الفعلي وفحص الكتابة:
```bash
RUN_SEND_TEST=true RUN_APPEND_TEST=true npm run phase0:env
```

## التشغيل السحابي (Claude Code on the web)

1. أنشئ/افتح جلسة سحابية مربوطة بريبو `command-center`.
2. في إعدادات البيئة:
   - **Secrets:** أضف `IMAP_USER/PASS` و `SMTP_USER/PASS` (لا تكتبها في git).
   - **Network policy:** اختر سياسة تسمح بالخروج إلى `imap.hostinger.com:993` و `smtp.hostinger.com:465`.
3. شغّل: `cd brix-mailops && npm install && npm run phase0`.

> ملاحظة: لو سياسة الشبكة تمنع الخروج، الاتصال الفعلي بالبريد يفشل في السحابة — حينها ابنِ/اختبر الكود سحابيًا وشغّل الاتصال الحي محليًا.

## البنية

```
brix-mailops/
├── package.json              # ESM، imapflow + nodemailer، سكربتات
├── .env.example              # قالب المتغيرات (لا أسرار)
├── phase0-hostinger-test.mjs # اختبار اتصال Phase 0 (المخرج 🟢/🟡/🔴)
├── README.md
└── src/
    ├── config.mjs            # قراءة/تحقّق المتغيرات
    ├── imap.mjs              # غلاف imapflow (فحص، قراءة، APPEND)
    └── smtp.mjs              # غلاف nodemailer (تحقّق، إرسال)
```

## القيم الافتراضية لـ Hostinger

| | Host | Port | Secure |
|---|---|---|---|
| IMAP | `imap.hostinger.com` | `993` | true |
| SMTP | `smtp.hostinger.com` | `465` | true |

أكّد القيم من لوحة Hostinger: **hPanel ← Emails ← Connect Devices / Configuration** (قد تختلف حسب نوع البريد).

## المراحل التالية

Phase 0 (هذا) = إثبات الاتصال فقط. الطبقات التالية (قراءة/إرسال/تنظيم/أتمتة/واجهة) تُبنى فوق `src/`
حسب `ARCHITECTURE` و `BUILD-PROTOCOL` في خطتك — أسقِطهما في هذا المجلد لإكمال البناء.
