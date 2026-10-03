/* Explanatory links do not alter service state or infer unrecorded dependencies. */
let wsRelationshipContext;
function wsRelations() {
  if (!wsRelationshipContext) {
    const rows = wsRegistry();
    wsRelationshipContext = {rows,graph:WorkspaceModel.relationshipGraph(rows)};
  }
  return wsRelationshipContext;
}
function wsRelationHint(row) {
  const {rows,graph} = wsRelations();
  const edges = RelationshipView.groups(rows,row,graph);
  if (!edges.length) return '<span class="ws-relation-empty">لا توجد علاقات مسجّلة</span>';
  const edge = edges.find(edge=>edge.directed) || edges[0];
  const {from,to,meaning} = RelationshipView.phrase(edge,rows);
  const label = `${from.title} · ${meaning} ${to.title}`;
  return `<a class="ws-relation-hint" href="graph.html?entity=${encodeURIComponent(row.key)}" title="${E(label)}"><span class="ws-relation-trace" aria-hidden="true"></span><span>${E(label)}${edge.state!=='recorded' ? `<small>${RelationshipView.STATES[edge.state]}</small>` : ''}</span><b>روابط: ${wsNumber(edges.length)}</b>${wsIcon('arrow-up-left')}</a>`;
}
function wsSectionEvidence(page,rows) {
  const tracked = rows.filter(row=>!['team','idea'].includes(row.kind));
  const counts = WorkspaceModel.counts(tracked);
  const text = page === 'team' ? 'الأدوار والمشاريع المسندة معلومات مسجّلة، وليست متابعة لحظية لعمل الفريق.' : page === 'ideas' ? 'هذه مقترحات مسجّلة؛ ارتباطها بمشروع لا يعني تنفيذها.' : page === 'archive' ? 'وجود المرجع لا يثبت حداثة محتواه. المرجع الأمني النشط مميّز عن الأرشيف.' : `${wsNumber(counts.ok)} اجتاز الفحص المحدد · ${wsNumber(counts.warn+counts.fail+counts.stale)} يحتاج إعادة تحقق · ${wsNumber(counts.manual+counts.unknown)} بلا تأكيد آلي. الوصف والعلاقات من السجل.`;
  return `<div class="ws-section-evidence"><p>${E(text)}</p><a class="ws-text-button" href="graph.html?page=${encodeURIComponent(page)}">${wsIcon('network')}علاقات القسم</a></div>`;
}
function wsHomeRelations() {
  const {rows,graph} = wsRelations();
  const examples = ['assigned_projects','parent_project','used_in'].map(kind=>graph.edges.find(edge=>edge.kind===kind && edge.state==='recorded')).filter(Boolean);
  return `<section class="ws-relationship-overview">${wsSectionTitle('كيف ترتبط مساحة العمل؟','<a class="ws-text-button" href="graph.html">كل العلاقات</a>')}<p class="rel-note">أمثلة من العلاقات المسجّلة، لا من حركة التشغيل الفعلية.</p><div>${examples.map(edge=>RelationshipView.flow(edge,rows,'#')).join('')}</div></section>`;
}
