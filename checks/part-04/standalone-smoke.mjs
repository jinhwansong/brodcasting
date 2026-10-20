import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {cp,mkdir,mkdtemp,writeFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Pool} from 'pg';
import {createServer} from 'node:net';
import {once} from 'node:events';

const raw=process.env.PART04_TEST_LAB_URL;
assert.ok(raw,'Set a dedicated disposable PART04_TEST_LAB_URL');
const {requireLocalDatabase}=await import('../../reference-solutions/part-04/server/dist/db-config.js');
const url=requireLocalDatabase(raw,'brodcasting_part04_lab');
const operator=new Pool({connectionString:url.href,connectionTimeoutMillis:1000,statement_timeout:3000});
try{
 assert.equal((await operator.query("SELECT 1 FROM pg_tables WHERE schemaname='public'")).rowCount,0,'Use an empty owned lab database');
 assert.equal((await operator.query("SELECT 1 FROM pg_roles WHERE rolname='part04_app'")).rowCount,0,'Existing app roles must be preserved; use a disposable cluster');
}finally{await operator.end();}
for(const port of [3004,5184]){
 const server=createServer();server.listen(port,'127.0.0.1');
 try{await once(server,'listening');}finally{await new Promise(resolve=>server.close(resolve));}
}
const source=fileURLToPath(new URL('../../reference-solutions/part-04/',import.meta.url));
const copy=await mkdtemp(path.join(tmpdir(),'part04-standalone-'));
await cp(source,copy,{recursive:true,filter:file=>!['node_modules','dist'].includes(path.basename(file))&&(!path.basename(file).startsWith('.env')||path.basename(file)==='.env.example')});
assert.ok(process.env.npm_execpath,'Run through npm run verify:part-04:standalone');
function command(args,env=process.env){
 const result=spawnSync(process.execPath,args,{cwd:copy,env,encoding:'utf8',timeout:180000,maxBuffer:8*1024*1024});
 assert.equal(result.error,undefined,'Standalone command failed to execute');return result;
}
for(const args of [['ci'],['run','typecheck'],['run','build']])assert.equal(command([process.env.npm_execpath,...args]).status,0,'Standalone install/typecheck/build failed');
const password=randomBytes(24).toString('hex'),secret=randomBytes(32).toString('hex');
const env={...process.env,NODE_ENV:'test',PART04_ADMIN_URL:raw,PART04_APP_PASSWORD:password,SESSION_SECRET:secret,PART04_BROWSER_ORIGIN:'http://127.0.0.1:5184',PORT:'3004'};
const markers=[password,secret],outputs=[];
function cli(task,args=[],overrides={},expected=0){
 const result=command(['server/dist/db-cli.js',task,...args],{...env,...overrides});
 outputs.push(result.stdout+result.stderr);assert.equal(result.status,expected,'Unexpected operator command result: '+task);
}
const children=[],logs=[];
function launch(args){
 const child=spawn(process.execPath,args,{cwd:copy,env,stdio:['ignore','pipe','pipe']});
 child.on('error',()=>{});child.stdout.on('data',chunk=>logs.push(String(chunk)));child.stderr.on('data',chunk=>logs.push(String(chunk)));children.push(child);return child;
}
async function stop(child){
 if(child.exitCode!==null||child.signalCode!==null)return;
 const closed=new Promise(resolve=>child.once('exit',resolve));child.kill('SIGTERM');
 let timer;try{await Promise.race([closed,new Promise((_,reject)=>{timer=setTimeout(()=>{child.kill('SIGKILL');reject(new Error('API did not stop in time'));},5000);})]);}finally{clearTimeout(timer);}
}
async function ready(route){
 const until=Date.now()+15000;
 while(Date.now()<until){try{const res=await fetch(route,{signal:AbortSignal.timeout(500)});if(res.ok)return res;}catch{}
  await new Promise(resolve=>setTimeout(resolve,100));}
 throw new Error('Standalone local HTTP service did not become ready');
}
let cookie='',csrf='';const origin='http://127.0.0.1:5184';
async function request(route,method='GET',body,overrideCookie=cookie){
 const headers={Origin:origin};if(overrideCookie)headers.Cookie=overrideCookie;
 if(method!=='GET')headers['X-CSRF-Token']=csrf;
 if(body!==undefined)headers['Content-Type']='application/json';
 const response=await fetch(origin+'/api/'+route,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(5000)});
 for(const value of response.headers.getSetCookie()){
  const pair=value.split(';',1)[0];if(pair.startsWith('brodcasting.part04.sid='))cookie=pair==='brodcasting.part04.sid='?'':pair;
 }
 return response;
}
try{
 cli('migrate');cli('migrate');cli('seed');cli('provision-app');
 const appUrl=new URL(raw);appUrl.username='part04_app';appUrl.password=password;env.PART04_DATABASE_URL=appUrl.href;
 const duplicate=randomBytes(24).toString('hex'),denied=randomBytes(24).toString('hex');markers.push(duplicate,denied);
 cli('provision-app',[],{PART04_APP_PASSWORD:duplicate},1);
 cli('provision-app',[],{PART04_ADMIN_URL:appUrl.href,PART04_APP_PASSWORD:denied},1);
 cli('grant-admin',['--username','unknown_user','--room','r1'],{},1);
 let api=launch(['server/dist/main.js']);await ready('http://127.0.0.1:3004/api/broadcasts');
 launch(['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5184','--strictPort','--config','client/vite.config.ts','client']);
 const html=await ready(origin);assert.match(await html.text(),/4단계/);
 assert.equal((await fetch(origin+'/src/App.tsx')).status,200);
 const session=await request('auth/session');assert.equal(session.status,200);csrf=(await session.json()).csrfToken;
 const credentials={username:'smoke_'+randomBytes(5).toString('hex'),password:randomBytes(24).toString('hex')};markers.push(credentials.password);
 assert.equal((await request('auth/register','POST',credentials)).status,201);
 const login=await request('auth/login','POST',credentials);assert.equal(login.status,200);
 const view=await login.json();csrf=view.csrfToken;const id=view.user.id;
 assert.equal((await request('users/'+id+'/favorites/a','PUT')).status,200);
 cli('grant-admin',['--username',credentials.username,'--room','r1']);
 assert.equal((await request('rooms/r1/notice','PUT',{notice:'독립 실행 확인'})).status,200);
 await stop(api);api=launch(['server/dist/main.js']);await ready('http://127.0.0.1:3004/api/broadcasts');
 const restored=await request('auth/session');assert.equal(restored.status,200);const next=await restored.json();assert.equal(next.user.id,id);csrf=next.csrfToken;
 const favorites=await request('users/'+id+'/favorites');assert.equal(favorites.status,200);assert.deepEqual((await favorites.json()).items.map(row=>row.id),['a']);
 const oldCookie=cookie;assert.equal((await request('auth/logout','POST')).status,204);
 await stop(api);api=launch(['server/dist/main.js']);await ready('http://127.0.0.1:3004/api/broadcasts');
 assert.equal((await request('users/'+id+'/favorites','GET',undefined,oldCookie)).status,401);
 assert.ok(process.env.PART04_SERVICE_CONTAINER,'Set the owned DB container to verify error logs');
 const dbLogs=spawnSync('docker',['logs',process.env.PART04_SERVICE_CONTAINER],{encoding:'utf8',timeout:10000});
 assert.equal(dbLogs.status,0,'Could not inspect owned database logs');outputs.push(dbLogs.stdout+dbLogs.stderr,...logs);
 for(const marker of markers)assert.equal(outputs.some(output=>output.includes(marker)),false,'Test secret appeared in command/process/DB logs');
 const report={node:process.version,platform:process.platform,cleanSourceInstall:true,typecheck:true,build:true,operatorCli:true,limitedRole:true,proxyHttp:true,
  actualProcessRestarts:2,sessionAndFavoritePersistence:true,logoutSurvivesRestart:true,setupErrorsSanitized:true,gracefulSignals:process.platform!=='win32',browser:false};
 const output=process.argv[2]??'test-results/part-04/standalone-summary.json';await mkdir(path.dirname(output),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n');
 console.log('Source-only install, operator CLI, HTTP/proxy, two process restarts and log checks passed');
}finally{for(const child of children)await stop(child);}
