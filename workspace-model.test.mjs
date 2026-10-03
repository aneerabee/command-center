import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const model = require('./workspace-model.js');
const now = Date.parse('2026-10-03T12:00:00Z');
const recent = { verification_status:'ok', verified_at:'2026-10-03T11:00:00Z' };
const inventory = vm.runInNewContext(readFileSync(new URL('./data.js',import.meta.url),'utf8') + '\n({PG,PRJ,SVC,BOT,TL,CLD,ARC,IDEAS,TEAM,AUTO,UMBRELLAS,DEPARTMENTS})');

describe('verification is evidence-based',()=>{
  it('does not invent an available status without a check',()=>expect(model.status(null,now).state).toBe('unknown'));
  it.each(['ok','warn','fail','manual'])('retains a recent %s result',state=>expect(model.status({...recent,verification_status:state},now).state).toBe(state));
  it.each([
    {verified_at:'2026-10-01T11:00:00Z'},
    {verified_at:'2026-10-04T11:00:00Z'},
    {verified_at:'invalid'},
    {stale_at:'2026-10-03T11:30:00Z'},
    {stale:true},
  ])('distinguishes old or invalid evidence: %j',patch=>expect(model.status({...recent,...patch},now).state).toBe('stale'));
  it('does not turn manual checks into automatically verified results',()=>expect(model.status({verification_status:'manual'},now).state).toBe('manual'));
  it('ignores obsolete runtime coverage and removed projects',()=>{
    const rows=model.registry({PRJ:[{id:'kept',name:'Kept'}]}, {project:{kept:recent,deleted:recent},coverage:{ok:90,total:99}});
    expect(model.counts(rows,now)).toEqual({ok:1,warn:0,fail:0,stale:0,manual:0,unknown:0,total:1});
  });
});

describe('complete inventory and stable routes',()=>{
  it('retains every current entity, including team and nested tasks',()=>{
    const rows=model.registry(inventory);
    const expected=['PRJ','SVC','BOT','TL','CLD','ARC','IDEAS','TEAM'].reduce((n,key)=>n+inventory[key].length,0)+inventory.AUTO.reduce((n,g)=>n+g.tasks.length,0);
    expect(rows).toHaveLength(expected);
    expect(new Set(rows.map(row=>row.key)).size).toBe(expected);
    for(const row of rows) {
      expect(row.id).toBeTruthy(); expect(row.arg).toBeTruthy(); expect(row.title).toBeTruthy();
      expect(inventory.PG.some(page=>page.id===row.page)).toBe(true);
    }
  });
  it('keeps automation links unambiguous when task names repeat across hosts',()=>{
    const data={AUTO:['desktop','server'].map(host=>({host,tasks:[{id:host,name:'Backup'}]}))};
    const rows=model.registry(data,{automation:{'server::Backup':recent}});
    expect(rows.map(row=>row.arg)).toEqual(['desktop::Backup','server::Backup']);
    expect(rows[0].record).toBeNull(); expect(rows[1].record).toEqual(recent);
  });
  it('also supports runtime tasks keyed by stable id',()=>{
    const data={AUTO:[{host:'desktop',tasks:[{id:'job',name:'Backup'}]}]};
    expect(model.registry(data,{automation:{job:recent}})[0].record).toEqual(recent);
  });
  it('does not mutate inventory, runtime, or incoming records',()=>{
    const data=Object.freeze({PRJ:Object.freeze([Object.freeze({id:'x',name:'X'})])});
    const runtime=Object.freeze({project:Object.freeze({x:Object.freeze({...recent})})});
    const before=JSON.stringify({data,runtime});
    model.counts(model.registry(data,runtime),now);
    expect(JSON.stringify({data,runtime})).toBe(before);
  });
});

describe('safe links and useful search',()=>{
  it.each(['javascript:alert(1)','data:text/html,test','file:///tmp/test','https://user:secret@example.com','invalid'])('rejects unsafe link %s',url=>expect(model.safeUrl(url)).toBeNull());
  it('preserves private-network URLs without replacing their host or port',()=>expect(model.safeUrl('http://100.116.69.101:3000/')).toBe('http://100.116.69.101:3000/'));
  it('does not offer a repository as if it were the deployed application',()=>expect(model.primaryLink({item:{repo_url:'https://github.com/example/project'}})).toBeNull());
  it('uses the exact deployed destination',()=>expect(model.primaryLink({item:{deploy_url:'https://example.com/app#inbox'}}).url).toBe('https://example.com/app#inbox'));
  it('matches Arabic without diacritics or alif variants',()=>expect(model.matches({title:'إِدارة المُشْرُوع',arg:'',item:{}},'ادارة المشروع')).toBe(true));
  it('requires every search word and supports file paths',()=>{
    const row={title:'BRIX',arg:'',item:{local_path:'/Projects/hotel-app'}};
    expect(model.matches(row,'brix hotel')).toBe(true);
    expect(model.matches(row,'brix missing')).toBe(false);
  });
});

describe('server snapshot freshness',()=>{
  it('does not claim a missing snapshot is healthy',()=>expect(model.health(null,now).state).toBe('unknown'));
  it('reports recent available evidence',()=>expect(model.health({checked_at:'2026-10-03T11:59:00Z',ok:true,reachable:true},now).state).toBe('ok'));
  it('does not show old green results as current availability',()=>expect(model.health({checked_at:'2026-10-03T11:00:00Z',ok:true,reachable:true},now).state).toBe('stale'));
  it('requires both reachability and successful checks',()=>expect(model.health({checked_at:'2026-10-03T11:59:00Z',ok:true,reachable:false},now).state).toBe('warn'));
});

