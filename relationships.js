const relationRows = WorkspaceModel.registry({PRJ,SVC,BOT,TL,CLD,ARC,IDEAS,TEAM,AUTO});
const relationSelect = document.getElementById('relation-entity');
const relationQuery = document.getElementById('relation-query');
const relationResults = document.getElementById('relation-results');
const relationKinds = {project:'مشروع',service:'خدمة',bot:'بوت',tool:'أداة',cloud:'منصة',archive:'مرجع محفوظ',idea:'فكرة',team:'عضو',automation:'مهمة'};
function relationOptions() {
  const selected = relationSelect.value;
  const rows = relationRows.filter(row=>WorkspaceModel.matches(row,relationQuery.value));
  relationSelect.replaceChildren(new Option(rows.length ? 'اختر عنصرًا' : 'لا توجد نتائج',''),...rows.map(row=>new Option(`${row.title} · ${relationKinds[row.kind]}`,row.key)));
  if(rows.some(row=>row.key===selected)) relationSelect.value=selected;
  relationDetails();
  document.getElementById('relation-count').textContent=`${rows.length} من ${relationRows.length} عنصرًا`;
}
function relationDetails() {
  relationResults.replaceChildren();
  const row=relationRows.find(row=>row.key===relationSelect.value);
  if(!row) return;
  const title=document.createElement('h2');title.textContent=row.title;
  const link=document.createElement('a');link.className='ws-button';link.href=`index.html#${WorkspaceModel.route(row)}`;link.textContent='فتح الصفحة';
  const connected=WorkspaceModel.related(relationRows,row);
  const count=document.createElement('p');count.className='relation-caption';count.textContent=connected.length ? `${connected.length} ارتباطات مسجّلة، تشمل الروابط الواردة والصادرة` : 'لا توجد ارتباطات مسجّلة.';
  const list=document.createElement('div');list.className='ws-connected-list';
  for(const other of connected) {
    const a=document.createElement('a');a.className='ws-connected-item';a.href=`index.html#${WorkspaceModel.route(other)}`;
    const span=document.createElement('span'),strong=document.createElement('strong'),small=document.createElement('small');
    strong.textContent=other.title;small.textContent=relationKinds[other.kind];span.append(strong,small);a.append(span);list.append(a);
  }
  relationResults.append(title,link,count,list);
}
relationQuery.addEventListener('input',relationOptions);
relationSelect.addEventListener('change',relationDetails);
relationOptions();
