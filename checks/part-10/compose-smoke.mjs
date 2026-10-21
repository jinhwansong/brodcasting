import fs from 'node:fs/promises';import path from 'node:path';import {spawnSync} from 'node:child_process';import {randomBytes,randomUUID,createHash} from 'node:crypto';import https from 'node:https';import {io} from 'socket.io-client';import assert from 'node:assert/strict';
const target=process.argv[2]??'exercise';if(!['exercise','reference'].includes(target)||process.argv.length!==3)throw Error('Use exercise or reference only');
const directory=path.resolve((target==='reference'?'reference-solutions':'labs')+'/part-10');
const suffix=randomBytes(6).toString('hex'),project='part10-check-'+suffix,tls=path.resolve('test-results/part-10/tls-'+suffix),image=project;
const env={...process.env,PART10_IMAGE_PREFIX:image,PART10_API_IMAGE:image+'-api',PART10_DB_PASSWORD:randomBytes(24).toString('hex'),PART10_APP_PASSWORD:randomBytes(24).toString('hex'),SESSION_SECRET:randomBytes(32).toString('hex'),PART10_TLS_DIR:tls,PART10_RELEASE:'v1',PART10_ACTIVE_DATABASE:'brodcasting_part10_lab'};
const report={startedAt:new Date().toISOString(),target,project,checks:[],scope:'owned local Compose; HTTPS certificate verified; no public deployment or real browser'};
const check=(name,value=true)=>{assert.ok(value,name);report.checks.push(name);console.log('part10 PASS',name);};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function docker(args,options={}){
 const r=spawnSync('docker',['compose','-p',project,'-f',directory+'/compose.yml',...args],{env,encoding:options.binary?undefined:'utf8',maxBuffer:32*1024*1024,input:options.input});
 if(r.status!==0&&!options.allowFailure){throw Error('Local compose command failed: '+args[0]+' '+String(r.stderr??'').slice(-500));}return r;
}
let agent,ca;const sockets=[],markers=[env.PART10_DB_PASSWORD,env.PART10_APP_PASSWORD,env.SESSION_SECRET];
async function request(route,{method='GET',body,cookie='',csrf='',headers={}}={}){
 return new Promise((resolve,reject)=>{const req=https.request('https://127.0.0.1:8443'+route,{agent,method,headers:{Cookie:cookie,Origin:'https://127.0.0.1:8443',...(body?{'Content-Type':'application/json','X-CSRF-Token':csrf}:{}),...headers},timeout:5000},res=>{const chunks=[];res.on('data',chunk=>chunks.push(chunk));res.on('end',()=>{const text=Buffer.concat(chunks).toString();let data;try{data=JSON.parse(text);}catch{data=text;}resolve({status:res.statusCode,headers:res.headers,data});});});req.on('timeout',()=>req.destroy(Error('Local HTTPS timeout')));req.on('error',reject);req.end(body?JSON.stringify(body):undefined);});
}
async function ready(){let last='';for(let i=0;i<60;i++){try{const response=await request('/health/ready');if(response.status===200)return;last='HTTP '+response.status;}catch(error){last=error.code??error.message;}await sleep(500);}throw Error('Local HTTPS readiness timeout: '+last);}
async function connect(cookie){const socket=io('https://127.0.0.1:8443',{transports:['websocket'],reconnection:false,forceNew:true,autoConnect:false,ca,rejectUnauthorized:true,timeout:3000,extraHeaders:{Cookie:cookie,Origin:'https://127.0.0.1:8443'}});sockets.push(socket);await new Promise((resolve,reject)=>{socket.once('connect',resolve);socket.once('connect_error',()=>reject(Error('Local WSS connection rejected')));socket.connect();});assert.equal((await socket.timeout(3000).emitWithAck('room:join',{roomId:'r1'})).ok,true);return socket;}
try{
 await fs.mkdir(tls,{recursive:true});
 const openssl=process.env.PART10_OPENSSL??(process.platform==='win32'?'C:/Program Files/Git/usr/bin/openssl.exe':'openssl');
 const certificate=spawnSync(openssl,['req','-x509','-newkey','rsa:2048','-nodes','-keyout',tls+'/key.pem','-out',tls+'/cert.pem','-days','1','-subj','/CN=localhost','-addext','subjectAltName=IP:127.0.0.1,DNS:localhost'],{stdio:'ignore'});assert.equal(certificate.status,0,'OpenSSL local certificate generation');
 ca=await fs.readFile(tls+'/cert.pem');agent=new https.Agent({ca,rejectUnauthorized:true,keepAlive:false});
 const build=docker(['build','api','web']);check('fresh source Docker build',build.status===0);
 docker(['up','-d','--wait','db']);docker(['run','--rm','setup']);docker(['up','-d','api','web']);await ready();
 check('HTTPS certificate validation and DB readiness',(await request('/health/ready')).data.ready===true);
 check('built client is served',(await request('/')).data.includes('<div id="root">'));
 const services=JSON.parse(docker(['config','--format','json']).stdout).services;
 check('only loopback TLS port is published',!services.api.ports&&!services.db.ports&&services.web.ports[0].host_ip==='127.0.0.1'&&services.web.ports[0].published==='8443');
 const users=[];
 for(const username of ['deploy_a','deploy_b']){
  const session=await request('/api/auth/session'),cookie=(session.headers['set-cookie']??[]).map(s=>s.split(';',1)[0]).join(';'),password=randomBytes(24).toString('hex');markers.push(password);check('Secure HttpOnly session cookie '+username,(session.headers['set-cookie']??[]).some(s=>s.includes('Secure')&&s.includes('HttpOnly')));
  assert.equal((await request('/api/auth/register',{method:'POST',cookie,csrf:session.data.csrfToken,body:{username,password}})).status,201);
  const login=await request('/api/auth/login',{method:'POST',cookie,csrf:session.data.csrfToken,body:{username,password}});assert.equal(login.status,200);const current=(login.headers['set-cookie']??[]).map(s=>s.split(';',1)[0]).join(';');markers.push(current,login.data.csrfToken);users.push({username,cookie:current,csrf:login.data.csrfToken});
  docker(['run','--rm','setup','node','server/dist/db-cli.js','grant-member','--username',username,'--room','r1']);
 }
 let sender=await connect(users[0].cookie),receiver=await connect(users[1].cookie);const received=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Local WSS message timeout')),3000);receiver.once('chat:message',value=>{clearTimeout(timer);resolve(value);});});
 const id=randomUUID(),sent=await sender.timeout(3000).emitWithAck('chat:send',{roomId:'r1',text:'배포 복구 연습',clientMessageId:id});assert.equal(sent.ok,true);check('authenticated WSS stores and delivers message',(await received).id===sent.data.id);
 for(const socket of sockets)socket.disconnect();sockets.length=0;
 docker(['restart','api']);await ready();check('session survives real API process restart',(await request('/api/auth/session',{cookie:users[0].cookie})).data.user.username==='deploy_a');sender=await connect(users[0].cookie);check('DB history survives API restart',(await sender.timeout(3000).emitWithAck('chat:history',{roomId:'r1',after:'0'})).data.items[0].id===sent.data.id);sender.disconnect();
 const csrfDenied=await request('/api/auth/logout',{method:'POST',cookie:users[0].cookie,body:{},csrf:'wrong',headers:{'X-CSRF-Token':'wrong'}});check('CSRF remains enforced',csrfDenied.status===403&&typeof csrfDenied.headers['x-request-id']==='string');
 const direct=docker(['exec','-T','api','node','--input-type=module','-e',"const r=await fetch('http://127.0.0.1:3010/api/auth/session',{headers:{'x-forwarded-proto':'https'}});console.log(JSON.stringify({cookie:r.headers.get('set-cookie')}))"]);check('direct API cannot forge trusted HTTPS proxy',JSON.parse(direct.stdout).cookie===null);
 const marker='marker-'+suffix;markers.push(marker);await request('/api/missing?token='+marker,{headers:{Cookie:marker}});
 docker(['stop','db']);const down=await request('/health/ready');check('DB outage is readiness 503',down.status===503&&down.data.ready===false);check('liveness remains separate from readiness',(await request('/health/live')).status===200);
 const unavailable=await request('/api/auth/session',{cookie:users[0].cookie});check('DB outage returns a safe API error',unavailable.status===503&&!JSON.stringify(unavailable.data).includes('postgres'));
 docker(['start','db']);await ready();check('DB recovery restores requests',(await request('/api/auth/session',{cookie:users[0].cookie})).status===200);
 const backup=docker(['exec','-T','db','pg_dump','-U','postgres','-Fc','--no-owner','--no-privileges','brodcasting_part10_lab'],{binary:true}).stdout;assert.ok(backup.length>1000);
 report.backup={bytes:backup.length,sha256:createHash('sha256').update(backup).digest('hex'),persisted:false};
 docker(['exec','-T','db','createdb','-U','postgres','brodcasting_part10_restore']);docker(['exec','-T','db','pg_restore','-U','postgres','--exit-on-error','--no-owner','--no-privileges','-d','brodcasting_part10_restore'],{input:backup});docker(['run','--rm','setup','node','restore-grants.mjs']);
 env.PART10_ACTIVE_DATABASE='brodcasting_part10_restore';docker(['up','-d','--no-deps','--force-recreate','api']);await ready();
 check('restored DB contains the session',(await request('/api/auth/session',{cookie:users[0].cookie})).data.user.username==='deploy_a');sender=await connect(users[0].cookie);check('restored DB serves the saved history',(await sender.timeout(3000).emitWithAck('chat:history',{roomId:'r1',after:'0'})).data.items[0].id===sent.data.id);sender.disconnect();
 const least=docker(['exec','-T','api','node','--input-type=module','-e',"import {Pool} from 'pg';const p=new Pool({connectionString:process.env.PART10_DATABASE_URL});try{await p.query('DELETE FROM chat_messages');console.log('UNSAFE')}catch{console.log('DENIED')}finally{await p.end()}"]);check('restored app role still cannot delete messages',least.stdout.trim()==='DENIED');
 const badImage=image+'-api-broken';
 const badBuild=spawnSync('docker',['build','--build-arg','BASE_IMAGE='+image+'-api','-f',directory+'/failure.Dockerfile','-t',badImage,directory],{env,encoding:'utf8',maxBuffer:4*1024*1024});assert.equal(badBuild.status,0,'failed-release image fixture build');
 const imageId=name=>spawnSync('docker',['image','inspect',name,'--format','{{.Id}}'],{env,encoding:'utf8'}).stdout.trim();
 report.rollback={goodImage:imageId(image+'-api'),badImage:imageId(badImage)};assert.notEqual(report.rollback.goodImage,report.rollback.badImage);
 env.PART10_API_IMAGE=badImage;docker(['up','-d','--no-deps','--no-build','--pull','never','--force-recreate','api']);await sleep(1500);
 let rejected=false;try{rejected=(await request('/health/ready')).status!==200;}catch(error){rejected=['ECONNREFUSED','ECONNRESET','ETIMEDOUT'].includes(error.code)||error.message==='Local HTTPS timeout';}check('bad release fails deployment',rejected);
 env.PART10_API_IMAGE=image+'-api';docker(['up','-d','--no-deps','--no-build','--pull','never','--force-recreate','api']);await ready();check('rollback restores healthy release',(await request('/health/live')).data.release==='v1');check('rollback preserves restored session',(await request('/api/auth/session',{cookie:users[0].cookie})).data.user.username==='deploy_a');
 report.rollback.actualImage=JSON.parse(docker(['images','api','--format','json']).stdout)[0].ID;check('rollback runs the exact previous image',report.rollback.actualImage===report.rollback.goodImage);
 await request('/api/auth/login',{method:'POST',cookie:users[0].cookie,csrf:users[0].csrf,body:{username:'deploy_a',password:marker}});
 await request('/api/missing?token='+marker,{headers:{Cookie:marker}});
 const logs=docker(['logs','--no-color','api']).stdout;check('structured errors include a request identifier',logs.includes('"event":"http_error"')&&logs.includes('"requestId"'));check('logs omit credentials cookies query values and request bodies',markers.filter(Boolean).every(value=>!logs.includes(value)));
 report.images={api:docker(['images','--format','json']).stdout.trim()};report.success=true;
}catch(error){
 let logs=docker(['logs','--no-color','api','web'],{allowFailure:true}).stdout??'';
 for(const marker of markers.filter(Boolean))logs=logs.replaceAll(marker,'[redacted]');
 const internal=docker(['exec','-T','web','wget','-qO-','http://api:3010/health/ready'],{allowFailure:true});
 report.failure={message:error instanceof Error?error.message:'Local smoke failed',internalReady:String(internal.stdout??''),logs:String(logs).slice(-6000)};console.error(report.failure);throw error;
}finally{
 for(const socket of sockets)socket.disconnect();agent?.destroy();
 if(!/^part10-check-[0-9a-f]{12}$/.test(project))throw Error('Unsafe cleanup project');docker(['down','--volumes','--remove-orphans'],{allowFailure:true});
 spawnSync('docker',['image','rm',image+'-api',image+'-web',image+'-api-broken'],{stdio:'ignore'});
 for(const file of ['cert.pem','key.pem'])await fs.rm(path.join(tls,file),{force:true});await fs.rmdir(tls).catch(()=>{});
 report.finishedAt=new Date().toISOString();await fs.mkdir('docs/experiments/part-10',{recursive:true});await fs.writeFile('docs/experiments/part-10/'+target+'-compose.json',JSON.stringify(report,null,2)+'\n');
}