describe('Western digits on every surface',()=>{
  it.each(['٠١٢٣٤٥٦٧٨٩','۰۱۲۳۴۵۶۷۸۹','0123456789'])('normalizes %s without losing zero',value=>expect(model.latinDigits(value)).toBe('0123456789'));
  it('formats Arabic dates and quantities with Western digits',()=>{
    const number=new Intl.NumberFormat(model.LOCALE).format(1345.67);
    const date=new Intl.DateTimeFormat(model.LOCALE,{year:'numeric',day:'numeric',month:'long',timeZone:'Europe/Istanbul'}).format(now);
    expect(number+date).not.toMatch(/[\u0660-\u0669\u06f0-\u06f9]/);
    expect(number).toContain('1'); expect(date).toContain('2026');
  });
  it('keeps search compatible with either numeral input',()=>expect(model.normalize('مهمة ١٢')).toBe(model.normalize('مهمة 12')));
  it('uses Western digits throughout the current inventory',()=>expect(JSON.stringify(inventory)).not.toMatch(/[\u0660-\u0669\u06f0-\u06f9]/));
});

describe('every entity has a page and valid relationships',()=>{
  const rows=model.registry(inventory);
  it.each(rows.map(row=>[row.key,row]))('round-trips the page for %s',(_key,row)=>{
    const [page,encoded]=model.route(row).split('/');
    expect(model.resolve(rows,decodeURIComponent(encoded),page)?.key).toBe(row.key);
  });
  it('finds every declared relationship, company and department',()=>{
    for(const row of rows) {
      for(const name of model.references(row.item)) expect(model.resolve(rows,name),`${row.key}: ${name}`).toBeTruthy();
      if(row.item.parent) expect(inventory.UMBRELLAS.some(x=>x.id===row.item.parent),row.key).toBe(true);
      if(row.item.department) expect(inventory.DEPARTMENTS.some(x=>x.id===row.item.department),row.key).toBe(true);
    }
  });
  it('distinguishes a platform from a same-named tool',()=>{
    expect(model.resolve(rows,'cloud:supabase')?.key).toBe('cloud:supabase');
    expect(model.resolve(rows,'tool:supabase-mcp')?.key).toBe('tool:supabase-mcp');
    const brix=rows.find(row=>row.id==='brix-travel-system');
    const related=model.related(rows,brix);
    expect(related.some(row=>row.key==='cloud:github')).toBe(true);
    expect(related.some(row=>row.key==='cloud:supabase')).toBe(true);
    expect(model.related(rows,rows.find(row=>row.key==='cloud:supabase')).some(row=>row.key===brix.key)).toBe(true);
  });
  it('has no self links or duplicated related items',()=>{
    for(const row of rows) {
      const related=model.related(rows,row);
      expect(new Set(related.map(x=>x.key)).size).toBe(related.length);
      expect(related.some(x=>x.key===row.key)).toBe(false);
    }
  });
  it('does not label the removed bot as active',()=>expect(inventory.BOT.find(x=>x.id==='brixprice-bot').st).not.toBe('a'));
});

describe('operational checks do not overclaim',()=>{
  const runtime=require('./runtime-sync.js');
  it.each(['failure','cancelled','timed_out','skipped',null])('does not call a %s execution successful',conclusion=>expect(runtime.workflowResult({status:'completed',conclusion}).verification_status).not.toBe('ok'));
  it('distinguishes running work from passed work',()=>expect(runtime.workflowResult({status:'in_progress',conclusion:null}).verification_status).toBe('warn'));
  it('reports the actual successful run and its time',()=>expect(runtime.workflowResult({status:'completed',conclusion:'success',createdAt:'2026-10-03',url:'https://github.com/example/run'})).toMatchObject({verification_status:'ok',facts:['run: https://github.com/example/run','started: 2026-10-03','result: success']}));
  it('does not invent a run when no result is returned',()=>expect(runtime.workflowResult(null).verification_status).toBe('manual'));
});

describe('staff form produces valid review data, not a saved employee',()=>{
  const survey=require('./survey-model.js');
  const input={name:'ربيع "اختبار"',phone:'+٩٠ ٥٣٥ ١٢٣ ٤٥٦٧',department:'easybooking',role:'مبيعات'};
  it('retains Arabic names and quotes in valid serialized data',()=>{
    const result=survey.member(input,'test-id');
    expect(JSON.parse(JSON.stringify(result)).name).toBe(input.name);
    expect(result.id).toBe('member-test-id');
  });
  it('normalizes phone digits before removing punctuation',()=>{
    const result=survey.member(input,'test-id');
    expect(result.phone).toBe('+905351234567');expect(result.whatsapp).toBe('905351234567');
  });
  it.each(['brix-b2b','easybooking','rihlaty'])('maps department %s to current projects',department=>{
    const result=survey.member({...input,department},'test-id');
    expect(inventory.DEPARTMENTS.some(d=>d.id===result.department)).toBe(true);
    expect(result.assigned_projects.every(id=>inventory.PRJ.some(p=>p.id===id))).toBe(true);
  });
  it('rejects unknown departments and invalid phones',()=>{
    expect(()=>survey.member({...input,department:'missing'},'test-id')).toThrow();
    expect(()=>survey.member({...input,phone:'١٢'},'test-id')).toThrow();
  });
});
