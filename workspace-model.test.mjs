import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const model = require('./workspace-model.js');
const now = Date.parse('2026-10-03T12:00:00Z');
const recent = { verification_status:'ok', verified_at:'2026-10-03T11:00:00Z' };
const inventory = vm.runInNewContext(readFileSync(new URL('./data.js',import.meta.url),'utf8') + '\n({PG,PRJ,SVC,BOT,TL,CLD,ARC,IDEAS,TEAM,AUTO})');

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
