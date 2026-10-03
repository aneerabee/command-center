/* Presentation layer: reads the existing inventory; never changes project data. */
const WS_PAGES = {
  home: { title:'نظرة عامة', icon:'layout-dashboard' },
  projects: { title:'المشاريع', icon:'folder-kanban', kind:'project' },
  umbrellas: { title:'الشركات', icon:'building-2' },
  team: { title:'الفريق', icon:'users', kind:'team' },
  server: { title:'الخدمات والخادم', icon:'server', kind:'service' },
  auto: { title:'المهام التلقائية', icon:'workflow', kind:'automation' },
  bots: { title:'البوتات', icon:'bot', kind:'bot' },
  cloud: { title:'المنصات', icon:'cloud', kind:'cloud' },
  tools: { title:'الأدوات', icon:'wrench', kind:'tool' },
  map: { title:'الملفات والمسارات', icon:'map-pin' },
  ideas: { title:'الأفكار والخطط', icon:'lightbulb', kind:'idea' },
  archive: { title:'الأرشيف', icon:'archive', kind:'archive' },
};
const WS_GROUPS = [
  { label:'مساحة العمل', pages:['home','projects','umbrellas','team'] },
  { label:'التشغيل', pages:['server','auto','bots','cloud'] },
  { label:'المراجع', pages:['tools','map','ideas','archive'] },
];
const WS_PRESENTATION = {
  home:{tone:'blue',label:'مساحتك، في مكان واحد'},
  projects:{tone:'blue',label:'المنتجات ومساحات العمل',layout:'grid'},
  umbrellas:{tone:'coral',label:'الشركات ومشاريعها'},
  team:{tone:'rose',label:'الأشخاص والمسؤوليات',layout:'grid'},
  server:{tone:'green',label:'حالة التشغيل والخدمات'},
  auto:{tone:'orange',label:'المهام ومواعيدها'},
  bots:{tone:'teal',label:'المساعدات المتصلة',layout:'grid'},
  cloud:{tone:'blue',label:'المنصات المرتبطة',layout:'grid'},
  tools:{tone:'violet',label:'أدوات العمل',layout:'grid'},
  map:{tone:'orange',label:'المسارات ومراجع الوصول'},
  ideas:{tone:'amber',label:'مساحة الأفكار'},
  archive:{tone:'graphite',label:'المراجع المحفوظة'},
};
const WS_COMPANY_TONES = {brix:'blue',etranex:'teal',saas:'violet',infra:'graphite'};
const WS_PROJECT_ICONS = {
  'brix-travel-system':'hotel',easybooking:'ticket','rihlaty-travel':'plane',
  'meta-mcp':'megaphone','wapy-dev':'calendar-days','command-center':'panels-top-left',
  'whatsapp-crm':'messages-square','money-manager':'wallet','brix-travel-website':'globe',
  'chess-academy':'crown','western-office':'arrow-left-right',adreem:'line-chart','dr-muhsen':'book-open',
};
function wsLayout(page) { return wsPreferences.layouts[page] || WS_PRESENTATION[page]?.layout || 'list'; }
function wsTone(row) { return WS_COMPANY_TONES[row.item.parent] || WS_PRESENTATION[row.page]?.tone || 'blue'; }
function wsGlyph(row) {
  return row.kind === 'team' ? `<span class="ws-avatar-letter">${E(nameInitial(row.title))}</span>` : wsIcon(WS_PROJECT_ICONS[row.item.id] || WS_PAGES[row.page]?.icon || 'folder');
}
const WS_STORAGE = 'cc.workspace.v1';
const WS_NUMBER = new Intl.NumberFormat(WorkspaceModel.LOCALE);
let wsPreferences = wsReadPreferences();
let wsPageState = {};
let wsRefreshing = false;
let wsSearchFocus = null;
let wsReviewExpanded = false;
let wsOverlay = null;
let wsFreshnessSignature = '';

