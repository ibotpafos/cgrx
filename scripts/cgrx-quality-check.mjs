import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
const [stage,relative]=process.argv.slice(2);const root=process.cwd();
if(process.env.CGRX_QUALITY_COPY!=='1')throw Error('Run only inside CGRX temporary verification copies');
const file=path.resolve(root,relative??'');if(!file.startsWith(root+path.sep)||!fs.statSync(file).isFile())throw Error('Invalid candidate path');
const run=(cmd,args,cwd=root)=>{const r=spawnSync(cmd,args,{cwd,env:process.env,stdio:'inherit'});if(r.error)throw r.error;process.exit(r.status??1);};
const ext=path.extname(relative);
if(ext==='.rs') {const args={format:['fmt','--all','--','--check'],typecheck:['check','--offline','--workspace'],tests:['test','--offline','--workspace']};if(!args[stage])throw Error('Unknown stage');run('cargo',args[stage]);}
if(ext==='.go') {if(stage==='format')run('gofmt',['-w',relative]);if(stage==='typecheck')run('go',['test','-run','^$','./...']);if(stage==='tests')run('go',['test','./...']);throw Error('Unknown stage');}
if(stage==='format'){
 const locations=['node_modules/prettier/bin/prettier.cjs','scripts/mcp-contract/node_modules/prettier/bin/prettier.cjs','tools/cgrx-quality/node_modules/prettier/bin/prettier.cjs'];
 const formatter=locations.find(p=>fs.existsSync(path.join(root,p)));if(!formatter)throw Error('Install pinned Prettier with npm ci --prefix tools/cgrx-quality (outside verification)');
 run('node',[formatter,'--write',relative]);
}
let owner=path.dirname(file);while(owner!==root&&!fs.existsSync(path.join(owner,'package.json')))owner=path.dirname(owner);
const pkg=JSON.parse(fs.readFileSync(path.join(owner,'package.json'),'utf8'));const scripts=pkg.scripts??{};
let name;if(stage==='typecheck')name=['typecheck','check-types','typecheck:web'].find(s=>scripts[s]);else if(stage==='tests')name=scripts.test?'test':undefined;else throw Error('Unknown stage');
if(!name)throw Error('No real '+stage+' command in owning workspace: '+path.relative(root,owner));
const script=scripts[name];
if(stage==='typecheck' && /^(?:bun x|bunx) tsc --noEmit$/.test(script.trim()))run('node',[path.join(root,'node_modules/typescript/bin/tsc'),'--noEmit'],owner);
if(/(?:\bbunx\b|\bbun x\b|\bnpx\b|\bnpm (?:install|ci|exec)\b|\bbun install\b)/i.test(script))throw Error('Dependency installer/runner forbidden inside verification');
if(/(?:deploy|migrat|seed|playwright|watch|db:push|db:generate)/i.test(script))throw Error('Configured command is not an isolated non-watching check; explicit project-specific adapter required');
const workspaceEnv={...process.env,PATH:[path.join(owner,'node_modules/.bin'),path.join(root,'node_modules/.bin'),process.env.PATH].join(path.delimiter)};
const r=spawnSync('npm',['run',name],{cwd:owner,env:workspaceEnv,stdio:'inherit'});if(r.error)throw r.error;process.exit(r.status??1);
