import {describe,it,expect} from 'vitest';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {redact,toolEvidence,networkEvidence}=require('./runtime-evidence.js');
const {buildRecord}=require('./runtime-sync.js');
describe('public operational evidence',()=>{
  it('removes identity links, URL tokens and bearer credentials recursively without mutation',()=>{
    const input={facts:['https://login.tailscale.com/a/test-secret','https://app.test/?token=test-token&safe=yes','Bearer sample-secret'],other:{x:'unchanged'}};
    const result=redact(input);
    expect(JSON.stringify(result)).not.toMatch(/test-secret|test-token|sample-secret/);
    expect(result.other.x).toBe('unchanged');
    expect(input.facts[0]).toContain('test-secret');
  });
  it('sanitizes before hashing and publishing records',()=>{
    const result=buildRecord('tool','x',null,{summary:'https://login.tailscale.com/a/test-secret',facts:[]},'7d');
    expect(result.summary).not.toContain('test-secret');
  });
  it('does not call a disabled configured tool broken or running',()=>{
    expect(toolEvidence('memory',{claude:{},codex:[{name:'memory',enabled:false}]})).toMatchObject({verification_status:'manual',summary:expect.stringContaining('معطلة')});
  });
  it('does not treat a permission as proof of connectivity',()=>expect(toolEvidence('perplexity',{claude:{},codex:[]},true).verification_status).toBe('manual'));
  it('does not treat an enabled definition as a successful connection',()=>expect(toolEvidence('memory',{claude:{memory:{}},codex:null}).verification_status).toBe('manual'));
  it('distinguishes unavailable config readers from successful tool checks',()=>expect(toolEvidence('magic',{claude:null,codex:null}).verification_status).toBe('manual'));
  it('checks actual network status independently from administrative login',()=>{
    expect(networkEvidence({BackendState:'Running',Self:{Online:true}}).verification_status).toBe('ok');
    expect(networkEvidence({BackendState:'NeedsLogin',Self:{Online:false}}).verification_status).toBe('warn');
    expect(networkEvidence(null).verification_status).toBe('warn');
  });
});
