/* Context-specific views share evidence and navigation, not a visual template. */
function wsContextEdge(edge,row,rows) {
  const other=edge.other;
  const direction=edge.directed ? `من: ${rows.find(r=>r.key===edge.from)?.title} · إلى: ${rows.find(r=>r.key===edge.to)?.title}` : '';
  return `<article class="context-edge" data-state="${edge.state}" data-peer="${E(other.key)}" data-from="${E(edge.from)}" data-to="${E(edge.to)}"><div class="context-edge-identity">${wsOpenButton(other,`${wsGlyph(other)}<strong>${E(other.title)}</strong>`,'context-peer')}<span>${E(WorkspaceContext.relationLabel(edge,row))}</span></div><span class="context-state" data-state="${edge.state}">${RelationshipView.STATES[edge.state]}</span><details class="context-source"><summary aria-label="مصدر العلاقة مع ${E(other.title)}">${wsIcon('info')}<span>المصدر</span></summary>${direction?`<p>${E(direction)}</p>`:''}<ul>${edge.sources.map(source=>{const owner=rows.find(r=>r.key===source.owner);return `<li>${wsOpenButton(owner,E(owner.title))}<span>${E(source.label)}</span></li>`;}).join('')}</ul></details></article>`;
}
function wsContextGroup(group,row,rows,tag='section') {
  return `<${tag} class="context-group" data-kind="${group.kind}"><header><h3>${E(group.label)}</h3><span>${wsNumber(group.edges.length)}</span></header><div class="context-members">${group.edges.map(edge=>wsContextEdge(edge,row,rows)).join('')}</div></${tag}>`;
}
const WS_CONTEXT_LAYOUTS = {
  project:(groups,row,rows)=>`<div class="context-project-map" data-pattern="${WorkspaceContent.profile(row).theme}">${groups.map(g=>wsContextGroup(g,row,rows)).join('')}</div>`,
  service:(groups,row,rows)=>`<div class="context-service-bus"><div class="context-origin">${wsIcon('server')}<strong>${E(row.title)}</strong><small>${E(row.item.host||'مكان غير مسجّل')}</small></div><div class="context-service-branches">${groups.map(g=>wsContextGroup(g,row,rows)).join('')}</div></div>`,
  tool:(groups,row,rows)=>`<div class="context-tool-sockets">${groups.map(g=>wsContextGroup(g,row,rows)).join('')}</div>`,
  cloud:(groups,row,rows)=>`<div class="context-cloud-directory">${groups.map(g=>wsContextGroup(g,row,rows)).join('')}</div>`,
  automation:(groups,row,rows)=>`<div class="context-task-scope"><div class="context-task-caption">${wsIcon('workflow')}نطاق مسجّل، لا ترتيب تنفيذ</div>${groups.map(g=>wsContextGroup(g,row,rows)).join('')}</div>`,
  bot:(groups,row,rows)=>`<div class="context-bot-channel"><div class="context-channel-label">${wsIcon('messages-square')}<span>${E(row.item.channel||'القناة غير مسجلة')}</span></div>${groups.map(g=>wsContextGroup(g,row,rows)).join('')}</div>`,
  team:(groups,row,rows)=>`<div class="context-assignment-register">${groups.map(g=>wsContextGroup(g,row,rows)).join('')}</div>`,
  idea:(groups,row,rows)=>`<div class="context-proposal-scope">${groups.map(g=>wsContextGroup(g,row,rows)).join('')}</div>`,
  archive:(groups,row,rows)=>`<div class="context-reference-index">${groups.map(g=>wsContextGroup(g,row,rows)).join('')}</div>`,
};
function wsDomainConnections(row) {
  const {rows,graph}=wsRelations();
  const groups=WorkspaceContext.sections(rows,row,graph);
  const issues=graph.issues.filter(issue=>issue.owner===row.key);
  const body=groups.length ? WS_CONTEXT_LAYOUTS[row.kind](groups,row,rows) : '<p class="context-empty">لا توجد علاقات مسجّلة.</p>';
  return wsDetailSection('connections',WorkspaceContext.TITLES[row.kind][0],`<div class="context-connections" data-context-kind="${row.kind}" data-context-motion><p class="context-note">من السجل، وليست حركة تشغيل حيّة.</p>${issues.length?`<p class="rel-warning">${wsNumber(issues.length)} مراجع غير محسومة؛ لم تُربط تخمينيًا.</p>`:''}${body}</div>`);
}
function wsContextFile(file) {
  return `<div class="context-file" data-storage="${file.kind}"><div>${wsIcon(WorkspaceContext.PATHS[file.kind][1])}<span>${E(file.label)}</span><button class="ws-icon-button" data-ws-copy="${E(file.value)}" aria-label="نسخ ${E(file.label)}" title="نسخ المسار">${wsIcon('copy')}</button></div><code dir="ltr">${E(file.value)}</code></div>`;
}
function wsDomainResources(row) {
  const {links,files}=WorkspaceContext.resources(row);
  if(!links.length&&!files.length) return '';
  const titles=WorkspaceContext.TITLES[row.kind];
  const linkBody=links.map(link=>`<li data-link-kind="${link.kind}">${wsExternal(link.value,link.label)}<bdi>${E(new URL(link.value).host)}</bdi></li>`).join('');
  return wsDetailSection('resources',titles[1],`<div class="context-resources" data-resource-kind="${row.kind}">${links.length?`<ul class="context-destinations">${linkBody}</ul>`:''}${files.length?`<div class="context-file-list">${files.map(wsContextFile).join('')}</div>`:''}</div>`);
}
function wsDomainHome() {
  const rows=wsRegistry(),tracked=rows.filter(r=>!['idea','team'].includes(r.kind));
  const pinned=rows.filter(r=>wsPreferences.pinned.includes(r.key));
  const quick=pinned.length?pinned:rows.filter(r=>r.kind==='project'&&WorkspaceModel.primaryLink(r)).slice(0,4);
  const review=tracked.filter(r=>['fail','warn','stale'].includes(wsMeta(r).state)).sort((a,b)=>wsMeta(a).rank-wsMeta(b).rank);
  const manual=tracked.filter(r=>['manual','unknown'].includes(wsMeta(r).state)).length;
  return wsHeader('home',`<span class="ws-date">${E(wsDate(RUNTIME_STATE.generated_at))}</span>`)+
    `<section class="context-launchpad">${wsSectionTitle(pinned.length?'المثبتة':'ابدأ من هنا',wsGo('projects','المشاريع'))}<div>${quick.map(row=>`<article data-tone="${wsTone(row)}">${wsOpenButton(row,`${row.kind==='project'?wsProjectMark(WorkspaceContent.profile(row)):wsGlyph(row)}<strong>${E(row.title)}</strong>`,'context-launch-title')}<div>${wsStar(row)}${WorkspaceModel.primaryLink(row)?wsExternal(WorkspaceModel.primaryLink(row).url,'فتح',true):wsOpenButton(row,wsIcon('arrow-left'),'ws-icon-button')}</div></article>`).join('')}</div></section>`+
    `<div class="context-home-columns"><section id="ws-review" class="context-attention">${wsSectionTitle('يحتاج انتباهك',`<span>${wsNumber(review.length)}</span>`)}${review.length?review.map(row=>wsOpenButton(row,`${wsIcon(wsMeta(row).icon)}<span><strong>${E(row.title)}</strong><small>${E(row.record?.summary||wsMeta(row).label)}</small></span>${wsIcon('arrow-left')}`,'context-review-link')).join(''):'<p class="context-empty">لا تنبيهات في الفحوص المتاحة.</p>'}<p class="context-note">${wsNumber(manual)} عناصر بلا تأكيد آلي.</p></section><section class="context-home-server">${wsSectionTitle('الخادم',wsGo('server','التشغيل'))}${wsServerSummary()}<p class="context-note">آخر نتائج محفوظة، لا فحص مباشر.</p></section></div>`+
    `<section class="context-workspace-index">${WS_GROUPS.map((group,index)=>`<div data-area="${index}"><header><span>${String(index+1).padStart(2,'0')}</span><h2>${E(group.label)}</h2></header>${group.pages.filter(page=>page!=='home').map(page=>`<a href="#${page}" data-action="goPage" data-arg="${page}">${wsIcon(WS_PAGES[page].icon)}<strong>${E(WS_PAGES[page].title)}</strong>${wsIcon('chevron-left')}</a>`).join('')}</div>`).join('')}</section>`;
}
let wsPathScope='all';
function wsDomainPaths() {
  const rows=wsRegistry();
  const entries=rows.flatMap(row=>{const resources=WorkspaceContext.resources(row);return [...resources.files,...resources.links.filter(r=>r.kind==='source')].map(resource=>({row,resource}));});
  const matches=entries.filter(({row,resource})=>(wsPathScope==='all'||resource.kind===wsPathScope)&&WorkspaceModel.normalize(`${row.title} ${resource.label} ${resource.value}`).includes(WorkspaceModel.normalize(wsState('map').query.trim())));
  const scopes=['all',...Object.keys(WorkspaceContext.PATHS).filter(kind=>entries.some(e=>e.resource.kind===kind))];
  return wsHeader('map',`<div><span class="ws-count">${wsNumber(entries.length)} مسار ومرجع</span><a class="ws-text-button" href="graph.html">${wsIcon('network')}خريطة العلاقات</a></div>`)+
    `<div class="ws-toolbar"><label class="ws-inline-search">${wsIcon('search')}<input data-ws-query="map" type="search" value="${E(wsState('map').query)}" placeholder="اسم أو مسار…" aria-label="البحث في المسارات"></label><div class="context-storage-tabs" aria-label="مكان الحفظ">${scopes.map(kind=>`<button data-path-scope="${kind}" aria-pressed="${kind===wsPathScope}">${E(kind==='all'?'الكل':WorkspaceContext.PATHS[kind][0])}<span>${wsNumber(entries.filter(e=>kind==='all'||e.resource.kind===kind).length)}</span></button>`).join('')}</div></div>`+
    `<div class="context-path-register">${matches.map(({row,resource})=>`<article data-storage="${resource.kind}"><div class="context-path-owner">${wsOpenButton(row,`${wsGlyph(row)}<strong>${E(row.title)}</strong>`)}<small>${E(resource.label)}</small></div><div class="context-path-value"><code dir="ltr">${E(resource.value)}</code>${resource.link?wsExternal(resource.value,'فتح المصدر',true):`<button class="ws-icon-button" data-ws-copy="${E(resource.value)}" aria-label="نسخ مسار ${E(row.title)}" title="نسخ">${wsIcon('copy')}</button>`}</div></article>`).join('')||'<p class="context-empty">لا توجد مسارات مطابقة.</p>'}</div>`;
}
R.home=wsDomainHome;
R.map=wsDomainPaths;
document.addEventListener('click',event=>{
  const button=event.target instanceof Element&&event.target.closest('[data-path-scope]');
  if(!button) return;
  const scope=button.dataset.pathScope;
  if(scope!=='all'&&!WorkspaceContext.PATHS[scope]) return;
  wsPathScope=scope; wsRender('map');
  document.querySelector(`[data-path-scope="${scope}"]`)?.focus({preventScroll:true});
});
