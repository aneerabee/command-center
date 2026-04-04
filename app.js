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
const _validPages = new Set(PG.map(p => p.id));
function _readHash() { const h = location.hash.slice(1).split('/')[0]; return _validPages.has(h) ? h : 'home'; }
let cur = _readHash();
const MOBILE_ITEMS = ['home','projects','server','bots','tools'];

/* ─────────────── 2. NAVIGATION ─────────────── */

function init() {
  const sidebar = document.getElementById('sidebar');
  const bottomBar = document.getElementById('bottom-bar');
  const app = document.getElementById('app');

  if (sidebar) {
    sidebar.innerHTML = '<div class="sidebar-brand"><span class="brand-icon">'+_ic('⚡',20)+'</span><span class="brand-text">مركز التحكم</span></div>' +
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

  if (app) {
    app.innerHTML = PG.map(p =>
      `<section id="page-${p.id}" class="page${cur===p.id?' active':''}">${(R[p.id]||(() => ''))()}</section>`
    ).join('');
  }

  _updateCountdown();
  setInterval(_updateCountdown, 60000);
  requestAnimationFrame(_processIcons);

  const hashParts = location.hash.slice(1).split('/');
  if (hashParts[1]) {
    const itemName = decodeURIComponent(hashParts[1]);
    if (M[itemName]) setTimeout(() => openDetailSmart(itemName), 300);
  }
}

function go(id) {
  if (!_validPages.has(id)) return;
  closeDetail(true);
  cur = id;
  location.hash = id;
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  const target = document.getElementById('page-' + id);
  if (target) { target.classList.add('active'); target.scrollTop = 0; }
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.page === id));
  document.querySelectorAll('.bar-item').forEach(el => el.classList.toggle('active', el.dataset.page === id));
  window.scrollTo(0, 0);
  requestAnimationFrame(_processIcons);
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
  const wDate = new Date(2026,3,21);
  const days = Math.max(0, Math.ceil((wDate - now) / 86400000));
  const r34 = 2*Math.PI*34;
  const pct = Math.min(1,(365-days)/365);
  const dateStr = now.toLocaleDateString('ar-EG',{weekday:'long',day:'numeric',month:'long'});
  const activeP = PRJ.filter(p=>p.st==='a');
  const avgPct = Math.round(activeP.reduce((s,p)=>s+p.pct,0)/activeP.length);
  const activeSvc = SVC.filter(s=>s.st).length;
  const activeBots = BOT.filter(b=>b.st==='a').length;

  return `<div class="hb">`+

    // ── A: Welcome + Status (spans 2 cols, short)
    `<div class="hb-a">`+
      `<div class="hb-a-txt"><h1 class="hb-name">مرحباً ربيع</h1><p class="hb-date">${dateStr}</p></div>`+
      `<div class="hb-a-status"><span class="hb-pulse"></span>الأنظمة تعمل</div>`+
    `</div>`+

    // ── B: Wedding Countdown (1 col, tall)
    `<div class="hb-b">`+
      `<div class="hb-b-ring"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" fill="none" stroke="#F9E4EC" stroke-width="5"/><circle cx="40" cy="40" r="34" fill="none" stroke="#E879A0" stroke-width="5" stroke-linecap="round" id="ring-fg" style="stroke-dasharray:${(pct*r34).toFixed(1)} ${r34.toFixed(1)};transform:rotate(-90deg);transform-origin:center"/></svg><span class="hb-b-num" id="ring-days">${days}</span></div>`+
      `<div class="hb-b-label">${_ic('💒',14)} يوم للزفاف</div>`+
      `<div class="hb-b-date">21 — 25 أبريل</div>`+
    `</div>`+

    // ── C: Quick Numbers (spans 2 cols)
    `<div class="hb-c">`+
      [{l:'مشاريع نشطة',v:activeP.length,c:'#7C5CFC'},{l:'خدمات تعمل',v:activeSvc,c:'#2ABFBF'},
       {l:'بوتات نشطة',v:activeBots,c:'#5B8DEF'},{l:'أتمتة نشطة',v:13,c:'#E8A838'}].map(s=>
        `<div class="hb-c-item"><span class="hb-c-num" style="color:${s.c}">${s.v}</span><span class="hb-c-label">${s.l}</span></div>`
      ).join('')+
    `</div>`+

    // ── D: Top Projects with motion graphics (spans 2 cols, tall)
    `<div class="hb-d">`+
      `<div class="hb-head"><h2>المشاريع</h2><span class="hb-more" onclick="go('projects')">عرض الكل</span></div>`+
      activeP.slice(0,5).map((p,i)=>
        `<div class="hb-proj" style="--pc:${p.cl};animation-delay:${i*.06}s" onclick="openProjectDetail('${E(p.name)}')">`+
          `<div class="hb-proj-anim">${_projAnim(p.em,p.cl)}</div>`+
          `<div class="hb-proj-mid"><span class="hb-proj-name">${E(p.ar)}</span><div class="hb-proj-bar"><div style="width:${p.pct}%;background:${p.cl}"></div></div></div>`+
          `<span class="hb-proj-pct" style="color:${p.cl}">${p.pct}%</span>`+
        `</div>`
      ).join('')+
    `</div>`+

    // ── E: System Health (1 col)
    `<div class="hb-e">`+
      `<div class="hb-head"><h2>النظام</h2></div>`+
      `<div class="hb-srv" onclick="go('server')"><span class="hb-pulse"></span><span class="hb-srv-name">VPS</span><span class="hb-srv-val">${activeSvc}/${SVC.length}</span></div>`+
      `<div class="hb-bots" onclick="go('bots')">`+
        BOT.slice(0,4).map(b=>
          `<div class="hb-bot"><span class="hb-led ${b.st==='a'?'hb-on':'hb-off'}"></span>${E(b.ar)}</div>`
        ).join('')+
      `</div>`+
      `<div class="hb-auto" onclick="go('auto')"><span class="hb-auto-label">${_ic('⚙️',12)} أتمتة</span><div class="hb-auto-bar"><div style="width:81%"></div></div><span class="hb-auto-num">13/16</span></div>`+
    `</div>`+

    // ── F: Activity (spans 2 cols)
    `<div class="hb-f">`+
      `<div class="hb-head"><h2>آخر النشاطات</h2></div>`+
      `<div class="hb-feed-grid">`+
        [{d:'31 مارس',t:'أكاديمية الشطرنج v2 — نسخة إنجليزية',c:'#7C5CFC',e:'♟️'},
         {d:'31 مارس',t:'تأمين 3 مشاريع على GitHub',c:'#5B8DEF',e:'🔒'},
         {d:'31 مارس',t:'إعادة تصميم لوحة التحكم بالكامل',c:'#2ABFBF',e:'⚡'},
         {d:'29 مارس',t:'تنظيم 5,400 ملف على iCloud',c:'#E8A838',e:'📁'}].map(t=>
          `<div class="hb-feed-card"><div class="hb-feed-top"><span class="hb-feed-ic" style="color:${t.c}">${_ic(t.e,16)}</span><span class="hb-feed-date">${E(t.d)}</span></div><span class="hb-feed-txt">${E(t.t)}</span></div>`
        ).join('')+
      `</div>`+
    `</div>`+

    // ── G: Quick Links (1 col)
    `<div class="hb-g">`+
      `<div class="hb-head"><h2>اختصارات</h2></div>`+
      [{n:'GitHub',h:'https://github.com/aneerabee',e:'🐙'},{n:'Meta Ads',h:'https://business.facebook.com',e:'📢'},
       {n:'Supabase',h:'https://supabase.com/dashboard',e:'⚡'},{n:'Railway',h:'https://railway.app',e:'🚂'},
       {n:'Vercel',h:'https://vercel.com',e:'▲'},{n:'Airtable',h:'https://airtable.com',e:'📊'}].map(l=>
        `<a class="hb-link" href="${l.h}" target="_blank">${_ic(l.e,14)}<span>${l.n}</span></a>`
      ).join('')+
    `</div>`+

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
    {n:"BRIX Travel System",e:"🏨",l:"github",p:"~/Desktop/Projects/🏨 BRIX-Travel/",g:"brix-travel-system",gp:0,s:"🔄 مُزامَن",c:"#10B981",t:"تطوير نشط — Vercel ينشر من GitHub"},
    {n:"WhatsApp CRM",e:"💬",l:"github",p:"~/Desktop/Projects/📢 EasyBooking/💬 whatsapp-crm/",g:"easybooking-whatsapp-crm",gp:0,s:"🔄 مُزامَن",c:"#10B981",t:"Railway ينشر من GitHub"},
    {n:"Meta MCP",e:"🤖",l:"github",p:"~/Desktop/Projects/📢 EasyBooking/🤖 meta-mcp/",g:"meta-mcp",gp:0,s:"💾 احتياطية",c:"#F59E0B",t:"يستخدمه Claude Code"},
    {n:"Money Manager",e:"💰",l:"github",p:"~/Desktop/Projects/💰 Money-Manager/",g:"money-manager",gp:0,s:"💾 احتياطية",c:"#F59E0B",t:"مشروع متوقف"},
    {n:"BRIX Website",e:"🌐",l:"github",p:"~/Desktop/Projects/🌐 brixtravelwebsite/",g:"brixtravel",gp:0,s:"💾 احتياطية",c:"#F59E0B",t:"الحي على Hostinger"},
    {n:"Command Center",e:"⚡",l:"github",p:"—",g:"command-center",gp:1,s:"☁️ GitHub فقط",c:"#6C3AED",t:"GitHub Pages"},
    {n:"Chess Academy",e:"♟️",l:"github",p:"—",g:"chess-academy",gp:1,s:"☁️ GitHub فقط",c:"#6C3AED",t:"GitHub Pages · AR+EN"},
    {n:"Tron Address Bot",e:"🕵️",l:"local",p:"~/Desktop/Projects/🤖 Bots/🕵️ tron-address-bot/",g:"—",gp:0,s:"⛔ محلي فقط",c:"#EF4444",t:"محافظ كريبتو — ممنوع الرفع"},
    {n:"Sueno Scripts",e:"🔧",l:"local",p:"~/Desktop/Projects/📢 EasyBooking/🔧 sueno-scripts/",g:"—",gp:0,s:"⛔ محلي فقط",c:"#EF4444",t:"توكن مكشوف — ممنوع الرفع"},
    {n:"Wedding Planner",e:"💒",l:"server",p:"server:~/wedding-planner/",g:"—",gp:0,s:"🖥️ سيرفر",c:"#00E5FF",t:"Contabo :3001"},
    {n:"Wapy.dev",e:"💳",l:"server",p:"server:/opt/wapy/",g:"—",gp:0,s:"🖥️ سيرفر",c:"#00E5FF",t:"Docker · PostgreSQL"},
    {n:"Argaz Bot",e:"🧠",l:"server",p:"server:~/.openclaw/",g:"—",gp:0,s:"🖥️ سيرفر",c:"#00E5FF",t:"OpenClaw :18789"}
  ];

  const counts = {github:0,local:0,server:0};
  mapData.forEach(d => counts[d.l]++);

  return `<h2 class="page-title"><span class="page-icon">${_ic('🗺️',20)}</span> خريطة المشاريع</h2>` +
    '<div class="map-stats">' +
      `<div class="map-stat"><span class="map-stat-val">${counts.github}</span><span class="map-stat-label">GitHub</span></div>`+
      `<div class="map-stat"><span class="map-stat-val">${counts.local}</span><span class="map-stat-label">محلي</span></div>`+
      `<div class="map-stat"><span class="map-stat-val">${counts.server}</span><span class="map-stat-label">سيرفر</span></div>`+
      `<div class="map-stat"><span class="map-stat-val">${mapData.length}</span><span class="map-stat-label">المجموع</span></div>`+
    '</div>' +
    '<div class="map-filters">' +
      `<button class="filter-btn active" data-filter="all" onclick="mapFilter('all')">الكل</button>`+
      `<button class="filter-btn" data-filter="github" onclick="mapFilter('github')">GitHub</button>`+
      `<button class="filter-btn" data-filter="local" onclick="mapFilter('local')">محلي</button>`+
      `<button class="filter-btn" data-filter="server" onclick="mapFilter('server')">سيرفر</button>`+
    '</div>' +
    '<div class="map-list" id="map-list">' + mapData.map(d => {
      const ghLink = d.g !== '—' ? `<a href="https://github.com/aneerabee/${E(d.g)}" target="_blank" rel="noopener" onclick="event.stopPropagation()" style="font-size:.75rem;margin-right:.5rem">${d.gp?_ic('🌐',12):_ic('🔒',12)} GitHub</a>` : '';
      return `<div class="map-item" data-loc="${d.l}" style="border-right:4px solid ${d.c}">`+
        `<span style="margin-left:.5rem">${_ic(d.e,18)}</span>`+
        `<div style="flex:1"><span class="map-item-name">${E(d.n)}</span>`+
        `<span class="map-item-path">${E(d.p)}</span>`+
        `<span style="font-size:.7rem;opacity:.55">${E(d.t)}</span></div>`+
        `<div style="display:flex;flex-direction:column;align-items:flex-end;gap:.3rem">`+
        `<span class="map-item-badge badge-${d.l}" style="color:${d.c}">${_icText(d.s)}</span>`+
        `${ghLink}</div></div>`;
    }).join('') + '</div>';
};

