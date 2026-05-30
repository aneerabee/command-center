// تحميل وتحقّق إعدادات البريد من متغيرات البيئة.
// لا يوجد أي سرّ مكتوب هنا — كل القيم تأتي من process.env (export أو --env-file=.env أو secrets سحابية).

function bool(v, fallback = false) {
  if (v === undefined || v === null || v === '') return fallback;
  return /^(1|true|yes|on)$/i.test(String(v).trim());
}

function int(v, fallback) {
  const n = Number.parseInt(v ?? '', 10);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * يقرأ الإعدادات ويعيد { imap, smtp, options, missing }.
 * missing = قائمة المتغيرات الإلزامية الناقصة (فارغة = كل شيء جاهز).
 */
export function loadConfig(env = process.env) {
  const imap = {
    host: env.IMAP_HOST || 'imap.hostinger.com',
    port: int(env.IMAP_PORT, 993),
    secure: bool(env.IMAP_SECURE, true),
    user: env.IMAP_USER || '',
    pass: env.IMAP_PASS || '',
  };

  const smtp = {
    host: env.SMTP_HOST || 'smtp.hostinger.com',
    port: int(env.SMTP_PORT, 465),
    secure: bool(env.SMTP_SECURE, true),
    user: env.SMTP_USER || '',
    pass: env.SMTP_PASS || '',
  };

  const options = {
    runSendTest: bool(env.RUN_SEND_TEST, false),
    runAppendTest: bool(env.RUN_APPEND_TEST, false),
  };

  const required = {
    IMAP_USER: imap.user,
    IMAP_PASS: imap.pass,
    SMTP_USER: smtp.user,
    SMTP_PASS: smtp.pass,
  };
  const missing = Object.entries(required)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  return { imap, smtp, options, missing };
}
