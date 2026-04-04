/* ══════════════════════════════════════════════
   APP.JS — الدوال فقط، لا بيانات هنا
   البيانات في data.js (يُحمَّل قبل هذا الملف)
   ══════════════════════════════════════════════ */

/* ─────────────── 1. UTILITIES ─────────────── */

const E = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

/* ── ICON SYSTEM — Lucide SVG icons replace emojis ── */
const IC={
  '🏠':'home','🚀':'rocket','🗺️':'map','⚙️':'settings','🖥️':'monitor',
  '🤖':'bot','🛠️':'wrench','💡':'lightbulb','☁️':'cloud','🗄️':'archive',
  '🏨':'building-2','💒':'heart','📢':'megaphone','💳':'credit-card',
  '⚡':'zap','💬':'message-circle','🌐':'globe','♟️':'trophy',
  '🧠':'brain','💰':'wallet','🏦':'landmark','💱':'arrow-right-left',
  '🏢':'building','🛍️':'shopping-bag','🏗️':'hard-hat','📸':'camera',
  '🔐':'lock-keyhole','🦞':'terminal','🐙':'github','📊':'bar-chart-3',
  '✈️':'send','🔍':'search','🕷️':'scan-search','🔗':'link',
  '🪙':'circle-dollar-sign','🚂':'train-front','📝':'file-text',
  '🔒':'shield-check','📁':'folder-open','🔧':'settings',
  '🕵️':'scan-eye','📘':'book-open','🟣':'circle-dot','▲':'triangle',
  '⏰':'clock','💾':'hard-drive','🛡️':'shield','📱':'smartphone',
  '📦':'package','🎯':'target','🔄':'refresh-cw','🐳':'container',
  '📡':'radio-tower','👥':'users','🌍':'earth','📈':'trending-up',
  '💹':'trending-up','🎨':'palette','🔔':'bell','🎮':'gamepad-2',
  '👤':'user','📌':'pin','⚠️':'alert-triangle','📂':'folder',
  '🏷️':'tag','📐':'ruler','📍':'map-pin','📄':'file-text',
  '⛔':'ban','🔴':'circle','🟡':'circle','⚫':'circle','🔥':'flame'
};

/* _icText(str) — replaces leading emoji in text with icon */
function _icText(str){
  if(!str)return '';
  const chars=[...str];
  const first=chars[0];
  const nm=IC[first];
  if(nm) return _ic(first,12)+' '+E(str.replace(first,'').replace(/^\uFE0F/,'').trim());
  // Try two-char emoji
  if(chars.length>1){
    const two=chars[0]+chars[1];
    const nm2=IC[two];
    if(nm2) return _ic(two,12)+' '+E(str.substring(two.length).replace(/^\uFE0F/,'').trim());
  }
  return E(str);
}

/* _projAnim(emoji, color) — animated SVG motion graphic per project */
function _projAnim(em,cl){
const A={
'🏨':`<svg viewBox="0 0 44 44" width="38" height="38"><rect x="10" y="8" width="24" height="30" rx="2" fill="none" stroke="${cl}" stroke-width="1.5"/><rect x="18" y="30" width="8" height="8" rx="1" fill="none" stroke="${cl}" stroke-width="1.5"/><rect x="14" y="13" width="4" height="3" rx=".5" fill="${cl}" class="pm-win" style="--d:0s"/><rect x="20" y="13" width="4" height="3" rx=".5" fill="${cl}" class="pm-win" style="--d:.4s"/><rect x="26" y="13" width="4" height="3" rx=".5" fill="${cl}" class="pm-win" style="--d:.8s"/><rect x="14" y="19" width="4" height="3" rx=".5" fill="${cl}" class="pm-win" style="--d:1.2s"/><rect x="20" y="19" width="4" height="3" rx=".5" fill="${cl}" class="pm-win" style="--d:1.6s"/><rect x="26" y="19" width="4" height="3" rx=".5" fill="${cl}" class="pm-win" style="--d:2s"/><rect x="14" y="25" width="4" height="3" rx=".5" fill="${cl}" class="pm-win" style="--d:.2s"/><rect x="20" y="25" width="4" height="3" rx=".5" fill="${cl}" class="pm-win" style="--d:1s"/><rect x="26" y="25" width="4" height="3" rx=".5" fill="${cl}" class="pm-win" style="--d:1.8s"/></svg>`,

'💒':`<svg viewBox="0 0 44 44" width="38" height="38"><path d="M22 8 L22 16" stroke="${cl}" stroke-width="1.5" stroke-linecap="round"/><path d="M22 14 C16 14 12 20 12 24 L12 36 L32 36 L32 24 C32 20 28 14 22 14Z" fill="none" stroke="${cl}" stroke-width="1.5"/><circle cx="22" cy="22" r="4" fill="none" stroke="${cl}" stroke-width="1.2" class="pm-beat"/><rect x="19" y="30" width="6" height="6" rx="1" fill="none" stroke="${cl}" stroke-width="1.2"/><circle cx="22" cy="8" r="2" fill="${cl}" class="pm-sparkle"/><circle cx="16" cy="11" r="1" fill="${cl}" class="pm-sparkle" style="--d:.5s"/><circle cx="28" cy="11" r="1" fill="${cl}" class="pm-sparkle" style="--d:1s"/></svg>`,

'📢':`<svg viewBox="0 0 44 44" width="38" height="38"><path d="M10 18 L10 26 L16 26 L24 32 L24 12 L16 18Z" fill="none" stroke="${cl}" stroke-width="1.5" stroke-linejoin="round"/><path d="M28 16 C30 18 30 26 28 28" fill="none" stroke="${cl}" stroke-width="1.5" stroke-linecap="round" class="pm-wave" style="--d:0s"/><path d="M31 12 C35 16 35 28 31 32" fill="none" stroke="${cl}" stroke-width="1.5" stroke-linecap="round" class="pm-wave" style="--d:.3s"/><path d="M34 8 C40 14 40 30 34 36" fill="none" stroke="${cl}" stroke-width="1.2" stroke-linecap="round" class="pm-wave" style="--d:.6s"/></svg>`,

'💳':`<svg viewBox="0 0 44 44" width="38" height="38"><rect x="6" y="12" width="32" height="22" rx="3" fill="none" stroke="${cl}" stroke-width="1.5"/><line x1="6" y1="19" x2="38" y2="19" stroke="${cl}" stroke-width="1.5"/><rect x="10" y="24" width="10" height="2" rx="1" fill="${cl}" opacity=".4"/><rect x="10" y="28" width="6" height="2" rx="1" fill="${cl}" opacity=".3"/><line x1="0" y1="12" x2="0" y2="34" stroke="${cl}" stroke-width="2" stroke-linecap="round" class="pm-scan"/></svg>`,

'⚡':`<svg viewBox="0 0 44 44" width="38" height="38"><polygon points="24,4 12,24 20,24 18,40 32,18 24,18" fill="none" stroke="${cl}" stroke-width="1.5" stroke-linejoin="round" class="pm-flash"/><circle cx="22" cy="22" r="18" fill="none" stroke="${cl}" stroke-width=".8" opacity=".15" class="pm-ring1"/><circle cx="22" cy="22" r="14" fill="none" stroke="${cl}" stroke-width=".6" opacity=".1" class="pm-ring2"/></svg>`,

'💬':`<svg viewBox="0 0 44 44" width="38" height="38"><rect x="6" y="8" width="22" height="16" rx="4" fill="none" stroke="${cl}" stroke-width="1.5"/><path d="M12 24 L10 30 L18 24" fill="none" stroke="${cl}" stroke-width="1.5" stroke-linejoin="round"/><rect x="18" y="18" width="18" height="12" rx="3" fill="none" stroke="${cl}" stroke-width="1.2" class="pm-bubble"/><circle cx="13" cy="15" r="1.2" fill="${cl}" class="pm-dot" style="--d:0s"/><circle cx="17" cy="15" r="1.2" fill="${cl}" class="pm-dot" style="--d:.3s"/><circle cx="21" cy="15" r="1.2" fill="${cl}" class="pm-dot" style="--d:.6s"/></svg>`,

'🌐':`<svg viewBox="0 0 44 44" width="38" height="38"><circle cx="22" cy="22" r="16" fill="none" stroke="${cl}" stroke-width="1.5"/><ellipse cx="22" cy="22" rx="8" ry="16" fill="none" stroke="${cl}" stroke-width="1" opacity=".5"/><line x1="6" y1="22" x2="38" y2="22" stroke="${cl}" stroke-width=".8" opacity=".4"/><line x1="6" y1="16" x2="38" y2="16" stroke="${cl}" stroke-width=".6" opacity=".25"/><line x1="6" y1="28" x2="38" y2="28" stroke="${cl}" stroke-width=".6" opacity=".25"/><circle cx="34" cy="10" r="3" fill="none" stroke="${cl}" stroke-width="1" class="pm-orbit"/></svg>`,

'♟️':`<svg viewBox="0 0 44 44" width="38" height="38"><circle cx="22" cy="12" r="5" fill="none" stroke="${cl}" stroke-width="1.5"/><path d="M16 38 L16 30 C16 26 18 24 22 22 C26 24 28 26 28 30 L28 38" fill="none" stroke="${cl}" stroke-width="1.5"/><line x1="14" y1="38" x2="30" y2="38" stroke="${cl}" stroke-width="1.5" stroke-linecap="round"/><line x1="22" y1="7" x2="22" y2="4" stroke="${cl}" stroke-width="1.2" stroke-linecap="round"/><rect x="12" y="6" width="20" height="36" fill="${cl}" opacity="0" class="pm-shine"/></svg>`
};
return A[em]||_ic(em,22);
}

/* _ic(emoji, size) — returns Lucide icon markup */
function _ic(em,sz){
  const nm=IC[em]; if(!nm) return em||'';
  const s=sz||20; const sw=s>28?1.5:s>18?1.75:2;
  return `<span class="ic-wrap" style="width:${s}px;height:${s}px;display:inline-flex;align-items:center;justify-content:center;line-height:0"><i data-lucide="${nm}" style="width:${s}px;height:${s}px" stroke-width="${sw}"></i></span>`;
}

/* _processIcons — aggressive: scans ALL DOM for remaining emojis */
function _processIcons(){
  if(!window.lucide)return;
  // Target known containers
  const targets=[
    ['.nav-icon',16,2],['.bar-icon',20,2],['.more-icon',22,2],
    ['.brand-icon',20,2.5],['.orb-icon',22,2],['.svc-em',18,2],
    ['.planet-emoji',26,1.5],['.book-emoji',32,1.5],
    ['.sticky-emoji',36,1.5],['.bot-emoji',26,2],
    ['.map-item>span:first-child',18,2]
  ];
  targets.forEach(([sel,sz,sw])=>{
    document.querySelectorAll(sel).forEach(el=>{
      if(el.querySelector('svg'))return;
      const em=el.textContent.trim();
      const nm=IC[em];
      if(nm) el.innerHTML=`<i data-lucide="${nm}" style="width:${sz}px;height:${sz}px" stroke-width="${sw}"></i>`;
    });
  });
  // Handle ANY span with font-size containing single emoji
  document.querySelectorAll('span[style*="font-size"]').forEach(el=>{
    if(el.querySelector('svg')||el.children.length>0)return;
    const em=el.textContent.trim();
    if(!em||em.length>4)return;
    const nm=IC[em];
    if(nm){
      const m=el.style.fontSize.match(/(\d+)/);
      const sz=m?parseInt(m[1]):24;
      el.innerHTML=`<i data-lucide="${nm}" style="width:${sz}px;height:${sz}px" stroke-width="${sz>28?1.5:2}"></i>`;
    }
  });
  lucide.createIcons();
}
const M = {};
[...PRJ,...BOT,...TL,...ARC,...IDEAS].forEach(i => { M[i.name] = i; });
SVC.forEach(i => { M[i.name] = i; });
CLD.forEach(i => { M[i.nm] = i; });

function _entityLookup(name) {
  if (!name) return null;
  return [...PRJ, ...BOT, ...ARC, ...TL].find(x => x.name === name || x.ar === name)
    || CLD.find(x => x.nm === name)
    || M[name]
    || null;
}

function _entityColor(name, fallback) {
  const entity = _entityLookup(name);
  return entity?.cl || _prjColor(name) || fallback || '#888';
}

function _relChips(names) {
  if (!names || !names.length) return '';
  return [...new Set(names.filter(Boolean))].map(rn => {
    const rp = _entityLookup(rn);
    const label = rp ? (rp.ar || rp.name || rp.nm) : rn;
    return rp ? `<span class="meta-chip">${_ic(rp.em,12)} ${E(label)}</span>` : `<span class="meta-chip">${E(rn)}</span>`;
  }).join('');
}

function _archiveKindLabel(item) {
  const map = {
    'archived-project':'مشروع مؤرشف',
    'archived-brand':'هوية مؤرشفة',
    'archived-client-work':'عمل عميل مؤرشف',
    'archived-site-export':'تصدير موقع مؤرشف',
    'archived-tool':'أداة مؤرشفة',
    'active-security':'مرجع أمني نشط',
    'active-runtime':'طبقة تشغيل نشطة'
  };
  return map[item.kind] || (item.st === 'a' ? 'نشط' : 'مؤرشف');
}

function _archiveStamp(item) {
  if (item.kind === 'active-security') return 'نشط';
  if (item.kind === 'active-runtime') return 'Runtime';
  if (item.st === 'a') return 'نشط';
  return 'مؤرشف';
}

function _projectKindLabel(kind) {
  return {
    product:'منتج',
    umbrella:'منظومة',
    dashboard:'لوحة',
    website:'موقع',
    'service-app':'خدمة',
    'content-product':'منتج محتوى',
    'internal-tool':'أداة داخلية',
    'financial-app':'تطبيق مالي'
  }[kind] || kind;
}

