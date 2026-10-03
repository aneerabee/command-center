const relationRows = WorkspaceModel.registry({PRJ,SVC,BOT,TL,CLD,ARC,IDEAS,TEAM,AUTO});
const relationSelect = document.getElementById('relation-entity');
const relationQuery = document.getElementById('relation-query');
const relationResults = document.getElementById('relation-results');
const relationKinds = {project:'مشروع',service:'خدمة',bot:'بوت',tool:'أداة',cloud:'منصة',archive:'مرجع محفوظ',idea:'فكرة',team:'عضو',automation:'مهمة'};
const relationGraph = WorkspaceModel.relationshipGraph(relationRows);
const relationParams = new URLSearchParams(location.search);
const relationPage = relationParams.get('page');
function relationOptions() {
  const selected = relationSelect.value;
  const rows = relationRows.filter(row=>(!relationPage || row.page===relationPage) && WorkspaceModel.matches(row,relationQuery.value));
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
  const connected=RelationshipView.groups(relationRows,row,relationGraph);
  const count=document.createElement('p');count.className='relation-caption';count.textContent=`العناصر المرتبطة: ${connected.length}. الاتجاه يظهر للاستخدام والإسناد والتبعية فقط؛ الخط بلا سهم يعني ارتباطًا دون اتجاه مسجّل.`;
  const list=document.createElement('div');
  list.innerHTML=RelationshipView.render(relationRows,row,{prefix:'index.html#',graph:relationGraph});
  relationResults.append(title,link,count,list);
  const params=new URLSearchParams(location.search);
  params.set('entity',row.key);
  history.replaceState(null,'',`${location.pathname}?${params}`);
}
relationQuery.addEventListener('input',relationOptions);
relationSelect.addEventListener('change',relationDetails);
relationOptions();
const initial=relationParams.get('entity');
if([...relationSelect.options].some(option=>option.value===initial)) relationSelect.value=initial;
else if(relationSelect.options.length>1) relationSelect.selectedIndex=1;
relationDetails();
