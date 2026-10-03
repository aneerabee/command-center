/* Domain-specific compositions use the same canonical links and filters. */
function wsGroupedRows(rows, key) {
  const groups = new Map();
  for (const row of rows) {
    const label = key(row) || 'غير محدد في السجل';
    groups.set(label,[...(groups.get(label) || []),row]);
  }
  return [...groups];
}
function wsCatalogActions(row) {
  const link = WorkspaceModel.primaryLink(row);
  return `<div class="ws-row-actions">${wsStar(row)}${link ? wsExternal(link.url,`${link.label}: ${row.title}`,true) : wsOpenButton(row,wsIcon('arrow-left'),'ws-icon-button ws-details-button')}</div>`;
}
function wsCatalogIdentity(row, className = '') {
  return wsOpenButton(row,`<span class="ws-entity-icon">${wsGlyph(row)}</span><span><strong>${E(row.title)}</strong><small>${E(wsSummary(row))}</small></span>`,`ws-domain-identity ${className}`);
}
function wsCatalogEvidence(row) {
  return `<div class="ws-domain-evidence">${wsBadge(row)}<small>${wsRelativeTime(row.record?.verified_at)}</small></div>`;
}
function wsPeopleCatalog(rows) {
  return wsGroupedRows(rows,wsGroup).map(([department,members])=>`<section class="ws-people-department"><header><h2>${E(department)}</h2><span>${wsNumber(members.length)} أعضاء</span></header><div class="ws-people-directory">${members.map(row=>`<article class="ws-person" data-tone="rose" data-entity-key="${E(row.key)}"><div class="ws-person-top">${wsOpenButton(row,`<span class="ws-person-avatar">${E(nameInitial(row.title))}</span><span><strong>${E(row.title)}</strong><small>${E(row.item.role || 'دور غير مسجل')}</small></span>`,'ws-person-name')}${wsStar(row)}</div><div class="ws-person-context"><span>${E(wsCompany(row.item))}</span>${row.item.location_office ? `<span>${wsIcon('map-pin')}${E(row.item.location_office)}</span>` : ''}</div>${wsOpenButton(row,`الملف والمسؤوليات${wsIcon('arrow-left')}`,'ws-text-button')}</article>`).join('')}</div></section>`).join('');
}
function wsServiceCatalog(rows) {
  return wsGroupedRows(rows,row=>row.item.host).map(([host,services])=>`<section class="ws-host"><header><span class="ws-host-symbol">${wsIcon('server')}</span><div><h2>${E(host)}</h2><span>${wsNumber(services.length)} خدمات مسجلة</span></div></header><div class="ws-service-table">${services.map(row=>`<article class="ws-service-row" data-tone="green" data-entity-key="${E(row.key)}">${wsCatalogIdentity(row)}<div class="ws-service-endpoint"><span>${E(row.item.runtime || row.item.type || '—')}</span>${row.item.port ? `<code>${E(String(row.item.port))}</code>` : ''}</div>${wsCatalogEvidence(row)}${wsCatalogActions(row)}</article>`).join('')}</div></section>`).join('');
}
function wsScheduleCatalog(rows) {
  return wsGroupedRows(rows,row=>row.group).map(([host,tasks])=>`<section class="ws-schedule"><header><h2>${E(host)}</h2><span>${wsNumber(tasks.length)} مهام</span></header><ol>${tasks.map(row=>`<li class="ws-schedule-entry" data-tone="orange" data-entity-key="${E(row.key)}"><div class="ws-schedule-time">${wsIcon('clock-3')}<strong>${E(row.item.freq || 'موعد غير مسجل')}</strong><small>${row.item.on ? 'مفعلة في السجل' : 'معطلة في السجل'}</small></div><div class="ws-schedule-task">${wsOpenButton(row,`<strong>${E(row.title)}</strong>`,'ws-schedule-title')}<p>${E(wsSummary(row))}</p>${wsCatalogEvidence(row)}</div>${wsCatalogActions(row)}</li>`).join('')}</ol></section>`).join('');
}
function wsBotCatalog(rows) {
  return rows.map(row=>`<article class="ws-bot-profile" data-tone="teal" data-entity-key="${E(row.key)}"><header>${wsOpenButton(row,`<span class="ws-bot-mark">${wsIcon('bot')}</span><span><small>${E(row.item.channel || 'القناة غير مسجلة')}</small><strong>${E(row.title)}</strong></span>`,'ws-bot-name')}${wsCatalogActions(row)}</header><div class="ws-bot-body"><p>${E(wsSummary(row))}</p><dl><div><dt>بيئة التشغيل المسجلة</dt><dd>${E(row.item.runtime || 'غير محددة')}</dd></div><div><dt>آخر تحقق</dt><dd>${wsCatalogEvidence(row)}</dd></div></dl></div>${wsOpenButton(row,`الروابط والارتباطات${wsIcon('arrow-left')}`,'ws-text-button')}</article>`).join('');
}
function wsPlatformCatalog(rows) {
  const registry=wsRegistry();
  return rows.map(row=>{
    const projects=WorkspaceModel.related(registry,row).filter(other=>other.kind==='project');
    return `<article class="ws-platform" data-tone="blue" data-entity-key="${E(row.key)}"><div class="ws-platform-provider">${wsCatalogIdentity(row)}<span class="ws-platform-category">${E(wsGroup(row))}</span>${wsCatalogEvidence(row)}</div><div class="ws-platform-usage"><span class="ws-overline">المشاريع المرتبطة في السجل</span>${projects.length ? projects.map(project=>wsOpenButton(project,`${wsIcon('folder')}<span>${E(project.title)}</span>${wsIcon('chevron-left')}`,'ws-platform-project')).join('') : '<p class="ws-muted">لا يوجد مشروع مرتبط مسجّل.</p>'}</div>${wsCatalogActions(row)}</article>`;
  }).join('');
}
function wsToolsCatalog(rows) {
  return wsGroupedRows(rows,wsGroup).map(([category,tools])=>`<section class="ws-tool-group"><header><h2>${E(category)}</h2><span>${wsNumber(tools.length)}</span></header><div class="ws-tool-directory">${tools.map(row=>`<article class="ws-tool-entry" data-tone="violet" data-entity-key="${E(row.key)}">${wsCatalogIdentity(row)}<div class="ws-tool-bottom">${wsBadge(row)}${wsCatalogActions(row)}</div></article>`).join('')}</div></section>`).join('');
}
function wsIdeasCatalog(rows) {
  return rows.map((row,index)=>`<article class="ws-idea-sheet" data-tone="amber" data-entity-key="${E(row.key)}"><div class="ws-idea-index">${String(index+1).padStart(2,'0')}</div><div class="ws-idea-writing"><div class="ws-idea-context"><span>${E(wsGroup(row) || 'مقترح مستقل')}</span>${wsBadge(row)}</div>${wsOpenButton(row,`<h2>${E(row.title)}</h2>`,'ws-idea-title')}<p>${E(wsSummary(row))}</p>${wsOpenButton(row,`قراءة المقترح${wsIcon('arrow-left')}`,'ws-text-button')}</div>${wsStar(row)}</article>`).join('');
}
function wsArchiveCatalog(rows) {
  return `<div class="ws-archive-index">${rows.map(row=>`<article class="ws-archive-file" data-tone="graphite" data-entity-key="${E(row.key)}">${wsOpenButton(row,`<span class="ws-file-spine">${wsIcon('file-archive')}</span><span class="ws-file-title"><small>${E(wsGroup(row))}</small><strong>${E(row.title)}</strong></span>`,'ws-archive-cover')}<p>${E(wsSummary(row))}</p><footer>${wsCatalogEvidence(row)}${wsCatalogActions(row)}</footer></article>`).join('')}</div>`;
}
const WS_CATALOG_RENDERERS = {
  projects:(rows,grid)=>rows.map(row=>wsListRow(row,grid)).join(''),
  team:wsPeopleCatalog, server:wsServiceCatalog, auto:wsScheduleCatalog,
  bots:wsBotCatalog, cloud:wsPlatformCatalog, tools:wsToolsCatalog,
  ideas:wsIdeasCatalog, archive:wsArchiveCatalog,
};
function wsCatalogBody(page,rows,grid) { return WS_CATALOG_RENDERERS[page](rows,grid); }