function _toolCategoryLabel(category) {
  return {
    'developer-env':'AI CLI',
    'internal-tool':'أداة داخلية',
    'platform':'منصة',
    'infra-access':'وصول بنية',
    'mcp':'MCP'
  }[category] || category;
}

function _botKindLabel(kind) {
  return {
    'telegram-bot':'بوت Telegram',
    'agent-runtime':'runtime وكلاء',
    'assistant-channel':'قناة مساعد',
    'financial-app':'تطبيق مالي'
  }[kind] || kind;
}

function _cloudCategoryLabel(category) {
  return {
    'platform':'منصة',
    'database-platform':'منصة بيانات',
    'deployment':'نشر',
    'marketing-platform':'تسويق',
    'data-platform':'بيانات',
    'communication':'تواصل',
    'infrastructure':'بنية',
    'storage':'تخزين',
    'mcp-linked':'MCP',
    'network':'شبكة',
    'external-api':'API'
  }[category] || category;
}

function _serviceTypeLabel(kind) {
  return {
    app:'تطبيق',
    container:'حاوية',
    database:'قاعدة بيانات',
    'agent-runtime':'runtime',
    'user-service':'خدمة مستخدم',
    cron:'cron',
    network:'شبكة'
  }[kind] || kind;
}

function _searchableText(v) {
  if (!v) return '';
  if (Array.isArray(v)) return v.map(_searchableText).join(' ');
  if (typeof v === 'object') return Object.values(v).map(_searchableText).join(' ');
  return String(v);
}

function _buildSearchIndex() {
  const rows = [];
  const push = (entry) => rows.push({
    id: entry.id,
    kind: entry.kind,
    page: entry.page,
    title: entry.title,
    subtitle: entry.subtitle || '',
    action: entry.action || null,
    tokens: _searchableText(entry.tokens).toLowerCase()
  });

  PRJ.forEach(p => push({
    id: p.id,
    kind: 'project',
    page: 'projects',
    title: p.ar || p.name,
    subtitle: p.summary || p.kind,
    action: () => { go('projects'); setTimeout(() => openProjectDetail(p.name), 120); },
    tokens: [p.name, p.ar, p.summary, p.desc, p.tags, p.stack, p.subsystems, p.local_path, p.server_path, p.repo_url, p.deploy_url]
  }));

  SVC.forEach(s => push({
    id: s.id,
    kind: 'service',
    page: 'server',
    title: s.name,
    subtitle: [s.owner || s.prj, s.service_type, s.host].filter(Boolean).join(' · '),
    action: () => { go('server'); setTimeout(() => openServiceDetail(s.name), 120); },
    tokens: [s.name, s.prj, s.owner, s.owner_type, s.info, s.dt, s.path, s.runtime, s.service_type, s.host, s.schedule, s.port]
  }));

  AUTO.forEach(group => group.tasks.forEach(task => push({
    id: `${group.group}-${task.name}`,
    kind: 'automation',
    page: 'auto',
    title: task.name,
    subtitle: [group.group, task.prj, task.freq].filter(Boolean).join(' · '),
    action: () => {
      go('auto');
      const id = `auto-${encodeURIComponent(group.group+'-'+task.name).replace(/%/g,'')}`;
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({block:'center', behavior:'smooth'});
          el.classList.add('auto-task-focus');
          setTimeout(() => el.classList.remove('auto-task-focus'), 1800);
        }
      }, 120);
    },
    tokens: [group.group, task.name, task.what, task.prj, task.path, task.kind, task.freq, task.on]
  })));

  BOT.forEach(b => push({
    id: b.id,
    kind: 'bot',
    page: 'bots',
    title: b.ar || b.name,
    subtitle: [_botKindLabel(b.kind), b.host].filter(Boolean).join(' · '),
    action: () => { go('bots'); setTimeout(() => openBotDetail(b.name), 120); },
    tokens: [b.name, b.ar, b.summary, b.desc, b.tags, b.kind, b.host, b.runtime, b.channel, b.related_entities]
  }));

  TL.forEach(t => push({
    id: t.id,
    kind: 'tool',
    page: 'tools',
    title: t.ar || t.name,
    subtitle: [t.category, ...(t.used_in||[])].filter(Boolean).join(' · '),
    action: () => { go('tools'); setTimeout(() => openToolDetail(t.name), 120); },
    tokens: [t.name, t.ar, t.summary, t.desc, t.tags, t.category, t.type, t.used_in, t.path]
  }));

  CLD.forEach(c => push({
    id: c.id,
    kind: 'cloud',
    page: 'cloud',
    title: c.nm,
    subtitle: [_cloudCategoryLabel(c.category), c.prj].filter(Boolean).join(' · '),
    action: () => { go('cloud'); setTimeout(() => openCloudDetail(c.nm), 120); },
    tokens: [c.nm, c.dt, c.category, c.prj, c.used_in, c.related_entities, c.lk]
  }));

  ARC.forEach(a => push({
    id: a.id,
    kind: a.kind,
    page: 'archive',
    title: a.ar || a.name,
    subtitle: [ _archiveKindLabel(a), ...(a.related_projects || []) ].filter(Boolean).join(' · '),
    action: () => { go('archive'); setTimeout(() => openArchiveDetail(a.name), 120); },
    tokens: [a.name, a.ar, a.summary, a.desc, a.kind, a.related_projects, a.next_step, a.tags, a.path]
  }));

  IDEAS.forEach(i => push({
    id: i.id,
    kind: 'idea',
    page: 'ideas',
    title: i.name,
    subtitle: [i.horizon, i.owner_scope].filter(Boolean).join(' · '),
    action: () => { go('ideas'); setTimeout(() => openIdeaDetail(i.name), 120); },
    tokens: [i.name, i.summary, i.desc, i.horizon, i.owner_scope, i.related_projects, i.next_step]
  }));

  return rows;
}

let SEARCH_INDEX = [];
const _validPages = new Set(PG.map(p => p.id));
function _readHash() { const h = location.hash.slice(1).split('/')[0]; return _validPages.has(h) ? h : 'home'; }
let cur = _readHash();
const MOBILE_ITEMS = ['home','projects','server','bots','tools'];

function _setHashSilently(nextHash) {
  const normalized = nextHash.startsWith('#') ? nextHash : `#${nextHash}`;
  if (location.hash === normalized) {
    _suppressHash = false;
    return;
  }
  _suppressHash = true;
  location.hash = normalized;
}

/* ─────────────── 2. NAVIGATION ─────────────── */

function init() {
  const sidebar = document.getElementById('sidebar');
  const bottomBar = document.getElementById('bottom-bar');
  const app = document.getElementById('app');
  SEARCH_INDEX = _buildSearchIndex();

  if (sidebar) {
    sidebar.innerHTML = '<div class="sidebar-brand"><span class="brand-icon">'+_ic('⚡',20)+'</span><span class="brand-text">مركز التحكم</span></div>' +
      '<button class="search-trigger" onclick="openSearch()" aria-label="بحث">'+_ic('🔍',16)+'<span>بحث</span></button>' +
      '<nav class="sidebar-nav">' + PG.map(p =>
        `<a class="nav-item${cur===p.id?' active':''}" data-page="${p.id}" onclick="go('${p.id}')">`+
        `<span class="nav-icon">${p.ic}</span><span class="nav-label">${E(p.n)}</span></a>`
      ).join('') + '</nav>';
  }

  if (bottomBar) {
    const mobilePages = PG.filter(p => MOBILE_ITEMS.includes(p.id));
    const morePage = PG.filter(p => !MOBILE_ITEMS.includes(p.id));
    bottomBar.innerHTML = mobilePages.map(p =>
      `<a class="bar-item${cur===p.id?' active':''}" data-page="${p.id}" onclick="go('${p.id}')">`+
      `<span class="bar-icon">${p.ic}</span><span class="bar-label">${E(p.n)}</span></a>`
    ).join('') +
    `<a class="bar-item" onclick="openSearch()"><span class="bar-icon">⌕</span><span class="bar-label">بحث</span></a>` +
    `<a class="bar-item" onclick="openMore()"><span class="bar-icon">⋯</span><span class="bar-label">المزيد</span></a>`;

    const sheet = document.createElement('div');
    sheet.id = 'more-sheet';
    sheet.className = 'more-sheet';
    sheet.innerHTML = '<div class="more-sheet-overlay" onclick="closeMore()"></div>' +
      '<div class="more-sheet-content">' +
      '<div class="more-sheet-handle"></div>' +
      morePage.map(p =>
        `<a class="more-item" data-page="${p.id}" onclick="go('${p.id}');closeMore()">`+
        `<span class="more-icon">${p.ic}</span><span class="more-label">${E(p.n)}</span></a>`
      ).join('') + '</div>';
    document.body.appendChild(sheet);
  }

  if (!document.getElementById('global-search')) {
    const search = document.createElement('div');
    search.id = 'global-search';
    search.className = 'global-search';
    search.innerHTML =
      '<div class="search-overlay" onclick="closeSearch()"></div>' +
      '<div class="search-panel">' +
        '<div class="search-head">' +
          `<span class="search-icon">${_ic('🔍',18)}</span>` +
          '<input id="search-input" class="search-input" type="text" dir="rtl" placeholder="ابحث في المشاريع، الخدمات، الأتمتة، البوتات، الأدوات، السحابة، الأرشيف..." autocomplete="off" />' +
          '<button class="search-close" onclick="closeSearch()" aria-label="إغلاق">&times;</button>' +
        '</div>' +
        '<div class="search-helper">يشمل كل البيانات المنظمة في اللوحة. جرّب اسم مشروع، مسار، خدمة، أداة، أو كلمة من الوصف.</div>' +
        '<div id="search-results" class="search-results"></div>' +
      '</div>';
    document.body.appendChild(search);
  }

  if (app) {
    app.innerHTML = PG.map(p =>
      `<section id="page-${p.id}" class="page${cur===p.id?' active':''}">${(R[p.id]||(() => ''))()}</section>`
    ).join('');
  }

  _updateCountdown();
  setInterval(_updateCountdown, 60000);
  requestAnimationFrame(_processIcons);
  _renderSearchResults('');

  const hashParts = location.hash.slice(1).split('/');
  if (hashParts[1]) {
    const itemName = decodeURIComponent(hashParts[1]);
    if (M[itemName] || SVC.find(s=>s.name===itemName) || CLD.find(c=>c.nm===itemName)) {
      setTimeout(() => openDetailSmart(itemName, hashParts[0]), 300);
    }
  }

  const input = document.getElementById('search-input');
  if (input && !input.dataset.bound) {
    input.dataset.bound = '1';
    input.addEventListener('input', e => _renderSearchResults(e.target.value || ''));
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const first = document.querySelector('.search-result');
        if (first) first.click();
      }
    });
  }
}

function _activatePage(id, syncHash) {
  if (!_validPages.has(id)) return;
  cur = id;
  if (syncHash) _setHashSilently(id);
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  const target = document.getElementById('page-' + id);
  if (target) { target.classList.add('active'); target.scrollTop = 0; }
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.page === id));
  document.querySelectorAll('.bar-item').forEach(el => el.classList.toggle('active', el.dataset.page === id));
  window.scrollTo(0, 0);
  requestAnimationFrame(_processIcons);
}

function go(id) {
  if (!_validPages.has(id)) return;
  closeDetail(true);
  _activatePage(id, true);
}

function openMore() {
  const s = document.getElementById('more-sheet');
  if (s) s.classList.add('open');
}

function closeMore() {
  const s = document.getElementById('more-sheet');
  if (s) s.classList.remove('open');
}

/* popstate removed — hashchange handles all navigation */

/* ─────────────── 3. RENDER FUNCTIONS ─────────────── */

const R = {};

