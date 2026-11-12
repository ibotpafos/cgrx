// Real formatter + TypeScript compiler + Node project tests through the public MCP.
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {fileURLToPath} from 'node:url';import {execFileSync} from 'node:child_process';
const here=path.dirname(fileURLToPath(import.meta.url));
const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'cgrx-project-checks-'));
let client;
try {
 const repo=path.join(fixture,'project');fs.mkdirSync(repo);
 const source='export function configuration() { const endpoint = "https://example.invalid/api"; return endpoint; }\n';
 const file=path.join(repo,'service.ts');fs.writeFileSync(file,source);
 fs.writeFileSync(path.join(repo,'package.json'),JSON.stringify({type:'module'}));
 fs.writeFileSync(path.join(repo,'tsconfig.json'),JSON.stringify({compilerOptions:{target:'ES2022',module:'NodeNext',strict:true,noEmit:true,types:[]},include:['*.ts']}));
 fs.writeFileSync(path.join(repo,'test.mjs'),"import {configuration} from './service.ts';import assert from 'node:assert/strict';assert.equal(configuration(),'https://example.invalid/api');\n");
 fs.writeFileSync(path.join(repo,'.gitignore'),'node_modules\n.cgrx\n');
 fs.mkdirSync(path.join(repo,'node_modules'));
 for(const pkg of ['prettier','typescript'])fs.cpSync(path.join(here,'node_modules',pkg),path.join(repo,'node_modules',pkg),{recursive:true});
 fs.mkdirSync(path.join(repo,'node_modules','.bin'));
 fs.symlinkSync('../typescript/bin/tsc',path.join(repo,'node_modules','.bin','tsc'));
 fs.mkdirSync(path.join(repo,'.cgrx'));
 const config={version:1,snapshot_max_bytes:268435456,snapshot_max_files:50000,snapshot_timeout_ms:20000,timeout_ms:5000,format:['node','node_modules/prettier/bin/prettier.cjs','--write','{path}'],typecheck:['tsc','--noEmit','--pretty','false'],tests:['node','--test','test.mjs']};
 const configFile=path.join(repo,'.cgrx','quality-checks.json');fs.writeFileSync(configFile,JSON.stringify(config));
 execFileSync('git',['init','-q',repo]);execFileSync('git',['-C',repo,'add','.']);execFileSync('git',['-C',repo,'-c','user.name=Contract','-c','user.email=contract@example.invalid','commit','-qm','fixture']);
 const profile=process.argv[3]??'full';
 client=new Client({name:'project-checks-contract',version:'1'},{});
 await client.connect(new StdioClientTransport({command:path.resolve(process.argv[2]),args:['serve','--multi-repo','--response-profile',profile],env:{...process.env,CGRX_INSTALL_PROBE:'1',CGRX_MEMORY_EMBEDDINGS:'off',CGRX_TOOLSET:'full'}}));
 const tools=(await client.listTools()).tools;
 const supported=!!tools.find(t=>t.name==='prepare_candidate_patch')?.inputSchema.properties.run_project_checks;
 const invoke=async(name,args={})=>{const result=await client.callTool({name,arguments:{repo,...args}},undefined,{timeout:240000});assert.equal(result.isError??false,false);if(profile==='token-efficient')assert.deepEqual(result.structuredContent,JSON.parse(result.content.find(c=>c.type==='text').text));return result.structuredContent;};
 const candidate=(await invoke('list_quality_candidates',{kind:'hardcode',limit:100})).candidates.find(c=>c.kind==='hardcode');assert.ok(candidate);
 const get=async()=>{const c=(await invoke('list_quality_candidates',{kind:'hardcode',limit:100})).candidates.find(c=>c.kind==='hardcode');return invoke('prepare_candidate_patch',{candidate_id:c.id,run_project_checks:true});};
 const prepared=await get();const result=prepared.patch_verification;
 const summary={supported,status:result.status,baseline:result.baseline,modified:result.modified,format:result.format.status,typecheck:result.typecheck.status,tests:result.tests.status,source_unchanged:fs.readFileSync(file,'utf8')===source};
 console.log('PROJECT_CHECKS '+JSON.stringify(summary));
 if(supported){
  assert.equal(result.status,'project_checks_passed',JSON.stringify(result));assert.equal(result.security_sandbox,false);
  assert.ok(prepared.diff.includes('CGRX_QUALITY_'));assert.equal(fs.readFileSync(file,'utf8'),source);
  // The exact returned formatted patch must apply to the original source.
  const proof=path.join(fixture,'patch-proof');fs.mkdirSync(proof);fs.writeFileSync(path.join(proof,'service.ts'),source);const diffFile=path.join(fixture,'returned.patch');fs.writeFileSync(diffFile,prepared.diff);execFileSync('git',['apply','--no-index',diffFile],{cwd:proof});
  execFileSync(process.execPath,[path.join(here,'node_modules/prettier/bin/prettier.cjs'),'--check','service.ts'],{cwd:proof,stdio:'pipe'});
  fs.writeFileSync(path.join(repo,'broken.ts'),'const invalid: number = "not a number";\n');
  const invalid=(await get()).patch_verification;assert.equal(invalid.status,'project_checks_failed');assert.equal(invalid.modified.typecheck.status,'failed');assert.equal(invalid.baseline.typecheck.status,'failed');fs.unlinkSync(path.join(repo,'broken.ts'));
  fs.writeFileSync(path.join(repo,'test.mjs'),"throw new Error('test fixture deliberately fails');\n");
  const failing=(await get()).patch_verification;assert.equal(failing.status,'project_checks_failed');assert.equal(failing.modified.tests.status,'failed');
  fs.unlinkSync(configFile);const missing=(await get()).patch_verification;assert.equal(missing.status,'blocked');assert.equal(missing.tests.status,'not_run');
  assert.equal(fs.readFileSync(file,'utf8'),source);
  console.log(`PROJECT_CHECKS_PASS profile=${profile} real_prettier=true real_tsc=true real_tests=true type_error_rejected=true failing_tests_rejected=true missing_config_blocked=true formatted_diff_applies=true`);
 }
} finally {if(client)await client.close();fs.rmSync(fixture,{recursive:true,force:true});}
