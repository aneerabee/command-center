/* Presentation metadata never changes inventory relationships or paths. */
const WorkspaceContext = (() => {
  const PATHS = Object.freeze({local:['على الجهاز','laptop'],server:['على الخادم','server'],cloud:['ملفات سحابية','cloud-download'],source:['مصدر المشروع','git-branch'],config:['ملفات الإعداد','file-cog'],reference:['مرجع','book-open']});
  const TITLES = Object.freeze({
    project:['بيئة المشروع','مداخل العمل والملفات'],service:['ما يرتبط بالخدمة','عناوين الخدمة'],
    automation:['نطاق المهمة','التنفيذ والمراجع'],bot:['قنوات ووجهات مسجّلة','الوصول إلى البوت'],
    tool:['أين تُستخدم الأداة؟','الإعداد والتوثيق'],cloud:['المشاريع والخدمات المرتبطة','المنصة وإدارتها'],
    team:['الأعمال المسندة','التواصل'],idea:['نطاق المقترح','مراجع القرار'],archive:['سياق المرجع','مكان الحفظ'],
  });
  function pathKind(value,field) {
    if(/^github:/.test(value)) return 'source';
    if(field==='server_path'||/^server:/.test(value)) return 'server';
    if(/Mobile Documents|CloudStorage|iCloud/.test(value)) return 'cloud';
    if(field==='config_paths') return 'config';
    if(value.startsWith('/')||value.startsWith('~/')) return 'local';
    return 'reference';
  }
  function resources(row) {
    const item=row.item;
    const candidates=[
      ...(item.deploy_url ? [['فتح المشروع',item.deploy_url,'app']] : []),
      ...(item.repo_url ? [['المستودع',item.repo_url,'source']] : []),
      ...(item.lk ? [['المنصة',item.lk,'platform']] : []),
      ...Object.entries(item.links || {}).map(([label,value])=>[label,value,'reference']),
    ];
    const links=candidates.filter(([,value])=>WorkspaceModel.safeUrl(value)).reduce((result,[label,value,kind])=>result.some(link=>link.value===value)?result:[...result,{label,value,kind,link:true}],[]);
    const files=['local_path','server_path','path','config_paths'].flatMap(field=>{
      const raw=item[field];
      return (Array.isArray(raw)?raw:raw?[raw]:[]).filter(value=>typeof value==='string').map(value=>({value,kind:pathKind(value,field),link:false}));
    }).reduce((result,file)=>result.some(previous=>previous.value===file.value)?result:[...result,file],[]).map(file=>({...file,label:PATHS[file.kind][0]}));
    return {links,files};
  }
  function relationLabel(edge,row) {
    if(edge.state==='proposed') return 'ارتباط مقترح';
    if(edge.kind==='assigned_projects') return 'عمل مسند';
    if(edge.kind==='parent_project') return edge.from===row.key?'المشروع الرئيسي':'عنصر تابع';
    if(edge.kind==='used_in') return edge.from===row.key?'استخدام مسجّل':'جهة تستخدمه في السجل';
    return 'ارتباط مسجّل';
  }
  function sections(rows,row,graph) {
    const edges=RelationshipView.groups(rows,row,graph);
    const kinds={project:'المشاريع',service:'الخدمات',automation:'المهام',tool:'الأدوات',cloud:'المنصات',team:'الفريق',bot:'البوتات',idea:'المقترحات',archive:'المراجع'};
    return Object.entries(kinds).map(([kind,label])=>({kind,label,edges:edges.filter(edge=>edge.other.kind===kind)})).filter(group=>group.edges.length);
  }
  return Object.freeze({PATHS,TITLES,pathKind,resources,relationLabel,sections});
})();
if(typeof module!=='undefined') module.exports=WorkspaceContext;