/* ── HOME — Warm Bento Dashboard ── */
R.home = function() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('ar-EG',{weekday:'long',day:'numeric',month:'long'});
  const activeP = PRJ.filter(p=>p.st==='a');
  const pausedP = PRJ.filter(p=>p.st==='p');
  const activeSvc = SVC.filter(s=>s.st).length;
  const activeBots = BOT.filter(b=>b.st==='a').length;
  const allTasks = AUTO.flatMap(g => g.tasks);
  const activeTasks = allTasks.filter(t => t.on).length;
  const runningContainers = SVC.filter(s => s.service_type === 'container' && s.st).length;
  const runningCron = SVC.filter(s => s.service_type === 'cron' && s.st).length;
  const runningUserServices = SVC.filter(s => s.service_type === 'user-service' && s.st).length;
  const focusNames = ['BRIX Travel System','EasyBooking','Wapy.dev','WhatsApp CRM','Command Center'];
  const focus = focusNames.map(n => PRJ.find(p => p.name === n)).filter(Boolean);
  const urgentIdeas = IDEAS.filter(i => i.pr === 1 || i.pr === 2);
  const activeRefs = ARC.filter(a => a.st === 'a');
  const aiCliTools = TL.filter(t => t.category === 'developer-env').map(t => ({
    t: t.ar || t.name,
    d: t.summary || '',
    f: (t.facts || []).slice(0,2).join(' · '),
    a: `openToolDetail('${E(t.name)}')`
  }));
  const layerCards = [
    {t:'أنظمة ومنتجات', n: PRJ.filter(p => ['product','service-app','website','content-product','financial-app','dashboard'].includes(p.kind)).length, d:'مشاريع وتشغيل فعلي يملك كودًا أو نشرًا أو خدمة حية.', c:'#6C3AED'},
    {t:'تسويق وأتمتة', n: ['EasyBooking','WhatsApp CRM','Meta MCP'].length, d:'منظومات الإعلانات والتحويل والـ MCP الداخلي.', c:'#2563EB'},
    {t:'بوتات وأمن', n: BOT.length + activeRefs.length, d:'Argaz وTelegram bots والمراجع الأمنية الحساسة.', c:'#E11D48'},
    {t:'تشغيل ومعرفة', n: TL.length + CLD.length, d:'أدوات التطوير، السحابة، الوصول، والبنية التشغيلية.', c:'#0EA5E9'}
  ];
  const attention = [
    ...pausedP.map(p => ({t:'مشروع متوقف', n:p.ar, d:p.summary || '', c:p.cl, a:`openProjectDetail('${E(p.name)}')`})),
    ...BOT.filter(b => b.st !== 'a').map(b => ({t:'بوت غير نشط', n:b.ar, d:b.summary || '', c:b.cl, a:`openBotDetail('${E(b.name)}')`})),
    ...urgentIdeas.map(i => ({t:`فكرة ${i.horizon}`, n:i.name, d:i.next_step || i.summary || '', c:i.cl, a:`openIdeaDetail('${E(i.name)}')`}))
  ].slice(0,6);
  return `<div class="hq">`+
    `<section class="hq-card hq-hero">`+
      `<div class="hq-hero-copy">`+
        `<span class="hq-kicker">موجز تشغيلي</span>`+
        `<h1 class="hq-title">لوحة قرار، لا صفحة استعراض</h1>`+
        `<p class="hq-sub">هذه الصفحة يجب أن تجيب بسرعة على ثلاثة أسئلة: ما الذي تملكه، ما الذي يعمل الآن، وأين يجب أن تذهب لاحقًا.</p>`+
      `</div>`+
      `<div class="hq-hero-meta">`+
        `<div class="hq-status"><span class="hb-pulse"></span>مراجعة من المصدر المحلي والسيرفر</div>`+
        `<div class="hq-date">${dateStr}</div>`+
      `</div>`+
    `</section>`+

    `<section class="hq-card hq-metrics">`+
      [{l:'مشاريع',v:PRJ.length,c:'#6C3AED'},{l:'خدمات',v:SVC.length,c:'#0EA5E9'},{l:'أتمتة',v:allTasks.length,c:'#D97706'},{l:'بوتات',v:BOT.length,c:'#7C3AED'},{l:'أدوات',v:TL.length,c:'#2563EB'},{l:'سحابي',v:CLD.length,c:'#059669'}].map(m=>
        `<div class="hq-metric"><span class="hq-metric-val" style="color:${m.c}">${m.v}</span><span class="hq-metric-label">${m.l}</span></div>`
      ).join('')+
    `</section>`+

    `<section class="hq-card hq-layers">`+
      `<div class="hq-head"><h2>طبقات العمل</h2><span>كيف تُقرأ المنظومة</span></div>`+
      `<div class="hq-layer-grid">`+
        layerCards.map(x =>
          `<div class="hq-layer" style="--lc:${x.c}"><strong>${x.t}</strong><span class="hq-layer-num">${x.n}</span><p>${x.d}</p></div>`
        ).join('')+
      `</div>`+
    `</section>`+

    `<section class="hq-card hq-health">`+
      `<div class="hq-head"><h2>تشغيل حي</h2><span onclick="go('server')" class="hq-inline-link">افتح السيرفر</span></div>`+
      `<div class="hq-health-list">`+
        `<div class="hq-health-row"><span>خدمات عاملة</span><strong>${activeSvc}/${SVC.length}</strong></div>`+
        `<div class="hq-health-row"><span>حاويات Docker</span><strong>${runningContainers}</strong></div>`+
        `<div class="hq-health-row"><span>مهام cron</span><strong>${runningCron}</strong></div>`+
        `<div class="hq-health-row"><span>خدمات user</span><strong>${runningUserServices}</strong></div>`+
        `<div class="hq-health-row"><span>بوتات نشطة</span><strong>${activeBots}/${BOT.length}</strong></div>`+
        `<div class="hq-health-row"><span>أتمتة نشطة</span><strong>${activeTasks}/${allTasks.length}</strong></div>`+
      `</div>`+
      `<div class="hq-mini-note">المعروض هنا مبني على الجرد الموثق في ` + `data.js` + ` وليس على أرقام شكلية.</div>`+
    `</section>`+

    `<section class="hq-card hq-focus">`+
      `<div class="hq-head"><h2>المحاور الحالية</h2><span onclick="go('projects')" class="hq-inline-link">كل المشاريع</span></div>`+
      `<div class="hq-focus-list">`+
        focus.map(p =>
          `<button class="hq-focus-item" onclick="openProjectDetail('${E(p.name)}')">`+
            `<span class="hq-focus-icon">${_ic(p.em,20)}</span>`+
            `<div class="hq-focus-body"><strong>${E(p.ar)}</strong><p>${E(p.summary || '')}</p><span class="hq-focus-meta">${E(_projectKindLabel(p.kind))} · ${p.pct}%</span></div>`+
            `<span class="hq-focus-bar"><span style="width:${p.pct}%;background:${p.cl}"></span></span>`+
          `</button>`
        ).join('')+
      `</div>`+
    `</section>`+

    `<section class="hq-card hq-attn">`+
      `<div class="hq-head"><h2>يحتاج انتباهًا</h2><span>${attention.length}</span></div>`+
      `<div class="hq-attention-list">`+
        attention.map(a =>
          `<button class="hq-attention-item" onclick="${a.a}">`+
            `<span class="hq-attention-tag" style="background:${a.c}15;color:${a.c}">${E(a.t)}</span>`+
            `<strong>${E(a.n)}</strong>`+
            `<p>${E(a.d)}</p>`+
          `</button>`
        ).join('')+
      `</div>`+
    `</section>`+

    `<section class="hq-card hq-access">`+
      `<div class="hq-head"><h2>مسارات الوصول</h2><span>أين يوجد كل شيء</span></div>`+
      `<div class="hq-access-grid">`+
        `<div class="hq-access-item"><strong>محلي</strong><p>Desktop/Projects يحتوي منتجاتك الحية ومشاريع EasyBooking وBRIX وMoney Manager.</p></div>`+
        `<div class="hq-access-item"><strong>سيرفر</strong><p>Contabo يشغّل Wapy وWedding وArgaz والمهام المجدولة والخدمات user-level.</p></div>`+
        `<div class="hq-access-item"><strong>سحابي</strong><p>GitHub وRailway وSupabase وMeta Business وHostinger هي طبقات النشر والتشغيل.</p></div>`+
        `<div class="hq-access-item"><strong>حساس</strong><p>Vault وTron Address Bot وTailscale ليست أرشيفًا؛ هي طبقات وصول وأمن حية.</p></div>`+
      `</div>`+
    `</section>`+

    `<section class="hq-card hq-standard">`+
      `<div class="hq-head"><h2>بيئات AI CLI وإعداداتها</h2><span onclick="go('tools')" class="hq-inline-link">افتح الأدوات</span></div>`+
      `<div class="hq-mini-note">هنا نوثق الأدوات التي نعمل بها نحن كوكلاء CLI مثل Codex وClaude Code: أين ملفاتها، ما إعداداتها الحالية، وما الذي أضفناه أو غيرناه فيها. هذا هو المكان الصحيح لهذا النوع من التوثيق.</div>`+
      `<div class="hq-standard-path"><strong>المسارات الحالية:</strong><code>/Users/rabeeshaban/.codex</code><code>/Users/rabeeshaban/.claude</code></div>`+
      `<div class="hq-standard-grid">`+
        aiCliTools.map(x =>
          `<button class="hq-standard-item hq-standard-item-btn" onclick="${x.a}"><strong>${x.t}</strong><p>${x.d}</p>${x.f ? `<span class="hq-standard-fact">${x.f}</span>` : ''}</button>`
        ).join('')+
      `</div>`+
    `</section>`+

    `<section class="hq-card hq-links">`+
      `<div class="hq-head"><h2>اختصارات تشغيل</h2><span>روابط مباشرة</span></div>`+
      `<div class="hq-link-grid">`+
        [{n:'GitHub',h:'https://github.com/aneerabee',e:'🐙'},{n:'Meta Business',h:'https://business.facebook.com',e:'📢'},{n:'Supabase',h:'https://supabase.com/dashboard',e:'⚡'},{n:'Railway',h:'https://railway.app',e:'🚂'},{n:'Vercel',h:'https://vercel.com',e:'▲'},{n:'Airtable',h:'https://airtable.com',e:'📊'}].map(l=>
          `<a class="hq-link" href="${l.h}" target="_blank" rel="noopener">${_ic(l.e,14)}<span>${l.n}</span></a>`
        ).join('')+
      `</div>`+
    `</section>`+
  `</div>`;
};

