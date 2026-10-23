import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {fork} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=new URL(process.env.RUNTIME05_SOURCE),require=createRequire(new URL('package.json',root)),{Pool}=require('pg');
const {InboxService}=await import(new URL('dist/notification-inbox.js',root)),{creation,pageQuery}=await import(new URL('dist/notification-input.js',root)),{NoticeQueue}=await import(new URL('dist/notification-queue.js',root)),{createApp}=await import(new URL('dist/create-app.js',root));
const pool=new Pool({connectionString:process.env.RUNTIME05_DATABASE_URL,max:6,connectionTimeoutMillis:1000,query_timeout:3000}),inbox=new InboxService(pool),origin='http://127.0.0.1:5195',secret=randomBytes(32).toString('hex'),options={redisUrl:process.env.RUNTIME05_REDIS_URL,prefix:'course_r05_'+randomBytes(8).toString('hex')};
let app,base,queue;const actors=[];
async function account(){const result=await pool.query('INSERT INTO users(username,password_hash) VALUES($1,$2) RETURNING id',['a'+randomBytes(8).toString('hex'),'test-only-unusable-hash']);return result.rows[0].id;}
async function event(user,body='hello'){return inbox.create(user,{clientKey:randomUUID(),body});}
async function actor(username){const cookies=new Map();let csrf='';const value={id:'',async request(path,body,method=body===undefined?'GET':'POST',overrides={}){const response=await fetch(base+'/api/'+path,{method,headers:{Origin:origin,Cookie:[...cookies].map(([key,val])=>key+'='+val).join('; '),...(method==='GET'?{}:{'X-CSRF-Token':csrf}),...(body===undefined?{}:{'Content-Type':'application/json'}),...overrides},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(5000)});for(const cookie of response.headers.getSetCookie()){const [pair]=cookie.split(';'),pos=pair.indexOf('=');if(pair.slice(pos+1))cookies.set(pair.slice(0,pos),pair.slice(pos+1));else cookies.delete(pair.slice(0,pos));}const data=response.status===204?null:await response.json();if(data?.csrfToken)csrf=data.csrfToken;return{status:response.status,data};}};await value.request('auth/session');const credentials={username,password:randomBytes(24).toString('hex')};assert.equal((await value.request('auth/register',credentials)).status,201);const login=await value.request('auth/login',credentials);assert.equal(login.status,200);value.id=login.data.user.id;return value;}
async function open(){app=await createApp(pool,{secret,browserOrigin:origin,notifications:options,authRateLimit:{windowMs:60000,limit:100}});await app.listen(0,'127.0.0.1');base=await app.getUrl();queue=app.get(NoticeQueue);}
before(async()=>{await open();actors.push(await actor('inbox_alice'),await actor('inbox_bob'));});
after(async()=>{await app?.close();await pool.end();});
test('input boundaries reject receiver spoofing and unstable cursor formats',()=>{
 assert.deepEqual(creation({clientKey:randomUUID(),body:'hello'}).body,'hello');for(const value of [{clientKey:randomUUID()+'\n',body:'x'},{userId:'other',clientKey:randomUUID(),body:'x'},{clientKey:'x',body:'x'},{clientKey:randomUUID(),body:' '},{clientKey:randomUUID(),body:'x'.repeat(501)}])assert.throws(()=>creation(value));
 for(const value of [{before:'1',after:'0'},{after:'01'},{after:'-1'},{after:['1']},{after:'9223372036854775808'},{before:'0'},{limit:'500'}])assert.throws(()=>pageQuery(value));assert.deepEqual(pageQuery({after:'0'}),{direction:'after',cursor:'0'});
});
test('durable event creation is idempotent per user and rejects changed body',async()=>{
 const owner=await account(),key=randomUUID(),input={clientKey:key,body:'durable'};const [a,b]=await Promise.all([inbox.create(owner,input),inbox.create(owner,input)]);assert.equal(a.id,b.id);assert.equal([a,b].filter(row=>!row.duplicate).length,1);await assert.rejects(inbox.create(owner,{...input,body:'changed'}),error=>error.getStatus()===409);const other=await inbox.create(await account(),input);assert.notEqual(other.id,a.id);
});
test('four concurrent duplicate deliveries leave exactly one inbox row and sequence',async()=>{
 const owner=await account(),saved=await event(owner);const results=await Promise.all(Array.from({length:4},()=>inbox.deliver(saved.id)));assert.equal(results.filter(row=>!row.duplicate).length,1);const rows=await pool.query('SELECT seq FROM notifications WHERE id=$1',[saved.id]);assert.equal(rows.rowCount,1);assert.equal(rows.rows[0].seq,'1');assert.equal((await pool.query('SELECT inbox_seq FROM notification_accounts WHERE user_id=$1',[owner])).rows[0].inbox_seq,'1');
});
test('failed INSERT rolls back the inbox counter as well as the notification',async()=>{
 const owner=await account(),saved=await event(owner,'rollback-check');await assert.rejects(inbox.deliver(saved.id),{code:'23514'});assert.equal((await pool.query('SELECT count(*) FROM notifications WHERE user_id=$1',[owner])).rows[0].count,'0');assert.equal((await pool.query('SELECT inbox_seq FROM notification_accounts WHERE user_id=$1',[owner])).rows[0].inbox_seq,'0');
});
test('different concurrent deliveries allocate unique committed per-user sequences',async()=>{
 const owner=await account(),events=await Promise.all(Array.from({length:4},()=>event(owner)));await Promise.all(events.map(row=>inbox.deliver(row.id)));const page=await inbox.list(owner,{});assert.deepEqual(page.items.map(row=>row.seq),['4','3','2','1']);assert.equal(new Set(page.items.map(row=>row.id)).size,4);
});
let pagedUser,pagedIds;
test('before pagination has a fixed twenty-row stable boundary even with identical timestamps',async()=>{
 pagedUser=await account();pagedIds=[];for(let i=0;i<45;i++){const saved=await event(pagedUser,'page '+i);await inbox.deliver(saved.id);pagedIds.push(saved.id);}
 const first=await inbox.list(pagedUser,{}),second=await inbox.list(pagedUser,{before:first.nextCursor}),last=await inbox.list(pagedUser,{before:second.nextCursor});assert.deepEqual([first.items.length,second.items.length,last.items.length],[20,20,5]);assert.equal(first.hasMore,true);assert.equal(last.hasMore,false);assert.equal(last.nextCursor,null);const rows=[...first.items,...second.items,...last.items];assert.equal(new Set(rows.map(row=>row.id)).size,45);assert.equal(new Set(rows.map(row=>row.createdAt)).size,1);assert.deepEqual(rows.map(row=>row.seq),Array.from({length:45},(_,i)=>String(45-i)));
});
test('after recovery returns ascending exclusive pages without gaps',async()=>{
 assert.ok(pagedUser&&pagedIds?.length===45,'previous fixture delivery must succeed');const first=await inbox.list(pagedUser,{after:'0'}),second=await inbox.list(pagedUser,{after:first.nextCursor}),last=await inbox.list(pagedUser,{after:second.nextCursor});assert.deepEqual([...first.items,...second.items,...last.items].map(row=>row.id),pagedIds);assert.equal(last.hasMore,false);
});
test('read ownership is enforced and repeat read keeps the first timestamp',async()=>{
 const owner=await account(),saved=await event(owner);await inbox.deliver(saved.id);const first=await inbox.markRead(owner,saved.id),again=await inbox.markRead(owner,saved.id);assert.equal(first.readAt,again.readAt);await assert.rejects(inbox.markRead(await account(),saved.id),error=>error.getStatus()===404);await assert.rejects(inbox.markRead(owner,randomUUID()),error=>error.getStatus()===404);
});
test('HTTP rejects anonymous reads, missing CSRF and wrong Origin',async()=>{
 const anonymous=await fetch(base+'/api/notifications',{signal:AbortSignal.timeout(5000)});assert.equal(anonymous.status,401);assert.equal((await actors[0].request('notifications/demo',{clientKey:randomUUID(),body:'csrf'},'POST',{'X-CSRF-Token':''})).status,403);assert.equal((await actors[0].request('notifications/demo',{clientKey:randomUUID(),body:'origin'},'POST',{Origin:'http://wrong.invalid'})).status,403);
});
test('HTTP receiver is the session user and the real queue contains only the event ID',async()=>{
 assert.equal((await actors[0].request('notifications/demo',{clientKey:randomUUID(),body:'spoof',userId:actors[1].id})).status,400);const response=await actors[0].request('notifications/demo',{clientKey:randomUUID(),body:'<strong>plain text</strong>'});assert.equal(response.status,202);assert.equal(response.data.queued,true);const job=await queue.queue.getJob(response.data.id);assert.deepEqual(job.data,{id:response.data.id});assert.equal((await pool.query('SELECT user_id FROM notification_events WHERE id=$1',[response.data.id])).rows[0].user_id,actors[0].id);
});
test('HTTP list and read never return another user notification',async()=>{
 const saved=await event(actors[0].id,'private inbox');await inbox.deliver(saved.id);const own=await actors[0].request('notifications'),other=await actors[1].request('notifications');assert.equal(own.status,200);assert.ok(own.data.items.some(row=>row.id===saved.id));assert.equal(other.status,200);assert.equal(other.data.items.some(row=>row.id===saved.id),false);assert.equal((await actors[1].request('notifications/'+saved.id+'/read',{})).status,404);assert.equal((await actors[0].request('notifications/'+saved.id+'/read',{userId:actors[1].id})).status,400);assert.equal((await actors[0].request('notifications?after=0&before=1')).status,400);
});
test('explicit replay is restricted to the current session owner',async()=>{
 const own=await event(actors[0].id,'pending self'),other=await event(actors[1].id,'pending other');const replay=await actors[0].request('notifications/replay',{});assert.equal(replay.status,200);assert.ok(await queue.queue.getJob(own.id));assert.equal(await queue.queue.getJob(other.id),undefined);
});
let gap;
test('a real closed queue leaves a durable event with queued:false rather than losing it',async()=>{
 await queue.queue.close();const response=await actors[0].request('notifications/demo',{clientKey:randomUUID(),body:'queue gap'});assert.equal(response.status,202);assert.equal(response.data.queued,false);gap=response.data.id;assert.equal((await pool.query('SELECT body FROM notification_events WHERE id=$1',[gap])).rows[0].body,'queue gap');assert.equal((await pool.query('SELECT count(*) FROM notifications WHERE id=$1',[gap])).rows[0].count,'0');
});
test('a separate Worker replays the durable gap after restart and has no HTTP server',async t=>{
 assert.ok(gap);const child=fork(fileURLToPath(new URL('dist/notification-worker.js',root)),[],{env:{...process.env,PART06_DATABASE_URL:process.env.RUNTIME05_DATABASE_URL,BROADCAST_REDIS_URL:options.redisUrl,BROADCAST_QUEUE_PREFIX:options.prefix},stdio:['ignore','ignore','ignore','ipc'],windowsHide:true});
 t.after(async()=>{if(child.exitCode!==null)return;const exited=new Promise(resolve=>child.once('exit',resolve));child.send({type:'stop'});const timer=setTimeout(()=>child.kill(),3000);await exited;clearTimeout(timer);});
 const ready=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Worker ready timeout')),10000);child.once('message',value=>{clearTimeout(timer);resolve(value);});child.once('exit',()=>{clearTimeout(timer);reject(new Error('Worker exited before ready'));});});assert.notEqual(ready.pid,process.pid);assert.equal(ready.hasHttp,false);
 let row;for(let i=0;i<60;i++){row=(await pool.query('SELECT id FROM notifications WHERE id=$1',[gap])).rows[0];if(row)break;await new Promise(resolve=>setTimeout(resolve,100));}assert.equal(row?.id,gap);assert.equal((await pool.query('SELECT count(*) FROM notifications WHERE id=$1',[gap])).rows[0].count,'1');
});
test('API restart keeps the session and retrieves the durable inbox',async()=>{
 await app.close();app=undefined;await open();const response=await actors[0].request('notifications');assert.equal(response.status,200);assert.ok(response.data.items.some(row=>row.id===gap));
});
test('logout invalidates the old session for future inbox reads',async()=>{assert.equal((await actors[0].request('auth/logout',undefined,'POST')).status,204);assert.equal((await actors[0].request('notifications')).status,401);});
test('the hundred-event cap serializes concurrent new requests and still permits duplicates',async()=>{
 const owner=await account();let input;for(let i=0;i<99;i++){input={clientKey:randomUUID(),body:'quota'};await inbox.create(owner,input);}const a={clientKey:randomUUID(),body:'last'},b={clientKey:randomUUID(),body:'overflow'},results=await Promise.allSettled([inbox.create(owner,a),inbox.create(owner,b)]);assert.equal(results.filter(row=>row.status==='fulfilled').length,1);assert.equal(results.find(row=>row.status==='rejected').reason.getStatus(),429);const duplicate=await inbox.create(owner,input);assert.equal(duplicate.duplicate,true);assert.equal((await pool.query('SELECT created_count FROM notification_accounts WHERE user_id=$1',[owner])).rows[0].created_count,100);
});

test('integrated unread count is scoped to the session owner and falls after read',async()=>{const actor=actors[1],saved=await inbox.create(actor.id,{clientKey:randomUUID(),body:'unread-count'});await inbox.deliver(saved.id);const before=await actor.request('notifications/unread');assert.equal(before.status,200);assert.ok(before.data.count>=1);await actor.request('notifications/'+saved.id+'/read',{});const after=await actor.request('notifications/unread');assert.equal(after.data.count,before.data.count-1);});
