import {spawnSync,fork} from 'node:child_process';
import {randomBytes,randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';
import assert from 'node:assert/strict';
import {summarize} from './src/summary.mjs';
const require=createRequire(import.meta.url),{Pool}=require('pg'),root=new URL('./service/',import.meta.url),suffix=randomBytes(8).toString('hex'),secret=randomBytes(32).toString('hex'),containers=[],children=[];
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));let pool;
function docker(args){const result=spawnSync('docker',args,{encoding:'utf8',timeout:60000,env:{...process.env,POSTGRES_PASSWORD:secret}});assert.equal(result.status,0,'Owned measurement container operation '+args[0]);return result.stdout.trim();}
async function ready(name,args){for(let i=0;i<150;i++){if(spawnSync('docker',['exec',name,...args],{stdio:'ignore'}).status===0)return;await pause(100);}throw new Error('Measurement service timeout');}
async function start(name,env){const child=fork(fileURLToPath(new URL('dist/'+name+'.js',root)),[],{env,stdio:['ignore','ignore','ignore','ipc'],windowsHide:true});children.push(child);const message=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Child readiness timeout')),15000);child.once('message',value=>{clearTimeout(timer);resolve(value);});child.once('exit',()=>{clearTimeout(timer);reject(new Error('Child exited'));});});return{child,...message};}
async function metrics(child){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{child.off('message',receive);reject(new Error('Metrics timeout'));},3000);function receive(value){if(value?.type==='metrics'){clearTimeout(timer);child.off('message',receive);resolve(value);}}child.on('message',receive);child.send({type:'metrics'});});}
try{
 assert.equal(spawnSync(process.execPath,[dirname(require.resolve('typescript/package.json'))+'/bin/tsc','-p',fileURLToPath(new URL('tsconfig.json',root))],{stdio:'inherit'}).status,0);
 const db='course-r06-db-'+suffix,redis='course-r06-redis-'+suffix;
 docker(['run','-d','--name',db,'--label','codex.owner=runtime06-measure','-p','127.0.0.1::5432','-e','POSTGRES_PASSWORD','-e','POSTGRES_USER=course_operator','-e','POSTGRES_DB=brodcasting_runtime05_lab','postgres:18.6']);containers.push(db);
 docker(['run','-d','--name',redis,'--label','codex.owner=runtime06-measure','-p','127.0.0.1::6379','redis:8.6.7-alpine','redis-server','--save','','--appendonly','no']);containers.push(redis);
 await ready(db,['pg_isready','-h','127.0.0.1','-U','course_operator']);await ready(redis,['redis-cli','ping']);
 const port=(name,n)=>docker(['inspect','--format',`{{(index (index .NetworkSettings.Ports "${n}/tcp") 0).HostPort}}`,name]);
 const dbPort=port(db,5432);pool=new Pool({connectionString:`postgresql://course_operator:${secret}@127.0.0.1:${dbPort}/brodcasting_runtime05_lab`});await pool.query(await readFile(new URL('schema.sql',root),'utf8'));
 await pool.query((await pool.query("SELECT format('CREATE ROLE runtime05_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD %L',$1::text) AS sql",[secret])).rows[0].sql);
 await pool.query('GRANT USAGE ON SCHEMA public TO runtime05_app; GRANT SELECT,INSERT ON users TO runtime05_app; GRANT SELECT,INSERT,UPDATE,DELETE ON sessions TO runtime05_app; GRANT SELECT,INSERT,UPDATE ON notification_accounts,notification_events,notifications TO runtime05_app');
 const origin='http://127.0.0.1:5195',env={...process.env,NODE_ENV:'development',PORT:'0',SESSION_SECRET:secret,RUNTIME05_DATABASE_URL:`postgresql://runtime05_app:${secret}@127.0.0.1:${dbPort}/brodcasting_runtime05_lab`,RUNTIME05_REDIS_URL:'redis://127.0.0.1:'+port(redis,6379)+'/0',RUNTIME05_QUEUE_PREFIX:'course_r05_'+suffix,RUNTIME05_BROWSER_ORIGIN:origin};
 const api=await start('api',env),worker=await start('worker',env);assert.notEqual(api.pid,worker.pid);assert.equal(worker.hasHttp,false);
 const rounds=[];
 for(let round=1;round<=3;round++){
  const cookies=new Map();let csrf='';
  async function request(path,body){const result=await fetch(api.url+'/api/'+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,Cookie:[...cookies].map(([a,b])=>a+'='+b).join('; '),...(body===undefined?{}:{'Content-Type':'application/json','X-CSRF-Token':csrf})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(5000)});for(const item of result.headers.getSetCookie()){const pair=item.split(';')[0],at=pair.indexOf('=');cookies.set(pair.slice(0,at),pair.slice(at+1));}const value=await result.json();if(value.csrfToken)csrf=value.csrfToken;return{status:result.status,value};}
  await request('auth/session');const credentials={username:'measure_'+round,password:randomBytes(24).toString('hex')};assert.equal((await request('auth/register',credentials)).status,201);const owner=await request('auth/login',credentials);assert.equal(owner.status,200);
  const phases=[];
  for(const [name,concurrency] of [['baseline',1],['increase',4],['hold',4],['release',1]]){
   const before=await Promise.all([metrics(api.child),metrics(worker.child)]),started=performance.now(),raw=[],errors=[];
   for(let i=0;i<10;i+=concurrency)await Promise.all(Array.from({length:Math.min(concurrency,10-i)},async()=>{const t=performance.now();try{const response=await request('notifications/demo',{clientKey:randomUUID(),body:'measurement'});if(response.status!==202)errors.push(response.status);}catch{errors.push('network');}raw.push(performance.now()-t);}));
   await pause(250);const after=await Promise.all([metrics(api.child),metrics(worker.child)]),elapsedMs=performance.now()-started;
   phases.push({name,concurrency,elapsedMs,rawRequestMs:raw,latencyMs:summarize(raw),errors,processes:after.map((value,i)=>({role:i?'worker':'api',pid:value.pid,cpuMs:(value.cpu.user+value.cpu.system-before[i].cpu.user-before[i].cpu.system)/1000,rssBytes:value.rss,eventLoopLifetimeP95Ms:value.eventLoopP95Ms}))});assert.equal(errors.length,0);
  }
  let delivered=0;for(let i=0;i<100;i++){delivered=Number((await pool.query('SELECT count(*) FROM notifications WHERE user_id=$1',[owner.value.user.id])).rows[0].count);if(delivered===40)break;await pause(100);}assert.equal(delivered,40);rounds.push({round,delivered,phases});
 }
 console.log(JSON.stringify({node:process.version,platform:process.platform,localOnly:true,requests:120,rounds,limitation:'Fixed small local workload; CPU is process CPU time; RSS is end-of-phase snapshot; event loop percentile is cumulative; not production capacity'}));
}finally{
 for(const child of children.reverse()){if(child.exitCode!==null)continue;await new Promise(resolve=>{const timer=setTimeout(()=>child.kill(),5000);child.once('exit',()=>{clearTimeout(timer);resolve();});child.send({type:'stop'});});}
 await pool?.end();for(const name of containers.reverse()){assert.match(name,/^course-r06-(db|redis)-[a-f0-9]{16}$/);assert.equal(docker(['inspect','--format','{{index .Config.Labels "codex.owner"}}',name]),'runtime06-measure');docker(['rm','-f','-v',name]);}
}