/* ── PROJECTS — Hero + Grid ── */
R.projects = function() {
  const hero = PRJ[0];
  const rest = PRJ.slice(1);
  const heroDesc = (hero.desc||'').split('\n')[0];
  const heroTags = (hero.tags||[]).slice(0,6);
  const heroLinks = Object.entries(hero.links||{}).slice(0,4);
  const heroStats = [{v:'1,450+',l:'اختبار'},{v:'7',l:'كتل LEGO'},{v:'30',l:'مرحلة'},{v:'10',l:'خطوات'}];

  return `<div class="prj-hero" onclick="openProjectDetail('${E(hero.name)}')">`+
    `<div class="prj-hero-accent" style="background:linear-gradient(135deg,${hero.cl},${hero.cl}aa)"></div>`+
    `<div class="prj-hero-content">`+
      `<div class="prj-hero-top">`+
        `<span style="font-size:52px">${_ic(hero.em,52)}</span>`+
        `<div>`+
          `<span class="prj-hero-badge">المشروع الرئيسي</span>`+
          `<h2 class="prj-hero-title">${E(hero.ar)}</h2>`+
          `<p class="prj-hero-desc">${E(heroDesc)}</p>`+
        `</div>`+
      `</div>`+
      `<div class="prj-hero-stats">${heroStats.map(s=>`<div class="prj-hero-stat"><span class="prj-stat-val">${s.v}</span><span class="prj-stat-label">${s.l}</span></div>`).join('')}</div>`+
      `<div class="prj-hero-footer">`+
        `<div style="display:flex;flex-wrap:wrap;gap:4px">${heroTags.map(t=>`<span class="tag" style="background:rgba(255,255,255,.15);color:#fff">${E(t)}</span>`).join('')}</div>`+
        `<div style="display:flex;gap:6px">${heroLinks.map(([k,v])=>`<a href="${E(v)}" target="_blank" rel="noopener" onclick="event.stopPropagation()" class="prj-hero-link">${E(k)}</a>`).join('')}</div>`+
      `</div>`+
      `<div class="prj-hero-progress"><div class="prj-hero-progress-bar" style="width:${hero.pct||0}%"></div></div>`+
      `<span class="prj-hero-progress-text">${hero.pct||0}% مكتمل</span>`+
    `</div>`+
  `</div>`+
  `<div class="prj-grid">`+rest.map(p=>{
    const firstLine=(p.desc||'').split('\n')[0];
    const tags=(p.tags||[]).slice(0,3);
    const links=Object.entries(p.links||{}).slice(0,2);
    return `<div class="prj-card" onclick="openProjectDetail('${E(p.name)}')">`+
      `<div class="prj-card-accent" style="background:${p.cl}"></div>`+
      `<div class="prj-card-body">`+
        `<div class="prj-card-head">`+
          `<span style="font-size:30px">${_ic(p.em,30)}</span>`+
          `<span class="prj-card-dot" style="background:${p.st==='a'?'var(--green)':'var(--t3)'}"></span>`+
        `</div>`+
        `<h3 class="prj-card-name">${E(p.ar||p.name)}</h3>`+
        `<p class="prj-card-desc">${E(firstLine)}</p>`+
        `<div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:8px">${tags.map(t=>`<span class="tag" style="background:${p.cl}12;color:${p.cl}">${E(t)}</span>`).join('')}</div>`+
        (links.length?`<div class="prj-card-links">${links.map(([k,v])=>`<a href="${E(v)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${E(k)}</a>`).join('')}</div>`:'')+
        `<div class="prj-progress" style="margin-top:12px"><div class="prj-progress-bar" style="width:${p.pct||0}%;background:${p.cl}"></div></div>`+
      `</div>`+
    `</div>`;
  }).join('')+`</div>`;
};

/* ── MAP ── */
R.map = function() {
  const mapData = [
    ...PRJ.map(p => {
      const loc = p.server_path ? 'server' : p.local_path ? 'local' : p.repo_url ? 'github' : 'local';
      const path = p.server_path ? `server:${p.server_path}` : (p.local_path || p.path || '—');
      const repoName = p.repo_url ? p.repo_url.split('/').slice(-1)[0] : '';
      const status = p.st === 'a' ? 'نشط' : p.st === 'p' ? 'متوقف' : 'أرشيف';
      const hint = p.deploy_url ? `نشر: ${p.deploy_url}` : (p.summary || _projectKindLabel(p.kind));
      return {name:p.name,n:p.ar||p.name,e:p.em,l:loc,p:path,g:repoName,gp:!!p.deploy_url,s:status,c:p.cl,t:hint,kind:_projectKindLabel(p.kind),action:`openProjectDetail('${E(p.name)}')`};
    }),
    ...TL.filter(t => t.category === 'developer-env').map(t => ({
      name:t.name,
      n:t.ar || t.name,
      e:t.name === 'Codex CLI' ? '🧭' : '⚡',
      l:'local',
      p:t.path || '—',
      g:'',
      gp:0,
      s:t.st === 'a' ? 'نشط' : 'متوقف',
      c:t.cl || '#0EA5E9',
      t:(t.config_paths || []).slice(0,2).join(' · ') || t.summary || '',
      kind:'AI CLI',
      action:`openToolDetail('${E(t.name)}')`
    })),
    {name:"Argaz Bot",n:"بوت أرقاز",e:"🧠",l:"server",p:"server:/home/argaz/.openclaw/",g:"",gp:0,s:"نشط",c:"#6C3AED",t:"Runtime متعدد الوكلاء على Contabo",kind:"runtime وكلاء",action:`openBotDetail('Argaz Bot')`},
    {name:"Tron Address Bot",n:"بوت عناوين ترون",e:"🕵️",l:"local",p:"/Users/rabeeshaban/Desktop/Projects/🤖 Bots/🕵️ tron-address-bot",g:"",gp:0,s:"عند الطلب",c:"#EF4444",t:"نظام حساس أمنيًا يعمل محليًا فقط",kind:"بوت Telegram",action:`openBotDetail('Tron Address Bot')`}
  ];

  const counts = {github:0,local:0,server:0};
  mapData.forEach(d => counts[d.l]++);
  const locLabel = {github:'مرتبط بـ GitHub',local:'محلي',server:'على السيرفر'};

  return `<h2 class="page-title"><span class="page-icon">${_ic('🗺️',20)}</span> خريطة المشاريع</h2>` +
    '<div class="map-stats">' +
      `<div class="map-stat"><span class="map-stat-val">${counts.github}</span><span class="map-stat-label">GitHub</span></div>`+
      `<div class="map-stat"><span class="map-stat-val">${counts.local}</span><span class="map-stat-label">محلي</span></div>`+
      `<div class="map-stat"><span class="map-stat-val">${counts.server}</span><span class="map-stat-label">سيرفر</span></div>`+
      `<div class="map-stat"><span class="map-stat-val">${mapData.length}</span><span class="map-stat-label">المجموع</span></div>`+
    '</div>' +
    '<div class="map-note">هذه الصفحة تجيب على سؤال واحد: أين يوجد كل عنصر فعليًا، وما هو نوع وجوده: محلي، GitHub، أو سيرفر.</div>' +
    '<div class="map-filters">' +
      `<button class="filter-btn active" data-filter="all" onclick="mapFilter('all')">الكل</button>`+
      `<button class="filter-btn" data-filter="github" onclick="mapFilter('github')">GitHub</button>`+
      `<button class="filter-btn" data-filter="local" onclick="mapFilter('local')">محلي</button>`+
      `<button class="filter-btn" data-filter="server" onclick="mapFilter('server')">سيرفر</button>`+
    '</div>' +
    '<div class="map-list" id="map-list">' + mapData.map(d => {
      const ghLink = d.g ? `<a href="https://github.com/aneerabee/${E(d.g)}" target="_blank" rel="noopener" onclick="event.stopPropagation()" class="map-item-link">${_ic(d.gp?'🌐':'🔒',12)} GitHub</a>` : '';
      return `<button class="map-item" data-loc="${d.l}" style="border-right:4px solid ${d.c}" onclick="${d.action}">`+
        `<span class="map-item-icon">${_ic(d.e,18)}</span>`+
        `<div class="map-item-main"><span class="map-item-name">${E(d.n)}</span>`+
        `<div class="map-item-meta"><span class="map-item-chip" style="background:${d.c}12;color:${d.c}">${E(d.kind)}</span><span class="map-item-chip">${E(locLabel[d.l] || d.l)}</span><span class="map-item-chip">${E(d.s)}</span></div>`+
        `<span class="map-item-path">${E(d.p)}</span>`+
        `<span class="map-item-text">${E(d.t)}</span></div>`+
        `<div class="map-item-side">${ghLink}</div></button>`;
    }).join('') + '</div>';
};

/* ── AUTO ── */
R.auto = function() {
  const allGroups = AUTO || [];
  const allTasks = allGroups.flatMap(g => g.tasks);
  const totalTasks = allTasks.length;
  const onTasks = allTasks.filter(t => t.on).length;

  const renderGroup = g =>
    '<div class="auto-group">' +
    `<div class="auto-group-header"><span class="auto-group-title">${E(g.group)}</span><span class="auto-group-loc">${E(g.loc)}</span></div>` +
    g.tasks.map(t =>
      `<div class="auto-task" id="auto-${encodeURIComponent(g.group+'-'+t.name).replace(/%/g,'')}"><span class="led ${t.on?'led-on':'led-off'}"></span>`+
      `<span class="auto-task-name">${E(t.name)}</span>`+
      `<span class="auto-task-dt">${E(t.freq)}</span>`+
      ((t.prj||[]).map(p => {
        const pc = _prjColor(p)||'#888';
        return `<span class="auto-prj-tag" style="background:${pc}15;color:${pc};border:1px solid ${pc}25">${E(p)}</span>`;
      }).join('')) +
      `<span class="auto-task-desc">${E(t.what)}</span>`+
      (t.path ? `<span class="auto-task-desc" style="font-family:var(--mono);font-size:10px;color:var(--t3)">${E(t.path)}</span>` : '') +
      `</div>`
    ).join('') +
    '</div>';

  return '<div class="auto-header">' +
    '<div class="terminal-line"><span class="terminal-prompt">$</span> <span class="terminal-text">حالة الأتمتة — جميع الأنظمة</span></div>' +
    '</div>' +
    '<div class="auto-stats">' +
      `<div class="auto-stat-box"><span class="auto-stat-val">${totalTasks}</span><span class="auto-stat-label">مهمة</span></div>`+
      `<div class="auto-stat-box"><span class="auto-stat-val">${onTasks}</span><span class="auto-stat-label">نشط</span></div>`+
      `<div class="auto-stat-box"><span class="auto-stat-val">${allGroups.length}</span><span class="auto-stat-label">أنظمة</span></div>`+
      '<div class="auto-stat-box"><span class="auto-stat-val">24/7</span><span class="auto-stat-label">متاح</span></div>'+
    '</div>' +
    allGroups.map(g => renderGroup(g)).join('') +
    `<div style="margin-top:1.5rem;padding:.75rem 1rem;border-radius:8px;background:var(--elevated);font-size:.75rem;color:var(--t3)">${_ic('💡',12)} المصدر الآن من data.js: محلي + cron + systemd + OpenClaw + hooks</div>`;
};

/* ── PROJECT COLOR HELPER ── */
function _prjColor(name) {
  if (!name) return '#888';
  const p = PRJ.find(x => x.name === name || x.ar === name);
  if (p) return p.cl;
  const colors = {'system':'#8B5CF6','Contabo':'#0EA5E9','BRIX Travel':'#6C3AED','Wedding Planner':'#E8453C','Wapy.dev':'#10B981','Argaz Bot':'#6C3AED','EasyBooking':'#2563EB','Meta MCP':'#2563EB','WhatsApp CRM':'#25D366','Chess Academy':'#d4a843','Command Center':'#F59E0B'};
  return colors[name] || '#888';
}

/* ── SERVER ── */
function _sparkline(data, color) {
  const w=80, h=20, max=Math.max(...data), min=Math.min(...data);
  const range = max-min || 1;
  const points = data.map((v,i) => `${(i/(data.length-1))*w},${h - ((v-min)/range)*h}`);
  return `<svg viewBox="0 0 ${w} ${h}" class="sparkline" style="width:80px;height:20px;display:block;margin:6px auto 0"><polyline points="${points.join(' ')}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

R.server = function() {
  const gauges = [
    {label:'خدمات عاملة',val:String(SVC.filter(s=>s.st).length),pct:Math.round((SVC.filter(s=>s.st).length / SVC.length) * 100),cl:'#0EA5E9'},
    {label:'حاويات Docker',val:String(SVC.filter(s=>s.service_type==='container').length),pct:100,cl:'#8B5CF6'},
    {label:'مهام cron',val:String(SVC.filter(s=>s.service_type==='cron').length),pct:100,cl:'#10B981'},
    {label:'خدمات user',val:String(SVC.filter(s=>s.service_type==='user-service').length),pct:100,cl:'#F59E0B'}
  ];
  return '<div class="server-header">' +
    `<h2 class="page-title server-title"><span class="page-icon">${_ic('🖥️',20)}</span> CONTABO VPS</h2>` +
    '<span class="server-ip">62.171.128.44 · Ubuntu 24 · `vmi3061403` · جرد موثق من السيرفر</span>' +
    '</div>' +
    '<div class="gauge-grid">' + gauges.map(g => {
      return `<div class="gauge-card">`+
        `<div class="gauge-ring gauge-ring-flat"><span class="gauge-val" style="color:${g.cl}">${E(g.val)}</span></div>`+
        `<span class="gauge-label">${E(g.label)}</span>`+
        `<span class="gauge-note">${E(g.pct)}% من الجرد المعروف</span>`+
        `</div>`;
    }).join('') + '</div>' +
    '<div class="svc-list">' + SVC.map(s => {
      const prj = s.owner || s.prj || '';
      const info = s.info || '';
      const path = s.path || '';
      const host = s.host || '';
      const schedule = s.schedule || '';
      const runtime = s.runtime || '';
      const type = s.service_type || '';
      const pc = prj ? _prjColor(prj) : '';
      const ownerLabel = s.owner_type === 'bot' ? 'runtime' : 'مشروع';
      return `<button class="svc-item" onclick="openServiceDetail('${E(s.name)}')">`+
      `<span class="svc-status ${s.st?'svc-on':'svc-off'}"></span>`+
      `<span class="svc-em">${_ic(s.em,18)}</span>`+
      `<div class="svc-info"><span class="svc-name">${E(s.name)}</span>`+
      (prj ? `<span class="svc-prj" style="background:${pc}15;color:${pc}">${E(ownerLabel)} · ${E(prj)}</span>` : '') +
      `<span class="svc-dt">${E(s.dt)}</span>`+
      (type ? `<span class="svc-desc">النوع: ${E(_serviceTypeLabel(type))}</span>` : '') +
      (runtime ? `<span class="svc-desc">التشغيل: ${E(runtime)}</span>` : '') +
      (host ? `<span class="svc-desc">المضيف: ${E(host)}</span>` : '') +
      (schedule ? `<span class="svc-desc">الجدولة: ${E(schedule)}</span>` : '') +
      (info ? `<span class="svc-desc">${E(info)}</span>` : '') +
      (path ? `<span class="svc-path">${E(path)}</span>` : '') +
      `</div>`+
      (s.port && s.port !== '—' ? `<span class="svc-port">:${E(s.port)}</span>` : '') +
      `</button>`;
    }).join('') + '</div>';
};

/* ── BOTS ── */
R.bots = function() {
  const kindMap = {
    'telegram-bot':'بوت Telegram',
    'agent-runtime':'runtime',
    'assistant-channel':'قناة مساعد',
    'financial-app':'تطبيق/API'
  };
  return `<h2 class="page-title"><span class="page-icon">${_ic('🤖',20)}</span> البوتات والـ runtimes <small style="font-size:.6em;opacity:.5">Telegram + agent runtimes + قنوات المساعدة</small></h2>` +
    '<div class="bot-list">' + BOT.map(b => {
      const stats = BSTATS[b.name] || [];
      const tags = (b.tags||[]).slice(0,4);
      const firstLine = b.summary || (b.desc||'').split('\n')[0] || '';
      const isActive = b.st === 'a';
      return `<div class="bot-card-h glass" onclick="openBotDetail('${E(b.name)}')">`+
        `<div class="bot-h-icon" style="background:linear-gradient(135deg,${b.cl}22,${b.cl}08);border-left:4px solid ${b.cl}">`+
          `<span class="bot-emoji">${_ic(b.em,36)}</span>`+
          `<span class="bot-pulse ${isActive?'pulse-on':'pulse-off'}"></span>`+
        `</div>`+
        `<div class="bot-h-body">`+
          `<div class="bot-h-top">`+
            `<h3 class="bot-name">${E(b.ar||b.name)}</h3>`+
            (isActive ? `<span class="bot-h-status bot-h-active"><span class="led led-on" style="width:6px;height:6px;display:inline-block;margin-left:4px"></span> نشط</span>` : `<span class="bot-h-status bot-h-paused"><span class="led led-off" style="width:6px;height:6px;display:inline-block;margin-left:4px"></span> متوقف</span>`) +
          `</div>`+
          `<p class="bot-h-desc">${E(firstLine)}</p>`+
          `<div class="bot-tags">`+
            (b.kind ? `<span class="tag" style="background:${b.cl}12;color:${b.cl}">${E(kindMap[b.kind] || b.kind)}</span>` : '') +
            (b.host ? `<span class="tag">المضيف: ${E(b.host)}</span>` : '') +
            `</div>`+
          (stats.length ? `<div class="bot-h-stats-grid">${stats.map(s =>
            `<div class="bot-h-stat-chip"><span class="bot-h-stat-val" style="color:${b.cl}">${E(s.v)}</span><span class="bot-h-stat-label">${E(s.l)}</span></div>`
          ).join('')}</div>` : '') +
          `<div class="bot-tags">${tags.map(t => `<span class="tag">${E(t)}</span>`).join('')}</div>`+
        `</div>`+
      `</div>`;
    }).join('') + '</div>';
};

/* ── TOOLS ── */
R.tools = function() {
  const hero = TL[0];
  const emojiMap = {"Codex CLI":"🧭","Claude Code":"⚡","Meta MCP":"📢","GitHub":"🐙","Tailscale":"🔒","Notion":"📝","Perplexity":"🔍","Filesystem":"📁","Memory":"🧠","Sequential Thinking":"💡","Firecrawl":"🕷️","Magic":"🎨","Supabase":"⚡","Vercel":"▲","Railway":"🚂","TestSprite":"🔧"};
  const cliItems = TL.filter(t => t.category === 'developer-env');
  const byCategory = c => TL.filter(t => t.category === c).length;
  const dials = [
    {v:String(byCategory('mcp')),l:"MCP",cl:"var(--purple)"},
    {v:String(byCategory('platform')),l:"منصات",cl:"var(--blue)"},
    {v:String(byCategory('internal-tool')),l:"داخلية",cl:"var(--green)"},
    {v:String(TL.filter(t => t.st === 'a').length),l:"نشطة",cl:"var(--amber)"}
  ];
  const dialCirc = 2 * Math.PI * 24;
  const dialMaxes = [Math.max(1, TL.length), Math.max(1, TL.length), Math.max(1, TL.length), Math.max(1, TL.length)];
  const groups = ['developer-env','internal-tool','platform','infra-access','mcp'];

  return `<h2 class="page-title"><span class="page-icon">${_ic('🛠️',20)}</span> أدوات التطوير <small style="font-size:.6em;opacity:.5">AI CLI + MCP + الإعدادات</small></h2>` +
    `<div class="tool-note">هذه الصفحة توثق أدوات العمل نفسها، وخصوصًا بيئات AI CLI: أين يوجد إعداد كل أداة، ما التخصيصات المضافة، وما المشاريع التي تُستخدم فيها.</div>` +
    `<div class="tool-cli-grid">`+
      cliItems.map(t => `<button class="tool-cli-card" style="--tc:${t.cl}" onclick="openToolDetail('${E(t.name)}')"><strong>${E(t.ar||t.name)}</strong><p>${E(t.summary||'')}</p><span>${E((t.capabilities||[]).slice(0,3).join(' · '))}</span></button>`).join('')+
    `</div>`+
    `<div class="tool-hero glass" style="border-left:4px solid ${hero.cl}" onclick="openToolDetail('${E(hero.name)}')">`+
      `<div class="tool-hero-info"><h3 class="tool-hero-name">${E(hero.ar||hero.name)}</h3>`+
      `<p class="tool-hero-desc">${E(hero.summary || 'بيئة العمل الأساسية الحالية')}</p></div>`+
      '<div class="tool-dials">' + dials.map((d, i) => {
        const pct = parseInt(d.v) / dialMaxes[i];
        const dash = pct * dialCirc;
        return `<div class="dial">`+
          `<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="24" class="dial-bg"/>`+
          `<circle cx="30" cy="30" r="24" class="dial-fg" style="stroke:${d.cl};stroke-dasharray:${dash.toFixed(1)} ${dialCirc.toFixed(1)}"/>`+
          `</svg><span class="dial-val">${E(d.v)}</span><span class="dial-label">${E(d.l)}</span></div>`;
      }).join('') + '</div>' +
    '</div>' +
    groups.map(cat => {
      const items = TL.filter(t => t.category === cat);
      if (!items.length) return '';
      const activeCount = items.filter(t => t.st === 'a').length;
      return `<div class="tool-section">`+
        `<div class="tool-section-head"><div><h3>${E(_toolCategoryLabel(cat))}</h3><p>${activeCount}/${items.length} نشط · ${E(_toolCategoryLabel(cat))}</p></div><span>${items.length}</span></div>`+
        `<div class="tool-grid">` + items.map(t => {
          const em = emojiMap[t.name] || t.em || '🔧';
          const usedIn = (t.used_in || []).slice(0,2).join(' · ');
          return `<div class="tool-card glass" style="border-top:3px solid ${t.cl}" onclick="openToolDetail('${E(t.name)}')">`+
            `<span style="font-size:1.5rem">${_ic(em,24)}</span>`+
            `<h4 class="tool-card-name">${E(t.ar||t.name)}</h4>`+
            `<p class="tool-card-desc">${E(t.summary || (t.desc||'').split('\n')[0])}</p>`+
            `<div class="tool-card-tags">${E(_toolCategoryLabel(t.category))}</div>` +
            (usedIn ? `<div class="tool-card-usage">${E(usedIn)}</div>` : '') +
            `</div>`;
        }).join('') + '</div>' +
      `</div>`;
    }).join('');
};

/* ── CLOUD ── */
R.cloud = function() {
  const categoryOrder = ['platform','database-platform','deployment','marketing-platform','data-platform','infrastructure','network','storage','communication','mcp-linked','external-api'];
  const categoryLabels = {
    'platform':'منصات أساسية',
    'database-platform':'منصات بيانات',
    'deployment':'نشر واستضافة',
    'marketing-platform':'تسويق',
    'data-platform':'بيانات تشغيلية',
    'infrastructure':'بنية تحتية',
    'storage':'تخزين',
    'mcp-linked':'خدمات متصلة عبر MCP',
    'network':'وصول وشبكات',
    'external-api':'واجهات خارجية',
    'communication':'تواصل'
  };
  const groups = categoryOrder
    .map(cat => ({cat, items: CLD.filter(c => c.category === cat)}))
    .filter(g => g.items.length);
  const activeCount = CLD.filter(c => c.active !== false).length;
  const deploymentCount = CLD.filter(c => c.category === 'deployment').length;
  const mcpLinkedCount = CLD.filter(c => c.category === 'mcp-linked').length;

  return `<h2 class="page-title"><span class="page-icon">${_ic('☁️',20)}</span> الخدمات السحابية <small style="font-size:.6em;opacity:.5">${CLD.length} عنصر تشغيل</small></h2>` +
    `<div class="cloud-overview">`+
      `<div class="cloud-overview-stat"><strong>${activeCount}</strong><span>نشط حاليًا</span></div>`+
      `<div class="cloud-overview-stat"><strong>${deploymentCount}</strong><span>نشر واستضافة</span></div>`+
      `<div class="cloud-overview-stat"><strong>${mcpLinkedCount}</strong><span>مرتبط عبر MCP</span></div>`+
      `<div class="cloud-overview-stat"><strong>${groups.length}</strong><span>فئات تشغيل</span></div>`+
    `</div>` +
    `<div class="cloud-note">هذه الصفحة لا تخلط بين المنصة نفسها وبين نوع دورها. ستجد الفرق بين منصة، نشر، API، شبكة، وتخزين بشكل صريح داخل كل بطاقة.</div>` +
    groups.map(group => {
      return `<div class="cloud-category">` +
        `<div class="cloud-cat-head"><h3 class="cloud-cat-title">${E(categoryLabels[group.cat] || group.cat)}</h3><span>${group.items.length}</span></div>` +
        `<div class="cloud-cat-grid">` +
        group.items.map(c => {
          const clickAttr = `onclick="openCloudDetail('${E(c.nm)}')"`;
          const cPrj = c.prj || '';
          const cpc = cPrj ? _entityColor(cPrj, '#0EA5E9') : '';
          const status = c.active === false ? 'متوقف' : 'نشط';
          const usedCount = (c.used_in || []).length;
          return `<div class="cloud-card clickable ${c.active===false?'cloud-card-off':''}" ${clickAttr}>` +
            `<span class="cloud-card-icon">${_ic(c.em, 22)}</span>` +
            `<div class="cloud-card-info">` +
              `<div class="cloud-card-top"><span class="cloud-card-name">${E(c.nm)}</span><span class="cloud-card-status ${c.active===false?'cloud-card-status-off':'cloud-card-status-on'}">${E(status)}</span></div>` +
              `<div class="cloud-card-tags">` +
                `<span class="cloud-prj-tag">${E(categoryLabels[c.category] || c.category)}</span>` +
                (cPrj ? `<span class="cloud-prj-tag" style="background:${cpc}15;color:${cpc}">${E(cPrj)}</span>` : '') +
                (usedCount ? `<span class="cloud-prj-tag">يخدم ${usedCount}</span>` : '') +
              `</div>` +
              `<span class="cloud-card-dt">${E(c.dt)}</span>` +
              ((c.related_entities || c.used_in)?.length ? `<span class="cloud-card-usage">${E((c.related_entities || c.used_in).slice(0,3).join(' · '))}</span>` : '') +
            `</div>` +
          `</div>`;
        }).join('') +
        `</div></div>`;
    }).join('');
};

/* ── IDEAS ── */
R.ideas = function() {
  const prLabels = {1:'عاجل',2:'قريب',3:'يوماً ما'};
  const prColors = {1:'#EF4444',2:'#F59E0B',3:'#6366F1'};
  const rotations = [-2, 1.5, -1, 2, -1.5, 1, -2.5, 2.5];

  return '<div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1rem">' +
    '<span style="font-size:.7rem;padding:.2rem .6rem;border-radius:20px;background:var(--elevated);color:var(--t3)">خريطة الطريق</span>' +
    `<h2 class="page-title" style="margin:0"><span class="page-icon">${_ic('💡',20)}</span> أفكار المستقبل <small style="font-size:.6em;opacity:.5">${IDEAS.length}</small></h2>` +
    '</div>' +
    '<div class="idea-filters">' +
      `<button class="filter-btn active" data-priority="all" onclick="filterIdeas('all')">الكل</button>`+
      `<button class="filter-btn" data-priority="1" onclick="filterIdeas(1)"><span class="pr-dot" style="background:#EF4444"></span> عاجل</button>`+
      `<button class="filter-btn" data-priority="2" onclick="filterIdeas(2)"><span class="pr-dot" style="background:#F59E0B"></span> قريب</button>`+
      `<button class="filter-btn" data-priority="3" onclick="filterIdeas(3)"><span class="pr-dot" style="background:#6366F1"></span> يوماً ما</button>`+
    '</div>' +
    '<div class="ideas-grid" id="ideas-grid">' + IDEAS.map((idea, i) => {
      const rot = rotations[i % rotations.length];
      const rels = _relChips((idea.related_projects || []).slice(0,3));
      const bullets = (idea.desc||'').split('\n').filter(l => /^[🎯🔧📊🔔📈💹🌍🔄🔗]/.test(l.trim())).slice(0,5);
      const allLines = [
        idea.summary ? `الملخص: ${idea.summary}` : '',
        idea.owner_scope ? `النطاق: ${idea.owner_scope}` : '',
        idea.next_step ? `الخطوة التالية: ${idea.next_step}` : ''
      ].filter(Boolean);
      return `<div class="sticky-note" data-pr="${idea.pr}" style="border-right:4px solid ${prColors[idea.pr]||'#999'};transform:rotate(${rot}deg)" onclick="openIdeaDetail('${E(idea.name)}')">`+
        `<span class="sticky-badge" style="background:${prColors[idea.pr]||'#999'}">${E(prLabels[idea.pr]||'')}</span>`+
        `<span class="sticky-emoji">${_ic(idea.em,42)}</span>`+
        `<h4 class="sticky-title">${E(idea.name)}</h4>`+
        `<p class="sticky-desc">${E(idea.summary || (idea.desc||'').split('\n')[0])}</p>`+
        (allLines.length ? `<div class="idea-details">${allLines.map(l => `<div class="idea-detail-line">${_icText(l.trim())}</div>`).join('')}</div>` : '') +
        (bullets.length ? `<div class="idea-bullets">${bullets.map(b => `<div class="idea-bullet">${_icText(b.trim())}</div>`).join('')}</div>` : '') +
        (rels ? `<div class="idea-rels"><span class="idea-rels-label">يتكامل مع</span>${rels}</div>` : '') +
      `</div>`;
    }).join('') +
    // Add idea placeholder
    `<div class="sticky-note sticky-placeholder" style="border-right:4px dashed var(--brd);transform:rotate(0deg);cursor:default;opacity:.6">`+
      `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:8px">`+
        `<span style="font-size:32px;opacity:.3">+</span>`+
        `<span style="font-size:12px;color:var(--t3)">فكرة جديدة</span>`+
      `</div>`+
    `</div>` +
    '</div>';
};

/* ── ARCHIVE ── */
R.archive = function() {
  const archived = ARC.filter(a => (a.kind||'').startsWith('archived-'));
  const activeRefs = ARC.filter(a => ['active-security','active-runtime'].includes(a.kind));

  const renderCard = (a, activeRef) => {
      const tags = (a.tags||[]).slice(0,4);
      const descLines = (a.desc||'').split('\n').filter(l => l.trim());
      const firstLine = a.summary || descLines[0] || '';
      const excerpt = descLines.slice(1,3).map(l => l.trim()).filter(l => l && !/^[📐🔧📊🔄🚀📱📦📸🎯💹⚙️🔐🛡️🤖👥🛠️📈🌍🔗📍⚡💾🎮💰🌐🔔📂⏰🔒🎨📌⚠️👤🐳📡💱🏢🛍️🏗️🧠♟️]/.test(l)).join(' · ');
      const stLabel = _archiveKindLabel(a);
      const stColor = activeRef ? 'var(--green)' : (a.st === 'arc' ? '#92400E' : 'var(--amber)');
      const size = a.size || '';
      const count = a.count || '';
      return `<div class="book-card ${activeRef?'book-card-active-ref':''}" onclick="openArchiveDetail('${E(a.name)}')">`+
        `<div class="book-spine" style="background:${a.cl}"></div>`+
        `<div class="book-body">`+
          `<span class="book-emoji">${_ic(a.em,32)}</span>`+
          `<h4 class="book-title">${E(a.ar||a.name)}</h4>`+
          `<p class="book-desc">${E(firstLine)}</p>`+
          (excerpt ? `<p class="book-excerpt">${E(excerpt)}</p>` : '') +
          `<div class="book-tags">${tags.map(t => `<span class="tag" style="background:${a.cl}12;color:${a.cl}">${E(t)}</span>`).join('')}</div>`+
          `<div class="book-meta">`+
            `<span class="book-status" style="background:${stColor}18;color:${stColor}">${E(stLabel)}</span>`+
            (size ? `<span class="book-size">${E(size)}</span>` : '') +
            (count ? `<span class="book-size">${E(count)}</span>` : '') +
          `</div>`+
        `</div></div>`;
  };

  return `<h2 class="page-title"><span class="page-icon">${_ic('🗄️',20)}</span> الأرشيف <small style="font-size:.6em;opacity:.5">الأرشيف الحقيقي + الطبقات النشطة التي كانت مختلطة معه</small></h2>` +
    `<div class="archive-section">`+
      `<div class="archive-section-head"><h3>المؤرشف فعليًا</h3><span>${archived.length}</span></div>`+
      `<div class="archive-shelf">` + archived.map(a => renderCard(a, false)).join('') + `</div>`+
    `</div>` +
    (activeRefs.length ? `<div class="archive-section archive-active-block">`+
      `<div class="archive-section-head"><h3>طبقات نشطة محفوظة خارج الأرشيف</h3><span>${activeRefs.length}</span></div>`+
      `<p class="archive-section-note">هذه العناصر كانت مصنفة داخل الأرشيف بصريًا، لكن حقيقتها التشغيلية الحالية نشطة أو حساسة ويجب قراءتها كمرجع حي.</p>`+
      `<div class="archive-shelf archive-shelf-active">` + activeRefs.map(a => renderCard(a, true)).join('') + `</div>`+
    `</div>` : '');
};

/* ─────────────── 4. DETAIL VIEWS — 5 أنماط مختلفة ─────────────── */

let _suppressHash = false;

function _parseDesc(item) {
  const lines = (item.desc||'').split('\n');
  const headline = lines[0]||'';
  const sections = [];
  let sec = null;
  lines.slice(1).forEach(line => {
    const t = line.trim();
    if (!t) return;
    if (/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}🔧📊📐🔄🚀📱📦📸🎯💹⚙️🔐🛡️🤖👥🛠️📈🌍🔗📍⚡💾🎮💰🌐🔔📂⏰🔒🎨📌⚠️👤🐳📡💱🏢🛍️🏗️🧠♟️]/u.test(t)) {
      sec = {title:t,rows:[]};
      sections.push(sec);
    } else if (sec) {
      sec.rows.push(t);
    } else {
      if (!sections.length) sections.push({title:'',rows:[]});
      sections[sections.length-1].rows.push(t);
    }
  });
  return {headline,sections};
}