function wsReadPreferences() {
  try {
    const value = JSON.parse(localStorage.getItem(WS_STORAGE) || '{}');
    return { pinned: Array.isArray(value.pinned) ? value.pinned.filter(x => typeof x === 'string') : [],
      layouts: value.layouts && typeof value.layouts === 'object' ? value.layouts : {} };
  } catch { return { pinned:[], layouts:{} }; }
}
function wsSavePreferences() {
  try { localStorage.setItem(WS_STORAGE, JSON.stringify(wsPreferences)); }
  catch { ccToast('تعذر حفظ التفضيلات على هذا الجهاز', 'warn'); }
}
function wsRegistry() { return WorkspaceModel.registry({ PRJ, SVC, BOT, TL, CLD, ARC, IDEAS, TEAM, AUTO }, RUNTIME_STATE); }
function wsIcon(name) {
  const aliases={'circle-check':'check-circle-2','circle-alert':'alert-circle','circle-x':'x-circle','triangle-alert':'alert-triangle'};
  return `<i data-lucide="${E(aliases[name]||name)}" aria-hidden="true"></i>`;
}
function wsNumber(n) { return WS_NUMBER.format(n); }
function wsState(page) { return { query:'', scope:'all', group:'all', sort:'default', ...(wsPageState[page] || {}) }; }
function wsMeta(row) { return WorkspaceModel.status(row.record); }
function wsBadge(row) {
  if (row.kind === 'team') return `<span class="ws-badge neutral">عضو الفريق</span>`;
  if (row.kind === 'idea') return `<span class="ws-badge neutral">${E(row.item.st || 'فكرة')}</span>`;
  const state = wsMeta(row);
  return `<span class="ws-badge ${state.state}" title="${E(row.record?.summary || state.label)}">${wsIcon(state.icon)}${state.label}</span>`;
}
function wsDate(value) { return value && Number.isFinite(Date.parse(value)) ? relTime(value) : 'لا يوجد فحص'; }
function wsRelativeTime(value) { return `<span${value ? ` data-live-time="${E(value)}"` : ''}>${E(wsDate(value))}</span>`; }
function wsRefreshFreshness() {
  const signature = wsRegistry().map(row=>`${row.key}:${wsMeta(row).state}`).join('|') + WorkspaceModel.health(HEALTH_STATE).state;
  if(signature === wsFreshnessSignature) return;
  wsFreshnessSignature = signature;
  if(wsDetailKey) wsRefreshEvidence(); else wsRender();
}
function wsCompany(item) { return UMBRELLAS.find(group => group.id === item.parent)?.name || ''; }
function wsGroup(row) {
  if (row.kind === 'team') return DEPARTMENTS.find(group=>group.id===row.item.department)?.name || wsCompany(row.item);
  if (['project','idea'].includes(row.kind)) return wsCompany(row.item);
  if (row.kind === 'automation') return row.group || '';
  if (row.kind === 'tool') return _toolCategoryLabel(row.item.category);
  if (row.kind === 'cloud') return _cloudCategoryLabel(row.item.category);
  return row.item.host || (row.kind === 'archive' ? _archiveKindLabel(row.item) : '') || '';
}
function wsSummary(row) { return WorkspaceContent.profile(row)?.lead || row.item.summary || row.item.what || row.item.info || row.item.dt || row.item.role || ''; }
function wsOpenButton(row, content, klass = '') {
  return `<a href="#${E(WorkspaceModel.route(row))}" class="${klass}" data-ws-open="${E(row.key)}" aria-label="تفاصيل ${E(row.title)}" title="تفاصيل ${E(row.title)}">${content}</a>`;
}
function wsStar(row) {
  const pinned = wsPreferences.pinned.includes(row.key);
  return `<button type="button" class="ws-icon-button ws-star${pinned ? ' selected' : ''}" data-ws-pin="${E(row.key)}" aria-pressed="${pinned}" aria-label="${pinned ? 'إلغاء تثبيت' : 'تثبيت'} ${E(row.title)}" title="${pinned ? 'إلغاء التثبيت' : 'تثبيت للوصول السريع'}">${wsIcon('star')}</button>`;
}
function wsExternal(url, label, iconOnly = false) {
  const safe = WorkspaceModel.safeUrl(url);
  return safe ? `<a class="${iconOnly ? 'ws-icon-button' : 'ws-button'}" href="${E(safe)}" target="_blank" rel="noopener noreferrer" aria-label="${E(label)}" title="${E(label)}">${iconOnly ? '' : E(label)}${wsIcon('arrow-up-left')}</a>` : '';
}
function wsHeader(page, suffix = '') {
  return `<header class="ws-page-heading" data-tone="${WS_PRESENTATION[page].tone}"><div class="ws-page-identity"><span class="ws-section-symbol">${wsIcon(WS_PAGES[page].icon)}</span><div><div class="ws-eyebrow">${E(WS_PRESENTATION[page].label)}</div><h1>${E(WS_PAGES[page].title)}</h1></div></div>${suffix}</header>`;
}
function wsSectionTitle(title, action = '') { return `<div class="ws-section-title"><h2>${E(title)}</h2>${action}</div>`; }
function wsGo(page, text) { return `<button class="ws-text-button" data-action="goPage" data-arg="${page}">${E(text)}${wsIcon('arrow-left')}</button>`; }

