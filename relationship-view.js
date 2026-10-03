/* Shared relationship language; layouts stay with their owning section. */
const RelationshipView = (() => {
  const STATES = {recorded:'مسجّل',historical:'قديم أو غير مفعّل',proposed:'مقترح'};
  const KINDS = {project:'مشروع',service:'خدمة',bot:'بوت',tool:'أداة',cloud:'منصة',archive:'مرجع',idea:'فكرة',team:'عضو الفريق',automation:'مهمة'};
  const escape = value => String(value ?? '').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function groups(rows,row,graph) {
    const pairs = new Map();
    for (const edge of WorkspaceModel.connections(rows,row,graph)) pairs.set(edge.other.key,[...(pairs.get(edge.other.key) || []),edge]);
    return [...pairs.values()].map(edges => ({
      ...[...edges].sort((a,b)=>Number(b.directed)-Number(a.directed))[0],
      sources:edges.flatMap(edge=>edge.sources),
    }));
  }
  function phrase(edge,rows) {
    const from = rows.find(row=>row.key===edge.from), to = rows.find(row=>row.key===edge.to);
    const meaning = edge.state === 'proposed' ? 'مقترح مرتبط بـ' : edge.kind === 'used_in' ? 'استخدام مسجّل لـ' : edge.kind === 'assigned_projects' ? 'عمل مسند على' : edge.kind === 'parent_project' ? 'تابع للمشروع' : 'ارتباط مسجّل مع';
    return { from, to, meaning };
  }
  function node(row,prefix) {
    return `<a class="rel-node" href="${escape(prefix+WorkspaceModel.route(row))}"><small>${KINDS[row.kind]}</small><strong>${escape(row.title)}</strong></a>`;
  }
  function flow(edge,rows,prefix) {
    const {from,to} = phrase(edge,rows);
    const label = edge.state === 'proposed' ? 'ارتباط مقترح' : edge.label;
    return `<div class="rel-flow" data-state="${edge.state}" data-directed="${edge.directed}">${node(from,prefix)}<div class="rel-connector"><span>${label}</span><i aria-hidden="true"></i></div>${node(to,prefix)}</div>`;
  }
  function render(rows,row,{prefix='#',graph=WorkspaceModel.relationshipGraph(rows)} = {}) {
    const edges = groups(rows,row,graph);
    const missing = graph.issues.filter(issue=>issue.owner===row.key);
    return `<div class="rel-explanation" data-context="${row.page}"><div class="rel-intro"><p class="rel-note">العلاقات من السجل، وليست حركة بيانات مباشرة أو إثباتًا لعمل الخدمات.</p>${edges.length ? '<button type="button" class="ws-text-button" data-relation-replay>إعادة العرض</button>' : ''}</div>${missing.length ? `<p class="rel-warning">${missing.length} مراجع تحتاج تصحيحًا؛ لم تُربط بعنصر تخميني.</p>` : ''}${edges.length ? `<div class="rel-lanes">${edges.map(edge=>`<article class="rel-lane"><div class="rel-state" data-state="${edge.state}">${STATES[edge.state]}</div>${flow(edge,rows,prefix)}<details class="rel-source"><summary>مصدر العلاقة</summary><ul>${edge.sources.map(source=>{
      const owner=rows.find(item=>item.key===source.owner);
      return `<li>سجل <a href="${escape(prefix+WorkspaceModel.route(owner))}">${escape(owner.title)}</a> · ${escape(source.label)}</li>`;
    }).join('')}</ul></details></article>`).join('')}</div>` : '<p class="rel-note">لا توجد علاقات مسجّلة لهذا العنصر. هذا لا يثبت أنه مستقل فعليًا.</p>'}</div>`;
  }
  return Object.freeze({groups,phrase,flow,render,STATES});
})();
if (typeof module !== 'undefined') module.exports = RelationshipView;
