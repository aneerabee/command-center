#!/usr/bin/env node
// Phase 0 — اختبار اتصال brixtravel على Hostinger (IMAP + SMTP).
//
// التشغيل:
//   npm install                 # أول مرة فقط (imapflow + nodemailer)
//   export IMAP_PASS=...         # عيّن المتغيرات (أو استخدم --env-file)
//   node phase0-hostinger-test.mjs
//   # أو:  npm run phase0:env   (يقرأ من .env)
//
// المخرجات: تقرير بنود، ثم سطر أخير 🟢 / 🟡 / 🔴.
//   🟢 كل الفحوص نجحت
//   🟡 الاتصال الأساسي تمام لكن فيه تحذير (WARN)
//   🔴 فشل أساسي (FAIL) — البريد غير صالح للاستخدام بعد

import { loadConfig } from './src/config.mjs';
import { inspectMailbox, appendMessage } from './src/imap.mjs';
import { verifyTransport, sendMail } from './src/smtp.mjs';

const results = [];
const record = (level, name, detail) => {
  results.push({ level, name, detail });
  const icon = { OK: '✅', WARN: '🟡', FAIL: '🔴', INFO: 'ℹ️' }[level] || '•';
  console.log(`${icon} ${name}${detail ? ' — ' + detail : ''}`);
};

function summarize(err) {
  if (!err) return '';
  const msg = err.responseText || err.message || String(err);
  return msg.replace(/\s+/g, ' ').slice(0, 200);
}

async function main() {
  console.log('=== brix-mailops · Phase 0 · Hostinger connectivity ===\n');

  const { imap, smtp, options, missing } = loadConfig();

  if (missing.length) {
    record('FAIL', 'متغيرات ناقصة', missing.join(', '));
    return finish();
  }
  record('INFO', 'IMAP', `${imap.user}@${imap.host}:${imap.port} secure=${imap.secure}`);
  record('INFO', 'SMTP', `${smtp.user}@${smtp.host}:${smtp.port} secure=${smtp.secure}`);
  console.log('');

  // 1) IMAP — اتصال + لقطة الحساب
  try {
    const { mailboxes, inbox } = await inspectMailbox(imap);
    record('OK', 'IMAP اتصال + تسجيل دخول');
    record('OK', 'INBOX', `رسائل=${inbox.exists} غير مقروءة=${inbox.unseen}`);
    record('INFO', 'المجلدات', mailboxes.join(', ') || '(لا شيء)');
  } catch (err) {
    record('FAIL', 'IMAP', summarize(err));
  }

  // 2) SMTP — تحقّق من الاتصال والمصادقة
  try {
    await verifyTransport(smtp);
    record('OK', 'SMTP اتصال + مصادقة');
  } catch (err) {
    record('FAIL', 'SMTP', summarize(err));
  }

  // 3) إرسال اختبار حقيقي (اختياري)
  if (options.runSendTest) {
    try {
      const info = await sendMail(smtp, {
        subject: 'brix-mailops · Phase 0 send test',
        text: `اختبار إرسال ناجح — ${new Date().toISOString()}`,
      });
      record('OK', 'إرسال اختبار', info.messageId || 'تم');
    } catch (err) {
      record('WARN', 'إرسال اختبار', summarize(err));
    }
  } else {
    record('INFO', 'إرسال اختبار', 'متخطّى (RUN_SEND_TEST=false)');
  }

  // 4) IMAP APPEND (اختياري) — فحص صلاحية الكتابة
  if (options.runAppendTest) {
    const raw = [
      `From: ${imap.user}`,
      `To: ${imap.user}`,
      'Subject: brix-mailops phase0 append',
      'Date: ' + new Date().toUTCString(),
      '',
      'اختبار APPEND من Phase 0.',
      '',
    ].join('\r\n');
    try {
      await appendMessage(imap, raw);
      record('OK', 'IMAP APPEND', 'تمت الإضافة');
    } catch (err) {
      record('WARN', 'IMAP APPEND', summarize(err));
    }
  } else {
    record('INFO', 'IMAP APPEND', 'متخطّى (RUN_APPEND_TEST=false)');
  }

  finish();
}

function finish() {
  const fails = results.filter((r) => r.level === 'FAIL').length;
  const warns = results.filter((r) => r.level === 'WARN').length;
  console.log('\n----------------------------------------');
  if (fails > 0) {
    console.log(`🔴 أحمر — ${fails} فشل، ${warns} تحذير. البريد غير جاهز.`);
    process.exitCode = 1;
  } else if (warns > 0) {
    console.log(`🟡 أصفر — الاتصال الأساسي تمام، ${warns} تحذير راجعه.`);
  } else {
    console.log('🟢 أخضر — كل الفحوص نجحت. جاهز للمرحلة التالية.');
  }
}

main().catch((err) => {
  record('FAIL', 'خطأ غير متوقع', summarize(err));
  finish();
});
