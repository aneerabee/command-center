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
    location:{hash:'#home'}, history:{replaceState:vi.fn()},
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
  for(const file of ['data.js','workspace-model.js','app.js','workspace.js','workspace-detail.js']) {
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

describe('search and history remain on the correct route',()=>{
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
