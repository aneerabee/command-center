/* Entity pages share navigation primitives, not a modal or a single detail template. */
const WS_DETAIL_SECTIONS = {
  project: ['purpose','evidence','resources','connections','notes'],
  service: ['evidence','operation','connections','resources','notes'],
  automation: ['operation','evidence','connections','resources','notes'],
  bot: ['purpose','evidence','operation','connections','resources','notes'],
  tool: ['purpose','resources','evidence','connections','notes'],
  cloud: ['purpose','evidence','connections','resources','notes'],
  team: ['profile','connections'],
  idea: ['purpose','proposal','connections','resources'],
  archive: ['purpose','evidence','resources','connections','notes'],
};
const wsPositions = new Map();
let wsActiveRoute = '';
let wsDetailKey = null;
history.scrollRestoration = 'manual';

function wsRememberView() {
  if (!wsActiveRoute) return;
  const focus = document.activeElement?.closest('[data-ws-open]')?.getAttribute('data-ws-open');
  const attribute = ['data-ws-pin','data-ws-copy','data-ws-back'].find(name => document.activeElement?.hasAttribute(name));
  const control = attribute ? {attribute,value:document.activeElement.getAttribute(attribute)} : null;
  wsPositions.set(wsActiveRoute, { y:window.scrollY, focus, control });
}
function wsRestoreView(route) {
  requestAnimationFrame(() => {
    const saved = wsPositions.get(route);
    window.scrollTo({ top:saved?.y || 0, behavior:'instant' });
    const trigger = saved?.focus && [...document.querySelectorAll('[data-ws-open]')].find(el => el.dataset.wsOpen === saved.focus && el.getClientRects().length);
    const control = saved?.control && [...document.querySelectorAll(`[${saved.control.attribute}]`)].find(el => el.getAttribute(saved.control.attribute) === saved.control.value && el.getClientRects().length);
    if (trigger || control) (trigger || control).focus({preventScroll:true});
  });
}
function wsDetailSection(id, title, content, extra = '') {
  return content ? `<section class="ws-detail-section ${extra}" id="detail-${id}" aria-labelledby="heading-${id}"><h2 id="heading-${id}">${E(title)}</h2>${content}</section>` : '';
}
function wsDefinition(rows) {
  return `<dl class="ws-definitions">${rows.filter(([,value]) => value != null && value !== '').map(([label,value]) => `<div><dt>${E(label)}</dt><dd>${E(String(value))}</dd></div>`).join('')}</dl>`;
}
function wsEvidence(row) {
  const record = row.record;
  const state = wsMeta(row);
  return wsDetailSection('evidence','نتيجة التحقق', `<div class="ws-evidence ${state.state}"><div>${wsBadge(row)}<time>${E(_fmtRuntimeDate(record?.verified_at))}</time></div><p>${E(record?.summary || 'لا توجد نتيجة فحص آلي لهذا العنصر.')}</p>${record ? `<span class="ws-evidence-scope">هذه النتيجة تخص الفحوص المذكورة فقط، وليست اختبارًا لكل وظائف العنصر.</span>` : ''}</div>${record?.facts?.length ? `<ul class="ws-evidence-facts">${record.facts.map(fact => `<li><bdi>${E(WorkspaceModel.latinDigits(fact))}</bdi></li>`).join('')}</ul>` : ''}`);
}
function wsRefreshEvidence() {
  const row = wsRegistry().find(row => row.key === wsDetailKey);
  const target = document.getElementById('detail-evidence');
  if(!row || !target) return;
  const template = document.createElement('template');
  template.innerHTML = wsEvidence(row);
  target.replaceWith(template.content);
  requestAnimationFrame(_processIcons);
}
function wsResources(row) {
  const item = row.item;
  const links = [...new Map(Object.entries({ ...(item.deploy_url ? {'فتح المشروع':item.deploy_url} : {}), ...(item.repo_url ? {'المستودع':item.repo_url} : {}), ...(item.lk ? {'المنصة':item.lk} : {}), ...(item.links || {}) }).filter(([,url]) => WorkspaceModel.safeUrl(url)).map(([label,url]) => [url,{label,url}])).values()];
  const paths = [...new Set([item.local_path,item.server_path,item.path,...(item.config_paths || [])].filter(Boolean))];
  return wsDetailSection('resources',row.kind === 'tool' ? 'الإعدادات والمراجع' : 'الروابط والمسارات',
    links.map(link => `<div class="ws-resource-link">${wsExternal(link.url,link.label)}<bdi>${E(link.url)}</bdi></div>`).join('') +
    paths.map(path => `<div class="ws-detail-path"><code dir="ltr">${E(path)}</code><button class="ws-icon-button" data-ws-copy="${E(path)}" aria-label="نسخ المسار" title="نسخ المسار">${wsIcon('copy')}</button></div>`).join(''));
}
function wsConnections(row) {
  const related = WorkspaceModel.related(wsRegistry(),row);
  const content = related.length ? `<div class="ws-connected-list">${related.map(other => wsOpenButton(other,`<span class="ws-entity-icon">${wsIcon(WS_PAGES[other.page].icon)}</span><span><strong>${E(other.title)}</strong><small>${E(WS_PAGES[other.page].title)}</small></span>${wsIcon('arrow-left')}`,'ws-connected-item')).join('')}</div>` : `<p class="ws-muted">لا توجد ارتباطات مسجلة.</p>`;
  return wsDetailSection('connections',row.kind === 'team' ? 'المشاريع المسندة' : 'الارتباطات',content);
}
function wsOperation(row) {
  const item = row.item;
  const rows = row.kind === 'automation' ? [
    ['مكان المهمة',row.group],['الجدول المسجّل',item.freq],['حالة السجل',item.on ? 'مفعلة في السجل' : 'معطلة في السجل'],
  ] : [['مكان التشغيل المسجّل',item.host],['طريقة التشغيل',item.runtime || item.type],['المنفذ المسجّل',item.port],['القناة',item.channel]];
  return wsDetailSection('operation',row.kind === 'automation' ? 'جدول المهمة' : 'بيانات التشغيل المسجّلة',wsDefinition(rows));
}
function wsProfile(row) {
  const item = row.item;
  const department = DEPARTMENTS.find(group => group.id === item.department)?.name;
  const contacts = [item.phone && `<a href="tel:${E(item.phone.replace(/[^+\d]/g,''))}" class="ws-button">${wsIcon('phone')}اتصال</a>`,item.whatsapp && wsExternal(`https://wa.me/${item.whatsapp.replace(/\D/g,'')}`,'واتساب'),item.email_work && `<a href="mailto:${E(item.email_work)}" class="ws-button">${wsIcon('mail')}البريد</a>`].filter(Boolean).join('');
  return wsDetailSection('profile','ملف العضو',wsDefinition([['الاسم',item.full_name || item.name],['الدور',item.role],['القسم',department],['الشركة',wsCompany(item)],['اللغات',(item.languages || []).join('، ')],['مكان العمل',item.location_office]]) + `<div class="ws-contact-actions">${contacts}</div>`);
}
function wsDocumentedNotes(row) {
  const item = row.item;
  const date = item.current_status?.updated || item.last_check;
  const content = [item.desc,item.current_status?.where, ...(item.ops || [])].filter(Boolean);
  if(!content.length) return '';
  return wsDetailSection('notes','سجل الوصف والملاحظات',`<details class="ws-documentation"><summary>عرض الملاحظات المسجّلة${date ? ` · ${E(date)}` : ''}${wsIcon('chevron-down')}</summary><p class="ws-documentation-notice">ملاحظات مرجعية قد تتضمن معلومات قديمة؛ الأرقام ونتائج الاختبارات الواردة فيها ليست تحققًا حاليًا. الحالة الأحدث في قسم «نتيجة التحقق».</p>${content.map(text => `<p class="ws-document-text">${E(WorkspaceModel.latinDigits(text))}</p>`).join('')}</details>`);
}
function wsEntityContent(row) {
  const item = row.item;
  const purpose = wsDetailSection('purpose',row.kind === 'idea' ? 'الفكرة المقترحة' : row.kind === 'archive' ? 'المرجع المحفوظ' : 'عن هذا العنصر',`<p class="ws-detail-lead">${E(WorkspaceModel.latinDigits(wsSummary(row)))}</p><span class="ws-caption">وصف مسجّل${item.content_reviewed_at ? ` · روجع ${E(item.content_reviewed_at)}` : ''}</span>`);
  const blocks = {
    purpose,
    evidence: () => wsEvidence(row),
    operation: () => wsOperation(row),
    connections: () => wsConnections(row),
    resources: () => wsResources(row),
    notes: () => wsDocumentedNotes(row),
    profile: () => wsProfile(row),
    proposal: () => wsDetailSection('proposal','تفاصيل المقترح',`<p class="ws-documentation-notice">مقترح، وليس وصفًا لنظام منفّذ أو تكلفة مؤكدة حاليًا.</p><p class="ws-document-text">${E(WorkspaceModel.latinDigits(item.desc || item.dt || 'لا توجد تفاصيل إضافية مسجلة.'))}</p>`),
  };
  return WS_DETAIL_SECTIONS[row.kind].map(id => typeof blocks[id] === 'function' ? blocks[id]() : blocks[id]).join('');
}
function wsShowDetail(row, {restore = false} = {}) {
  if(!restore) wsRememberView();
  wsCloseOverlay();
  document.getElementById('detail-view')?.remove();
  const route = WorkspaceModel.route(row);
  if (!restore) _setHashSilently(route);
  cur = row.page;
  wsActiveRoute = route;
  wsDetailKey = row.key;
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  document.querySelectorAll('[data-page]').forEach(link => {
    link.classList.toggle('active',link.dataset.page === row.page);
    if(link.dataset.page === row.page) link.setAttribute('aria-current','page');
    else link.removeAttribute('aria-current');
  });
  const root = document.createElement('article');
  root.id = 'detail-view';
  root.className = `ws-detail-page ws-detail-${row.kind}`;
  root.dataset.entityKey = row.key;
  const link = WorkspaceModel.primaryLink(row);
  root.innerHTML = `<div class="ws-detail-navigation"><button class="ws-text-button" data-ws-back>${wsIcon('arrow-right')}رجوع</button><a href="#${row.page}" data-action="goPage" data-arg="${row.page}">${E(WS_PAGES[row.page].title)}</a></div>` +
    `<header class="ws-detail-heading"><div class="ws-detail-title"><span class="ws-detail-symbol">${row.kind === 'team' ? E(nameInitial(row.title)) : wsIcon(WS_PAGES[row.page].icon)}</span><div><span class="ws-eyebrow">${E(wsGroup(row) || WS_PAGES[row.page].title)}</span><h1 tabindex="-1">${E(row.title)}</h1>${itemSubtitle(row)}</div></div><div class="ws-detail-actions">${link ? wsExternal(link.url,link.label) : ''}${wsStar(row)}<button class="ws-icon-button" data-ws-copy="${E(new URL('#'+route,location.href).href)}" aria-label="نسخ رابط الصفحة" title="نسخ رابط الصفحة">${wsIcon('link')}</button></div></header>` +
    `<div class="ws-detail-content">${wsEntityContent(row)}</div>`;
  document.getElementById('app').appendChild(root);
  wsUpdateShell();
  document.title = `${row.title} · مركز التحكم`;
  const crumb = document.querySelector('.ws-breadcrumb');
  if(crumb) crumb.innerHTML = `<a href="#${row.page}" data-action="goPage" data-arg="${row.page}">${E(WS_PAGES[row.page].title)}</a>${wsIcon('chevron-left')}<strong>${E(row.title)}</strong>`;
  _processIcons();
  if(restore) wsRestoreView(route);
  else { window.scrollTo({top:0,behavior:'instant'}); root.querySelector('h1').focus({preventScroll:true}); }
}
function itemSubtitle(row) {
  const subtitle = row.kind === 'team' ? row.item.role : row.title !== row.arg && row.kind !== 'automation' ? row.arg : '';
  return subtitle ? `<p class="ws-detail-subtitle">${E(subtitle)}</p>` : '';
}
function wsOpenEntity(value, page) {
  const row = WorkspaceModel.resolve(wsRegistry(),value,page);
  if(row) wsShowDetail(row);
}