function wsSidebar() {
  return `<a class="ws-brand" href="#home" data-action="goPage" data-arg="home"><img src="cc-icon.svg?v=20261003e" width="36" height="36" alt=""><span>مركز التحكم<small>مساحة ربيع</small></span></a>` +
    `<nav class="ws-navigation" aria-label="أقسام اللوحة">${WS_GROUPS.map(group => `<div class="ws-nav-group"><div class="ws-nav-label">${group.label}</div>${group.pages.map(id => `<a href="#${id}" class="nav-item${cur === id ? ' active' : ''}" data-tone="${WS_PRESENTATION[id].tone}" data-page="${id}" data-action="goPage" data-arg="${id}" ${cur === id ? 'aria-current="page"' : ''}><span class="ws-nav-icon">${wsIcon(WS_PAGES[id].icon)}</span><span>${WS_PAGES[id].title}</span>${id === 'projects' ? `<small>${wsNumber(PRJ.length)}</small>` : ''}</a>`).join('')}</div>`).join('')}</nav>` +
    `<div class="ws-sidebar-footer"><span class="ws-owner">ر</span><div><strong>ربيع</strong><small>إدارة المشاريع</small></div><button class="ws-icon-button" data-action="openSearch" aria-label="بحث في اللوحة" title="بحث">${wsIcon('search')}</button></div>`;
}
function wsMobile() {
  return ['home','projects','server'].map(id => `<a href="#${id}" class="bar-item${cur === id ? ' active' : ''}" data-action="goPage" data-arg="${id}" data-page="${id}">${wsIcon(WS_PAGES[id].icon)}<span>${id === 'server' ? 'التشغيل' : WS_PAGES[id].title}</span></a>`).join('') +
    `<button class="bar-item" data-action="openMore" aria-label="كل الأقسام">${wsIcon('menu')}<span>المزيد</span></button>`;
}
function wsMore() {
  return `<div class="more-sheet-overlay" data-action="closeMore"></div><div class="more-sheet-content" role="dialog" aria-modal="true" aria-label="كل الأقسام"><div class="ws-section-title"><h2>كل الأقسام</h2><button class="ws-icon-button" data-action="closeMore" aria-label="إغلاق القائمة">${wsIcon('x')}</button></div>${WS_GROUPS.map(g => `<div class="ws-nav-label">${g.label}</div><div class="ws-more-grid">${g.pages.map(id => `<a href="#${id}" class="more-item" data-tone="${WS_PRESENTATION[id].tone}" data-action="goPage" data-arg="${id}"><span class="ws-nav-icon">${wsIcon(WS_PAGES[id].icon)}</span><span>${WS_PAGES[id].title}</span></a>`).join('')}</div>`).join('')}</div>`;
}
function wsUpdateShell() {
  const host = document.getElementById('workspace-topbar');
  if (host) host.innerHTML = `<a href="#home" class="ws-mobile-brand" data-action="goPage" data-arg="home" aria-label="مركز التحكم"><img src="cc-icon.svg?v=20261003e" width="28" height="28" alt=""></a><div class="ws-breadcrumb"><span>مساحة ربيع</span>${wsIcon('chevron-left')}<strong>${E(WS_PAGES[cur]?.title || '')}</strong></div><div class="ws-top-actions"><button class="ws-search-trigger" data-action="openSearch" aria-label="بحث في كل شيء">${wsIcon('search')}<span>بحث في كل شيء</span></button><button class="ws-icon-button${wsRefreshing ? ' ws-loading' : ''}" data-ws-refresh ${wsRefreshing ? 'disabled' : ''} aria-label="تحديث بيانات اللوحة" title="تحديث بيانات اللوحة">${wsIcon('refresh-cw')}</button></div>`;
  document.title = `${WS_PAGES[cur]?.title || 'مركز التحكم'} · مركز التحكم`;
  if(wsDetailKey) {
    const row=wsRegistry().find(row=>row.key===wsDetailKey);
    if(row) {
      document.title=`${row.title} · مركز التحكم`;
      host.querySelector('.ws-breadcrumb').innerHTML=`<a href="#${row.page}" data-action="goPage" data-arg="${row.page}">${E(WS_PAGES[row.page].title)}</a>${wsIcon('chevron-left')}<strong>${E(row.title)}</strong>`;
    }
  }
  requestAnimationFrame(_processIcons);
}
function wsRender(page = cur) {
  if(wsDetailKey) {
    const row=wsRegistry().find(row=>row.key===wsDetailKey);
    if(row) { wsRememberView(); wsShowDetail(row,{restore:true}); return; }
  }
  const target = document.getElementById(`page-${page}`);
  const focused = document.activeElement;
  const query = focused instanceof HTMLInputElement ? focused.dataset.wsQuery : null;
  if (target && R[page]) {
    const html=R[page]();
    if (query === page) {
      const fragment=document.createElement('template');
      fragment.innerHTML=html;
      for (const selector of ['.ws-entity-list','.ws-path-list','.ws-result-count']) {
        const current=target.querySelector(selector),next=fragment.content.querySelector(selector);
        if(current && next) current.replaceWith(next);
      }
    } else smartRender(target, html);
  }
  requestAnimationFrame(_processIcons);
}
function wsListRow(row, card = false) {
  const link = WorkspaceModel.primaryLink(row);
  const group = wsGroup(row);
  const checked = row.record?.verified_at;
  const context = row.kind === 'automation' ? row.item.freq : row.kind === 'team' ? row.item.role : group;
  return `<article class="ws-entity${card ? ' ws-entity-card' : ''}" data-kind="${row.kind}" data-tone="${wsTone(row)}" data-entity-key="${E(row.key)}">` +
    wsOpenButton(row, `<span class="ws-entity-icon">${wsGlyph(row)}</span><span class="ws-entity-copy"><strong>${E(row.title)}</strong><span>${E(wsSummary(row))}</span></span>`, 'ws-entity-main') +
    `<div class="ws-entity-group">${E(context || '—')}</div><div class="ws-entity-check"><span>${wsBadge(row)}</span><small>${['team','idea'].includes(row.kind) ? E(group) : wsRelativeTime(checked)}</small></div>` +
    `<div class="ws-row-actions">${wsStar(row)}${link ? wsExternal(link.url, `${link.label}: ${row.title}`, true) : wsOpenButton(row, wsIcon('arrow-left'), 'ws-icon-button ws-details-button')}</div><div class="ws-entity-relations">${wsRelationHint(row)}</div></article>`;
}
function wsEmpty(text = 'لا توجد نتائج مطابقة') {
  return `<div class="ws-empty">${wsIcon('search-x')}<h3>${E(text)}</h3><button class="ws-button" data-ws-reset>إظهار الكل</button></div>`;
}
function wsFiltered(rows, page) {
  const state = wsState(page);
  const matches = rows.filter(row => WorkspaceModel.matches(row,state.query) && (state.group === 'all' || wsGroup(row) === state.group) &&
    (state.scope === 'all' || state.scope === 'pinned' && wsPreferences.pinned.includes(row.key) || state.scope === 'attention' && ['fail','warn','stale','manual','unknown'].includes(wsMeta(row).state)));
  return [...matches].sort((a,b) => {
    if (state.sort === 'name') return a.title.localeCompare(b.title,'ar');
    if (state.sort === 'checked') return (Date.parse(b.record?.verified_at) || 0) - (Date.parse(a.record?.verified_at) || 0);
    if (state.sort === 'attention') return wsMeta(a).rank-wsMeta(b).rank;
    return Number(wsPreferences.pinned.includes(b.key))-Number(wsPreferences.pinned.includes(a.key));
  });
}
function wsToolbar(page, rows) {
  const state = wsState(page);
  const groups = [...new Set(rows.map(wsGroup).filter(Boolean))];
  const isGrid = wsLayout(page) === 'grid';
  const sortOptions=[['default','الترتيب الافتراضي'],['name','حسب الاسم'],...(['team','ideas'].includes(page)?[]:[['attention','المراجعة أولًا'],['checked','آخر فحص']])];
  const scopeLabels = [['all','الكل'],['pinned','المثبتة'], ...(['team','ideas'].includes(page) ? [] : [['attention','للمراجعة']])];
  return `<div class="ws-toolbar"><div class="ws-tabs" role="group" aria-label="تصفية القائمة">${scopeLabels.map(([key,label]) => `<button data-ws-scope="${key}" class="${state.scope === key ? 'selected' : ''}" aria-pressed="${state.scope === key}">${label}${key === 'all' ? `<span>${wsNumber(rows.length)}</span>` : ''}</button>`).join('')}</div>` +
    `<div class="ws-filter-controls"><label class="ws-inline-search">${wsIcon('search')}<input type="search" data-ws-query="${page}" aria-label="البحث في ${WS_PAGES[page].title}" placeholder="بحث بالاسم…" value="${E(state.query)}" autocomplete="off"></label>` +
    (groups.length > 1 ? `<select data-ws-group aria-label="تصفية حسب المجموعة"><option value="all">كل المجموعات</option>${groups.map(g=>`<option value="${E(g)}" ${state.group === g ? 'selected' : ''}>${E(g)}</option>`).join('')}</select>` : '') +
    `<select data-ws-sort aria-label="ترتيب النتائج">${sortOptions.map(([key,label]) => `<option value="${key}" ${state.sort===key?'selected':''}>${label}</option>`).join('')}</select>` +
    (page === 'projects' ? `<div class="ws-view-switch" role="group" aria-label="طريقة العرض"><button class="ws-icon-button${!isGrid?' selected':''}" data-ws-layout="list" aria-label="عرض قائمة" title="عرض قائمة" aria-pressed="${!isGrid}">${wsIcon('list')}</button><button class="ws-icon-button${isGrid?' selected':''}" data-ws-layout="grid" aria-label="عرض بطاقات" title="عرض بطاقات" aria-pressed="${isGrid}">${wsIcon('layout-grid')}</button></div>` : '') + '</div></div>';
}
function wsCatalog(page) {
  const rows = wsRegistry().filter(row => row.page === page);
  const filtered = wsFiltered(rows,page);
  const grid = wsLayout(page) === 'grid';
  const extra = page === 'team' ? `<a class="ws-button" href="survey.html" target="_blank" rel="noopener">${wsIcon('clipboard-list')}استبيان الفريق</a>` : `<span class="ws-count">${wsNumber(rows.length)} عنصر</span>`;
  return wsHeader(page,extra) + wsSectionEvidence(page,rows) + (page === 'server' ? wsServerSummary() : '') + wsToolbar(page,rows) +
    `<div class="ws-result-count" role="status">${wsNumber(filtered.length)} من ${wsNumber(rows.length)}</div>` +
    `<div class="ws-entity-list ws-catalog-${page}${grid && page === 'projects' ? ' ws-card-grid' : ''}" data-presentation="${page}">${filtered.length ? wsCatalogBody(page,filtered,grid) : wsEmpty()}</div>`;
}
function wsServerSummary() {
  const health = WorkspaceModel.health(HEALTH_STATE);
  const metrics = HEALTH_STATE?.metrics;
  return `<section class="ws-server-summary"><div><span class="ws-badge ${health.state}">${wsIcon('server')}${health.label}</span><small>${E(wsDate(HEALTH_STATE?.checked_at))}</small></div>` +
    (metrics ? `<div><strong>${E(metrics.disk_free || '—')}</strong><small>مساحة متاحة</small></div><div><strong>${E(String(metrics.disk_pct ?? '—'))}%</strong><small>استخدام القرص</small></div><div><strong>${E(String(metrics.svc_failed ?? '—'))}</strong><small>خدمات فاشلة</small></div>` : '') + `</section>`;
}
function wsHome() {
  const rows = wsRegistry();
  const projects = rows.filter(row=>row.kind === 'project');
  const tracked = rows.filter(row=>!['team','idea'].includes(row.kind));
  const counts = WorkspaceModel.counts(tracked);
  const pinned = rows.filter(row=>wsPreferences.pinned.includes(row.key));
  const quick = pinned.length ? pinned : projects.filter(row=>WorkspaceModel.primaryLink(row)).slice(0,4);
  const allIssues = [...tracked].filter(row=>['fail','warn','stale'].includes(wsMeta(row).state)).sort((a,b)=>wsMeta(a).rank-wsMeta(b).rank);
  const issues = wsReviewExpanded ? allIssues : allIssues.slice(0,5);
  const date = new Intl.DateTimeFormat(WorkspaceModel.LOCALE,{ weekday:'long',day:'numeric',month:'long',timeZone:'Europe/Istanbul' }).format(new Date());
  return wsHeader('home',`<div class="ws-date">${wsIcon('calendar-days')}${date}</div>`) +
    `<section class="ws-stat-band" aria-label="ملخص اللوحة">${[
      ['projects','folder-kanban',PRJ.length,'مشروع','ضمن '+wsNumber(UMBRELLAS.length)+' مجموعات'],
      ['server','server',SVC.length,'خدمة مسجلة','تشغيل ومتابعة'],
      ['review','circle-alert',counts.fail+counts.warn,'تحتاج انتباهًا','بحسب آخر فحص حديث'],
      ['review','clock-3',counts.stale,'نتيجة قديمة','تحتاج إعادة تحقق'],
    ].map(([page,icon,num,label,note])=>`<button class="ws-stat" data-ws-stat="${page}"><span class="ws-stat-label">${wsIcon(icon)}${label}</span><strong>${wsNumber(num)}</strong><span class="ws-stat-note">${note}</span></button>`).join('')}</section>` +
    `<section class="ws-quick-section">${wsSectionTitle(pinned.length ? 'العناصر المثبتة' : 'الوصول السريع',wsGo('projects','كل المشاريع'))}<div class="ws-quick-grid">${quick.map(row=>`<article class="ws-quick-item" data-tone="${wsTone(row)}"><div class="ws-quick-top">${wsOpenButton(row,`<span class="ws-entity-icon">${wsGlyph(row)}</span><strong>${E(row.title)}</strong>`,'ws-quick-name')}${wsStar(row)}</div><div class="ws-quick-bottom"><span>${E(wsGroup(row)||WS_PAGES[row.page].title)}</span>${WorkspaceModel.primaryLink(row) ? wsExternal(WorkspaceModel.primaryLink(row).url,WorkspaceModel.primaryLink(row).label) : wsOpenButton(row,'التفاصيل','ws-button')}</div></article>`).join('')}</div></section>` +
    wsHomeRelations() + `<div class="ws-home-columns"><div class="ws-home-main"><section>${wsSectionTitle('مشاريعك',wsGo('projects','عرض الكل'))}<div class="ws-entity-list ws-home-projects">${projects.slice(0,6).map(row=>wsListRow(row)).join('')}</div></section>` +
    `<section class="ws-review-section" id="ws-review">${wsSectionTitle('قائمة المراجعة',`<span class="ws-count">${wsNumber(allIssues.length)} عنصر</span>`)}${issues.length ? `<div class="ws-review-list">${issues.map(row=>wsOpenButton(row,`<span class="ws-review-icon ${wsMeta(row).state}">${wsIcon(wsMeta(row).icon)}</span><span><strong>${E(row.title)}</strong><small>${E(wsMeta(row).label)} · ${E(wsDate(row.record?.verified_at))}</small></span>${wsIcon('chevron-left')}`,'ws-review-item')).join('')}</div>${allIssues.length > 5 ? `<button class="ws-text-button" data-ws-review aria-expanded="${wsReviewExpanded}">${wsReviewExpanded ? 'عرض أقل' : 'عرض القائمة كاملة'}${wsIcon(wsReviewExpanded ? 'chevron-up' : 'chevron-down')}</button>` : ''}` : `<div class="ws-quiet-state">${wsIcon('circle-check')}لا توجد تنبيهات في نتائج الفحص المتاحة</div>`}</section></div>` +
    `<aside class="ws-home-aside"><section>${wsSectionTitle('الخادم')}${wsServerSummary()}${wsGo('server','تفاصيل التشغيل')}</section>` +
    `<section>${wsSectionTitle('الشركات والمجموعات')}${UMBRELLAS.map(u=>`<button class="ws-company-line" data-ws-company="${E(u.id)}"><span class="ws-company-mark">${E(nameInitial(u.name))}</span><span><strong>${E(u.name)}</strong><small>${wsNumber(PRJ.filter(p=>p.parent===u.id).length)} مشاريع</small></span>${wsIcon('chevron-left')}</button>`).join('')}</section>` +
    `<section class="ws-sync-note">${wsIcon('refresh-cw')}<div><strong>آخر تحديث للبيانات</strong><span>${E(wsDate(RUNTIME_STATE.generated_at))}</span>${RUNTIME_STATE.generated_at ? `<time datetime="${E(RUNTIME_STATE.generated_at)}">${E(_fmtRuntimeDate(RUNTIME_STATE.generated_at))}</time>` : '<span>جارٍ جلب نتائج الفحص</span>'}</div></section></aside></div>`;
}
function wsCompanies() {
  const projects = wsRegistry().filter(row=>row.kind==='project');
  return wsHeader('umbrellas',`<span class="ws-count">${wsNumber(UMBRELLAS.length)} مجموعات</span>`) + '<p class="rel-note">التفرعات تبيّن التبعية للشركة في السجل. إسناد العمل إلى شخص يظهر في ملفه؛ وجوده في الشركة لا يعني مسؤوليته عن كل مشاريعها.</p>' + UMBRELLAS.map(u=> {
    const rows = projects.filter(row=>row.item.parent===u.id);
    const members = TEAM.filter(member=>member.parent===u.id);
    return `<section class="ws-company-section" data-tone="${WS_COMPANY_TONES[u.id] || 'graphite'}"><header><div class="ws-company-mark">${E(nameInitial(u.name))}</div><div><h2>${E(u.name)}</h2><p>${E(u.specialty || u.summary || '')}</p></div><div class="ws-company-counts"><span>${wsNumber(rows.length)} مشاريع</span><span>${wsNumber(members.length)} أعضاء</span></div></header><div class="ws-company-branches"><div class="ws-company-projects"><h3>المشاريع</h3>${rows.map(row=>wsOpenButton(row,`${wsIcon('folder')}<strong>${E(row.title)}</strong>${wsIcon('chevron-left')}`,'ws-company-project')).join('') || '<p class="ws-muted">لا توجد مشاريع مسجلة.</p>'}</div><div class="ws-company-team"><h3>الفريق</h3>${members.length ? members.map(member=>`<button data-action="openTeam" data-arg="${E(member.name)}">${wsIcon('user-round')}<strong>${E(member.full_name||member.name)}</strong><span>${E(member.role||'')}</span></button>`).join('') : '<p class="ws-muted">لا يوجد أعضاء مسجلون.</p>'}</div></div></section>`;
  }).join('');
}
function wsMap() {
  const rows = wsRegistry().filter(row=>row.item.local_path || row.item.server_path || row.item.path || row.item.repo_url);
  const state = wsState('map');
  const filtered = rows.filter(row=>WorkspaceModel.matches(row,state.query));
  return wsHeader('map',`<span class="ws-count">${wsNumber(rows.length)} مرجع</span>`) + '<p class="rel-note">كل مسار تابع للعنصر المكتوب فوقه، وليس رابطًا بين خدمتين. وجود الملف لا يثبت تشغيل المشروع؛ افتح صفحته لنتيجة التحقق وعلاقاته.</p>' +
    `<div class="ws-toolbar"><label class="ws-inline-search">${wsIcon('search')}<input type="search" data-ws-query="map" aria-label="البحث في المسارات" placeholder="بحث عن مشروع أو مسار…" value="${E(state.query)}"></label><a class="ws-button" href="graph.html" target="_blank" rel="noopener">${wsIcon('network')}خريطة العلاقات</a></div>` +
    `<div class="ws-path-list">${filtered.map(row=>`<article class="ws-path-item">${wsOpenButton(row,`<strong>${E(row.title)}</strong>${wsIcon('arrow-up-left')}`,'ws-path-title')}${[['على جهازك',row.item.local_path],['على الخادم',row.item.server_path],['المسار',row.item.path],['المستودع',row.item.repo_url]].filter(([,v],i,a)=>v && a.findIndex(([,x])=>x===v)===i).map(([label,value])=>`<div class="ws-path-row"><span>${label}</span><code dir="ltr">${E(value)}</code><button class="ws-icon-button" data-ws-copy="${E(value)}" aria-label="نسخ ${E(label)}" title="نسخ">${wsIcon('copy')}</button></div>`).join('')}</article>`).join('') || wsEmpty()}</div>`;
}

