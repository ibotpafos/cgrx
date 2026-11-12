// Real MCP client output validation, every advertised tool, both wire profiles.
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
const binary=path.resolve(process.argv[2]??'target/release/cgrx');
const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'cgrx-contract-'));
try {
 for(const profile of ['full','token-efficient']) {
  const repo=path.join(fixture,profile);fs.mkdirSync(repo);
  fs.writeFileSync(path.join(repo,'service.ts'),'function alpha(x: number) { const p = x + 1; return p * 2; }\nfunction beta(v: number) { const q = v + 1; return q * 2; }\nexport function configuration() { const endpoint = "https://example.invalid/api"; return endpoint; }\nfunction caller() { return alpha(1) + configuration().length; }\n');
  fs.appendFileSync(path.join(repo,'service.ts'),Array.from({length:30},(_,i)=>`function caller${i}() { return alpha(${i}); }\n`).join(''));
  execFileSync('git',['init','-q',repo]);execFileSync('git',['-C',repo,'add','.']);execFileSync('git',['-C',repo,'-c','user.name=Contract','-c','user.email=contract@example.invalid','commit','-qm','fixture']);
  const client=new Client({name:'cgrx-ci-contract',version:'1'},{});
  await client.connect(new StdioClientTransport({command:binary,args:['serve','--multi-repo','--response-profile',profile],env:{...process.env,CGRX_TOOLSET:'full',CGRX_MEMORY_EMBEDDINGS:'off',CGRX_QUALITY_POLL_MS:'200',CGRX_INSTALL_PROBE:'1',CGRX_GITHUB_MCP_BRIDGE:''}}));
  const covered=new Set();let tools;let expectedErrors=0;
  const invoke=async(name,args={},allowError=null)=>{
   assert.ok(tools.some(t=>t.name===name),`tool ${name} absent`);covered.add(name);
   try {
    const result=await client.callTool({name,arguments:{repo,...args}});
    assert.equal(result.isError??false,false,`${name}: unexpected tool error`);
    assert.ok(result.structuredContent && typeof result.structuredContent==='object'&&!Array.isArray(result.structuredContent),`${name}: missing structured object`);
    const text=JSON.parse(result.content.find(c=>c.type==='text').text);
    if(profile==='token-efficient')assert.deepEqual(result.structuredContent,text,`${name}: compact text/structured mismatch`);
    return {raw:result.structuredContent,text};
   } catch(error) {
    // Only documented fixture failures are accepted; SDK output-schema errors always fail.
    if(allowError && error.code!==-32600 && allowError(error)){expectedErrors++;return {expectedError:String(error)};}
    throw new Error(`${profile}/${name}: ${error}`,{cause:error});
   }
  };
  try {
   ({tools}=await client.listTools());assert.equal(new Set(tools.map(t=>t.name)).size,tools.length);
   for(const name of ['list_quality_candidates','get_candidate_details','prepare_candidate_patch','get_quality_index_status','update_quality_candidate_status'])assert.ok(tools.some(t=>t.name===name),`missing required ${name}`);
   for(const t of tools){assert.equal(t.outputSchema?.type,'object');assert.ok(t.inputSchema.required?.includes('repo'));}
   await invoke('status');await invoke('search_graph',{query:'alpha',language:'typescript'});await invoke('get_outline',{path:'service.ts'});
   await invoke('get_architecture',{scope:'**',limit:10});await invoke('trace_path',{symbol:'alpha',path:'service.ts',direction:'callers',depth:1,limit:10});await invoke('find_usages',{symbol:'alpha',path:'service.ts',limit:10});
   await invoke('get_code_snippet',{symbol:'alpha',path:'service.ts'});await invoke('explain_symbol',{symbol:'alpha',path:'service.ts',scope:'**'});await invoke('detect_dead_code',{scope:'**'});
   await invoke('suggest_refactors',{limit:10,min_score:760});await invoke('check_index_coverage',{paths:['service.ts']});
   await invoke('check_framework_gates',{paths:['service.ts']});await invoke('check_security_gates',{fail_on:'none'});await invoke('scan_risks',{limit:10});await invoke('check_change_gates',{fail_on:'none',limit:10});await invoke('check_repository_gates',{scope:'**',fail_on:'none'});
   const oriented=await invoke('orient',{task:'Find alpha callers',mode:'BOUNDED',budget:400,scope:{include:['**'],exclude:[],relation_kinds:['CALLS','IMPLEMENTS'],max_depth:2}});
   const handle=oriented.raw.next_handles?.[0]??oriented.text.handle??oriented.text.next_handles?.[0]??oriented.text.next?.[0];
   await invoke('expand',{handle:handle??'missing',budget:2000},handle?null:e=>/handle/i.test(String(e))&&[-32602,-32004].includes(e.code));
   await invoke('ingest_runtime_evidence',{input_path:'missing-contract-trace.ndjson',format:'ndjson'},e=>[-32602,-32020].includes(e.code)&&e.data?.code==='cgrx.invalid_runtime_path');
   const list=await invoke('list_quality_candidates',{limit:100});const c=list.raw.candidates.find(c=>c.kind==='hardcode');assert.ok(c);
   await invoke('get_candidate_details',{candidate_id:c.id});const before=fs.readFileSync(path.join(repo,'service.ts'),'utf8');const prepared=await invoke('prepare_candidate_patch',{candidate_id:c.id});assert.equal(prepared.raw.patch_verification.diff_applied,true);assert.equal(prepared.raw.patch_verification.source_modified,false);assert.equal(prepared.raw.patch_verification.tests.status,'not_run');assert.equal(fs.readFileSync(path.join(repo,'service.ts'),'utf8'),before);
   await invoke('update_quality_candidate_status',{candidate_id:c.id,status:'confirmed',expected_version:0,reason:'CI contract fixture'});
   let background;for(let i=0;i<50;i++){background=(await invoke('get_quality_index_status')).raw;if(background.phase==='ready'&&background.fresh)break;await new Promise(r=>setTimeout(r,100));}assert.equal(background.phase,'ready');assert.equal(background.fresh,true);
   const record={fact:'Contract test fixture decision',confidence:700,source_kind:'user',source_ref:'contract://fixture/user-note',memory_kind:'semantic'};
   const saved=await invoke('memory_record',record);const id=saved.raw.record?.id??saved.raw.id??saved.text.id;assert.ok(id,JSON.stringify(saved));
   await invoke('memory_recall',{query:'Contract test fixture',limit:5});
   await invoke('memory_update',{id,expected_version:1,reason:'contract update',record:{...record,fact:'Updated contract fixture decision'}});
   await invoke('memory_forget',{id,expected_version:2});
   if(tools.some(t=>t.name==='find_similar'))await invoke('find_similar',{symbol:'alpha',path:'service.ts',scope:'**',limit:10});
   if(tools.some(t=>t.name==='find_examples'))await invoke('find_examples',{task:'Contract fixture search',queries:['language:TypeScript configuration'],limit:3},e=>[-32602,-32020].includes(e.code)&&e.data?.code==='cgrx.github_mcp_unconfigured');
   fs.writeFileSync(path.join(repo,'service.ts'),before.replace('https://example.invalid/api','configured-at-runtime'));
   await invoke('list_quality_candidates',{include_inactive:true});
   const resolved=await invoke('update_quality_candidate_status',{finding_id:c.finding_id,status:'fixed',expected_version:1,reason:'fixture endpoint removed after review'});assert.equal(resolved.raw.still_detected,false);
   assert.deepEqual([...covered].sort(),tools.map(t=>t.name).sort(),'every advertised tool needs a contract case');
   console.log(`CONTRACT_PASS profile=${profile} tools=${covered.size} expected_negative=${expectedErrors} sdk=1.25.2`);
  } finally {await client.close();}
 }
} finally {fs.rmSync(fixture,{recursive:true,force:true});}