openProjectDetail = name => wsOpenEntity(name,'projects');
openServiceDetail = name => wsOpenEntity(name,'server');
openBotDetail = name => wsOpenEntity(name,'bots');
openToolDetail = name => wsOpenEntity(name,'tools');
openCloudDetail = name => wsOpenEntity(name,'cloud');
openArchiveDetail = name => wsOpenEntity(name,'archive');
openAutoDetail = name => wsOpenEntity(name,'auto');
openTeamDetail = name => wsOpenEntity(name,'team');
openIdeaDetail = name => wsOpenEntity(name,'ideas');
openDetailSmart = (name,page) => wsOpenEntity(name,page);
closeDetail = function() {
  document.getElementById('detail-view')?.remove();
  wsDetailKey = null;
};

function wsFollowLocation() {
  wsRememberView();
  closeDetail();
  const [rawPage,rawName] = _hashParts();
  const page = _validPages.has(rawPage) ? rawPage : 'home';
  _activatePage(page,false);
  wsActiveRoute = rawName ? `${page}/${rawName}` : page;
  let name;
  try { name = rawName ? decodeURIComponent(rawName) : null; } catch { name = null; }
  const row = name && WorkspaceModel.resolve(wsRegistry(),name,page);
  if(row) wsShowDetail(row,{restore:true});
  else {
    if(rawName) ccToast('هذا العنصر غير موجود في السجل الحالي','warn');
    wsActiveRoute = page;
    wsRestoreView(page);
  }
}
document.addEventListener('click',event => {
  if(event.target instanceof Element && event.target.closest('.skip-link')) {
    event.preventDefault();
    document.querySelector('#detail-view h1,.page.active h1')?.scrollIntoView({block:'start'});
    document.getElementById('app')?.focus({preventScroll:true});
  }
  if(event.target instanceof Element && event.target.closest('[data-ws-back]')) {
    if(history.state?.ccFrom) history.back();
    else { const page=cur; go(page); wsRestoreView(page); }
  }
});
document.addEventListener('DOMContentLoaded',() => { wsActiveRoute = location.hash.slice(1) || cur; });