R.home = wsHome;
R.umbrellas = wsCompanies;
R.map = wsMap;
for (const page of Object.keys(WS_PAGES).filter(page=>WS_PAGES[page].kind)) R[page] = () => wsCatalog(page);
for (const page of Object.keys(WS_PAGES)) _RUNTIME_BOUND_PAGES.add(page);
ccActions.closeMore = closeMore;
_buildSearchIndex = function () {
  return wsRegistry().map(row=>({id:row.key,kind:row.kind,page:row.page,title:row.title,
    subtitle:wsSummary(row),route:WorkspaceModel.route(row),
    tokens:WorkspaceModel.normalize([row.title,row.arg,wsSummary(row),WorkspaceContent.note(row)?.join(' '),WorkspaceContent.profile(row)?.areas.flat().join(' '),row.item.role,row.item.host,
      row.item.local_path,row.item.server_path,row.item.path,row.item.repo_url,...(row.item.tags||[])].join(' ')),
    action:()=>wsShowDetail(row)}));
};

function wsOpenOverlay(id) {
  const root = document.getElementById(id);
  if (!root || wsOverlay?.root === root) return;
  wsCloseOverlay();
  const siblings = [...document.body.children].filter(el => el !== root && !['SCRIPT','STYLE'].includes(el.tagName));
  wsOverlay = { root, focus:document.activeElement, siblings:siblings.map(el=>({el,inert:el.inert,hidden:el.getAttribute('aria-hidden')})) };
  siblings.forEach(el=>{ el.inert=true; el.setAttribute('aria-hidden','true'); });
  document.documentElement.classList.add('ws-modal-open');
  root.classList.add('open');
  root.querySelector('input,button,a[href]')?.focus();
}
function wsCloseOverlay() {
  if (!wsOverlay) return;
  const previous=wsOverlay;
  wsOverlay=null;
  previous.root.classList.remove('open');
  previous.siblings.forEach(({el,inert,hidden})=>{
    el.inert=inert;
    if(hidden===null) el.removeAttribute('aria-hidden'); else el.setAttribute('aria-hidden',hidden);
  });
  document.documentElement.classList.remove('ws-modal-open');
  if(previous.focus?.isConnected) previous.focus.focus({preventScroll:true});
}
document.addEventListener('keydown',event=>{
  if(!wsOverlay) return;
  const controls=[...wsOverlay.root.querySelectorAll('input,button:not([disabled]),a[href],select')].filter(el=>el.getClientRects().length);
  if(event.key==='Tab' && controls.length) {
    const first=controls[0],last=controls[controls.length-1];
    if(event.shiftKey && document.activeElement===first) { event.preventDefault(); last.focus(); }
    else if(!event.shiftKey && document.activeElement===last) { event.preventDefault(); first.focus(); }
  }
  if(wsOverlay.root.id==='global-search' && ['ArrowDown','ArrowUp'].includes(event.key)) {
    const results=[...wsOverlay.root.querySelectorAll('.search-result')];
    const index=results.indexOf(document.activeElement);
    const next=event.key==='ArrowDown'?index+1:index-1;
    event.preventDefault();
    if(results[next]) results[next].focus();
    else document.getElementById('search-input')?.focus();
  }
});

