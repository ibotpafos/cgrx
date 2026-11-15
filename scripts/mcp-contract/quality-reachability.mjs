// Behavioral probe: same input for baseline, modified and restored executables.
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
const repo=fs.mkdtempSync(path.join(os.tmpdir(),'cgrx-quality-behavior-'));
let client;
try {
 const file=path.join(repo,'a.ts');
 const source='export function entry() { return retained(); }\nfunction retained() { return 1; }\nfunction orphanA() { return orphanB(); }\nfunction orphanB() { return orphanA(); }\nexport function configuration() { const endpoint = "https://example.invalid/api"; return endpoint; }\n';
 fs.writeFileSync(file,source);execFileSync('git',['init','-q',repo]);execFileSync('git',['-C',repo,'add','.']);execFileSync('git',['-C',repo,'-c','user.name=Probe','-c','user.email=probe@example.invalid','commit','-qm','fixture']);
 client=new Client({name:'quality-behavior',version:'1'},{});
 await client.connect(new StdioClientTransport({command:path.resolve(process.argv[2]),args:['serve','--multi-repo','--response-profile','full'],env:{...process.env,CGRX_MEMORY_EMBEDDINGS:'off',CGRX_INSTALL_PROBE:'1',CGRX_TOOLSET:'full'}}));
 const call=async(name,args={})=>{const r=await client.callTool({name,arguments:{repo,...args}});if(r.isError)throw Error(JSON.stringify(r));return r.structuredContent;};
 const list=await call('list_quality_candidates',{limit:100});
 const dead=list.candidates.filter(c=>c.kind==='dead_code');
 const c=list.candidates.find(c=>c.kind==='hardcode');
 const patch=await call('prepare_candidate_patch',{candidate_id:c.id});
 console.log(JSON.stringify({private_cycle_detected:dead.some(c=>c.evidence.members?.length===2),public_chain_reported:dead.some(c=>['entry','retained'].includes(c.evidence.symbol?.symbol)),patch_status:patch.status,diff_applied:patch.patch_verification?.diff_applied??false,syntax_status:patch.patch_verification?.status??'unavailable',source_unchanged:fs.readFileSync(file,'utf8')===source}));
} finally {if(client)await client.close();fs.rmSync(repo,{recursive:true,force:true});}
