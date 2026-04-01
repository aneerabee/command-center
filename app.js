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
  '👤':'user','📌':'pin','⚠️':'alert-triangle','📂':'folder'
};

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
    sidebar.innerHTML = '<div class="sidebar-brand"><span class="brand-icon">⚡</span><span class="brand-text">مركز التحكم</span></div>' +
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

window.addEventListener('popstate', () => {
  const id = _readHash();
  if (id !== cur) go(id);
});

/* ─────────────── 3. RENDER FUNCTIONS ─────────────── */

const R = {};

/* ── HOME ── */
R.home = function() {
  const weddingDate = new Date(2026, 3, 21);
  const now = new Date();
  const days = Math.max(0, Math.ceil((weddingDate - now) / 86400000));
  const circumference = 2 * Math.PI * 52;
  const totalDays = 365;
  const elapsed = totalDays - days;
  const pct = Math.min(100, Math.max(0, elapsed / totalDays));
  const dashArray = `${pct * circumference} ${circumference}`;

  const orbs = [
    {label:'مشاريع',val:PRJ.length,em:'🚀',pg:'projects',grad:'linear-gradient(135deg,#6C3AED,#8B5CF6)'},
    {label:'خدمات',val:SVC.length,em:'🖥️',pg:'server',grad:'linear-gradient(135deg,#0EA5E9,#38BDF8)'},
    {label:'بوتات',val:BOT.length,em:'🤖',pg:'bots',grad:'linear-gradient(135deg,#10B981,#34D399)'},
    {label:'سحابية',val:CLD.length,em:'☁️',pg:'cloud',grad:'linear-gradient(135deg,#EC4899,#F472B6)'},
    {label:'وكلاء',val:14,em:'🧠',pg:'tools',grad:'linear-gradient(135deg,#8B5CF6,#A78BFA)'},
    {label:'أفكار',val:IDEAS.length,em:'💡',pg:'ideas',grad:'linear-gradient(135deg,#F59E0B,#FBBF24)'},
    {label:'مشفّر',val:130,em:'🔐',pg:'archive',grad:'linear-gradient(135deg,#EF4444,#F87171)'}
  ];

  const timeline = [
    {date:'31 مارس',text:'أكاديمية الشطرنج v2 — نسخة إنجليزية + اختبارات + XP + سلسلة يومية',cl:'var(--purple)'},
    {date:'31 مارس',text:'تأمين 3 مشاريع — money-manager + meta-mcp + brixtravel → GitHub',cl:'var(--blue)'},
    {date:'31 مارس',text:'لوحة التحكم — إعادة تصميم CSS + 15 حركة + خطوط جديدة',cl:'var(--green)'},
    {date:'29 مارس',text:'تنظيم iCloud — 5,400 ملف + خزنة مشفرة AES-256',cl:'var(--amber)'}
  ];

  return '<div class="home-hero">' +
    '<h1 class="hero-title"><span class="gradient-text">مرحباً ربيع</span></h1>' +
    '<p class="hero-sub">نظرة شاملة على كل مشاريعك وخدماتك وأدواتك — من مكان واحد.</p>' +
    '</div>' +
    '<div class="countdown-section">' +
      '<div class="countdown-ring" id="countdown-ring">' +
        '<svg viewBox="0 0 120 120" class="ring-svg">' +
          '<circle cx="60" cy="60" r="52" class="ring-bg"/>' +
          `<circle cx="60" cy="60" r="52" class="ring-fg" id="ring-fg" style="stroke-dasharray:${dashArray}"/>` +
        '</svg>' +
        '<div class="ring-content">' +
          `<span class="ring-days" id="ring-days">${days}</span>` +
          '<span class="ring-label">يوم</span>' +
        '</div>' +
      '</div>' +
      '<div class="countdown-info">' +
        `<div style="font-size:1.3rem">${_ic('💒',22)} العد التنازلي للزفاف</div>` +
        '<div style="opacity:.7;margin:.25rem 0">21 — 25 أبريل 2026</div>' +
        `<div style="font-size:.85rem;opacity:.55">5 أيام · ${days} يوم متبقي</div>` +
      '</div>' +
    '</div>' +
    '<div class="orbs-grid">' + orbs.map(o =>
      `<div class="orb glass" style="background:${o.grad}" onclick="go('${o.pg}')">`+
      `<span class="orb-icon">${_ic(o.em,24)}</span>`+
      `<span class="orb-val">${o.val}</span>`+
      `<span class="orb-label">${E(o.label)}</span></div>`
    ).join('') + '</div>' +
    '<div class="timeline-section">' +
      '<h3 class="section-title">آخر النشاطات</h3>' +
      '<div class="timeline">' + timeline.map(t =>
        `<div class="timeline-item">`+
        `<span class="timeline-dot" style="background:${t.cl}"></span>`+
        `<span class="timeline-text"><strong style="opacity:.5;font-size:.75rem;margin-left:.4rem">${E(t.date)}</strong>${E(t.text)}</span>`+
        `</div>`
      ).join('') + '</div>' +
    '</div>';
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
      const ghLink = d.g !== '—' ? `<a href="https://github.com/aneerabee/${E(d.g)}" target="_blank" rel="noopener" onclick="event.stopPropagation()" style="font-size:.75rem;margin-right:.5rem">${d.gp?'🌐':'🔒'} GitHub</a>` : '';
      return `<div class="map-item" data-loc="${d.l}" style="border-right:4px solid ${d.c}">`+
        `<span style="margin-left:.5rem">${_ic(d.e,18)}</span>`+
        `<div style="flex:1"><span class="map-item-name">${E(d.n)}</span>`+
        `<span class="map-item-path">${E(d.p)}</span>`+
        `<span style="font-size:.7rem;opacity:.55">${E(d.t)}</span></div>`+
        `<div style="display:flex;flex-direction:column;align-items:flex-end;gap:.3rem">`+
        `<span class="map-item-badge badge-${d.l}" style="color:${d.c}">${E(d.s)}</span>`+
        `${ghLink}</div></div>`;
    }).join('') + '</div>';
};

