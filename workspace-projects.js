/* Project-specific compositions; common navigation and evidence stay canonical. */
function wsProjectMark(profile) {
  return profile.logo ? `<img class="project-logo" src="${E(profile.logo)}" alt="${E(profile.mark)}" width="92" height="72">` : `<span class="project-wordmark" dir="auto">${E(profile.mark)}</span>`;
}
function wsProjectSteps(profile, className = '') {
  return `<ol class="project-steps ${className}">${profile.steps.map(([name,meaning],index)=>`<li class="project-step"><span class="project-step-index">${String(index+1).padStart(2,'0')}</span><strong>${E(name)}</strong><p>${E(meaning)}</p></li>`).join('')}</ol>`;
}
function wsProjectTopics(profile) {
  return `<dl class="project-topics">${profile.areas.map(([name,meaning])=>`<div><dt>${E(name)}</dt><dd>${E(meaning)}</dd></div>`).join('')}</dl>`;
}
const WS_PROJECT_SCENES = {
  contracts:p=>`<div class="project-contract-desk"><div class="project-contract-index"><span>ملف الفندق</span>${['الغرف','الفترات','الأسعار','الشروط'].map(x=>`<span>${wsIcon('file-text')}${E(x)}</span>`).join('')}</div><div><h3>${E(p.title)}</h3>${wsProjectSteps(p,'contract-route')}</div></div>`,
  campaign:p=>`<div class="project-campaign"><figure><img src="${E(p.photo)}" alt="صورة منتجع من مكتبة مواد المجموعة" width="1920" height="1440" loading="lazy"><figcaption>مكتبة المحتوى · مواد المجموعة</figcaption></figure><div><h3>${E(p.title)}</h3>${wsProjectSteps(p,'campaign-route')}</div></div>`,
  itinerary:p=>`<div class="project-itinerary"><div class="itinerary-line"><span>${wsIcon('map-pin')}هوية رحلتي</span><span>${wsIcon('flag')}طلب الحجز</span></div><h3>${E(p.title)}</h3>${wsProjectSteps(p,'itinerary-stops')}</div>`,
  modules:p=>`<div class="project-modules"><header>${wsIcon('blocks')}<h3>${E(p.title)}</h3><span>وحدات منفصلة</span></header>${wsProjectSteps(p,'module-grid')}<div class="module-boundary">${wsIcon('shield-check')}القراءة لا تمنح تفويضًا بالكتابة</div></div>`,
  subscriptions:p=>`<div class="project-subscriptions"><div class="subscription-cycle">${wsIcon('calendar-days')}<strong>دورة الاشتراك</strong><span>تسجيل · متابعة · تجديد</span></div><div><h3>${E(p.title)}</h3>${wsProjectSteps(p,'subscription-rows')}</div></div>`,
  observatory:p=>`<div class="project-observatory"><div class="observatory-center">${wsIcon('panels-top-left')}<h3>${E(p.title)}</h3></div>${wsProjectSteps(p,'observatory-grid')}</div>`,
  conversation:p=>`<div class="project-conversation"><div class="conversation-rail"><span>${wsIcon('messages-square')}</span><h3>${E(p.title)}</h3><small>مسار العمل المسجّل</small></div>${wsProjectSteps(p,'conversation-thread')}</div>`,
  recovery:p=>`<div class="project-recovery"><header>${wsIcon('folder-open')}<h3>${E(p.title)}</h3><span>المحتوى غير مفحوص</span></header>${wsProjectSteps(p,'recovery-checklist')}</div>`,
  destination:p=>`<div class="project-destination"><img src="${E(p.photo)}" alt="صورة من ملفات موقع بريكس" width="1920" height="1440" loading="lazy"><div class="destination-title">${wsProjectMark(p)}<h3>${E(p.title)}</h3></div></div>${wsProjectSteps(p,'destination-index')}`,
  chess:p=>`<div class="project-chess"><div class="project-chessboard" role="img" aria-label="لوح شطرنج توضيحي للتعلم">${Array.from({length:64},(_,i)=>`<span class="${(Math.floor(i/8)+i)%2 ? 'dark':''}">${i===28 ? wsIcon('crown') : ''}</span>`).join('')}</div><div><h3>${E(p.title)}</h3>${wsProjectSteps(p,'lesson-stair')}</div></div>`,
  remittance:p=>`<div class="project-remittance"><header><span>${wsIcon('send')}سير الحوالة</span><span>العملة مستقلة في كل سجل</span></header><h3>${E(p.title)}</h3>${wsProjectSteps(p,'remittance-lane')}<footer><span>USD · دولار</span><span>LYD · دينار</span><span>TRY · ليرة</span></footer></div>`,
  ledger:p=>`<div class="project-ledger"><div class="ledger-spine">${wsProjectMark(p)}<span>دفتر مستقل</span></div><div class="ledger-pages"><h3>${E(p.title)}</h3>${wsProjectSteps(p,'ledger-lines')}</div></div>`,
  statement:p=>`<div class="project-statement"><header><span>كشف حساب</span><strong>الدكتور محسن</strong><span>${wsIcon('lock-keyhole')}وصول خاص</span></header><div class="statement-equation"><span>الوارد</span><b>+</b><span>المكاسب</span><b>−</b><span>الصادر</span><b>=</b><strong>الرصيد</strong></div>${wsProjectSteps(p,'statement-columns')}<p>لكل عملة كشف مستقل. لا تُعرض أرصدة الأشخاص هنا.</p></div>`,
};
function wsProjectHeader(row) {
  const p=WorkspaceContent.profile(row);
  const link=WorkspaceModel.primaryLink(row);
  return `<header class="project-heading"><div class="project-identity">${wsProjectMark(p)}<div><span class="ws-eyebrow">${E(p.label)}</span><h1 tabindex="-1">${E(row.title)}</h1></div></div><p class="project-lead">${E(p.lead)}</p><div class="project-entry">${link ? wsExternal(link.url,link.label) : '<span class="project-no-entry">لا يوجد رابط تطبيق منشور في السجل</span>'}${wsStar(row)}<button class="ws-icon-button" data-ws-copy="${E(new URL('#'+WorkspaceModel.route(row),location.href).href)}" aria-label="نسخ رابط الصفحة" title="نسخ رابط الصفحة">${wsIcon('link')}</button></div></header>`;
}
function wsProjectContent(row) {
  const p=WorkspaceContent.profile(row);
  return `<nav class="project-sections" aria-label="أقسام المشروع">${[['scope','نطاق العمل'],['followup','المتابعة'],['evidence','التحقق'],['resources','الروابط'],['connections','الارتباطات']].map(([id,label])=>`<button data-project-jump="detail-${id}">${E(label)}</button>`).join('')}</nav>`+
    wsDetailSection('scope',p.label,`<div class="project-scenario" data-project-motion>${WS_PROJECT_SCENES[p.theme](p)}</div>${wsProjectTopics(p)}`,'project-scope')+
    wsDetailSection('followup','المتابعة',`<div class="project-followup"><div>${wsIcon('arrow-up-right')}<h3>الخطوة التالية</h3><p>${E(p.next)}</p></div><aside>${wsIcon('info')}<h3>حدود المعلومات</h3><p>${E(p.caution)}</p></aside></div><p class="project-source">${E(p.source)} · مراجعة الوصف ${WorkspaceContent.reviewedAt}</p>`)+
    wsEvidence(row)+wsResources(row)+wsConnections(row);
}
function wsProjectCatalog(rows,grid) {
  return rows.map(row=>{
    const p=WorkspaceContent.profile(row);
    return `<article class="project-cover ${grid ? 'cover-grid' : 'cover-list'}" data-project="${p.theme}" data-entity-key="${E(row.key)}" style="--project-accent:${p.accent}"><div class="project-cover-top">${wsOpenButton(row,wsProjectMark(p),'project-cover-brand')}${wsCatalogActions(row)}</div>${wsOpenButton(row,`<small>${E(p.label)}</small><h2>${E(row.title)}</h2><p>${E(p.lead)}</p>`,'project-cover-title')}<div class="project-cover-motif" aria-hidden="true">${p.steps.map(([name],index)=>`<span><i>${String(index+1).padStart(2,'0')}</i>${E(name)}</span>`).join('')}</div><footer>${wsBadge(row)}<span>${wsRelativeTime(row.record?.verified_at)}</span></footer>${wsRelationHint(row)}</article>`;
  }).join('');
}
document.addEventListener('click',event=>{
  const jump=event.target instanceof Element && event.target.closest('[data-project-jump]');
  if(!jump) return;
  const section=document.getElementById(jump.dataset.projectJump);
  if(!section) return;
  section.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',block:'start'});
  const heading=section.querySelector('h2');
  heading?.setAttribute('tabindex','-1'); heading?.focus({preventScroll:true});
});
