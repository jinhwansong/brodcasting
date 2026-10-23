import {spawnSync,spawn,fork} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';
import {createInterface} from 'node:readline';
import assert from 'node:assert/strict';
const root=new URL('./',import.meta.url),require=createRequire(new URL('package.json',root)),{Pool}=require('pg');
const tsc=dirname(require.resolve('typescript/package.json'))+'/bin/tsc',vite=dirname(require.resolve('vite/package.json'))+'/bin/vite.js';
const suffix=randomBytes(8).toString('hex'),containers=[],children=new Map(),operatorPassword=randomBytes(24).toString('hex'),appPassword=randomBytes(24).toString('hex');let operator,env,stopping=false;
function docker(args){const run=spawnSync('docker',args,{encoding:'utf8',timeout:60000,env:{...process.env,POSTGRES_PASSWORD:operatorPassword}});assert.equal(run.status,0,'Owned local lab operation failed ('+args[0]+')');return run.stdout.trim();}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function ready(name,args){for(let i=0;i<150;i++){if(stopping)throw new Error('Stopping');if(spawnSync('docker',['exec',name,...args],{stdio:'ignore',timeout:2000}).status===0)return;await pause(100);}throw new Error('Owned service readiness timeout');}
async function stopChild(name){const child=children.get(name);if(!child||child.exitCode!==null||child.signalCode!==null){children.delete(name);return;}const exited=new Promise(resolve=>child.once('exit',resolve));if(child.connected)child.send({type:'stop'});else child.kill();const timer=setTimeout(()=>child.kill('SIGKILL'),5000);await exited;clearTimeout(timer);children.delete(name);}
async function start(name){
 if(stopping||children.has(name))return;const child=fork(fileURLToPath(new URL('dist/'+name+'.js',root)),[],{env,stdio:['ignore','ignore','ignore','ipc'],windowsHide:true});children.set(name,child);
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Local child readiness timeout')),30000);child.once('message',value=>{clearTimeout(timer);if(value?.type==='ready')resolve();else reject(new Error('Unexpected local child message'));});child.once('exit',()=>{clearTimeout(timer);reject(new Error('Local child exited'));});});console.log(name+' ready');
}
async function stop(status=0){
 if(stopping)return;stopping=true;for(const name of [...children.keys()])await stopChild(name);await operator?.end();
 for(const name of containers.reverse()){assert.match(name,/^course-r05-lab-(redis|db)-[a-f0-9]{16}$/);assert.equal(docker(['inspect','--format','{{index .Config.Labels "codex.owner"}}',name]),'runtime05-local-lab');docker(['rm','-f','-v',name]);}
 console.log('Owned disposable lab cleaned');process.exit(status);
}
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>void stop());
try{
 const built=spawnSync(process.execPath,[tsc,'-p',fileURLToPath(new URL('tsconfig.json',root))],{stdio:'inherit',timeout:30000});assert.equal(built.status,0,'Local build failed');
 const redis='course-r05-lab-redis-'+suffix,db='course-r05-lab-db-'+suffix;
 docker(['run','-d','--name',redis,'--label','codex.owner=runtime05-local-lab','-p','127.0.0.1::6379','redis:8.6.7-alpine','redis-server','--save','','--appendonly','no','--maxmemory','64mb','--maxmemory-policy','noeviction']);containers.push(redis);
 docker(['run','-d','--name',db,'--label','codex.owner=runtime05-local-lab','-p','127.0.0.1::5432','-e','POSTGRES_PASSWORD','-e','POSTGRES_USER=course_operator','-e','POSTGRES_DB=brodcasting_runtime05_lab','postgres:18.6']);containers.push(db);
 await ready(redis,['redis-cli','ping']);await ready(db,['pg_isready','-h','127.0.0.1','-U','course_operator']);if(stopping)throw new Error('Stopping');
 const port=(name,service)=>docker(['inspect','--format',`{{(index (index .NetworkSettings.Ports "${service}/tcp") 0).HostPort}}`,name]),dbPort=port(db,5432);
 operator=new Pool({connectionString:`postgresql://course_operator:${operatorPassword}@127.0.0.1:${dbPort}/brodcasting_runtime05_lab`,connectionTimeoutMillis:1000,query_timeout:3000});await operator.query(await readFile(new URL('schema.sql',root),'utf8'));
 await operator.query((await operator.query("SELECT format('CREATE ROLE runtime05_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD %L',$1::text) AS sql",[appPassword])).rows[0].sql);
 await operator.query('GRANT CONNECT ON DATABASE brodcasting_runtime05_lab TO runtime05_app; GRANT USAGE ON SCHEMA public TO runtime05_app; GRANT SELECT,INSERT ON users TO runtime05_app; GRANT SELECT,INSERT,UPDATE,DELETE ON sessions TO runtime05_app; GRANT SELECT,INSERT,UPDATE ON notification_accounts,notification_events,notifications TO runtime05_app');
 env={...process.env,NODE_ENV:'development',PORT:'3015',SESSION_SECRET:randomBytes(32).toString('hex'),RUNTIME05_DATABASE_URL:`postgresql://runtime05_app:${appPassword}@127.0.0.1:${dbPort}/brodcasting_runtime05_lab`,RUNTIME05_REDIS_URL:'redis://127.0.0.1:'+port(redis,6379)+'/0',RUNTIME05_QUEUE_PREFIX:'course_r05_'+suffix,RUNTIME05_BROWSER_ORIGIN:'http://127.0.0.1:5195'};
 await start('api');await start('worker');if(stopping)throw new Error('Stopping');
 const web=spawn(process.execPath,[vite],{cwd:fileURLToPath(new URL('client/',root)),stdio:'ignore',windowsHide:true});children.set('web',web);
 let webReady=false;for(let i=0;i<100;i++){if(stopping)throw new Error('Stopping');try{if((await fetch('http://127.0.0.1:5195',{signal:AbortSignal.timeout(500)})).ok){webReady=true;break;}}catch{}if(web.exitCode!==null)break;await pause(100);}assert.equal(webReady,true,'Local UI readiness failed');
 console.log('READY http://127.0.0.1:5195 — disposable DB; no passwords printed');console.log('Commands: worker-stop, worker-start, api-stop, api-start, stop. Exiting removes only this disposable lab.');
 let controls=Promise.resolve();createInterface({input:process.stdin}).on('line',line=>{controls=controls.then(async()=>{const command=line.trim();if(command==='stop'){await stop();return;}const match=/^(worker|api)-(start|stop)$/.exec(command);if(!match){console.log('Unknown local command');return;}if(match[2]==='start')await start(match[1]);else{await stopChild(match[1]);console.log(match[1]+' stopped');}}).catch(()=>console.error('Local control failed'));});
}catch{console.error('Local lab preparation failed; check Docker, dependencies and unused ports3015/5195.');await stop(1);}
