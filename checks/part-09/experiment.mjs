import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {fork} from 'node:child_process';import {randomBytes,randomUUID} from 'node:crypto';import {pathToFileURL} from 'node:url';import {once} from 'node:events';import {Pool} from 'pg';import {io} from 'socket.io-client';
const target=process.argv[2]??'exercise';if(!['reference','exercise'].includes(target)||process.argv.length!==3)throw Error('Use exercise or reference only; external targets are not accepted');
const root=path.resolve((target==='reference'?'reference-solutions':'labs')+'/part-09');
const {summarize,validate}=await import(pathToFileURL(root+'/analyze.mjs').href);
const phases=[{name:'baseline',clients:2,rooms:1,senders:1,rate:1,seconds:2,bytes:128},{name:'increase',clients:4,rooms:2,senders:2,rate:2,seconds:3,bytes:128},{name:'hold',clients:8,rooms:2,senders:4,rate:2,seconds:4,bytes:128},{name:'release',clients:2,rooms:1,senders:1,rate:1,seconds:2,bytes:128}];
for(const {name,...phase}of phases)validate(phase);
const {requireLocalDatabase,grantAppAccess}=await import(pathToFileURL(root+'/server/dist/db-config.js').href);
const url=requireLocalDatabase(process.env.PART09_TEST_ADMIN_URL,'brodcasting_part09_test');
const admin=new Pool({connectionString:url.href,connectionTimeoutMillis:1000,statement_timeout:3000});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const result={startedAt:new Date().toISOString(),environment:{node:process.version,platform:process.platform,arch:process.arch,cpuModel:os.cpus()[0]?.model,hostRamBytes:os.totalmem(),scope:'loopback only; server child and generator on same host; dedicated PostgreSQL; no browser',cpuUnit:'server child user+system microseconds',latencyUnit:'generator monotonic clock milliseconds; ack RTT',dbProbe:'SELECT 1 on operator pool, not individual chat SQL timing'},phases,repetitions:3,runs:[]};
let resourceStopped=false;
try{
 for(let repetition=1;repetition<=3;repetition++)for(const width of (repetition%2?[1,4]:[4,1])){
  const suffix=randomBytes(6).toString('hex'),schema='part09_check_'+suffix,role=schema,password=randomBytes(24).toString('hex');let worker,pool,roleCreated=false;const sockets=[];const suffixUrl=new URL(url);suffixUrl.username=role;suffixUrl.password=password;
  try{
   await admin.query('CREATE SCHEMA '+schema);pool=new Pool({connectionString:url.href,options:'-c search_path='+schema,connectionTimeoutMillis:1000,statement_timeout:3000});
   await pool.query(await fs.readFile(root+'/server/migrations/001-schema.sql','utf8'));await pool.query("INSERT INTO rooms(id,title,notice) VALUES('r1','실험 1',''),('r2','실험 2','')");
   await admin.query(`CREATE ROLE ${role} LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT`);roleCreated=true;await grantAppAccess(pool,role,schema);
   worker=fork('checks/part-09/runtime.mjs',[],{stdio:['ignore','ignore','pipe','ipc'],env:{...process.env,PART09_RUNTIME_DIR:root+'/server/dist',PART09_RUNTIME_URL:suffixUrl.href,PART09_RUNTIME_SCHEMA:schema,PART09_RUNTIME_SECRET:randomBytes(32).toString('hex'),PART09_WIDTH:String(width)}});
   worker.stderr.on('data',()=>{});
   const base=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Local API startup timeout')),15000);worker.once('message',value=>{clearTimeout(timer);value.type==='ready'?resolve(value.base):reject(Error('Local API startup failed'));});worker.once('exit',()=>{clearTimeout(timer);reject(Error('Local API exited'));});});
   let requestId=0;const sample=()=>new Promise((resolve,reject)=>{const id=++requestId,timer=setTimeout(()=>{worker.off('message',listener);reject(Error('Metrics timeout'));},3000);const listener=message=>{if(message.type==='sample'&&message.id===id){clearTimeout(timer);worker.off('message',listener);resolve(message);}};worker.on('message',listener);worker.send({type:'sample',id});});
   const actors=[];
   for(let i=0;i<8;i++){
    let cookie='',csrf='';const request=async(route,body)=>{const res=await fetch(base+'/api/'+route,{method:body?'POST':'GET',headers:{Cookie:cookie,Origin:'http://127.0.0.1:5189',...(body?{'Content-Type':'application/json','X-CSRF-Token':csrf}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(3000)});for(const value of res.headers.getSetCookie())if(value.startsWith('brodcasting.part09.sid='))cookie=value.split(';',1)[0];if(!res.ok)throw Error('Account setup failed '+res.status);return res.json();};
    csrf=(await request('auth/session')).csrfToken;const username='load_'+i,pw=randomBytes(24).toString('hex');await request('auth/register',{username,password:pw});const view=await request('auth/login',{username,password:pw});csrf=view.csrfToken;
    await pool.query("INSERT INTO room_members(user_id,room_id) VALUES($1,'r1'),($1,'r2')",[view.user.id]);actors.push({cookie});
   }
   const run={repetition,width,phases:[]};
   for(const phase of phases){
    const raw=[],dbProbe=[],resource=[],received=new Set(),duplicates=[],errors=[];let receivedCount=0;
    for(let i=0;i<phase.clients;i++){
     const socket=io(base,{transports:['websocket'],autoConnect:false,reconnection:false,forceNew:true,timeout:2000,extraHeaders:{Cookie:actors[i].cookie,Origin:'http://127.0.0.1:5189'}});sockets.push(socket);
     socket.on('chat:message',message=>{const key=i+':'+message.id;if(received.has(key))duplicates.push(key);received.add(key);receivedCount++;});
     await new Promise((resolve,reject)=>{socket.once('connect',resolve);socket.once('connect_error',()=>reject(Error('Local socket setup failed')));socket.connect();});
     const ack=await socket.timeout(2000).emitWithAck('room:join',{roomId:'r'+(i%phase.rooms+1)});if(!ack.ok)throw Error('Local room setup failed');
    }
    const cpuStart=await sample(),start=performance.now(),deadline=start+phase.seconds*1000;let attempted=0,success=0,expectedReceived=0,stopReason=null;
    for(let tick=0;tick<phase.seconds*phase.rate&&performance.now()<deadline;tick++){
     await Promise.all(sockets.slice(0,phase.senders).map(async(socket,i)=>{const began=performance.now();attempted++;let code=0;try{const ack=await socket.timeout(2000).emitWithAck('chat:send',{roomId:'r'+(i%phase.rooms+1),text:'x'.repeat(phase.bytes),clientMessageId:randomUUID()});code=ack.ok?200:ack.code;if(ack.ok){success++;expectedReceived+=Math.floor((phase.clients-1-i%phase.rooms)/phase.rooms)+1;}else errors.push(code);}catch{errors.push(0);}raw.push({at:began-start,ms:performance.now()-began,code});}));
     const began=performance.now();await pool.query('SELECT 1');dbProbe.push(performance.now()-began);const metrics=await sample();resource.push({at:performance.now()-start,...metrics});
     if(metrics.rss>256*1024*1024||(attempted>=10&&errors.length/attempted>.2)||raw.at(-1)?.ms>1500){stopReason='Resource/error/latency bound reached';resourceStopped=true;break;}
     await sleep(Math.max(0,Math.min(deadline-performance.now(),start+(tick+1)*1000/phase.rate-performance.now())));
    }
    await sleep(200);for(const socket of sockets)socket.disconnect();sockets.length=0;await sleep(200);const after=await sample();
    const elapsed=performance.now()-start,row={name:phase.name,attempted,success,errors,received:receivedCount,duplicates:duplicates.length,elapsed,ack:summarize(raw.map(value=>value.ms)),successfulAck:summarize(raw.filter(value=>value.code===200).map(value=>value.ms)),dbProbe:summarize(dbProbe),cpuMicros:after.cpu.user+after.cpu.system-cpuStart.cpu.user-cpuStart.cpu.system,rssPeak:Math.max(cpuStart.rss,...resource.map(value=>value.rss)),connectionsAfter:after.connections,stopReason,raw,dbProbeRaw:dbProbe,resource};
    row.expectedReceived=expectedReceived;run.phases.push(row);console.log('part09',repetition,width,phase.name,'sent',attempted,'p95',row.successfulAck.p95,'errors',errors.length,'remaining',after.connections);if(stopReason)break;
   }
   result.runs.push(run);
  }finally{
   for(const socket of sockets)socket.disconnect();if(worker&&worker.exitCode===null){const closed=once(worker,'exit');worker.send?.({type:'close'});const timer=setTimeout(()=>worker.kill(),5000);await closed;clearTimeout(timer);}await pool?.end();await admin.query('DROP SCHEMA IF EXISTS '+schema+' CASCADE');if(roleCreated)await admin.query('DROP ROLE '+role);
  }
  if(resourceStopped)break;
 }
}finally{
 await admin.end();result.finishedAt=new Date().toISOString();result.resourceStopped=resourceStopped;await fs.mkdir('docs/experiments/part-09',{recursive:true});await fs.writeFile('docs/experiments/part-09/'+target+'-load.json',JSON.stringify(result,null,2)+'\n');
}
if(resourceStopped||result.runs.length!==6||result.runs.some(run=>run.phases.length!==4||run.phases.some(phase=>phase.errors.length||phase.duplicates||phase.received!==phase.expectedReceived||phase.connectionsAfter!==0)))process.exitCode=1;
