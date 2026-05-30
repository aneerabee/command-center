// غلاف SMTP فوق nodemailer — تحقّق من الاتصال وإرسال رسالة.
import nodemailer from 'nodemailer';

/** ينشئ transporter من إعدادات config.smtp. */
export function createTransport(smtpCfg) {
  return nodemailer.createTransport({
    host: smtpCfg.host,
    port: smtpCfg.port,
    secure: smtpCfg.secure, // true لـ 465، false لـ 587 (STARTTLS)
    auth: { user: smtpCfg.user, pass: smtpCfg.pass },
  });
}

/** يتحقّق أن الخادم يقبل الاتصال والمصادقة دون إرسال. */
export async function verifyTransport(smtpCfg) {
  const transport = createTransport(smtpCfg);
  try {
    return await transport.verify();
  } finally {
    transport.close();
  }
}

/** يرسل رسالة. الافتراضي: من وإلى نفس الحساب (اختبار ذاتي آمن). */
export async function sendMail(smtpCfg, { to, subject, text, html } = {}) {
  const transport = createTransport(smtpCfg);
  try {
    return await transport.sendMail({
      from: smtpCfg.user,
      to: to || smtpCfg.user,
      subject: subject || 'brix-mailops phase0 test',
      text: text || 'رسالة اختبار من brix-mailops Phase 0.',
      html,
    });
  } finally {
    transport.close();
  }
}