/* ── AUTO ── */
R.auto = function() {
  const s1 = {
    title:'النسخ الاحتياطي المحلي → GitHub',
    loc:'MacBook Pro',
    tasks:[
      {name:'auto-backup.sh',freq:'يومياً 2 ظهراً',on:true,what:'meta-mcp + Money-Manager + brixtravelwebsite → GitHub'}
    ]
  };
  const s2 = {
    title:'النسخ الاحتياطي على السيرفر',
    loc:'Contabo VPS',
    tasks:[
      {name:'Wedding Planner Backup',freq:'كل 6 ساعات',on:true,what:'نسخ قاعدة SQLite → مجلد النسخ الاحتياطي'},
      {name:'Wapy.dev DB Dump',freq:'يومياً 3 صباحاً',on:true,what:'pg_dump لقاعدة PostgreSQL 17.5'},
      {name:'Wapy.dev Cleanup',freq:'يومياً 4 صباحاً',on:true,what:'تنظيف النسخ القديمة والملفات المؤقتة'},
      {name:'Argaz Config Backup',freq:'كل ساعة',on:true,what:'نسخ openclaw.json عند اكتشاف تغيير'},
      {name:'Gateway Watchdog',freq:'كل دقيقة',on:true,what:'مراقبة OpenClaw — إعادة تشغيل تلقائية عند التوقف'}
    ]
  };
  const s3 = {
    title:'المهام السحابية — Argaz Bot',
    loc:'OpenClaw Scheduler',
    tasks:[
      {name:'Morning Briefing',freq:'08:00 يومياً',on:true,what:'Gmail + طقس أنطاليا + ذاكرة → إرسال ملخص Telegram'},
      {name:'Daily Self-Review',freq:'كل 24 ساعة',on:true,what:'مراجعة التعلمات + تحديث الذاكرة'},
      {name:'Memory Maintenance',freq:'03:00 كل يومين',on:false,what:'تنظيف وصيانة ملفات الذاكرة'},
      {name:'Weekly Skill Extraction',freq:'أسبوعياً',on:false,what:'استخراج مهارات جديدة من التعلمات'},
      {name:'Error Pattern Detection',freq:'كل 3 أيام',on:false,what:'كشف أنماط الأخطاء المتكررة'}
    ]
  };

  const totalTasks = s1.tasks.length + s2.tasks.length + s3.tasks.length;
  const onTasks = [...s1.tasks,...s2.tasks,...s3.tasks].filter(t => t.on).length;

  const renderGroup = g =>
    '<div class="auto-group">' +
    `<div class="auto-group-header"><span class="auto-group-title">${E(g.title)}</span><span class="auto-group-loc">${E(g.loc)}</span></div>` +
    g.tasks.map(t =>
      `<div class="auto-task"><span class="led ${t.on?'led-on':'led-off'}"></span>`+
      `<span class="auto-task-name">${E(t.name)}</span>`+
      `<span class="auto-task-dt">${E(t.freq)}</span>`+
      `<span style="font-size:.7rem;opacity:.5;flex:1;text-align:left">${E(t.what)}</span></div>`
    ).join('') +
    '</div>';

  return '<div class="auto-header">' +
    '<div class="terminal-line"><span class="terminal-prompt">$</span> <span class="terminal-text">automation status --all</span></div>' +
    '</div>' +
    '<div class="auto-stats">' +
      `<div class="auto-stat-box"><span class="auto-stat-val">${totalTasks}</span><span class="auto-stat-label">مهمة</span></div>`+
      `<div class="auto-stat-box"><span class="auto-stat-val">${onTasks}</span><span class="auto-stat-label">نشط</span></div>`+
      '<div class="auto-stat-box"><span class="auto-stat-val">24/7</span><span class="auto-stat-label">متاح</span></div>'+
    '</div>' +
    renderGroup(s1) + renderGroup(s2) + renderGroup(s3) +
    '<div style="margin-top:1.5rem;padding:.75rem 1rem;border-radius:8px;background:var(--elevated);font-size:.75rem;color:var(--t3)">💡 المحلي: launchd · السيرفر: cron + systemd · Argaz: OpenClaw Scheduler</div>';
};