/* ── AUTO ── */
R.auto = function() {
  const _autoPrjColors = {
    'meta-mcp':'#2563EB','Money-Manager':'#F59E0B','brixtravel':'#E8453C',
    'system-wide':'#8B5CF6','BRIX Travel':'#6C3AED','Wedding Planner':'#E8453C',
    'Wapy.dev':'#10B981','Argaz Bot':'#6C3AED','Claude Code':'#8B5CF6'
  };

  const s1 = {
    title:'MacBook Pro',
    loc:'launchd',
    tasks:[
      {name:'auto-backup.sh',freq:'يومياً 14:00',on:true,what:'دفع meta-mcp + Money-Manager + brixtravelwebsite → GitHub',prj:['meta-mcp','Money-Manager','brixtravel']},
      {name:'PM2 Resurrect',freq:'عند الإقلاع',on:true,what:'إدارة العمليات — إعادة تشغيل تلقائية',prj:['system-wide']},
      {name:'BRIX Invoice Server',freq:'دائم',on:true,what:'PHP localhost:8000',prj:['BRIX Travel']}
    ]
  };
  const s2 = {
    title:'Contabo VPS',
    loc:'cron + systemd',
    tasks:[
      {name:'Wedding Planner Backup',freq:'كل 6 ساعات',on:true,what:'نسخ قاعدة SQLite → مجلد النسخ الاحتياطي',prj:['Wedding Planner']},
      {name:'Wapy.dev DB Dump',freq:'يومياً 3 صباحاً',on:true,what:'pg_dump لقاعدة PostgreSQL 17.5',prj:['Wapy.dev']},
      {name:'Wapy.dev Cleanup',freq:'يومياً 4 صباحاً',on:true,what:'تنظيف النسخ القديمة والملفات المؤقتة',prj:['Wapy.dev']},
      {name:'Argaz Config Backup',freq:'كل ساعة',on:true,what:'نسخ openclaw.json عند اكتشاف تغيير',prj:['Argaz Bot']},
      {name:'Gateway Watchdog',freq:'كل دقيقة',on:true,what:'مراقبة OpenClaw + إعادة تشغيل تلقائية',prj:['Argaz Bot']}
    ]
  };
  const s3 = {
    title:'Argaz Bot',
    loc:'OpenClaw Scheduler',
    tasks:[
      {name:'Morning Briefing',freq:'08:00 يومياً',on:true,what:'Gmail + طقس أنطاليا + ذاكرة → Telegram',prj:['Argaz Bot']},
      {name:'Daily Self-Review',freq:'كل 24 ساعة',on:true,what:'مراجعة التعلمات + تحديث الذاكرة',prj:['Argaz Bot']},
      {name:'Memory Maintenance',freq:'03:00 كل يومين',on:false,what:'تنظيف وصيانة ملفات الذاكرة',prj:['Argaz Bot']},
      {name:'Weekly Skill Extraction',freq:'أسبوعياً',on:false,what:'استخراج مهارات جديدة من التعلمات',prj:['Argaz Bot']},
      {name:'Error Pattern Detection',freq:'كل 3 أيام',on:false,what:'كشف أنماط الأخطاء المتكررة',prj:['Argaz Bot']}
    ]
  };
  const s4 = {
    title:'Claude Code',
    loc:'Hooks',
    tasks:[
      {name:'PreToolUse',freq:'3 hooks',on:true,what:'تحقق قبل الأدوات',prj:['Claude Code']},
      {name:'PostToolUse',freq:'2 hooks',on:true,what:'تنسيق + فحص بعد الأدوات',prj:['Claude Code']},
      {name:'Stop',freq:'1 hook',on:true,what:'تحقق نهائي',prj:['Claude Code']}
    ]
  };

  const allGroups = [s1, s2, s3, s4];
  const allTasks = allGroups.flatMap(g => g.tasks);
  const totalTasks = allTasks.length;
  const onTasks = allTasks.filter(t => t.on).length;

  const renderGroup = g =>
    '<div class="auto-group">' +
    `<div class="auto-group-header"><span class="auto-group-title">${E(g.title)}</span><span class="auto-group-loc">${E(g.loc)}</span></div>` +
    g.tasks.map(t =>
      `<div class="auto-task"><span class="led ${t.on?'led-on':'led-off'}"></span>`+
      `<span class="auto-task-name">${E(t.name)}</span>`+
      `<span class="auto-task-dt">${E(t.freq)}</span>`+
      ((t.prj||[]).map(p => {
        const pc = _autoPrjColors[p]||'#888';
        return `<span class="auto-prj-tag" style="background:${pc}15;color:${pc};border:1px solid ${pc}25">${E(p)}</span>`;
      }).join('')) +
      `<span class="auto-task-desc">${E(t.what)}</span></div>`
    ).join('') +
    '</div>';

  return '<div class="auto-header">' +
    '<div class="terminal-line"><span class="terminal-prompt">$</span> <span class="terminal-text">automation status --all</span></div>' +
    '</div>' +
    '<div class="auto-stats">' +
      `<div class="auto-stat-box"><span class="auto-stat-val">${totalTasks}</span><span class="auto-stat-label">مهمة</span></div>`+
      `<div class="auto-stat-box"><span class="auto-stat-val">${onTasks}</span><span class="auto-stat-label">نشط</span></div>`+
      `<div class="auto-stat-box"><span class="auto-stat-val">${allGroups.length}</span><span class="auto-stat-label">أنظمة</span></div>`+
      '<div class="auto-stat-box"><span class="auto-stat-val">24/7</span><span class="auto-stat-label">متاح</span></div>'+
    '</div>' +
    allGroups.map(g => renderGroup(g)).join('') +
    `<div style="margin-top:1.5rem;padding:.75rem 1rem;border-radius:8px;background:var(--elevated);font-size:.75rem;color:var(--t3)">${_ic('💡',12)} MacBook: launchd · السيرفر: cron + systemd · Argaz: OpenClaw Scheduler · Claude: Hooks</div>`;
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
  const circ = 2 * Math.PI * 34;
  const sparkData = {
    'القرص': [65,68,70,72,74,75,76,77,77,77],
    'RAM خالي': [12,11,10,11,10,10,11,10,10,10],
    'مساحة حرة': [30,28,27,26,25,24,23,23,23,23],
    'الخدمات': [10,10,10,10,10,10,10,10,10,10]
  };
  const gauges = [
    {label:'القرص',val:'77%',pct:77,cl:'#0EA5E9'},
    {label:'RAM خالي',val:'10GB',pct:55,cl:'#8B5CF6'},
    {label:'مساحة حرة',val:'23GB',pct:23,cl:'#10B981'},
    {label:'الخدمات',val:String(SVC.filter(s=>s.st).length),pct:100,cl:'#F59E0B'}
  ];

  return '<div class="server-header">' +
    `<h2 class="page-title server-title"><span class="page-icon">${_ic('🖥️',20)}</span> CONTABO VPS</h2>` +
    '<span class="server-ip">62.171.128.44 · UBUNTU 24 · <span style="color:#10B981">ONLINE</span></span>' +
    '</div>' +
    '<div class="gauge-grid">' + gauges.map(g => {
      const dash = (g.pct / 100) * circ;
      return `<div class="gauge-card">`+
        `<div class="gauge-ring"><svg viewBox="0 0 80 80">`+
        `<circle cx="40" cy="40" r="34" class="gauge-bg"/>`+
        `<circle cx="40" cy="40" r="34" class="gauge-fg" style="stroke:${g.cl};stroke-dasharray:${dash.toFixed(1)} ${circ.toFixed(1)}"/>`+
        `</svg><span class="gauge-val">${E(g.val)}</span></div>`+
        `<span class="gauge-label">${E(g.label)}</span>`+
        (sparkData[g.label] ? _sparkline(sparkData[g.label], g.cl) : '') +
        `</div>`;
    }).join('') + '</div>' +
    '<div class="svc-list">' + SVC.map(s => {
      const prj = s.prj || '';
      const info = s.info || '';
      const path = s.path || '';
      const pc = prj ? _prjColor(prj) : '';
      return `<div class="svc-item">`+
      `<span class="svc-status ${s.st?'svc-on':'svc-off'}"></span>`+
      `<span class="svc-em">${_ic(s.em,18)}</span>`+
      `<div class="svc-info"><span class="svc-name">${E(s.name)}</span>`+
      (prj ? `<span class="svc-prj" style="background:${pc}15;color:${pc}">${E(prj)}</span>` : '') +
      `<span class="svc-dt">${E(s.dt)}</span>`+
      (info ? `<span class="svc-desc">${E(info)}</span>` : '') +
      (path ? `<span class="svc-path">${E(path)}</span>` : '') +
      `</div>`+
      (s.port && s.port !== '—' ? `<span class="svc-port">:${E(s.port)}</span>` : '') +
      `</div>`;
    }).join('') + '</div>';
};

