import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function workspace() {
  const handlers = {};
  const frames = [];
  class Element {
    constructor(attributes = {}) { this.attributes = attributes; }
    closest(selector) { return selector === '[data-action]' ? this : null; }
    getAttribute(name) { return this.attributes[name] ?? null; }
    matches(selector) { return selector === 'a[href]' && !!this.attributes.href; }
  }
  const context = {
    console, URL, Intl, Date, Element,
    setTimeout:vi.fn(), setInterval:vi.fn(), clearInterval:vi.fn(),
    requestAnimationFrame:fn=>frames.push(fn),
    location:{hash:'#home',href:'http://localhost/#home'}, history:{replaceState:vi.fn()},
    localStorage:{getItem:()=>null, removeItem:vi.fn()},
    document:{
      documentElement:{removeAttribute:vi.fn(),classList:{add:vi.fn(),remove:vi.fn()}},
      activeElement:null,
      addEventListener:(type,fn)=>(handlers[type] ??= []).push(fn),
      querySelector:()=>null,querySelectorAll:()=>[],getElementById:()=>null,
    },
    window:{addEventListener:vi.fn(),scrollTo:vi.fn()},
    MutationObserver:class { observe() {} },
  };
  vm.createContext(context);
  for(const file of ['data.js','workspace-model.js','workspace-content.js','relationship-view.js','app.js','workspace.js','workspace-relations.js','workspace-context.js','workspace-projects.js','workspace-catalogs.js','workspace-detail.js','workspace-domains.js']) {
    vm.runInContext(readFileSync(new URL(file,import.meta.url),'utf8'),context,{filename:file});
  }
  return { context, handlers, frames, run:code=>vm.runInContext(code,context) };
}

describe('real workspace event handlers',()=>{
  it('Escape never destroys the current detail page',()=>{
    const {context,handlers}=workspace();
    context.closeDetail=vi.fn(); context.closeSearch=vi.fn(); context.closeMore=vi.fn();
    handlers.keydown.forEach(fn=>fn({key:'Escape'}));
    expect(context.closeDetail).not.toHaveBeenCalled();
    expect(context.closeSearch).toHaveBeenCalledOnce();
    expect(context.closeMore).toHaveBeenCalledOnce();
  });
  it.each(['metaKey','ctrlKey','shiftKey','altKey'])('preserves browser link behavior with %s',modifier=>{
    const {context,handlers}=workspace();
    context.go=vi.fn();
    const event={target:new context.Element({'data-action':'goPage','data-arg':'projects',href:'#projects'}),button:0,[modifier]:true,preventDefault:vi.fn(),stopPropagation:vi.fn()};
    handlers.click[0](event);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(context.go).not.toHaveBeenCalled();
  });
  it('ordinary link activation navigates once',()=>{
    const {context,handlers}=workspace(); context.go=vi.fn();
    const event={target:new context.Element({'data-action':'goPage','data-arg':'projects',href:'#projects'}),button:0,preventDefault:vi.fn(),stopPropagation:vi.fn()};
    handlers.click[0](event);
    expect(context.go).toHaveBeenCalledExactlyOnceWith('projects');
  });
  it.each(['SELECT','INPUT','TEXTAREA'])('does not hijack slash while using %s',tagName=>{
    const {context,handlers}=workspace(); context.openSearch=vi.fn();
    context.document.activeElement={tagName};
    handlers.keydown.forEach(fn=>fn({key:'/',preventDefault:vi.fn()}));
    expect(context.openSearch).not.toHaveBeenCalled();
  });
  it('does not hijack slash inside editable content',()=>{
    const {context,handlers}=workspace(); context.openSearch=vi.fn();
    context.document.activeElement={tagName:'DIV',isContentEditable:true};
    handlers.keydown.forEach(fn=>fn({key:'/',preventDefault:vi.fn()}));
    expect(context.openSearch).not.toHaveBeenCalled();
  });
});