document.addEventListener('click', async event => {
  const target = event.target instanceof Element ? event.target.closest('[data-ws-open],[data-ws-pin],[data-ws-layout],[data-ws-scope],[data-ws-reset],[data-ws-refresh],[data-ws-company],[data-ws-stat],[data-ws-copy],[data-ws-review]') : null;
  if (!target) return;
  if (target.hasAttribute('data-ws-open')) {
    if(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const row=wsRegistry().find(row=>row.key===target.dataset.wsOpen);
    if(row) ccActions[row.action](row.arg);
  } else if (target.hasAttribute('data-ws-review')) {
    wsReviewExpanded=!wsReviewExpanded; wsRender();
  } else if (target.hasAttribute('data-ws-pin')) {
    const key=target.dataset.wsPin;
    wsPreferences={...wsPreferences,pinned:wsPreferences.pinned.includes(key)?wsPreferences.pinned.filter(id=>id!==key):[...wsPreferences.pinned,key]};
    wsSavePreferences(); wsRender();
  } else if (target.hasAttribute('data-ws-layout')) {
    wsPreferences={...wsPreferences,layouts:{...wsPreferences.layouts,[cur]:target.dataset.wsLayout}};
    wsSavePreferences(); wsRender();
  } else if (target.hasAttribute('data-ws-scope')) {
    wsPageState={...wsPageState,[cur]:{...wsState(cur),scope:target.dataset.wsScope}}; wsRender();
  } else if (target.hasAttribute('data-ws-reset')) {
    wsPageState={...wsPageState,[cur]:{}}; wsRender();
  } else if (target.hasAttribute('data-ws-company')) {
    const company=UMBRELLAS.find(u=>u.id===target.dataset.wsCompany);
    wsPageState={...wsPageState,projects:{...wsState('projects'),group:company?.name||'all'}}; go('projects');
  } else if (target.hasAttribute('data-ws-stat')) {
    if(target.dataset.wsStat==='review') document.getElementById('ws-review')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
    else go(target.dataset.wsStat);
  } else if (target.hasAttribute('data-ws-copy')) {
    try { await navigator.clipboard.writeText(target.dataset.wsCopy); ccToast('تم النسخ','ok'); }
    catch { ccToast('تعذر النسخ','warn'); }
  } else if (target.hasAttribute('data-ws-refresh') && !wsRefreshing) {
    wsRefreshing=true; wsUpdateShell();
    try {
      const loaded=await _loadRuntimeData();
      const healthLoaded=await _loadHealthData();
      wsRender();
      const complete=loaded && healthLoaded;
      ccToast(complete?'تم جلب أحدث البيانات المحفوظة':loaded || healthLoaded?'تحدث جزء من البيانات؛ تعذر جلب الجزء الآخر':'تعذر جلب البيانات؛ تُعرض آخر نسخة متاحة',complete?'ok':'warn');
    }
    finally { wsRefreshing=false; wsUpdateShell(); }
  }
});
document.addEventListener('input',event=>{
  const target=event.target;
  if (!(target instanceof HTMLInputElement) || !target.hasAttribute('data-ws-query')) return;
  const page=target.dataset.wsQuery;
  wsPageState={...wsPageState,[page]:{...wsState(page),query:target.value}}; wsRender(page);
});
document.addEventListener('change',event=>{
  const target=event.target;
  if (!(target instanceof HTMLSelectElement)) return;
  const key=target.hasAttribute('data-ws-group')?'group':target.hasAttribute('data-ws-sort')?'sort':null;
  if(key) { wsPageState={...wsPageState,[cur]:{...wsState(cur),[key]:target.value}}; wsRender(); }
});
