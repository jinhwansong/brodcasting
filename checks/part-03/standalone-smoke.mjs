import assert from 'node:assert/strict';
import {spawn,spawnSync,execFileSync} from 'node:child_process';
import {cp,mkdtemp,writeFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const source=fileURLToPath(new URL('../../reference-solutions/part-03/',import.meta.url));
const copy=await mkdtemp(path.join(tmpdir(),'part03-standalone-'));
await cp(source,copy,{recursive:true,filter:file=>!['node_modules','dist'].includes(path.basename(file))&&(!path.basename(file).startsWith('.env')||path.basename(file)==='.env.example')});
function command(cmd,args,env=process.env,inherit=true){const result=spawnSync(cmd,args,{cwd:copy,env,stdio:inherit?'inherit':'pipe',encoding:'utf8'});if(result.error)throw result.error;return result;}
for(const args of [['ci'],['run','typecheck'],['run','build']])assert.equal(command('npm',args).status,0,'Standalone npm command failed');
const raw=process.env.PART03_TEST_LAB_URL??process.env.PART03_ADMIN_URL;
assert.ok(raw,'A dedicated CI lab URL is required');
const password=randomBytes(24).toString('hex');
const env={...process.env,PART03_ADMIN_URL:raw,PART03_APP_PASSWORD:password,PORT:'3003'};
for(const task of ['migrate','seed','provision-app'])assert.equal(command(process.execPath,['server/dist/db-cli.js',task],env,false).status,0,'Standalone local DB setup failed');
const appUrl=new URL(raw);appUrl.username='part03_app';appUrl.password=password;env.PART03_DATABASE_URL=appUrl.href;
const duplicateMarker=randomBytes(24).toString('hex');
assert.equal(command(process.execPath,['server/dist/db-cli.js','provision-app'],{...env,PART03_APP_PASSWORD:duplicateMarker},false).status,1,'Existing app role must be refused');
const deniedMarker=randomBytes(24).toString('hex');
assert.equal(command(process.execPath,['server/dist/db-cli.js','provision-app'],{...env,PART03_ADMIN_URL:appUrl.href,PART03_APP_PASSWORD:deniedMarker},false).status,1,'Unprivileged operator must be refused');
assert.ok(process.env.PART03_SERVICE_CONTAINER,'CI PostgreSQL container is required for the error-log probe');
const dbLogs=execFileSync('docker',['logs',process.env.PART03_SERVICE_CONTAINER],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
// docker logs가 stderr로 돌려주는 PostgreSQL 오류도 검사합니다.
const allLogs=spawnSync('docker',['logs',process.env.PART03_SERVICE_CONTAINER],{encoding:'utf8'});
assert.equal((dbLogs+allLogs.stdout+allLogs.stderr).includes(duplicateMarker),false,'Duplicate setup logged its test password');
assert.equal((dbLogs+allLogs.stdout+allLogs.stderr).includes(deniedMarker),false,'Denied setup logged its test password');
const children=[];
function launch(args){const child=spawn(process.execPath,args,{cwd:copy,env,stdio:['ignore','pipe','pipe']});child.stdout.on('data',()=>{});child.stderr.on('data',()=>{});children.push(child);return child;}
async function stop(child){if(child.exitCode!==null)return;const closed=new Promise(resolve=>child.once('exit',resolve));child.kill('SIGTERM');let timer;await Promise.race([closed,new Promise(resolve=>{timer=setTimeout(()=>{child.kill('SIGKILL');resolve();},4000);})]);clearTimeout(timer);}
async function ready(url){const until=Date.now()+10000;while(Date.now()<until){try{const response=await fetch(url,{signal:AbortSignal.timeout(500)});if(response.ok)return response;}catch{}await new Promise(resolve=>setTimeout(resolve,80));}throw new Error('Standalone local HTTP service did not become ready');}
try{
  let api=launch(['server/dist/main.js']);await ready('http://127.0.0.1:3003/api/broadcasts');
  launch(['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4178','--strictPort','--config','client/vite.config.ts','client']);
  const origin='http://127.0.0.1:4178';const html=await ready(origin);assert.match(await html.text(),/3단계/);
  const first=await fetch(origin+'/api/broadcasts?search=React');assert.equal(first.status,200);assert.deepEqual((await first.json()).items.map(row=>row.id),['d','a']);
  assert.equal((await fetch(origin+'/api/favorites/a',{method:'PUT'})).status,200);
  await stop(api);api=launch(['server/dist/main.js']);await ready('http://127.0.0.1:3003/api/broadcasts');
  assert.deepEqual((await (await fetch(origin+'/api/broadcasts?favoritesOnly=true')).json()).items.map(row=>row.id),['a']);
  assert.equal((await fetch(origin+'/api/favorites/a',{method:'DELETE'})).status,200);
  const report={node:process.version,cleanInstall:true,typecheck:true,build:true,proxyHttp:true,limitedRole:true,processRestartPersistence:true,expectedRoleRejectionsNoPasswordInErrorLogs:true,browser:false};
  if(process.argv[2])await writeFile(process.argv[2],JSON.stringify(report,null,2)+'\n');console.log('Standalone install/build/HTTP/proxy/restart and setup-error log checks passed');
}finally{for(const child of children)await stop(child);}