/* ── SERVER ── */
R.server = function() {
  const circ = 2 * Math.PI * 34;
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
        `<span class="gauge-label">${E(g.label)}</span></div>`;
    }).join('') + '</div>' +
    '<div class="svc-list">' + SVC.map(s =>
      `<div class="svc-item">`+
      `<span class="svc-status ${s.st?'svc-on':'svc-off'}"></span>`+
      `<span class="svc-em">${_ic(s.em,18)}</span>`+
      `<div class="svc-info"><span class="svc-name">${E(s.name)}</span><span class="svc-dt">${E(s.dt)}</span></div>`+
      (s.port && s.port !== '—' ? `<span class="svc-port">:${E(s.port)}</span>` : '') +
      `</div>`
    ).join('') + '</div>';
};

/* ── BOTS ── */
R.bots = function() {
  return `<h2 class="page-title"><span class="page-icon">${_ic('🤖',20)}</span> مصنع البوتات <small style="font-size:.6em;opacity:.5">بوتات Telegram والأدوات المالية</small></h2>` +
    '<div class="bot-grid">' + BOT.map(b => {
      const stats = BSTATS[b.name] || [];
      const tags = (b.tags||[]).slice(0,4);
      const firstLine = (b.desc||'').split('\n')[0] || '';
      const isActive = b.st === 'a';
      return `<div class="bot-card glass" style="border-top:3px solid ${b.cl}" onclick="openBotDetail('${E(b.name)}')">`+
        `<div class="bot-header">`+
        `<span class="bot-emoji">${_ic(b.em,26)}</span>`+
        `<span class="bot-pulse ${isActive?'pulse-on':'pulse-off'}"></span>`+
        `</div>`+
        `<h3 class="bot-name">${E(b.ar||b.name)}</h3>`+
        (isActive ? `<span style="font-size:.65rem;color:${b.cl};opacity:.8;display:inline-block;margin-bottom:.4rem">● نشط${b.st==='a'?' · '.repeat(3):''}&#8203;</span>` : `<span style="font-size:.65rem;opacity:.45;display:inline-block;margin-bottom:.4rem">متوقف</span>`) +
        `<div style="font-family:monospace;font-size:.7rem;opacity:.5;margin-bottom:.5rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${E(firstLine)}</div>`+
        `<div class="bot-stats">${stats.map(s => `<div class="bot-stat"><span class="bot-stat-val">${E(s.v)}</span><span class="bot-stat-label">${E(s.l)}</span></div>`).join('')}</div>`+
        `<div class="bot-tags">${tags.map(t => `<span class="tag">${E(t)}</span>`).join('')}</div>`+
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
  return `<h2 class="page-title"><span class="page-icon">${_ic('☁️',20)}</span> الخدمات السحابية <small style="font-size:.6em;opacity:.5">${CLD.length} خدمة متصلة</small></h2>` +
    '<div class="cloud-grid">' + CLD.map(c => {
      const clickAttr = c.lk ? `onclick="window.open('${E(c.lk)}','_blank')"` : '';
      return `<div class="planet glass ${c.lk?'clickable':''}" ${clickAttr}>`+
        `<span class="planet-emoji">${_ic(c.em,26)}</span>`+
        `<span class="planet-name">${E(c.nm)}</span>`+
        `<span class="planet-dt">${E(c.dt)}</span></div>`;
    }).join('') + '</div>';
};

/* ── IDEAS ── */
R.ideas = function() {
  const prLabels = {1:'🔴 عاجل',2:'🟡 قريب',3:'⚫ يوماً ما'};
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
      `<button class="filter-btn" data-priority="1" onclick="filterIdeas(1)">🔴 عاجل</button>`+
      `<button class="filter-btn" data-priority="2" onclick="filterIdeas(2)">🟡 قريب</button>`+
      `<button class="filter-btn" data-priority="3" onclick="filterIdeas(3)">⚫ يوماً ما</button>`+
    '</div>' +
    '<div class="ideas-grid" id="ideas-grid">' + IDEAS.map((idea, i) => {
      const rot = rotations[i % rotations.length];
      const rels = (relMap[idea.name]||[]).slice(0,3).map(rn => {
        const rp = [...PRJ,...BOT].find(x => x.name === rn || x.ar === rn);
        return rp ? `<span title="${E(rn)}">${rp.em||'•'}</span>` : '';
      }).filter(Boolean).join(' ');
      const bullets = (idea.desc||'').split('\n').filter(l => /^[🎯🔧📊🔔📈💹🌍🔄🔗]/.test(l.trim())).slice(0,3);
      return `<div class="sticky-note" data-pr="${idea.pr}" style="border-right:4px solid ${prColors[idea.pr]||'#999'};transform:rotate(${rot}deg)" onclick="openIdeaDetail('${E(idea.name)}')">`+
        `<span class="sticky-badge" style="background:${prColors[idea.pr]||'#999'}">${E(prLabels[idea.pr]||'')}</span>`+
        `<span class="sticky-emoji">${_ic(idea.em,36)}</span>`+
        `<h4 class="sticky-title">${E(idea.name)}</h4>`+
        `<p class="sticky-desc">${E((idea.desc||'').split('\n')[0])}</p>`+
        (bullets.length ? `<div style="margin-top:.4rem;font-size:.7rem;color:var(--t3)">${bullets.map(b => `<div>${E(b)}</div>`).join('')}</div>` : '') +
        (rels ? `<div style="margin-top:.5rem;font-size:.75rem;color:var(--t3)">يتكامل مع ${rels}</div>` : '') +
      `</div>`;
    }).join('') + '</div>';
};

/* ── ARCHIVE ── */
R.archive = function() {
  return `<h2 class="page-title"><span class="page-icon">${_ic('🗄️',20)}</span> الأرشيف <small style="font-size:.6em;opacity:.5">المشاريع القديمة والملفات المؤرشفة</small></h2>` +
    '<div class="archive-shelf">' + ARC.map(a => {
      const tags = (a.tags||[]).slice(0,3);
      return `<div class="book-card" onclick="openArchiveDetail('${E(a.name)}')">`+
        `<div class="book-spine" style="background:${a.cl}"></div>`+
        `<div class="book-body">`+
          `<span class="book-emoji">${_ic(a.em,32)}</span>`+
          `<h4 class="book-title">${E(a.ar||a.name)}</h4>`+
          `<p class="book-desc">${E((a.desc||'').split('\n')[0])}</p>`+
          `<div class="book-tags">${tags.map(t => `<span class="tag">${E(t)}</span>`).join('')}</div>`+
          `<div class="book-stamp">مؤرشف</div>`+
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
  return `<div style="margin-top:14px;font-family:var(--mono);font-size:11px;background:var(--elevated);padding:10px 14px;border-radius:8px;color:var(--t2);direction:ltr;word-break:break-all">📁 ${E(path)}</div>`;
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
      sections.map(s=>
        `<div class="prj-info-card">`+
        (s.title?`<h3 class="prj-info-title">${E(s.title)}</h3>`:'')+
        s.rows.map(r=>`<div class="prj-info-row">${E(r)}</div>`).join('')+
        `</div>`
      ).join('')+
      (tags.length?`<div class="prj-info-card"><h3 class="prj-info-title">🏷️ التقنيات</h3><div style="display:flex;flex-wrap:wrap;gap:6px">${tags.map(t=>`<span class="tag" style="background:${cl}12;color:${cl};padding:4px 12px;font-size:10px">${E(t)}</span>`).join('')}</div></div>`:'')+
      (item.path?`<div class="prj-info-card"><h3 class="prj-info-title">📁 المسار</h3><code style="font-size:12px;color:var(--t2);direction:ltr;display:block;word-break:break-all">${E(item.path)}</code></div>`:'')+
      (Object.keys(links).length?`<div class="prj-info-card"><h3 class="prj-info-title">🔗 الروابط</h3><div style="display:flex;flex-wrap:wrap;gap:8px">${Object.entries(links).map(([k,v])=>`<a href="${E(v)}" target="_blank" rel="noopener" style="padding:8px 20px;border-radius:10px;background:${cl};color:#fff;font-size:12px;font-weight:600;text-decoration:none;transition:opacity .15s" onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">${E(k)}</a>`).join('')}</div></div>`:'')+
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
        `<button class="dt-close" onclick="closeDetail()">&times;</button>`+
      `</div>`+
      `<div class="dt-body">`+
        `<div class="dt-prompt">$ bot status --name "${E(item.name)}"</div>`+
        `<div class="dt-output">`+
          `<div class="dt-line"><span class="dt-key">الاسم</span> ${E(item.ar||item.name)} ${_ic(item.em,16)}</div>`+
          `<div class="dt-line"><span class="dt-key">الحالة</span> <span style="color:${isActive?'#28C840':'#FF5F57'}">${isActive?'● نشط':'● متوقف'}</span></div>`+
          (headline?`<div class="dt-line"><span class="dt-key">الوصف</span> ${E(headline)}</div>`:'')+
        `</div>`+
        (stats.length?`<div class="dt-prompt">$ bot stats</div><div class="dt-stats">${stats.map(s=>`<div class="dt-stat"><span class="dt-stat-val" style="color:${cl}">${E(s.v)}</span><span class="dt-stat-label">${E(s.l)}</span></div>`).join('')}</div>`:'')+
        `<div class="dt-prompt">$ bot info --verbose</div>`+
        `<div class="dt-output">`+
          sections.map(s=>
            (s.title?`<div class="dt-section-title">${E(s.title)}</div>`:'')+
            s.rows.map(r=>`<div class="dt-line">${E(r)}</div>`).join('')
          ).join('')+
        `</div>`+
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
        `<button class="dsp-close" onclick="closeDetail()">&times;</button>`+
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
  const prLabels = {1:'🔴 عاجل',2:'🟡 قريب',3:'⚫ يوماً ما'};
  const prColors = {1:'#EF4444',2:'#F59E0B',3:'#6366F1'};
  const cl = prColors[item.pr]||'#6366F1';

  const relMap = {
    "بوت تلقرام لبريكس":["Argaz Bot","BRIX Travel System"],
    "نظام تتبع مالي":["BRIX Travel System","Wapy.dev"],
    "BRIX Website v2":["BRIX Travel Website","BRIX Travel System"]
  };
  const rels = (relMap[item.name]||[]).map(rn => {
    const rp = [...PRJ,...BOT].find(x=>x.name===rn||x.ar===rn);
    return rp ? `<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:var(--elevated);border-radius:20px;font-size:10px">${rp.em} ${E(rp.ar||rp.name)}</span>` : '';
  }).filter(Boolean).join('');

  const el = document.createElement('div');
  el.id = 'detail-view';
  el.className = 'detail-idea';
  el.innerHTML =
    `<div class="di-overlay" onclick="closeDetail()"></div>`+
    `<div class="di-card" style="border-top:4px solid ${cl}">`+
      `<button class="di-close" onclick="closeDetail()">&times;</button>`+
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
      `<button class="da-close" onclick="closeDetail()">&times;</button>`+
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
  // Restore any hidden pages
  const pg = document.getElementById('page-'+cur);
  if (pg && pg.style.display==='none') pg.style.display='';
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

document.addEventListener('mousemove', function(e) {
  document.querySelectorAll('.glass').forEach(card => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
      card.style.setProperty('--mouse-x', x + 'px');
      card.style.setProperty('--mouse-y', y + 'px');
    }
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
