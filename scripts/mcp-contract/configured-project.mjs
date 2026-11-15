import {Client} from '@modelcontextprotocol/sdk/client/index.js';import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';import fs from 'node:fs';import path from 'node:path';
const binary=path.resolve(process.argv[2]),repo=fs.realpathSync(process.argv[3]);const client=new Client({name:'configured-project-probe',version:'1'},{});
try{
 await client.connect(new StdioClientTransport({command:binary,args:['serve','--multi-repo','--response-profile','full'],env:{...process.env,CGRX_TOOLSET:'full',CGRX_MEMORY_EMBEDDINGS:'off',CGRX_INSTALL_PROBE:'1'}}));
 const call=async(name,args={})=>{const r=await client.callTool({name,arguments:{repo,...args}},undefined,{timeout:600000});if(r.isError)throw Error(name+' returned tool error');return r.structuredContent;};
 await call('status');const list=await call('list_quality_candidates',{kind:'hardcode',limit:100});let ran=false;const reasons=[];
 for(const c of list.candidates??[]){if(c.evidence?.language!=='typescript'||c.evidence?.sensitive)continue;
 const prepared=await call('prepare_candidate_patch',{candidate_id:c.id,run_project_checks:true});
 if(prepared.status==='blocked'){reasons.push(prepared.reason);if(reasons.length>=5)break;continue;}
 const v=prepared.patch_verification;console.log(JSON.stringify({repo,candidate_path:c.evidence.path,status:v.status,reason:v.reason??null,baseline:v.baseline,modified:v.modified,format:v.format,typecheck:v.typecheck,tests:v.tests,source_modified:v.source_modified,post_checks_source_stable:v.post_checks_source_stable}));ran=true;break;
 }
 if(!ran)console.log(JSON.stringify({repo,status:'no_supported_preparable_candidate',blocked_reasons:reasons}));
}finally{await client.close();}