function _sectionsHTML(sections) {
  return sections.map(s => {
    // Replace emoji in section title with icon
    let title = s.title||'';
    if(title){
      const firstChar = [...title][0];
      const iconName = IC[firstChar];
      if(iconName) title = _ic(firstChar,14) + ' ' + title.substring(firstChar.length + (title.codePointAt(0)>0xFFFF?0:title[1]==='\uFE0F'?1:0)).trim();
    }
    return `<div style="margin-top:14px">`+
    (title?`<h4 style="font-size:12px;font-weight:600;color:var(--t1);margin-bottom:6px;display:flex;align-items:center;gap:4px">${title}</h4>`:'')+
    s.rows.map(r=>`<div style="font-size:11px;color:var(--t2);line-height:1.7;padding:4px 10px;background:var(--elevated);border-radius:5px;margin-bottom:2px">${E(r)}</div>`).join('')+
    `</div>`;
  }).join('');
}

function _tagsHTML(tags,cl) {
  if (!tags||!tags.length) return '';
  return `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:14px">${tags.map(t=>`<span class="tag" style="background:${cl||'var(--purple)'}15;color:${cl||'var(--purple)'};border:1px solid ${cl||'var(--purple)'}22">${E(t)}</span>`).join('')}</div>`;
}

function _linksHTML(links,cl) {
  const entries = Object.entries(links||{});
  if (!entries.length) return '';
  return `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:14px">${entries.map(([k,v])=>`<a href="${E(v)}" target="_blank" rel="noopener" onclick="event.stopPropagation()" style="display:inline-flex;align-items:center;gap:4px;padding:7px 16px;border-radius:8px;background:${cl||'var(--purple)'};color:#fff;font-size:11px;font-weight:600;text-decoration:none;transition:opacity .15s" onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">${E(k)}</a>`).join('')}</div>`;
}

