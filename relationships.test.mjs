import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require=createRequire(import.meta.url);
const model=require('./workspace-model.js');
const inventory=vm.runInNewContext(readFileSync(new URL('data.js',import.meta.url),'utf8')+';({PRJ,SVC,BOT,TL,CLD,ARC,IDEAS,TEAM,AUTO})');
const rows=model.registry(inventory);
const graph=model.relationshipGraph(rows);
const view=vm.runInNewContext(readFileSync(new URL('relationship-view.js',import.meta.url),'utf8')+';RelationshipView',{WorkspaceModel:model});

describe('typed relationship contract',()=>{
  it('resolves every current reference uniquely within its declared kind',()=>expect(graph.issues).toEqual([]));
  it('includes previously hidden tool usage with consumer-to-resource direction',()=>{
    expect(graph.edges).toContainEqual(expect.objectContaining({from:'project:meta-mcp',to:'tool:github-tool',kind:'used_in',directed:true}));
  });
  it('includes the vault as an active reference to a bot, not an invented project',()=>{
    expect(model.connections(rows,rows.find(row=>row.key==='archive:vault'),graph)).toContainEqual(expect.objectContaining({other:expect.objectContaining({key:'bot:tron-address-bot'}),state:'recorded'}));
  });
  it('does not silently choose between duplicate names',()=>{
    const data={PRJ:[{id:'x',name:'Same'}],TL:[{id:'x',name:'Same'}],CLD:[{id:'c',name:'Cloud',used_in:['Same']}]};
    const result=model.relationshipGraph(model.registry(data));
    expect(result.edges).toEqual([]);
    expect(result.issues).toEqual([{owner:'cloud:c',field:'used_in',value:'Same',reason:'ambiguous'}]);
  });
  it('rejects a bot in a project-only field even when its name exists',()=>{
    const result=model.relationshipGraph(model.registry({BOT:[{id:'b',name:'Bot'}],ARC:[{id:'a',name:'Archive',related_projects:['Bot']}]}));
    expect(result.edges).toEqual([]);expect(result.issues[0].reason).toBe('missing');
  });
  it('resolves an explicit key in a mixed-kind usage field',()=>{
    const result=model.relationshipGraph(model.registry({PRJ:[{id:'x',name:'Same'}],TL:[{id:'x',name:'Same',used_in:['project:x']}]}));
    expect(result.issues).toEqual([]);expect(result.edges[0].from).toBe('project:x');
  });
  it('does not invent dependency direction for generic associations',()=>{
    expect(graph.edges.filter(edge=>edge.kind==='association').every(edge=>!edge.directed)).toBe(true);
  });
  it('does not call a child project a service',()=>{
    const edge=graph.edges.find(edge=>edge.from==='project:meta-mcp' && edge.kind==='parent_project');
    expect(edge.to).toBe('project:easybooking');
    expect(view.phrase(edge,rows).meaning).toBe('تابع للمشروع');
    expect(view.flow(edge,rows,'#')).not.toContain('خدمة تابعة');
  });
  it('preserves source provenance and eliminates duplicate pair records',()=>{
    const result=model.relationshipGraph(model.registry({PRJ:[{id:'a',name:'A',related_projects:['B']},{id:'b',name:'B',related_projects:['A']}]}));
    expect(result.edges).toHaveLength(1);expect(result.edges[0].sources).toHaveLength(2);
  });
  it('shows inverse connections without reversing their meaning',()=>{
    const edge=graph.edges.find(edge=>edge.kind==='assigned_projects');
    for(const key of [edge.from,edge.to]) expect(model.connections(rows,rows.find(row=>row.key===key),graph)).toContainEqual(expect.objectContaining({from:edge.from,to:edge.to}));
  });
  it('marks inactive platforms and disabled tasks as historical',()=>{
    for(const row of rows.filter(row=>row.item.active===false || row.kind==='automation' && row.item.on===false)) {
      expect(model.connections(rows,row,graph).every(edge=>['historical','proposed'].includes(edge.state)),row.key).toBe(true);
    }
  });
  it('never turns an idea into an implemented dependency',()=>{
    for(const row of rows.filter(row=>row.kind==='idea')) expect(model.connections(rows,row,graph).every(edge=>edge.state==='proposed')).toBe(true);
  });
  it('remains symmetric, has no self-links, and does not mutate source data',()=>{
    const before=JSON.stringify(inventory);
    for(const row of rows) for(const other of model.related(rows,row)) {
      expect(other.key).not.toBe(row.key);
      expect(model.related(rows,other).some(back=>back.key===row.key)).toBe(true);
    }
    expect(JSON.stringify(inventory)).toBe(before);
  });
});