describe('independent presentation system',()=>{
  it('has a distinct complete composition for all 13 reviewed projects',()=>{
    const {run}=workspace();
    expect(run("wsRegistry().filter(row=>row.kind==='project').length")).toBe(13);
    expect(run("new Set(Object.values(WorkspaceContent.projects).map(p=>p.theme)).size")).toBe(13);
    expect(run("wsRegistry().filter(row=>row.kind==='project').every(row=>{const p=WorkspaceContent.profile(row); return p.source && p.next && p.caution && p.areas.length && p.steps.length && typeof WS_PROJECT_SCENES[p.theme]==='function';})")).toBe(true);
    expect(run("wsRegistry().filter(row=>row.kind==='project').every(row=>{const html=wsProjectContent(row);return html.indexOf('id=\"detail-resources\"')<html.indexOf('id=\"detail-connections\"');})")).toBe(true);
  });
  it('renders complete detail contents for every recorded entity without changing source data',()=>{
    const {run}=workspace();
    const before=run('JSON.stringify([PRJ,SVC,BOT,TL,CLD,ARC,IDEAS,TEAM,AUTO])');
    expect(run("wsRegistry().every(row=>{const html=wsEntityContent(row);return html.includes('ws-detail-section')&&!html.includes('undefined')&&!html.includes('[object Object]');})")).toBe(true);
    expect(run('JSON.stringify([PRJ,SVC,BOT,TL,CLD,ARC,IDEAS,TEAM,AUTO])')).toBe(before);
  });
  it('keeps unknown projects readable without pretending their descriptions were reviewed',()=>{
    const {run}=workspace();
    expect(run("wsProjectContent({kind:'project',id:'future',key:'project:future',item:{},title:'مشروع جديد'}).includes('لم يُراجع هذا الوصف')")).toBe(true);
  });
  it('reviews every tool, platform, bot, archive and proposal individually',()=>{
    const {run}=workspace();
    expect(run("wsRegistry().filter(row=>['tool','cloud','bot','archive'].includes(row.kind)).every(row=>WorkspaceContent.note(row)?.length===2)")).toBe(true);
    expect(run("wsRegistry().filter(row=>row.kind==='idea').every(row=>WorkspaceContent.proposal(row)?.sections.length>0)")).toBe(true);
  });
  it('does not render raw historic claims in notes or search',()=>{
    const {run}=workspace();
    run("PRJ[0].desc='UNVERIFIED_HISTORIC_ASSERTION'; TL[0].desc='UNVERIFIED_HISTORIC_ASSERTION'; IDEAS[0].desc='UNVERIFIED_HISTORIC_ASSERTION'");
    expect(run("wsRegistry().map(wsEntityContent).join('').includes('UNVERIFIED_HISTORIC_ASSERTION')")).toBe(false);
    expect(run("_buildSearchIndex().some(row=>row.tokens.includes('unverified_historic_assertion'))")).toBe(false);
  });
  it('defines presentation for every existing section',()=>{
    const {run}=workspace();
    expect(run('Object.keys(WS_PAGES).every(page=>WS_PRESENTATION[page]?.tone && WS_PRESENTATION[page]?.label)')).toBe(true);
  });
  it('uses distinct defaults for products and operational records',()=>{
    const {run}=workspace();
    expect(run("wsLayout('projects')")).toBe('grid');
    expect(run("wsLayout('team')")).toBe('grid');
    expect(run("wsLayout('server')")).toBe('list');
    expect(run("wsLayout('auto')")).toBe('list');
  });
  it('preserves saved user layout choices',()=>{
    const {run}=workspace();
    run("wsPreferences={pinned:[],layouts:{projects:'list',server:'grid'}}");
    expect(run("wsLayout('projects')")).toBe('list');
    expect(run("wsLayout('server')")).toBe('grid');
  });
  it('renders every entity in both modes with the same canonical link',()=>{
    const {run}=workspace();
    expect(run("wsRegistry().every(row=>[false,true].every(card=>wsListRow(row,card).includes('href=\"#'+E(WorkspaceModel.route(row))+'\"')))")).toBe(true);
  });
  it('uses only declared colors and keeps source records immutable',()=>{
    const {run}=workspace();
    const before=run('JSON.stringify([PRJ,SVC,BOT,TL,CLD,ARC,IDEAS,TEAM,AUTO])');
    expect(run("wsRegistry().every(row=>['blue','teal','green','violet','rose','coral','orange','amber','graphite'].includes(wsTone(row)))")).toBe(true);
    run('wsRegistry().forEach(row=>wsListRow(row,true))');
    expect(run('JSON.stringify([PRJ,SVC,BOT,TL,CLD,ARC,IDEAS,TEAM,AUTO])')).toBe(before);
  });
  it('does not load the conflicting legacy stylesheet',()=>{
    const html=readFileSync(new URL('index.html',import.meta.url),'utf8');
    expect(html).not.toMatch(/href="style\.css/);
    expect(html).toMatch(/href="workspace\.css/);
  });
  it('uses a separate renderer for each catalog section',()=>{
    const {run}=workspace();
    expect(run('new Set(Object.values(WS_CATALOG_RENDERERS)).size')).toBe(9);
    expect(run("Object.keys(WS_PAGES).filter(page=>WS_PAGES[page].kind).every(page=>typeof WS_CATALOG_RENDERERS[page]==='function')")).toBe(true);
  });
  it('retains every canonical entity link in its domain composition',()=>{
    const {run}=workspace();
    expect(run("Object.keys(WS_CATALOG_RENDERERS).every(page=>{const rows=wsRegistry().filter(row=>row.page===page); const html=wsCatalogBody(page,rows,false);return rows.every(row=>html.includes('data-entity-key=\"'+E(row.key)+'\"')&&html.includes('href=\"#'+E(WorkspaceModel.route(row))+'\"'));})")).toBe(true);
  });
  it('only offers layout controls where two layouts are implemented',()=>{
    const {run}=workspace();
    expect(run("Object.keys(WS_CATALOG_RENDERERS).every(page=>wsToolbar(page,wsRegistry().filter(row=>row.page===page)).includes('data-ws-layout')===(page==='projects'))")).toBe(true);
  });
  it('keeps domain rendering immutable and preserves filtered membership',()=>{
    const {run}=workspace();
    const before=run('JSON.stringify([PRJ,SVC,BOT,TL,CLD,ARC,IDEAS,TEAM,AUTO])');
    expect(run("Object.keys(WS_CATALOG_RENDERERS).every(page=>{const rows=wsRegistry().filter(row=>row.page===page).slice(0,1);const html=wsCatalogBody(page,rows,false);return (html.match(/data-entity-key=/g)||[]).length===rows.length;})")).toBe(true);
    expect(run('JSON.stringify([PRJ,SVC,BOT,TL,CLD,ARC,IDEAS,TEAM,AUTO])')).toBe(before);
  });
  it('provides empty states and retains every company project link',()=>{
    const {run}=workspace();
    expect(run("Object.keys(WS_CATALOG_RENDERERS).every(page=>{wsPageState[page]={query:'unmatched-000-not-a-record'};return wsCatalog(page).includes('data-ws-reset');})")).toBe(true);
    expect(run("wsRegistry().filter(row=>row.kind==='project').every(row=>wsCompanies().includes('href=\"#'+E(WorkspaceModel.route(row))+'\"'))")).toBe(true);
  });
});

describe('search and history remain on the correct route',()=>{
  it('remembers separate expanded sources rather than only the first source in a section',()=>{
    const {context,run}=workspace();
    context.document.querySelectorAll=()=>[{open:false},{open:true},{open:false},{open:true}];
    context.window.scrollY=412;
    run("wsActiveRoute='tools/Tailscale'; wsRememberView()");
    expect(run("wsPositions.get('tools/Tailscale').expanded")).toEqual([1,3]);
    expect(run("wsPositions.get('tools/Tailscale').y")).toBe(412);
  });
  it('search has one canonical entry and route for every entity',()=>{
    const {run}=workspace();
    expect(run('_buildSearchIndex().length')).toBe(run('wsRegistry().length'));
    expect(run('new Set(_buildSearchIndex().map(row=>row.id)).size')).toBe(run('wsRegistry().length'));
    expect(run('_buildSearchIndex().every(row=>row.route===WorkspaceModel.route(wsRegistry().find(entity=>entity.key===row.id)))')).toBe(true);
  });
  it('opens a search result immediately without an intermediate page or timer',()=>{
    const {context,run}=workspace();
    context.go=vi.fn();context.wsShowDetail=vi.fn();context.closeSearch=vi.fn();
    context.setTimeout.mockClear();
    run('SEARCH_INDEX=_buildSearchIndex(); selectSearchResult(SEARCH_INDEX[0].id)');
    expect(context.wsShowDetail).toHaveBeenCalledOnce();
    expect(context.go).not.toHaveBeenCalled();
    expect(context.setTimeout).not.toHaveBeenCalled();
  });
  it('closes overlays and normalizes an invalid deep link',()=>{
    const {context,run}=workspace();
    context.location.hash='#projects/%E0%A4%A';
    context.wsRememberView=vi.fn();context.wsCloseOverlay=vi.fn();context.closeDetail=vi.fn();
    context._activatePage=vi.fn();context.wsRestoreView=vi.fn();context.ccToast=vi.fn();
    run('wsFollowLocation()');
    expect(context.wsCloseOverlay).toHaveBeenCalledOnce();
    expect(context.history.replaceState).toHaveBeenCalledWith(undefined,'','#projects');
  });
  it('a queued scroll restoration cannot move a newer page',()=>{
    const {context,run,frames}=workspace();
    run("wsActiveRoute='projects'; wsPositions.set('projects',{y:700}); wsRestoreView('projects'); wsActiveRoute='home'");
    frames.forEach(fn=>fn());
    expect(context.window.scrollTo).not.toHaveBeenCalled();
  });
  it('restores the saved position for the current route',()=>{
    const {context,run,frames}=workspace();
    run("wsActiveRoute='projects'; wsPositions.set('projects',{y:700}); wsRestoreView('projects')");
    frames.forEach(fn=>fn());
    expect(context.window.scrollTo).toHaveBeenCalledWith({top:700,behavior:'instant'});
  });
});

describe('context-specific resources and relationship views',()=>{
  it('preserves canonical link roles when the same URL is repeated in references',()=>{
    const {run}=workspace();
    expect(run("WorkspaceContext.resources({item:{repo_url:'https://github.com/a/b',links:{GitHub:'https://github.com/a/b'}}}).links")).toEqual([{label:'المستودع',value:'https://github.com/a/b',kind:'source',link:true}]);
  });
  it('classifies real storage locations, not the owning project type',()=>{
    const {run}=workspace();
    expect(run("WorkspaceContext.pathKind('/srv/app','server_path')")).toBe('server');
    expect(run("WorkspaceContext.pathKind('/Users/r/Library/Mobile Documents/app','local_path')")).toBe('cloud');
    expect(run("WorkspaceContext.pathKind('~/.config/app.json','config_paths')")).toBe('config');
    expect(run("WorkspaceContext.pathKind('/Users/r/Developer/app','local_path')")).toBe('local');
  });
  it('does not overwrite an explicit server location with its generic path alias',()=>{
    const {run}=workspace();
    expect(run("WorkspaceContext.resources({item:{server_path:'/srv/app',path:'/srv/app'}}).files")).toEqual([{value:'/srv/app',kind:'server',link:false,label:'على الخادم'}]);
  });
  it('keeps every safe resource and exact copyable path for all entities',()=>{
    const {run}=workspace();
    expect(run(`wsRegistry().every(row=>{
      const result=WorkspaceContext.resources(row), html=wsDomainResources(row);
      const paths=['local_path','server_path','path','config_paths'].flatMap(field=>[row.item[field]||[]].flat()).filter(value=>typeof value==='string');
      const urls=[row.item.deploy_url,row.item.repo_url,row.item.lk,...Object.values(row.item.links||{})].filter(WorkspaceModel.safeUrl);
      return paths.every(value=>result.files.some(f=>f.value===value)&&html.includes('data-ws-copy="'+E(value)+'"')) && urls.every(value=>result.links.some(l=>l.value===value)&&html.includes('href="'+E(WorkspaceModel.safeUrl(value))+'"'));
    })`)).toBe(true);
  });
  it('retains every relationship and its recorded source without inventing peers',()=>{
    const {run}=workspace();
    expect(run(`wsRegistry().every(row=>{
      const {rows,graph}=wsRelations(), original=RelationshipView.groups(rows,row,graph);
      const groups=WorkspaceContext.sections(rows,row,graph), edges=groups.flatMap(g=>g.edges), html=wsDomainConnections(row);
      return edges.length===original.length && edges.every(edge=>original.some(old=>old.other.key===edge.other.key) && html.includes('data-peer="'+E(edge.other.key)+'"') && html.includes('href="#'+E(WorkspaceModel.route(edge.other))+'"') && edge.sources.every(source=>html.includes(E(source.label))));
    })`)).toBe(true);
  });
  it('uses nine distinct compositions and the actual project theme',()=>{
    const {run}=workspace();
    expect(run('new Set(Object.values(WS_CONTEXT_LAYOUTS)).size')).toBe(9);
    expect(run("wsRegistry().filter(r=>r.kind==='project').every(row=>!WorkspaceContext.sections(...[wsRelations().rows,row,wsRelations().graph]).length || wsDomainConnections(row).includes('data-pattern=\"'+WorkspaceContent.profile(row).theme+'\"'))")).toBe(true);
  });
  it('does not mutate inventory while rendering every overview and detail',()=>{
    const {run}=workspace();
    const before=run('JSON.stringify([PRJ,SVC,BOT,TL,CLD,ARC,IDEAS,TEAM,AUTO])');
    run('wsRegistry().forEach(row=>{wsDomainResources(row);wsDomainConnections(row)});wsDomainHome();wsDomainPaths()');
    expect(run('JSON.stringify([PRJ,SVC,BOT,TL,CLD,ARC,IDEAS,TEAM,AUTO])')).toBe(before);
  });
  it('filters paths by explicit storage kind without losing the search text',()=>{
    const {run}=workspace();
    run("wsPathScope='server';wsPageState.map={query:''}");
    expect(run("wsDomainPaths().includes('data-storage=\"local\"')")).toBe(false);
    expect(run("wsDomainPaths().includes('data-storage=\"server\"')")).toBe(true);
    run("wsPageState.map={query:'not-a-path-000'}");
    expect(run("wsDomainPaths().includes('لا توجد مسارات مطابقة')")).toBe(true);
  });
  it('updates the real path register while retaining focus in the search box',()=>{
    const {context,run}=workspace();
    class Input { constructor(){this.dataset={wsQuery:'map'};} }
    context.HTMLInputElement=Input;
    context.document.activeElement=new Input();
    const next={},replaceWith=vi.fn();
    context.document.getElementById=()=>({querySelector:selector=>selector==='.context-path-register'?{replaceWith}:null});
    context.document.createElement=()=>({content:{querySelector:selector=>selector==='.context-path-register'?next:null}});
    run("wsRender('map')");
    expect(replaceWith).toHaveBeenCalledExactlyOnceWith(next);
    expect(context.document.activeElement).toBeInstanceOf(Input);
  });
  it('keeps restoration history scoped to the current detail',()=>{
    const {run}=workspace();
    run("wsPositions.set('tools/a',{expanded:[1,3]});wsPositions.set('tools/b',{expanded:[0]})");
    expect(run("wsPositions.get('tools/a').expanded")).toEqual([1,3]);
  });
});

describe('health refresh reports failures honestly',()=>{
  it.each([null,[],{}, {checked_at:'bad'}])('rejects an invalid snapshot %j',async payload=>{
    const {context}=workspace(); context.fetch=async()=>({ok:true,json:async()=>payload});
    expect(await context._loadHealthData()).toBe(false);
  });
  it('reports a failed request instead of announcing success',async()=>{
    const {context}=workspace(); context.fetch=async()=>({ok:false});
    expect(await context._loadHealthData()).toBe(false);
  });
});

describe('runtime refresh retains the last good snapshot on malformed data',()=>{
  it.each([null,[],{}, {generated_at:'2026-10-03T12:00:00Z',project:[]}])('rejects incomplete data %j',async payload=>{
    const {context,run}=workspace();
    run("RUNTIME_STATE.generated_at='2026-10-03T11:00:00Z'");
    context.fetch=async()=>({ok:true,json:async()=>payload});
    expect(await context._loadRuntimeData()).toBe(false);
    expect(run('RUNTIME_STATE.generated_at')).toBe('2026-10-03T11:00:00Z');
  });
});