function _pathHTML(path) {
  if (!path) return '';
  return `<div style="margin-top:14px;font-family:var(--mono);font-size:11px;background:var(--elevated);padding:10px 14px;border-radius:8px;color:var(--t2);direction:ltr;word-break:break-all;display:flex;align-items:center;gap:6px">${_ic('📁',14)} ${E(path)}</div>`;
}

function _projectStructuredSections(item) {
  const sections = [];
  const summary = item.summary || '';
  const pathRows = [];
  if (item.local_path) pathRows.push(`محلي: ${item.local_path}`);
  if (item.server_path) pathRows.push(`سيرفر: ${item.server_path}`);
  if (!pathRows.length && item.path) pathRows.push(item.path);

  const releaseRows = [];
  if (item.repo_url) releaseRows.push(`GitHub: ${item.repo_url}`);
  if (item.deploy_url) releaseRows.push(`نشر: ${item.deploy_url}`);
  if (!releaseRows.length && item.links) {
    Object.entries(item.links).forEach(([k, v]) => releaseRows.push(`${k}: ${v}`));
  }

  const relationRows = [];
  if (item.parent_project) relationRows.push(`يتبع: ${item.parent_project}`);
  if (item.related_services?.length) relationRows.push(`الخدمات: ${item.related_services.join(' · ')}`);
  if (item.related_tools?.length) relationRows.push(`الأدوات: ${item.related_tools.join(' · ')}`);
  if (item.related_cloud?.length) relationRows.push(`السحابية: ${item.related_cloud.join(' · ')}`);

  if (summary || item.kind) {
    sections.push({
      title: '🧭 نظرة عامة',
      rows: [
        summary || 'لا يوجد ملخص منظم بعد',
        item.kind ? `النوع: ${_projectKindLabel(item.kind)}` : '',
        item.pct != null ? `التقدم: ${item.pct}%` : ''
      ].filter(Boolean)
    });
  }
  if (item.stack?.length) sections.push({title: '🔧 التقنيات', rows: item.stack});
  if (item.subsystems?.length) sections.push({title: '🧩 الأنظمة الفرعية', rows: item.subsystems});
  if (pathRows.length) sections.push({title: '📁 المسارات', rows: pathRows});
  if (releaseRows.length) sections.push({title: '🚀 الريبو والنشر', rows: releaseRows});
  if (item.ops?.length) sections.push({title: '⚙️ التشغيل', rows: item.ops});
  if (relationRows.length) sections.push({title: '🔗 العلاقات', rows: relationRows});
  return sections;
}

