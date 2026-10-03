/* Public evidence never contains authentication challenges or credentials. */
const fs = require('fs');
const os = require('os');
const path = require('path');

function redact(value) {
  if (typeof value === 'string') return value
    .replace(/https?:\/\/login\.tailscale\.com\/[^\s"'<>]+/gi, '[رابط تأكيد الدخول محجوب]')
    .replace(/([?&#](?:token|access_token|refresh_token|code|api_key|key|secret)=)[^\s&#"'<>]+/gi, '$1[محجوب]')
    .replace(/(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, '$1[محجوب]');
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key,item]) => [key,redact(item)]));
  return value;
}
function jsonFile(file) {
  try { return {ok:true,value:JSON.parse(fs.readFileSync(file,'utf8'))}; }
  catch { return {ok:false,value:null}; }
}
function toolInventory(exec, root) {
  const config = jsonFile(path.join(os.homedir(),'.claude.json'));
  const project = jsonFile(path.join(root,'.mcp.json'));
  const codex = exec('codex mcp list --json', {timeout:8000});
  let servers = null;
  try { const parsed = JSON.parse(codex.stdout); if(codex.ok && Array.isArray(parsed)) servers = parsed; } catch {}
  return {claude:config.ok ? {...config.value.mcpServers,...project.value?.mcpServers} : null,
    codex:servers && servers.map(server=>({name:server.name,enabled:server.enabled}))};
}
function toolEvidence(name, inventory, hasPermission = false) {
  const claude = inventory.claude?.[name];
  const codex = inventory.codex?.find(server=>server.name===name);
  const facts = [];
  if (claude) facts.push(`كلود: ${claude.disabled === true ? 'تعريف معطل' : 'تعريف موجود'}`);
  if (codex) facts.push(`كودكس: ${codex.enabled === false ? 'معطل صراحة' : 'تعريف مفعّل'}`);
  if (hasPermission) facts.push('يوجد إذن مسجل؛ لا يثبت الاتصال أو التشغيل');
  const disabled = !claude && codex?.enabled === false || claude?.disabled === true && (!codex || codex.enabled === false);
  return {verification_status:'manual',checked_from:'tool configuration',
    summary:disabled ? 'الأداة معطلة في الإعدادات؛ لم تُفعّل أثناء الفحص' : claude || codex ? 'تعريف الأداة موجود؛ الاتصال الفعلي لم يُختبر' : 'لم يتأكد ربط الأداة في الإعدادات المفحوصة',
    facts:facts.length ? facts : ['غياب التعريف في هذه البيئة لا يثبت تعطل المنصة أو الحساب']};
}
function networkEvidence(snapshot) {
  const running = snapshot?.BackendState === 'Running' && snapshot?.Self?.Online === true;
  return {verification_status:running ? 'ok' : 'warn',checked_from:'network status',
    summary:running ? 'الشبكة الخاصة متصلة على هذا الجهاز' : 'اتصال الشبكة الخاصة غير مؤكّد',
    facts:running ? ['النتيجة من برنامج الشبكة؛ الدخول الإداري والتطبيقات لهما فحص مستقل'] : ['لم تتأكد حالة اتصال الجهاز؛ لا يُستنتج منها توقف السيرفر']};
}
function tailscaleStatus(exec) {
  const app = '/Applications/Tailscale.app/Contents/MacOS/Tailscale';
  const bin = fs.existsSync(app) ? JSON.stringify(app) : 'tailscale';
  const result = exec(`${bin} status --json`,{timeout:8000});
  try { if(result.ok) return networkEvidence(JSON.parse(result.stdout)); } catch {}
  return {verification_status:'warn',checked_from:'network status',summary:'تعذر قراءة حالة برنامج الشبكة',facts:['لم ينجح فحص البرنامج؛ ليس إثباتًا لانقطاع الشبكة']};
}
module.exports = {redact,toolInventory,toolEvidence,networkEvidence,tailscaleStatus};
