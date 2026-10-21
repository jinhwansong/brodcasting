import {spawnSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const root=new URL('../../apps/broadcast/',import.meta.url),require=createRequire(new URL('package.json',root));
const {Pool}=require('pg'),{io}=require('socket.io-client');
const built=spawnSync(process.execPath,[fileURLToPath(new URL('../../node_modules/typescript/bin/tsc',import.meta.url)),'-p',fileURLToPath(new URL('server/tsconfig.json',root))],{stdio:'inherit',timeout:30000});if(built.status!==0)process.exit(built.status??1);
const container='course-rtc-'+randomBytes(8).toString('hex'),operatorPassword=randomBytes(24).toString('hex'),appPassword=randomBytes(24).toString('hex'),origin='http://127.0.0.1:5190';
function docker(args){const run=spawnSync('docker',args,{encoding:'utf8',timeout:120000,env:{...process.env,POSTGRES_PASSWORD:operatorPassword}});assert.equal(run.status,0,'Owned RTC database operation failed ('+args[0]+')');return run.stdout.trim();}
let created=false,operator,pool,app;const sockets=[];let checks=0;
try{
 docker(['run','-d','--name',container,'--label','codex.owner=broadcast-rtc-check','-p','127.0.0.1::5432','-e','POSTGRES_PASSWORD','-e','POSTGRES_USER=course_operator','-e','POSTGRES_DB=brodcasting_part06_lab','postgres:18.6']);created=true;
 for(let i=0;i<100;i++){if(spawnSync('docker',['exec',container,'pg_isready','-h','127.0.0.1','-U','course_operator'],{stdio:'ignore'}).status===0)break;if(i===99)throw new Error('Owned RTC DB readiness timeout');await new Promise(r=>setTimeout(r,100));}
 const port=docker(['inspect','--format','{{(index (index .NetworkSettings.Ports "5432/tcp") 0).HostPort}}',container]);
 operator=new Pool({connectionString:`postgresql://course_operator:${operatorPassword}@127.0.0.1:${port}/brodcasting_part06_lab`,connectionTimeoutMillis:1500,statement_timeout:3000});
 const {applyMigrations}=await import(new URL('server/dist/migrate.js',root));await applyMigrations(operator);
 const {grantAppAccess}=await import(new URL('server/dist/db-config.js',root));
 await operator.query((await operator.query("SELECT format('CREATE ROLE part06_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD %L',$1::text) AS sql",[appPassword])).rows[0].sql);await grantAppAccess(operator,'part06_app');
 pool=new Pool({connectionString:`postgresql://part06_app:${appPassword}@127.0.0.1:${port}/brodcasting_part06_lab`,max:6,connectionTimeoutMillis:1000,statement_timeout:3000});
 const {createApp}=await import(new URL('server/dist/create-app.js',root));app=await createApp(pool,{secret:randomBytes(32).toString('hex'),browserOrigin:origin,authRateLimit:{windowMs:60000,limit:100}});await app.listen(0,'127.0.0.1');const base=await app.getUrl();
 async function actor(username){const cookies=new Map(),password=randomBytes(24).toString('hex');let csrf='';const value={user:null,get cookie(){return[...cookies].map(([key,val])=>key+'='+val).join('; ');},async request(path,body,method=body===undefined?'GET':'POST'){const headers={Origin:origin,Cookie:value.cookie,...(body===undefined?{}:{'Content-Type':'application/json','X-CSRF-Token':csrf})};if(method==='POST')headers['X-CSRF-Token']=csrf;const res=await fetch(base+'/api/'+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});for(const set of res.headers.getSetCookie()){const [pair]=set.split(';'),index=pair.indexOf('=');if(pair.slice(index+1))cookies.set(pair.slice(0,index),pair.slice(index+1));else cookies.delete(pair.slice(0,index));}const data=res.status===204?null:await res.json();if(data?.csrfToken)csrf=data.csrfToken;return{status:res.status,data};}};await value.request('auth/session');assert.equal((await value.request('auth/register',{username,password})).status,201);const login=await value.request('auth/login',{username,password});assert.equal(login.status,200);value.user=login.data.user;return value;}
 const actors=await Promise.all(['rtc_owner','rtc_viewer','rtc_other'].map(actor));
 async function connect(index=0,requestOrigin=origin){const socket=io(base+'/rtc',{path:'/rtc.io',transports:['websocket'],autoConnect:false,reconnection:false,forceNew:true,timeout:2000,extraHeaders:{...(index===null?{}:{Cookie:actors[index].cookie}),...(requestOrigin===null?{}:{Origin:requestOrigin})}});sockets.push(socket);await new Promise((resolve,reject)=>{socket.once('connect',resolve);socket.once('connect_error',()=>reject(new Error('RTC connection rejected')));socket.connect();});return socket;}
 const ack=(socket,event,payload={})=>socket.timeout(2000).emitWithAck(event,payload);
 function event(socket,name){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{socket.off(name,done);reject(new Error('Expected RTC event '+name));},3000);function done(value){clearTimeout(timer);resolve(value);}socket.once(name,done);});}
 await assert.rejects(connect(null));await assert.rejects(connect(0,'http://wrong.invalid'));await assert.rejects(connect(0,null));checks++;
 const publisher=await connect(0),viewer=await connect(1),other=await connect(2);
 assert.equal((await ack(publisher,'rtc:publish',{title:'test',userId:actors[2].user.id})).code,400);
 const published=await ack(publisher,'rtc:publish',{title:'RTC test broadcast'});assert.equal(published.ok,true);const room=published.data;assert.equal(room.hostName,'rtc_owner');assert.equal('userId' in room,false);checks++;
 const joining=event(publisher,'rtc:viewer');const watched=await ack(viewer,'rtc:watch',{roomId:room.id});assert.equal(watched.ok,true);assert.equal((await joining).peerId,viewer.id);checks++;
 const sdp='v=0\r\ns=RTC signaling test\r\n',incoming=event(viewer,'rtc:signal');assert.equal((await ack(publisher,'rtc:signal',{roomId:room.id,target:viewer.id,type:'offer',sdp})).ok,true);assert.deepEqual(await incoming,{roomId:room.id,from:publisher.id,type:'offer',sdp});
 const answer=event(publisher,'rtc:signal');assert.equal((await ack(viewer,'rtc:signal',{roomId:room.id,target:publisher.id,type:'answer',sdp})).ok,true);assert.equal((await answer).from,viewer.id);checks++;
 assert.equal((await ack(other,'rtc:signal',{roomId:room.id,target:viewer.id,type:'offer',sdp})).code,403);assert.equal((await ack(viewer,'rtc:signal',{roomId:room.id,target:publisher.id,type:'offer',sdp})).code,403);assert.equal((await ack(publisher,'rtc:signal',{roomId:room.id,target:viewer.id,type:'offer',sdp:'v=0\r\n'+'x'.repeat(20000)})).code,400);checks++;
 const disconnected=event(viewer,'disconnect');assert.equal((await actors[1].request('auth/logout',undefined,'POST')).status,204);assert.equal((await ack(publisher,'rtc:signal',{roomId:room.id,target:viewer.id,type:'offer',sdp})).ok,false);await disconnected;checks++;
 const secondViewer=await connect(2);assert.equal((await ack(secondViewer,'rtc:watch',{roomId:room.id})).ok,true);const ended=event(secondViewer,'rtc:ended');publisher.disconnect();await ended;const listed=await ack(other,'rtc:list');assert.equal(listed.ok,true);assert.deepEqual(listed.data,[]);checks++;
 await app.close();app=undefined;
 const httpsOrigin='https://192.168.0.10:5190';app=await createApp(pool,{secret:randomBytes(32).toString('hex'),browserOrigin:httpsOrigin});await app.listen(0,'127.0.0.1');
 const secureSession=await fetch(await app.getUrl()+'/api/auth/session',{headers:{Origin:httpsOrigin,'X-Forwarded-Proto':'https'}});assert.equal(secureSession.status,200);const secureCookie=secureSession.headers.getSetCookie().join(';');assert.match(secureCookie,/; Secure/);assert.match(secureCookie,/; HttpOnly/);assert.match(secureCookie,/SameSite=Lax/);checks++;
 const plainSession=await fetch(await app.getUrl()+'/api/auth/session',{headers:{Origin:httpsOrigin}});assert.equal(plainSession.headers.getSetCookie().length,0);checks++;
 console.log(JSON.stringify({node:process.version,platform:process.platform,realPostgres:true,restrictedRole:true,realHttpSessionAndCsrf:true,realSocketNamespace:true,httpsProxySecureCookie:true,actualTls:false,checks,mediaTransportTest:false}));
}finally{
 for(const socket of sockets)socket.disconnect();await app?.close();await pool?.end();await operator?.end();
 if(created){assert.match(container,/^course-rtc-[a-f0-9]{16}$/);assert.equal(docker(['inspect','--format','{{index .Config.Labels "codex.owner"}}',container]),'broadcast-rtc-check');docker(['rm','-f','-v',container]);}
}