function _normalizeSectionTitle(title) {
  return String(title || '')
    .replace(/^[^\p{L}\p{N}]+/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function _projectMergedSections(item, legacySections) {
  const structured = _projectStructuredSections(item);
  if (!structured.length) return legacySections;

  const blocked = ['نظرة عامة','التقنيات','الأنظمة الفرعية','المسارات','الريبو والنشر','التشغيل','العلاقات'];

  const filteredLegacy = legacySections.filter(s => {
    const normalized = _normalizeSectionTitle(s.title);
    if (!normalized) {
      const body = (s.rows || []).join(' ');
      if (item.summary && body.includes(item.summary)) return false;
      return true;
    }
    return !blocked.some(label => normalized.includes(label));
  });

  return [...structured, ...filteredLegacy];
}

/* ── 1. PROJECT DETAIL — صفحة كاملة تحل محل المحتوى ── */
function openProjectDetail(name) {
  const item = PRJ.find(p => p.name === name); if (!item) return;
  closeDetail(true);
  const {headline,sections: legacySections} = _parseDesc(item);
  const sections = _projectMergedSections(item, legacySections);
  const cl = item.cl||'#6C3AED';
  const tags = item.tags||[];
  const links = item.links||{};
  const stLabel = item.st==='a'?'نشط':item.st==='p'?'متوقف':'أرشيف';
  const stCls = item.st==='a'?'status-active':item.st==='p'?'status-paused':'status-archive';
  const factRows = [
    {l:'النوع',v:_projectKindLabel(item.kind) || item.kind || '—'},
    {l:'الحالة',v:stLabel},
    {l:'التقدم',v:item.pct != null ? `${item.pct}%` : '—'},
    {l:'الأنظمة الفرعية',v:String(item.subsystems?.length || 0)},
    {l:'التقنيات',v:String(item.stack?.length || tags.length || 0)},
    {l:'الروابط',v:String(Object.keys(links).length)}
  ];

  document.querySelectorAll('.page').forEach(p=>p.style.display='none');

  const el = document.createElement('section');
  el.id = 'detail-view';
  el.className = 'prj-detail';
  el.innerHTML =
    `<button class="prj-detail-back" onclick="closeDetail()">← رجوع للمشاريع</button>`+
    `<div class="prj-detail-banner" style="background:linear-gradient(135deg,${cl},${cl}88)">`+
      `<span style="font-size:60px">${_ic(item.em,60)}</span>`+
      `<h1 style="font-size:28px;font-weight:800;margin-top:10px">${E(item.ar||item.name)}</h1>`+
      `<span class="${stCls}" style="margin-top:8px">${E(stLabel)}</span>`+
      `</div>`+
    `<div class="prj-detail-summary" style="margin-top:14px;padding:14px 18px;border-radius:14px;background:linear-gradient(135deg,${cl}10,${cl}05);border:1px solid ${cl}20;color:var(--t1)">`+
      `<div style="font-size:13px;font-weight:700;margin-bottom:6px;display:flex;align-items:center;gap:6px">${_ic('🧭',14)} الملخص التنفيذي</div>`+
      `<div style="font-size:13px;line-height:1.8;color:var(--t2)">${E(item.summary || headline || '')}</div>`+
    `</div>`+
    `<div class="prj-fact-strip">`+
      factRows.map(f => `<div class="prj-fact"><span class="prj-fact-label">${E(f.l)}</span><strong class="prj-fact-val">${E(f.v)}</strong></div>`).join('')+
    `</div>`+
    `<div class="prj-detail-grid">`+
      sections.map(s=>{
        const title = s.title || '';
        const firstChar = title ? [...title][0] : '';
        const sectionTints = {'📐':'blue','🔧':'purple','📊':'green','🔄':'amber','🚀':'cyan','💾':'cyan','📱':'purple','📦':'green','📸':'purple','🎯':'amber','💹':'green','⚙️':'purple','🔐':'rose','🛡️':'rose','🤖':'purple','👥':'blue','🛠️':'purple','📈':'green','🌍':'blue','🔗':'cyan','📍':'amber','⏰':'amber','💰':'green','🌐':'blue','🔔':'amber','📂':'amber','🎨':'purple','📌':'amber','🎮':'purple','💱':'green','🧠':'purple','👤':'blue','📡':'cyan','🐳':'cyan'};
        const tint = sectionTints[firstChar] || '';
        const tintClass = tint ? ' prj-info-card--' + tint : '';
        return `<div class="prj-info-card${tintClass}">`+
        (title?`<h3 class="prj-info-title">${E(title)}</h3>`:'')+
        s.rows.map(r=>`<div class="prj-info-row">${E(r)}</div>`).join('')+
        `</div>`;
      }).join('')+
      (!item.stack?.length && tags.length?`<div class="prj-info-card"><h3 class="prj-info-title">${_ic('🏷️',14)} الوسوم</h3><div style="display:flex;flex-wrap:wrap;gap:6px">${tags.map(t=>`<span class="tag" style="background:${cl}12;color:${cl};padding:4px 12px;font-size:10px">${E(t)}</span>`).join('')}</div></div>`:'')+
      (!item.local_path && !item.server_path && item.path?`<div class="prj-info-card"><h3 class="prj-info-title">${_ic('📁',14)} المسار</h3><code style="font-size:12px;color:var(--t2);direction:ltr;display:block;word-break:break-all">${E(item.path)}</code></div>`:'')+
      (!item.repo_url && !item.deploy_url && Object.keys(links).length?`<div class="prj-info-card"><h3 class="prj-info-title">${_ic('🔗',14)} الروابط</h3><div style="display:flex;flex-wrap:wrap;gap:8px">${Object.entries(links).map(([k,v])=>`<a href="${E(v)}" target="_blank" rel="noopener" style="padding:8px 20px;border-radius:10px;background:${cl};color:#fff;font-size:12px;font-weight:600;text-decoration:none;transition:opacity .15s" onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">${E(k)}</a>`).join('')}</div></div>`:'')+
    `</div>`;
  document.getElementById('app').appendChild(el);
  _setHashSilently(cur+'/'+encodeURIComponent(name));
  window.scrollTo(0,0);
  requestAnimationFrame(()=>{el.classList.add('open');_processIcons();});
}

/* ── 2. BOT TERMINAL — واجهة ترمنال داكنة ── */
function openBotDetail(name) {
  const item = BOT.find(b => b.name === name); if (!item) return;
  closeDetail();
  const {headline,sections} = _parseDesc(item);
  const stats = BSTATS[item.name]||[];
  const cl = item.cl||'#6C3AED';
  const isActive = item.st==='a';
  const tags = item.tags||[];
  const kindLabel = _botKindLabel(item.kind);
  const meta = [
    item.kind ? `النوع: ${kindLabel}` : '',
    item.host ? `المضيف: ${item.host}` : '',
    item.runtime ? `التشغيل: ${item.runtime}` : '',
    item.channel ? `القناة: ${item.channel}` : '',
    item.related_entities?.length ? `يرتبط بـ: ${item.related_entities.join(' · ')}` : ''
  ].filter(Boolean);
  const related = _relChips(item.related_entities || []);

  if (item.kind !== 'agent-runtime') {
    const el = document.createElement('div');
    el.id = 'detail-view';
    el.className = 'detail-split';
    el.innerHTML =
      `<div class="dsp-overlay" onclick="closeDetail()"></div>`+
      `<div class="dsp-panel">`+
        `<div class="dsp-sidebar" style="background:linear-gradient(180deg,${cl},${cl}cc)">`+
          `<button class="dsp-close" onclick="closeDetail()" aria-label="إغلاق">&times;</button>`+
          `<span style="font-size:48px;display:block;margin-bottom:14px">${_ic(item.em,48)}</span>`+
          `<h2 style="font-size:18px;font-weight:700">${E(item.ar||item.name)}</h2>`+
          `<p style="font-size:12px;line-height:1.8;opacity:.88;margin:10px 0 0">${E(kindLabel)}</p>`+
        `</div>`+
        `<div class="dsp-content">`+
          ((item.summary||headline)?`<p style="font-size:13px;color:var(--t2);margin-bottom:16px;padding:14px;background:var(--elevated);border-radius:10px;border-right:3px solid ${cl};line-height:1.8">${E(item.summary||headline)}</p>`:'')+
          (meta.length ? `<div class="detail-meta-box">${meta.map(r=>`<div class="detail-meta-line">${E(r)}</div>`).join('')}</div>` : '') +
          (related ? `<div style="margin:16px 0"><div class="detail-meta-box"><div class="detail-meta-line">الكيانات المرتبطة</div><div class="meta-chip-row">${related}</div></div></div>` : '') +
          (stats.length ? `<div class="entity-stats">${stats.map(s=>`<div class="entity-stat"><span class="entity-stat-val" style="color:${cl}">${E(s.v)}</span><span class="entity-stat-label">${E(s.l)}</span></div>`).join('')}</div>` : '') +
          _sectionsHTML(sections)+
          (item.path ? _pathHTML(item.path) : '')+
          _linksHTML(item.links,cl)+
        `</div>`+
      `</div>`;
    document.body.appendChild(el);
    _setHashSilently(cur+'/'+encodeURIComponent(name));
    requestAnimationFrame(()=>{el.classList.add('open');_processIcons();});
    return;
  }

  const el = document.createElement('div');
  el.id = 'detail-view';
  el.className = 'detail-terminal';
  el.innerHTML =
    `<div class="dt-overlay" onclick="closeDetail()"></div>`+
    `<div class="dt-panel">`+
      `<div class="dt-titlebar">`+
        `<div class="dt-dots"><span style="background:#FF5F57"></span><span style="background:#FFBD2E"></span><span style="background:#28C840"></span></div>`+
        `<span class="dt-titlebar-text">${E(item.ar||item.name)} — ${isActive?'نشط':'متوقف'}</span>`+
        `<button class="dt-close" onclick="closeDetail()" aria-label="إغلاق">&times;</button>`+
      `</div>`+
      `<div class="dt-body">`+
        `<div class="dt-prompt">الملف التشغيلي</div>`+
        `<div class="dt-output">`+
          `<div class="dt-line"><span class="dt-key">الاسم</span> ${E(item.ar||item.name)} ${_ic(item.em,16)}</div>`+
          `<div class="dt-line"><span class="dt-key">الحالة</span> <span style="color:${isActive?'#28C840':'#FF5F57'}">${isActive?'■ نشط':'□ متوقف'}</span></div>`+
          (item.summary||headline?`<div class="dt-line"><span class="dt-key">الوصف</span> ${E(item.summary||headline)}</div>`:'')+
          meta.map(m=>`<div class="dt-line">${E(m)}</div>`).join('')+
        `</div>`+
        (related ? `<div class="detail-meta-box dt-meta-box"><div class="detail-meta-line">الكيانات المرتبطة</div><div class="meta-chip-row">${related}</div></div>` : '') +
        (stats.length?`<div class="dt-prompt">المقاييس</div><div class="dt-stats">${stats.map(s=>`<div class="dt-stat"><span class="dt-stat-val" style="color:${cl}">${E(s.v)}</span><span class="dt-stat-label">${E(s.l)}</span></div>`).join('')}</div>`:'')+
        (function(){
          const catMap = {'🔧':'tech','📊':'stats','🔐':'security','🛡️':'security','⏰':'schedule','🤖':'tech','👥':'tech','🛠️':'tech','🔗':'links','🚀':'deploy','💾':'deploy','📱':'tech','📸':'tech','🧠':'tech','💹':'stats','📈':'stats','🔔':'schedule'};
          const catLabels = {tech:'البنية والقدرات',stats:'المؤشرات',security:'الأمان',schedule:'الجدولة',links:'الروابط',deploy:'النشر والتشغيل'};
          const catColors = {tech:'#79c0ff',stats:'#7ee787',security:'#f97583',schedule:'#d2a8ff',links:'#79c0ff',deploy:'#56d4dd'};
          const grouped = {};
          sections.forEach(s => {
            const firstChar = s.title ? [...s.title][0] : '';
            const cat = catMap[firstChar] || 'tech';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(s);
          });
          return Object.keys(grouped).map(cat =>
            `<div class="dt-prompt" style="color:${catColors[cat]||'#7ee787'}">${catLabels[cat]||'تفاصيل'}</div>`+
            `<div class="dt-output">`+
            grouped[cat].map(s =>
              (s.title?`<div class="dt-section-title">${E(s.title)}</div>`:'')+
              s.rows.map(r=>`<div class="dt-line">${E(r)}</div>`).join('')
            ).join('')+
            `</div>`
          ).join('');
        })()+
        (tags.length?`<div class="dt-prompt">الوسوم</div><div class="dt-tags">${tags.map(t=>`<span class="dt-tag">${E(t)}</span>`).join('')}</div>`:'')+
        (item.path?`<div class="dt-prompt">المسار</div><div class="dt-line" style="direction:ltr">${E(item.path)}</div>`:'')+
        _linksHTML(item.links,cl)+
      `</div>`+
    `</div>`;
  document.body.appendChild(el);
  _setHashSilently(cur+'/'+encodeURIComponent(name));
  requestAnimationFrame(()=>{el.classList.add('open');_processIcons();});
}

/* ── 3. TOOL SPLIT — لوحة منقسمة (أيقونة + تفاصيل) ── */
function openToolDetail(name) {
  const item = TL.find(t => t.name === name); if (!item) return;
  closeDetail();
  const {headline,sections} = _parseDesc(item);
  const cl = item.cl||'#6C3AED';
  const tags = item.tags||[];
  const categoryMap = {'developer-env':'AI CLI','internal-tool':'أداة داخلية','platform':'منصة','infra-access':'وصول بنية','mcp':'MCP'};
  const metaRows = [
    item.type ? `النوع: ${item.type}` : '',
    item.category ? `الفئة: ${categoryMap[item.category] || item.category}` : ''
  ].filter(Boolean);
  const rels = _relChips(item.used_in || []);
  const pathRows = [item.path].filter(Boolean);
  const factRows = item.facts || [];
  const customRows = item.customizations || [];
  const configPaths = item.config_paths || [];
  const structureRows = item.structure || [];
  const capabilityRows = item.capabilities || [];

  const el = document.createElement('div');
  el.id = 'detail-view';
  el.className = 'detail-split';
  el.innerHTML =
    `<div class="dsp-overlay" onclick="closeDetail()"></div>`+
    `<div class="dsp-panel">`+
      `<div class="dsp-sidebar" style="background:linear-gradient(180deg,${cl},${cl}cc)">`+
        `<button class="dsp-close" onclick="closeDetail()" aria-label="إغلاق">&times;</button>`+
        `<span style="font-size:48px;display:block;margin-bottom:14px">${_ic(item.em,48)}</span>`+
        `<h2 style="font-size:18px;font-weight:700">${E(item.ar||item.name)}</h2>`+
        (tags.length?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:14px;justify-content:center">${tags.map(t=>`<span style="font-size:8px;padding:2px 8px;border-radius:20px;background:rgba(255,255,255,.15);color:#fff">${E(t)}</span>`).join('')}</div>`:'')+
      `</div>`+
      `<div class="dsp-content">`+
        (item.summary||headline?`<p style="font-size:13px;color:var(--t2);margin-bottom:16px;padding:14px;background:var(--elevated);border-radius:10px;border-right:3px solid ${cl};line-height:1.7">${E(item.summary||headline)}</p>`:'')+
        (metaRows.length ? `<div style="margin-bottom:16px;padding:14px;background:var(--elevated);border-radius:10px">${metaRows.map(r=>`<div style="font-size:12px;color:var(--t2);line-height:1.8">${E(r)}</div>`).join('')}</div>` : '') +
        (rels ? `<div style="margin-bottom:16px"><div class="detail-meta-box"><div class="detail-meta-line">يظهر في هذه المشاريع</div><div class="meta-chip-row">${rels}</div></div></div>` : '') +
        (factRows.length ? `<div class="detail-meta-box"><div class="detail-meta-line">الإعداد الحالي</div>${factRows.map(r=>`<div class="detail-meta-line">${E(r)}</div>`).join('')}</div>` : '') +
        (capabilityRows.length ? `<div class="detail-meta-box"><div class="detail-meta-line">قدرات متصلة</div>${capabilityRows.map(r=>`<div class="detail-meta-line">${E(r)}</div>`).join('')}</div>` : '') +
        (customRows.length ? `<div class="detail-meta-box"><div class="detail-meta-line">ما أُضيف أو خُصص</div>${customRows.map(r=>`<div class="detail-meta-line">${E(r)}</div>`).join('')}</div>` : '') +
        (structureRows.length ? `<div class="detail-meta-box"><div class="detail-meta-line">البنية الداخلية</div>${structureRows.map(r=>`<div class="detail-meta-line">${E(r)}</div>`).join('')}</div>` : '') +
        (configPaths.length ? `<div class="detail-meta-box"><div class="detail-meta-line">ملفات الإعداد</div>${configPaths.map(r=>`<div class="detail-meta-line" style="font-family:var(--mono);font-size:11px;direction:ltr;text-align:left">${E(r)}</div>`).join('')}</div>` : '') +
        _sectionsHTML(sections)+
        (pathRows.length ? _pathHTML(pathRows[0]) : '')+
        _linksHTML(item.links,cl)+
      `</div>`+
    `</div>`;
  document.body.appendChild(el);
  _setHashSilently(cur+'/'+encodeURIComponent(name));
  requestAnimationFrame(()=>{el.classList.add('open');_processIcons();});
}

function openServiceDetail(name) {
  const item = SVC.find(s => s.name === name);
  if (!item) return;
  closeDetail();
  const owner = item.owner || item.prj || '';
  const cl = _prjColor(owner || item.name) || '#0EA5E9';
  const rels = _relChips(owner ? [owner] : []);
  const metaRows = [
    item.service_type ? `النوع: ${_serviceTypeLabel(item.service_type)}` : '',
    item.runtime ? `التشغيل: ${item.runtime}` : '',
    item.host ? `المضيف: ${item.host}` : '',
    item.port && item.port !== '—' ? `المنفذ: ${item.port}` : '',
    item.schedule ? `الجدولة: ${item.schedule}` : '',
    item.st ? 'الحالة: نشط' : 'الحالة: متوقف'
  ].filter(Boolean);
  const bodyRows = [
    item.info ? `الوصف: ${item.info}` : '',
    item.dt ? `التفصيل: ${item.dt}` : ''
  ].filter(Boolean);
  const accessRows = [
    item.path ? `المسار: ${item.path}` : '',
    item.host ? `المضيف: ${item.host}` : '',
    owner ? `${item.owner_type === 'bot' ? 'المالك runtime' : 'يتبع'}: ${owner}` : ''
  ].filter(Boolean);

  const el = document.createElement('div');
  el.id = 'detail-view';
  el.className = 'detail-split';
  el.innerHTML =
    `<div class="dsp-overlay" onclick="closeDetail()"></div>`+
    `<div class="dsp-panel">`+
      `<div class="dsp-sidebar" style="background:linear-gradient(180deg,${cl},${cl}cc)">`+
        `<button class="dsp-close" onclick="closeDetail()" aria-label="إغلاق">&times;</button>`+
        `<span style="font-size:48px;display:block;margin-bottom:14px">${_ic(item.em,48)}</span>`+
        `<h2 style="font-size:18px;font-weight:700">${E(item.name)}</h2>`+
        `<p style="font-size:11px;line-height:1.8;opacity:.88;margin:10px 0 0">${E(_serviceTypeLabel(item.service_type))}</p>`+
      `</div>`+
      `<div class="dsp-content">`+
        (metaRows.length ? `<div class="detail-meta-box">${metaRows.map(r=>`<div class="detail-meta-line">${E(r)}</div>`).join('')}</div>` : '') +
        (rels ? `<div style="margin-bottom:16px"><div class="detail-meta-box"><div class="detail-meta-line">${item.owner_type === 'bot' ? 'الكيان المالك' : 'المشروع المالك'}</div><div class="meta-chip-row">${rels}</div></div></div>` : '') +
        `<div class="prj-detail-grid">`+
          `<div class="prj-info-card prj-info-card--cyan"><h3 class="prj-info-title">🧭 ما هذا</h3>${bodyRows.map(r=>`<div class="prj-info-row">${E(r)}</div>`).join('')}</div>`+
          `<div class="prj-info-card prj-info-card--blue"><h3 class="prj-info-title">📍 الوصول</h3>${accessRows.map(r=>`<div class="prj-info-row">${E(r)}</div>`).join('')}</div>`+
        `</div>`+
      `</div>`+
    `</div>`;
  document.body.appendChild(el);
  _setHashSilently(cur+'/'+encodeURIComponent(name));
  requestAnimationFrame(()=>{el.classList.add('open');_processIcons();});
}

function openCloudDetail(name) {
  const item = CLD.find(c => c.nm === name);
  if (!item) return;
  closeDetail();
  const cl = _entityColor(item.prj || item.nm, '#0EA5E9');
  const rels = _relChips(item.related_entities || item.used_in || []);
  const metaRows = [
    item.category ? `الدور: ${_cloudCategoryLabel(item.category)}` : '',
    item.prj ? `يرتبط أساسًا بـ: ${item.prj}` : '',
    item.active === false ? 'الحالة: متوقف' : 'الحالة: نشط',
    item.lk ? `الرابط: ${item.lk}` : ''
  ].filter(Boolean);

  const el = document.createElement('div');
  el.id = 'detail-view';
  el.className = 'detail-split';
  el.innerHTML =
    `<div class="dsp-overlay" onclick="closeDetail()"></div>`+
    `<div class="dsp-panel">`+
      `<div class="dsp-sidebar" style="background:linear-gradient(180deg,${cl},${cl}cc)">`+
        `<button class="dsp-close" onclick="closeDetail()" aria-label="إغلاق">&times;</button>`+
        `<span style="font-size:48px;display:block;margin-bottom:14px">${_ic(item.em,48)}</span>`+
        `<h2 style="font-size:18px;font-weight:700">${E(item.nm)}</h2>`+
        `<p style="font-size:11px;line-height:1.8;opacity:.88;margin:10px 0 0">${E(_cloudCategoryLabel(item.category))}</p>`+
      `</div>`+
      `<div class="dsp-content">`+
        `<p style="font-size:13px;color:var(--t2);margin-bottom:16px;padding:14px;background:var(--elevated);border-radius:10px;border-right:3px solid ${cl};line-height:1.7">${E(item.dt)}</p>`+
        (metaRows.length ? `<div class="detail-meta-box">${metaRows.map(r=>`<div class="detail-meta-line">${E(r)}</div>`).join('')}</div>` : '') +
        (rels ? `<div style="margin-bottom:16px"><div class="detail-meta-box"><div class="detail-meta-line">تظهر في هذه المشاريع</div><div class="meta-chip-row">${rels}</div></div></div>` : '') +
        (item.lk ? `<div style="margin-top:8px">${_linksHTML({'افتح المنصة': item.lk}, cl)}</div>` : '') +
      `</div>`+
    `</div>`;
  document.body.appendChild(el);
  _setHashSilently(cur+'/'+encodeURIComponent(name));
  requestAnimationFrame(()=>{el.classList.add('open');_processIcons();});
}

/* ── 4. IDEA EXPAND — بطاقة تتوسع من المركز ── */
function openIdeaDetail(name) {
  const item = IDEAS.find(i => i.name === name); if (!item) return;
  closeDetail();
  const {headline,sections} = _parseDesc(item);
  const prLabels = {1:'عاجل',2:'قريب',3:'يوماً ما'};
  const prColors = {1:'#EF4444',2:'#F59E0B',3:'#6366F1'};
  const cl = prColors[item.pr]||'#6366F1';
  const rels = _relChips(item.related_projects || []);
  const metaRows = [
    item.owner_scope ? `النطاق: ${item.owner_scope}` : '',
    item.horizon ? `الأفق: ${item.horizon}` : '',
    item.next_step ? `الخطوة التالية: ${item.next_step}` : ''
  ].filter(Boolean);

  const el = document.createElement('div');
  el.id = 'detail-view';
  el.className = 'detail-idea';
  el.innerHTML =
    `<div class="di-overlay" onclick="closeDetail()"></div>`+
    `<div class="di-card" style="border-top:4px solid ${cl}">`+
      `<button class="di-close" onclick="closeDetail()" aria-label="إغلاق">&times;</button>`+
      `<div class="di-header">`+
        `<span style="font-size:42px">${_ic(item.em,42)}</span>`+
        `<span class="di-priority" style="background:${cl}">${E(prLabels[item.pr]||'')}</span>`+
      `</div>`+
      `<h2 style="font-size:18px;font-weight:700;margin-bottom:8px">${E(item.name)}</h2>`+
      ((item.summary||headline)?`<p style="font-size:12px;color:var(--t2);margin-bottom:14px">${E(item.summary||headline)}</p>`:'')+
      (metaRows.length ? `<div class="detail-meta-box">${metaRows.map(r=>`<div class="detail-meta-line">${E(r)}</div>`).join('')}</div>` : '') +
      _sectionsHTML(sections)+
      (rels?`<div style="margin-top:16px"><h4 style="font-size:11px;color:var(--t3);margin-bottom:6px">يتكامل مع</h4><div class="meta-chip-row">${rels}</div></div>`:'')+
    `</div>`;
  document.body.appendChild(el);
  _setHashSilently(cur+'/'+encodeURIComponent(name));
  requestAnimationFrame(()=>{el.classList.add('open');_processIcons();});
}

/* ── 5. ARCHIVE DOCUMENT — وثيقة ورقية كلاسيكية ── */
function openArchiveDetail(name) {
  const item = ARC.find(a => a.name === name); if (!item) return;
  closeDetail();
  const {headline,sections} = _parseDesc(item);
  const cl = item.cl||'#F59E0B';
  const stamp = _archiveStamp(item);
  const metaRows = [
    `التصنيف: ${_archiveKindLabel(item)}`,
    item.next_step ? `الخطوة التالية: ${item.next_step}` : ''
  ].filter(Boolean);
  const rels = _relChips(item.related_projects || []);

  const el = document.createElement('div');
  el.id = 'detail-view';
  el.className = 'detail-archive';
  el.innerHTML =
    `<div class="da-overlay" onclick="closeDetail()"></div>`+
    `<div class="da-paper">`+
      `<button class="da-close" onclick="closeDetail()" aria-label="إغلاق">&times;</button>`+
      `<div class="da-stamp ${item.st==='a'?'da-stamp-active':''}">${E(stamp)}</div>`+
      `<div class="da-header">`+
        `<span style="font-size:44px">${_ic(item.em,44)}</span>`+
        `<h2 style="font-size:18px;font-weight:700;color:var(--t1)">${E(item.ar||item.name)}</h2>`+
      `</div>`+
      ((item.summary||headline)?`<p style="font-size:12px;color:var(--t2);border-bottom:1px dashed #D4C99E;padding-bottom:12px;margin-bottom:12px">${E(item.summary||headline)}</p>`:'')+
      (metaRows.length ? `<div class="detail-meta-box archive-meta-box">${metaRows.map(r=>`<div class="detail-meta-line">${E(r)}</div>`).join('')}</div>` : '') +
      _sectionsHTML(sections)+
      (rels?`<div style="margin-top:16px"><h4 style="font-size:11px;color:var(--t3);margin-bottom:6px">يرتبط بـ</h4><div class="meta-chip-row">${rels}</div></div>`:'')+
      _tagsHTML(item.tags,cl)+
      _pathHTML(item.path)+
      _linksHTML(item.links,cl)+
    `</div>`;
  document.body.appendChild(el);
  _setHashSilently(cur+'/'+encodeURIComponent(name));
  requestAnimationFrame(()=>{el.classList.add('open');_processIcons();});
}

/* ── إغلاق أي عرض تفصيلي ── */
function closeDetail(instant) {
  const d = document.getElementById('detail-view');
  if (!d) return;
  // Restore ALL hidden pages (project detail hides all)
  document.querySelectorAll('.page').forEach(p=>{if(p.style.display==='none')p.style.display='';});
  if (instant) { d.remove(); return; }
  d.classList.remove('open');
  d.addEventListener('transitionend',()=>d.remove(),{once:true});
  setTimeout(()=>{if(document.getElementById('detail-view'))d.remove();},500);
  if (location.hash.includes('/')) _setHashSilently(cur);
  window.scrollTo(0,0);
}

/* ── فتح ذكي حسب نوع العنصر (للتنقل بالهاش) ── */
function openDetailSmart(name, pageHint) {
  const openByPage = {
    projects: () => { if (PRJ.find(p=>p.name===name)) { openProjectDetail(name); return true; } return false; },
    server: () => { if (SVC.find(s=>s.name===name)) { openServiceDetail(name); return true; } return false; },
    bots: () => { if (BOT.find(b=>b.name===name)) { openBotDetail(name); return true; } return false; },
    tools: () => { if (TL.find(t=>t.name===name)) { openToolDetail(name); return true; } return false; },
    cloud: () => { if (CLD.find(c=>c.nm===name)) { openCloudDetail(name); return true; } return false; },
    ideas: () => { if (IDEAS.find(i=>i.name===name)) { openIdeaDetail(name); return true; } return false; },
    archive: () => { if (ARC.find(a=>a.name===name)) { openArchiveDetail(name); return true; } return false; }
  };
  if (pageHint && openByPage[pageHint]) {
    if (openByPage[pageHint]()) return;
  }
  if (PRJ.find(p=>p.name===name)) return openProjectDetail(name);
  if (SVC.find(s=>s.name===name)) return openServiceDetail(name);
  if (BOT.find(b=>b.name===name)) return openBotDetail(name);
  if (TL.find(t=>t.name===name)) return openToolDetail(name);
  if (CLD.find(c=>c.nm===name)) return openCloudDetail(name);
  if (IDEAS.find(i=>i.name===name)) return openIdeaDetail(name);
  if (ARC.find(a=>a.name===name)) return openArchiveDetail(name);
}

/* ─────────────── 5. FILTER FUNCTIONS ─────────────── */

function mapFilter(f) {
  const list = document.getElementById('map-list');
  if (!list) return;
  list.querySelectorAll('.map-item').forEach(el => {
    el.style.display = (f === 'all' || el.dataset.loc === f) ? '' : 'none';
  });
  document.querySelectorAll('.map-filters .filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === f);
  });
}

function filterIdeas(pr) {
  const grid = document.getElementById('ideas-grid');
  if (!grid) return;
  grid.querySelectorAll('.sticky-note').forEach(el => {
    el.style.display = (pr === 'all' || el.dataset.pr === String(pr)) ? '' : 'none';
  });
  document.querySelectorAll('.idea-filters .filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.priority === String(pr));
    btn.classList.toggle('idea-active', btn.dataset.priority === String(pr) && pr !== 'all');
  });
}

function _searchKindLabel(kind) {
  const labels = {
    project:'مشروع',
    service:'خدمة',
    automation:'أتمتة',
    bot:'بوت',
    tool:'أداة',
    cloud:'سحابي',
    idea:'فكرة',
    'archived-project':'أرشيف',
    'archived-brand':'أرشيف',
    'archived-client-work':'أرشيف',
    'archived-site-export':'أرشيف',
    'archived-tool':'أرشيف',
    'active-security':'مرجع نشط',
    'active-runtime':'مرجع نشط'
  };
  return labels[kind] || kind;
}

function _searchEmpty(query) {
  return `<div class="search-empty">`+
    `<span class="search-empty-icon">${_ic('🔍',22)}</span>`+
    `<strong>${query ? 'لا توجد نتائج مطابقة' : 'ابحث في كل اللوحة من مكان واحد'}</strong>`+
    `<p>${query ? 'جرّب اسم مشروع، خدمة، مسار، أو كلمة من الوصف.' : 'المصدر يشمل المشاريع، الخدمات، الأتمتة، البوتات، الأدوات، السحابية، الأرشيف، والأفكار.'}</p>`+
  `</div>`;
}

function _renderSearchResults(query) {
  const resultsEl = document.getElementById('search-results');
  if (!resultsEl) return;
  const q = (query || '').trim().toLowerCase();
  let rows = SEARCH_INDEX;
  if (q) {
    const parts = q.split(/\s+/).filter(Boolean);
    rows = SEARCH_INDEX.filter(r => parts.every(p => r.tokens.includes(p)));
  }
  rows = rows.slice(0, 18);
  if (!rows.length) {
    resultsEl.innerHTML = _searchEmpty(query);
    requestAnimationFrame(_processIcons);
    return;
  }
  resultsEl.innerHTML = rows.map(r =>
    `<button class="search-result" onclick="selectSearchResult('${E(r.id)}')">`+
      `<span class="search-result-kind">${E(_searchKindLabel(r.kind))}</span>`+
      `<div class="search-result-body">`+
        `<strong class="search-result-title">${E(r.title)}</strong>`+
        (r.subtitle ? `<span class="search-result-sub">${E(r.subtitle)}</span>` : '') +
      `</div>`+
      `<span class="search-result-page">${E(PG.find(p => p.id === r.page)?.n || r.page)}</span>`+
    `</button>`
  ).join('');
  requestAnimationFrame(_processIcons);
}

function openSearch() {
  closeMore();
  const el = document.getElementById('global-search');
  if (!el) return;
  el.classList.add('open');
  const input = document.getElementById('search-input');
  if (input) {
    input.value = '';
    _renderSearchResults('');
    setTimeout(() => input.focus(), 60);
  }
}

function closeSearch() {
  const el = document.getElementById('global-search');
  if (el) el.classList.remove('open');
}

function selectSearchResult(id) {
  const row = SEARCH_INDEX.find(r => r.id === id);
  if (!row) return;
  closeSearch();
  if (row.action) row.action();
}

/* ─────────────── 6. INTERACTIVE EFFECTS ─────────────── */

let _mRaf=false;
document.addEventListener('mousemove', function(e) {
  if(_mRaf)return; _mRaf=true;
  requestAnimationFrame(()=>{
    _mRaf=false;
    const active=document.querySelector('.page.active');
    if(!active)return;
    active.querySelectorAll('.glass').forEach(card=>{
      const rect=card.getBoundingClientRect();
      const x=e.clientX-rect.left,y=e.clientY-rect.top;
      if(x>=0&&x<=rect.width&&y>=0&&y<=rect.height){
        card.style.setProperty('--mouse-x',x+'px');
        card.style.setProperty('--mouse-y',y+'px');
      }
    });
  });
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') { closeDetail(); closeMore(); closeSearch(); }
  if ((e.key === '/' && !['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
    e.preventDefault();
    openSearch();
  }
});

/* ─────────────── 7. COUNTDOWN HELPER ─────────────── */

function _updateCountdown() {
  const weddingDate = new Date(2026, 3, 21);
  const days = Math.max(0, Math.ceil((weddingDate - new Date()) / 86400000));
  const circumference = 2 * Math.PI * 34;
  const totalDays = 365;
  const pct = Math.min(1, Math.max(0, (totalDays - days) / totalDays));

  const daysEl = document.getElementById('ring-days');
  const fgEl = document.getElementById('ring-fg');
  if (daysEl) daysEl.textContent = days;
  if (fgEl) fgEl.style.strokeDasharray = `${(pct * circumference).toFixed(1)} ${circumference.toFixed(1)}`;
}

/* ─────────────── 8. INIT ─────────────── */

init();

window.addEventListener('hashchange', function() {
  if (_suppressHash) { _suppressHash = false; return; }
  const parts = location.hash.slice(1).split('/');
  const page = parts[0];
  if (_validPages.has(page) && page !== cur) _activatePage(page, false);
  if (!parts[1] && document.getElementById('detail-view')) closeDetail(true);
  if (parts[1]) {
    const itemName = decodeURIComponent(parts[1]);
    if (M[itemName] || SVC.find(s=>s.name===itemName) || CLD.find(c=>c.nm===itemName)) {
      setTimeout(() => {
        if (document.getElementById('detail-view')) closeDetail(true);
        openDetailSmart(itemName, page);
      }, 200);
    }
  }
});