describe('truthful diagrams and accessible routes',()=>{
  it('defines every visual token used by the diagrams and their sections',()=>{
    const css=readFileSync(new URL('workspace.css',import.meta.url),'utf8');
    const defined=new Set([...css.matchAll(/(--[a-z-]+)\s*:/g)].map(match=>match[1]));
    for(const [,token] of css.matchAll(/var\((--[a-z-]+)/g)) expect(defined.has(token),token).toBe(true);
  });
  it('renders every connection as a canonical route in both surfaces',()=>{
    for(const row of rows) for(const prefix of ['#','index.html#']) {
      const html=view.render(rows,row,{prefix,graph});
      for(const other of model.related(rows,row)) expect(html).toContain(prefix+model.route(other));
    }
  });
  it('does not repeat a pair when usage and generic references coexist',()=>{
    const row=rows.find(row=>row.key==='project:brix-travel-system');
    const groups=view.groups(rows,row,graph);
    expect(new Set(groups.map(edge=>edge.other.key)).size).toBe(groups.length);
    expect(groups.find(edge=>edge.other.key==='cloud:github').sources.length).toBeGreaterThan(1);
  });
  it('explains missing data without claiming independence',()=>{
    const data=model.registry({PRJ:[{id:'x',name:'X',related_projects:['Missing']}]});
    const html=view.render(data,data[0]);
    expect(html).toContain('تحتاج تصحيحًا');expect(html).toContain('لا يثبت أنه مستقل');
  });
  it('escapes names and never treats inventory text as markup',()=>{
    const data=model.registry({PRJ:[{id:'a',name:'<img src=x onerror=alert(1)>',related_projects:['B']},{id:'b',name:'B'}]});
    const html=view.render(data,data[0]);
    expect(html).not.toContain('<img');expect(html).toContain('&lt;img');
  });
  it('keeps proposed and historical labels visible independently of motion',()=>{
    for(const state of ['historical','proposed']) {
      const edge=graph.edges.find(edge=>edge.state===state);
      const html=view.render(rows,rows.find(row=>row.key===edge.from),{graph});
      expect(html).toContain(view.STATES[state]);
    }
  });
});

describe('finite motion with reduced-motion support',()=>{
  function setup(reducedMotion=false) {
    const animate=vi.fn(),cancel=vi.fn(),handlers={},media={matches:reducedMotion,addEventListener:vi.fn()};
    const nodes=[{animate},{animate}];
    const flow={isConnected:true,animate,getAnimations:()=>[{cancel}],querySelector:()=>({animate}),querySelectorAll:()=>nodes};
    const context={matchMedia:()=>media,window:{},document:{body:{},querySelectorAll:()=>[flow],addEventListener:(type,fn)=>handlers[type]=fn},MutationObserver:class{observe(){}},requestAnimationFrame:vi.fn()};
    vm.runInNewContext(readFileSync(new URL('relationship-motion.js',import.meta.url),'utf8'),context);
    return {animate,cancel,media};
  }
  it('uses finite opacity and transform animation only',()=>{
    const {animate}=setup();expect(animate).toHaveBeenCalledTimes(3);
    for(const [frames,options] of animate.mock.calls) {
      expect(options.iterations).toBeUndefined();expect(options.duration).toBeLessThan(1000);
      expect(frames.every(frame=>Object.keys(frame).every(key=>['opacity','transform'].includes(key)))).toBe(true);
    }
  });
  it('does not animate when reduced motion is requested',()=>expect(setup(true).animate).not.toHaveBeenCalled());
  it('cancels existing motion when the preference changes',()=>{
    const {media,cancel}=setup();cancel.mockClear();media.matches=true;media.addEventListener.mock.calls[0][1]();expect(cancel).toHaveBeenCalledOnce();
  });
});