/* ── BOTS ── */
R.bots = function() {
  return `<h2 class="page-title"><span class="page-icon">${_ic('🤖',20)}</span> مصنع البوتات <small style="font-size:.6em;opacity:.5">بوتات Telegram والأدوات المالية</small></h2>` +
    '<div class="bot-list">' + BOT.map(b => {
      const stats = BSTATS[b.name] || [];
      const tags = (b.tags||[]).slice(0,4);
      const firstLine = (b.desc||'').split('\n')[0] || '';
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
  const rest = TL.slice(1);
  const emojiMap = {"Claude Code":"⚡","Meta MCP":"📢","GitHub":"🐙","Tailscale":"🔒","Notion":"📝","Perplexity":"🔍"};
  const dials = [
    {v:"14",l:"وكيل",cl:"var(--purple)"},
    {v:"49",l:"مهارة",cl:"var(--blue)"},
    {v:"12",l:"MCP",cl:"var(--green)"},
    {v:"15",l:"قاعدة",cl:"var(--amber)"}
  ];
  const dialCirc = 2 * Math.PI * 24;
  const dialMaxes = [20, 60, 16, 20];

  return `<h2 class="page-title"><span class="page-icon">${_ic('🛠️',20)}</span> أدوات التطوير <small style="font-size:.6em;opacity:.5">Claude Code + MCP + الإعدادات</small></h2>` +
    `<div class="tool-hero glass" style="border-left:4px solid ${hero.cl}" onclick="openToolDetail('${E(hero.name)}')">`+
      `<div class="tool-hero-info"><h3 class="tool-hero-name">${E(hero.ar||hero.name)}</h3>`+
      `<p class="tool-hero-desc">Opus 4.6 · 1M context · Claude Max</p></div>`+
      '<div class="tool-dials">' + dials.map((d, i) => {
        const pct = parseInt(d.v) / dialMaxes[i];
        const dash = pct * dialCirc;
        return `<div class="dial">`+
          `<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="24" class="dial-bg"/>`+
          `<circle cx="30" cy="30" r="24" class="dial-fg" style="stroke:${d.cl};stroke-dasharray:${dash.toFixed(1)} ${dialCirc.toFixed(1)}"/>`+
          `</svg><span class="dial-val">${E(d.v)}</span><span class="dial-label">${E(d.l)}</span></div>`;
      }).join('') + '</div>' +
    '</div>' +
    '<div class="tool-grid">' + rest.map(t => {
      const em = emojiMap[t.name] || t.em || '🔧';
      return `<div class="tool-card glass" style="border-top:3px solid ${t.cl}" onclick="openToolDetail('${E(t.name)}')">`+
        `<span style="font-size:1.5rem">${_ic(em,24)}</span>`+
        `<h4 class="tool-card-name">${E(t.ar||t.name)}</h4>`+
        `<p class="tool-card-desc">${E((t.desc||'').split('\n')[0])}</p>`+
        `<div class="tool-card-tags">${(t.tags||[]).join(' · ')}</div>`+
        `</div>`;
    }).join('') + '</div>';
};

/* ── CLOUD ── */
R.cloud = function() {
  const categories = [
    {name:'تطوير', items:['GitHub','Supabase','Vercel','Railway','Heroku']},
    {name:'تسويق', items:['Meta Business','Airtable']},
    {name:'بنية تحتية', items:['Contabo VPS','Tailscale','iCloud Drive','Google Drive']},
    {name:'ذكاء اصطناعي', items:['Perplexity','Firecrawl','Notion']},
    {name:'مالي', items:['TronGrid','CoinGecko']},
    {name:'تواصل', items:['Telegram']}
  ];
  const important = new Set(['GitHub','Supabase','Contabo VPS']);
  const cldMap = {};
  CLD.forEach(c => { cldMap[c.nm] = c; });

  return `<h2 class="page-title"><span class="page-icon">${_ic('☁️',20)}</span> الخدمات السحابية <small style="font-size:.6em;opacity:.5">${CLD.length} خدمة متصلة</small></h2>` +
    categories.map(cat => {
      const catItems = cat.items.map(nm => cldMap[nm]).filter(Boolean);
      if (!catItems.length) return '';
      return `<div class="cloud-category">` +
        `<h3 class="cloud-cat-title">${E(cat.name)}</h3>` +
        `<div class="cloud-cat-grid">` +
        catItems.map(c => {
          const isImportant = important.has(c.nm);
          const clickAttr = c.lk ? `onclick="window.open('${E(c.lk)}','_blank')"` : '';
          const cPrj = c.prj || '';
          const cpc = cPrj ? _prjColor(cPrj) : '';
          return `<div class="cloud-card ${isImportant?'cloud-card-lg':''} ${c.lk?'clickable':''}" ${clickAttr}>` +
            `<span class="cloud-card-icon">${_ic(c.em, isImportant?28:22)}</span>` +
            `<div class="cloud-card-info">` +
              `<span class="cloud-card-name">${E(c.nm)}</span>` +
              (cPrj ? `<span class="cloud-prj-tag" style="background:${cpc}15;color:${cpc}">${E(cPrj)}</span>` : '') +
              `<span class="cloud-card-dt">${E(c.dt)}</span>` +
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
  const noteBgs = {1:'#EF444418',2:'#F59E0B18',3:'#6366F118'};
  const rotations = [-2, 1.5, -1, 2, -1.5, 1, -2.5, 2.5];

  const relMap = {
    "بوت تلقرام لبريكس":["Argaz Bot","BRIX Travel System"],
    "نظام تتبع مالي":["BRIX Travel System","Wapy.dev"],
    "BRIX Website v2":["BRIX Travel Website","BRIX Travel System"]
  };

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
      const rels = (relMap[idea.name]||[]).slice(0,3).map(rn => {
        const rp = [...PRJ,...BOT].find(x => x.name === rn || x.ar === rn);
        return rp ? `<span class="idea-rel-chip">${_ic(rp.em,12)} ${E(rp.ar||rp.name)}</span>` : '';
      }).filter(Boolean).join('');
      const bullets = (idea.desc||'').split('\n').filter(l => /^[🎯🔧📊🔔📈💹🌍🔄🔗]/.test(l.trim())).slice(0,5);
      const allLines = (idea.desc||'').split('\n').filter(l => l.trim()).slice(1,4);
      return `<div class="sticky-note" data-pr="${idea.pr}" style="border-right:4px solid ${prColors[idea.pr]||'#999'};transform:rotate(${rot}deg)" onclick="openIdeaDetail('${E(idea.name)}')">`+
        `<span class="sticky-badge" style="background:${prColors[idea.pr]||'#999'}">${E(prLabels[idea.pr]||'')}</span>`+
        `<span class="sticky-emoji">${_ic(idea.em,42)}</span>`+
        `<h4 class="sticky-title">${E(idea.name)}</h4>`+
        `<p class="sticky-desc">${E((idea.desc||'').split('\n')[0])}</p>`+
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
  return `<h2 class="page-title"><span class="page-icon">${_ic('🗄️',20)}</span> الأرشيف <small style="font-size:.6em;opacity:.5">المشاريع القديمة والملفات المؤرشفة</small></h2>` +
    '<div class="archive-shelf">' + ARC.map(a => {
      const tags = (a.tags||[]).slice(0,4);
      const descLines = (a.desc||'').split('\n').filter(l => l.trim());
      const firstLine = descLines[0] || '';
      const excerpt = descLines.slice(1,3).map(l => l.trim()).filter(l => l && !/^[📐🔧📊🔄🚀📱📦📸🎯💹⚙️🔐🛡️🤖👥🛠️📈🌍🔗📍⚡💾🎮💰🌐🔔📂⏰🔒🎨📌⚠️👤🐳📡💱🏢🛍️🏗️🧠♟️]/.test(l)).join(' · ');
      const stLabel = a.st === 'arc' ? 'مؤرشف' : a.st === 'a' ? 'نشط' : 'متوقف';
      const stColor = a.st === 'arc' ? '#92400E' : a.st === 'a' ? 'var(--green)' : 'var(--amber)';
      const size = a.size || '';
      const count = a.count || '';
      return `<div class="book-card" onclick="openArchiveDetail('${E(a.name)}')">`+
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
    }).join('') + '</div>';
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

/* ── 1. PROJECT DETAIL — صفحة كاملة تحل محل المحتوى ── */
function openProjectDetail(name) {
  const item = M[name]; if (!item) return;
  closeDetail(true);
  const {headline,sections} = _parseDesc(item);
  const cl = item.cl||'#6C3AED';
  const tags = item.tags||[];
  const links = item.links||{};
  const stLabel = item.st==='a'?'نشط':item.st==='p'?'متوقف':'أرشيف';
  const stCls = item.st==='a'?'status-active':item.st==='p'?'status-paused':'status-archive';

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
      (headline?`<p style="margin-top:14px;font-size:14px;opacity:.85;max-width:520px;line-height:1.7">${E(headline)}</p>`:'')+
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
      (tags.length?`<div class="prj-info-card"><h3 class="prj-info-title">${_ic('🏷️',14)} التقنيات</h3><div style="display:flex;flex-wrap:wrap;gap:6px">${tags.map(t=>`<span class="tag" style="background:${cl}12;color:${cl};padding:4px 12px;font-size:10px">${E(t)}</span>`).join('')}</div></div>`:'')+
      (item.path?`<div class="prj-info-card"><h3 class="prj-info-title">${_ic('📁',14)} المسار</h3><code style="font-size:12px;color:var(--t2);direction:ltr;display:block;word-break:break-all">${E(item.path)}</code></div>`:'')+
      (Object.keys(links).length?`<div class="prj-info-card"><h3 class="prj-info-title">${_ic('🔗',14)} الروابط</h3><div style="display:flex;flex-wrap:wrap;gap:8px">${Object.entries(links).map(([k,v])=>`<a href="${E(v)}" target="_blank" rel="noopener" style="padding:8px 20px;border-radius:10px;background:${cl};color:#fff;font-size:12px;font-weight:600;text-decoration:none;transition:opacity .15s" onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">${E(k)}</a>`).join('')}</div></div>`:'')+
    `</div>`;
  document.getElementById('app').appendChild(el);
  _suppressHash = true;
  location.hash = cur+'/'+encodeURIComponent(name);
  window.scrollTo(0,0);
  requestAnimationFrame(()=>{el.classList.add('open');_processIcons();});
}

/* ── 2. BOT TERMINAL — واجهة ترمنال داكنة ── */
function openBotDetail(name) {
  const item = M[name]; if (!item) return;
  closeDetail();
  const {headline,sections} = _parseDesc(item);
  const stats = BSTATS[item.name]||[];
  const cl = item.cl||'#6C3AED';
  const isActive = item.st==='a';
  const tags = item.tags||[];

  const el = document.createElement('div');
  el.id = 'detail-view';
  el.className = 'detail-terminal';
  el.innerHTML =
    `<div class="dt-overlay" onclick="closeDetail()"></div>`+
    `<div class="dt-panel">`+
      `<div class="dt-titlebar">`+
        `<div class="dt-dots"><span style="background:#FF5F57"></span><span style="background:#FFBD2E"></span><span style="background:#28C840"></span></div>`+
        `<span class="dt-titlebar-text">${E(item.ar||item.name)} — ${isActive?'ACTIVE':'STOPPED'}</span>`+
        `<button class="dt-close" onclick="closeDetail()" aria-label="إغلاق">&times;</button>`+
      `</div>`+
      `<div class="dt-body">`+
        `<div class="dt-prompt">$ bot status --name "${E(item.name)}"</div>`+
        `<div class="dt-output">`+
          `<div class="dt-line"><span class="dt-key">الاسم</span> ${E(item.ar||item.name)} ${_ic(item.em,16)}</div>`+
          `<div class="dt-line"><span class="dt-key">الحالة</span> <span style="color:${isActive?'#28C840':'#FF5F57'}">${isActive?'■ نشط':'□ متوقف'}</span></div>`+
          (headline?`<div class="dt-line"><span class="dt-key">الوصف</span> ${E(headline)}</div>`:'')+
        `</div>`+
        (stats.length?`<div class="dt-prompt">$ bot stats</div><div class="dt-stats">${stats.map(s=>`<div class="dt-stat"><span class="dt-stat-val" style="color:${cl}">${E(s.v)}</span><span class="dt-stat-label">${E(s.l)}</span></div>`).join('')}</div>`:'')+
        (function(){
          const catMap = {'🔧':'tech','📊':'stats','🔐':'security','🛡️':'security','⏰':'schedule','🤖':'tech','👥':'tech','🛠️':'tech','🔗':'links','🚀':'deploy','💾':'deploy','📱':'tech','📸':'tech','🧠':'tech','💹':'stats','📈':'stats','🔔':'schedule'};
          const catLabels = {tech:'$ bot tech',stats:'$ bot metrics',security:'$ bot security',schedule:'$ bot schedule',links:'$ bot links',deploy:'$ bot deploy'};
          const catColors = {tech:'#79c0ff',stats:'#7ee787',security:'#f97583',schedule:'#d2a8ff',links:'#79c0ff',deploy:'#56d4dd'};
          const grouped = {};
          sections.forEach(s => {
            const firstChar = s.title ? [...s.title][0] : '';
            const cat = catMap[firstChar] || 'tech';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(s);
          });
          return Object.keys(grouped).map(cat =>
            `<div class="dt-prompt" style="color:${catColors[cat]||'#7ee787'}">${catLabels[cat]||'$ bot info'}</div>`+
            `<div class="dt-output">`+
            grouped[cat].map(s =>
              (s.title?`<div class="dt-section-title">${E(s.title)}</div>`:'')+
              s.rows.map(r=>`<div class="dt-line">${E(r)}</div>`).join('')
            ).join('')+
            `</div>`
          ).join('');
        })()+
        (tags.length?`<div class="dt-prompt">$ bot tags</div><div class="dt-tags">${tags.map(t=>`<span class="dt-tag">${E(t)}</span>`).join('')}</div>`:'')+
        (item.path?`<div class="dt-prompt">$ pwd</div><div class="dt-line" style="direction:ltr">${E(item.path)}</div>`:'')+
        _linksHTML(item.links,cl)+
      `</div>`+
    `</div>`;
  document.body.appendChild(el);
  _suppressHash = true;
  location.hash = cur+'/'+encodeURIComponent(name);
  requestAnimationFrame(()=>{el.classList.add('open');_processIcons();});
}

/* ── 3. TOOL SPLIT — لوحة منقسمة (أيقونة + تفاصيل) ── */
function openToolDetail(name) {
  const item = M[name]; if (!item) return;
  closeDetail();
  const {headline,sections} = _parseDesc(item);
  const cl = item.cl||'#6C3AED';
  const tags = item.tags||[];

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
        (headline?`<p style="font-size:13px;color:var(--t2);margin-bottom:16px;padding:14px;background:var(--elevated);border-radius:10px;border-right:3px solid ${cl};line-height:1.7">${E(headline)}</p>`:'')+
        _sectionsHTML(sections)+
        _pathHTML(item.path)+
        _linksHTML(item.links,cl)+
      `</div>`+
    `</div>`;
  document.body.appendChild(el);
  _suppressHash = true;
  location.hash = cur+'/'+encodeURIComponent(name);
  requestAnimationFrame(()=>{el.classList.add('open');_processIcons();});
}

/* ── 4. IDEA EXPAND — بطاقة تتوسع من المركز ── */
function openIdeaDetail(name) {
  const item = M[name]; if (!item) return;
  closeDetail();
  const {headline,sections} = _parseDesc(item);
  const prLabels = {1:'عاجل',2:'قريب',3:'يوماً ما'};
  const prColors = {1:'#EF4444',2:'#F59E0B',3:'#6366F1'};
  const cl = prColors[item.pr]||'#6366F1';

  const relMap = {
    "بوت تلقرام لبريكس":["Argaz Bot","BRIX Travel System"],
    "نظام تتبع مالي":["BRIX Travel System","Wapy.dev"],
    "BRIX Website v2":["BRIX Travel Website","BRIX Travel System"]
  };
  const rels = (relMap[item.name]||[]).map(rn => {
    const rp = [...PRJ,...BOT].find(x=>x.name===rn||x.ar===rn);
    return rp ? `<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:var(--elevated);border-radius:20px;font-size:10px">${_ic(rp.em,12)} ${E(rp.ar||rp.name)}</span>` : '';
  }).filter(Boolean).join('');

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
      (headline?`<p style="font-size:12px;color:var(--t2);margin-bottom:14px">${E(headline)}</p>`:'')+
      _sectionsHTML(sections)+
      (rels?`<div style="margin-top:16px"><h4 style="font-size:11px;color:var(--t3);margin-bottom:6px">يتكامل مع</h4><div style="display:flex;flex-wrap:wrap;gap:6px">${rels}</div></div>`:'')+
    `</div>`;
  document.body.appendChild(el);
  _suppressHash = true;
  location.hash = cur+'/'+encodeURIComponent(name);
  requestAnimationFrame(()=>{el.classList.add('open');_processIcons();});
}

/* ── 5. ARCHIVE DOCUMENT — وثيقة ورقية كلاسيكية ── */
function openArchiveDetail(name) {
  const item = M[name]; if (!item) return;
  closeDetail();
  const {headline,sections} = _parseDesc(item);
  const cl = item.cl||'#F59E0B';

  const el = document.createElement('div');
  el.id = 'detail-view';
  el.className = 'detail-archive';
  el.innerHTML =
    `<div class="da-overlay" onclick="closeDetail()"></div>`+
    `<div class="da-paper">`+
      `<button class="da-close" onclick="closeDetail()" aria-label="إغلاق">&times;</button>`+
      `<div class="da-stamp">مؤرشف</div>`+
      `<div class="da-header">`+
        `<span style="font-size:44px">${_ic(item.em,44)}</span>`+
        `<h2 style="font-size:18px;font-weight:700;color:var(--t1)">${E(item.ar||item.name)}</h2>`+
      `</div>`+
      (headline?`<p style="font-size:12px;color:var(--t2);border-bottom:1px dashed #D4C99E;padding-bottom:12px;margin-bottom:12px">${E(headline)}</p>`:'')+
      _sectionsHTML(sections)+
      _tagsHTML(item.tags,cl)+
      _pathHTML(item.path)+
      _linksHTML(item.links,cl)+
    `</div>`;
  document.body.appendChild(el);
  _suppressHash = true;
  location.hash = cur+'/'+encodeURIComponent(name);
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
  if (location.hash.includes('/')) { _suppressHash = true; location.hash = cur; }
  window.scrollTo(0,0);
}

/* ── فتح ذكي حسب نوع العنصر (للتنقل بالهاش) ── */
function openDetailSmart(name) {
  const item = M[name]; if (!item) return;
  if (PRJ.find(p=>p.name===name)) return openProjectDetail(name);
  if (BOT.find(b=>b.name===name)) return openBotDetail(name);
  if (TL.find(t=>t.name===name)) return openToolDetail(name);
  if (IDEAS.find(i=>i.name===name)) return openIdeaDetail(name);
  if (ARC.find(a=>a.name===name)) return openArchiveDetail(name);
  openProjectDetail(name);
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
  if (e.key === 'Escape') { closeDetail(); closeMore(); }
});

/* ─────────────── 7. COUNTDOWN HELPER ─────────────── */

function _updateCountdown() {
  const weddingDate = new Date(2026, 3, 21);
  const days = Math.max(0, Math.ceil((weddingDate - new Date()) / 86400000));
  const circumference = 2 * Math.PI * 52;
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
  if (_validPages.has(page) && page !== cur) go(page);
  if (parts[1]) {
    const itemName = decodeURIComponent(parts[1]);
    if (M[itemName] && !document.getElementById('detail-view')) {
      setTimeout(() => openDetailSmart(itemName), 200);
    }
  }
});
