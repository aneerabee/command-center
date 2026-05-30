// غلاف IMAP فوق imapflow — اتصال، فحص صناديق، قراءة، إضافة رسالة.
import { ImapFlow } from 'imapflow';

/** ينشئ عميل IMAP من إعدادات config.imap (بدون فتح اتصال بعد). */
export function createImapClient(imapCfg, { logger = false } = {}) {
  return new ImapFlow({
    host: imapCfg.host,
    port: imapCfg.port,
    secure: imapCfg.secure,
    auth: { user: imapCfg.user, pass: imapCfg.pass },
    logger,
  });
}

/**
 * يفتح اتصالًا، يجمع لقطة سريعة عن الحساب، ثم يغلق.
 * يعيد { mailboxes, inbox: { exists, unseen } }.
 */
export async function inspectMailbox(imapCfg) {
  const client = createImapClient(imapCfg);
  await client.connect();
  try {
    const mailboxes = [];
    for await (const box of client.list()) {
      mailboxes.push(box.path);
    }

    const lock = await client.getMailboxLock('INBOX');
    let inbox;
    try {
      const status = await client.status('INBOX', { messages: true, unseen: true });
      inbox = { exists: status.messages ?? 0, unseen: status.unseen ?? 0 };
    } finally {
      lock.release();
    }

    return { mailboxes, inbox };
  } finally {
    await client.logout();
  }
}

/**
 * يضيف رسالة خام إلى مجلد عبر IMAP APPEND (لاختبار صلاحية الكتابة).
 * mailbox الافتراضي: المسودات إن وُجد، وإلا INBOX.
 */
export async function appendMessage(imapCfg, rawMessage, mailbox = 'INBOX') {
  const client = createImapClient(imapCfg);
  await client.connect();
  try {
    return await client.append(mailbox, rawMessage, ['\\Seen']);
  } finally {
    await client.logout();
  }
}
