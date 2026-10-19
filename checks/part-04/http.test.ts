import 'reflect-metadata';
import {afterAll,afterEach,beforeAll,beforeEach,expect,it} from 'vitest';
import {randomBytes} from 'node:crypto';
import {Pool} from 'pg';
import * as argon2 from 'argon2';
import {fixture,load,reset,A,B} from './db-fixture';
import {CookieJar,ORIGIN} from './cookie-jar';
let db:Awaited<ReturnType<typeof fixture>>,pool:Pool,app:any,base:string,passwordA:string,passwordB:string;
const secret=randomBytes(32).toString('hex'),hashOptions={type:argon2.argon2id,memoryCost:19456,timeCost:2,parallelism:1} as const;
const owner=(userId=A,id='a')=>'users/'+userId+'/favorites/'+id;
async function makeApp(otherPool=pool,extra:Record<string,unknown>={}){
 const {createApp}=await load('create-app');const next=await createApp(otherPool,{secret,browserOrigin:ORIGIN,schemaName:db.schema,...extra});
 await next.listen(0,'127.0.0.1');return next;
}
async function loginA(){const jar=new CookieJar(base);await jar.login('learner_a',passwordA);return jar;}
async function loginB(){const jar=new CookieJar(base);await jar.login('learner_b',passwordB);return jar;}
async function rows(){return(await db.pool.query('SELECT user_id,broadcast_id FROM favorites ORDER BY user_id,broadcast_id')).rows;}
beforeAll(async()=>{db=await fixture();pool=await db.limitedPool();});
beforeEach(async()=>{
 await reset(db.pool);passwordA=randomBytes(20).toString('hex');passwordB=randomBytes(20).toString('hex');
 await db.pool.query('UPDATE users SET password_hash=$1 WHERE id=$2',[await argon2.hash(passwordA,hashOptions),A]);
 await db.pool.query('UPDATE users SET password_hash=$1 WHERE id=$2',[await argon2.hash(passwordB,hashOptions),B]);
 app=await makeApp();base=await app.getUrl();
});
afterEach(async()=>app?.close());afterAll(async()=>db?.close());
it('가입은 공개 User만 반환하고 실제 Argon2id 해시를 저장한다',async()=>{
 const jar=new CookieJar(base);await jar.session();const password=randomBytes(20).toString('hex');
 const res=await jar.request('auth/register',{method:'POST',json:{username:'learner_c',password}});
 expect(res.status).toBe(201);const user=await res.json();expect(Object.keys(user).sort()).toEqual(['id','username']);
 const encoded=(await db.pool.query('SELECT password_hash FROM users WHERE id=$1',[user.id])).rows[0].password_hash;
 expect(await argon2.verify(encoded,password)).toBe(true);expect((await jar.session()).user).toBeNull();
});
it('중복 가입은409이며 추가 행을 남기지 않는다',async()=>{
 const jar=new CookieJar(base);await jar.session();const res=await jar.request('auth/register',{method:'POST',json:{username:'learner_a',password:passwordA}});
 expect(res.status).toBe(409);expect(Number((await db.pool.query('SELECT count(*) FROM users')).rows[0].count)).toBe(2);
});
it('틀린 비밀번호와 존재하지 않는 계정은 동일401이다',async()=>{
 const jar=new CookieJar(base);await jar.session();const bad=randomBytes(20).toString('hex');
 const first=await jar.request('auth/login',{method:'POST',json:{username:'learner_a',password:bad}});
 const second=await jar.request('auth/login',{method:'POST',json:{username:'missing_name',password:bad}});
 expect([first.status,second.status]).toEqual([401,401]);expect(await first.json()).toEqual(await second.json());
});
it('로그인은 SID와 CSRF를 교체하고 옛 익명 토큰을 거부한다',async()=>{
 const jar=new CookieJar(base);await jar.session();const oldCookie=jar.cookie,oldToken=jar.csrf;
 const res=await jar.request('auth/login',{method:'POST',json:{username:'learner_a',password:passwordA}});expect(res.status).toBe(200);
 const view=await res.json();expect(view.user).toEqual({id:A,username:'learner_a'});expect(view.csrfToken===oldToken).toBe(false);expect(jar.cookie===oldCookie).toBe(false);
 expect((await jar.request(owner(),{method:'PUT',headers:{'X-CSRF-Token':oldToken}})).status).toBe(403);
 const old=new CookieJar(base,oldCookie);old.csrf=oldToken;expect((await old.request(owner(),{method:'PUT'})).status).toBe(403);expect(await rows()).toEqual([]);
});
it('쿠키는 HttpOnly/Lax/path=/이며 로컬 HTTP는 Secure=false다',async()=>{
 const jar=new CookieJar(base);const res=await jar.request('auth/session');expect(res.status).toBe(200);
 const header=res.headers.getSetCookie().join(';');expect(/;\s*HttpOnly/i.test(header)).toBe(true);expect(/;\s*SameSite=Lax/i.test(header)).toBe(true);expect(/;\s*Path=\//i.test(header)).toBe(true);expect(/;\s*Secure(?:;|$)/i.test(header)).toBe(false);
 expect(header.includes(secret)).toBe(false);expect(header.includes('learner_a')).toBe(false);expect(res.headers.get('cache-control')).toBe('no-store');
});
it('서명 없는/변조한 쿠키로 보호 데이터를 읽지 못한다',async()=>{
 const jar=await loginA(),bad=new CookieJar(base,jar.cookie+'x');expect((await bad.request('users/'+A+'/favorites')).status).toBe(401);
 expect((await new CookieJar(base).request('users/'+A+'/favorites')).status).toBe(401);
});
it.each(['','wrong-token'])('로그인 CSRF 누락/오류는403이다: %s',async token=>{
 const jar=new CookieJar(base);await jar.session();expect((await jar.request('auth/login',{method:'POST',headers:{'X-CSRF-Token':token},json:{username:'learner_a',password:passwordA}})).status).toBe(403);
 expect((await jar.session()).user).toBeNull();
});
it('다른 세션의 토큰과 다른 Origin은 저장을 허용하지 않는다',async()=>{
 const jar=await loginA(),other=new CookieJar(base);await other.session();
 expect((await jar.request(owner(),{method:'PUT',headers:{'X-CSRF-Token':other.csrf}})).status).toBe(403);
 expect((await jar.request(owner(),{method:'PUT',origin:'https://other.invalid'})).status).toBe(403);expect(await rows()).toEqual([]);
});
it('직접 API 클라이언트는 Origin 없이도 올바른 CSRF를 제출한다',async()=>{
 const jar=await loginA();expect((await jar.request(owner(),{method:'PUT',origin:null})).status).toBe(200);expect(await rows()).toEqual([{user_id:A,broadcast_id:'a'}]);
});
it('로그아웃은204 뒤 옛 세션을 폐기하고 같은 path 쿠키를 지운다',async()=>{
 const jar=await loginA(),old=jar.cookie;const res=await jar.request('auth/logout',{method:'POST'});
 expect(res.status).toBe(204);expect(jar.cookie).toBe('');expect(/Path=\//i.test(res.headers.getSetCookie().join(';'))).toBe(true);
 expect((await new CookieJar(base,old).request('users/'+A+'/favorites')).status).toBe(401);
 expect(Number((await db.pool.query("SELECT count(*) FROM sessions WHERE sess->>'userId'=$1",[A])).rows[0].count)).toBe(0);
});
it('CSRF 없는 로그아웃은 인증을 폐기하지 않는다',async()=>{
 const jar=await loginA();expect((await jar.request('auth/logout',{method:'POST',headers:{'X-CSRF-Token':''}})).status).toBe(403);
 expect((await jar.session()).user).toEqual({id:A,username:'learner_a'});
});
it('상태 조회가 늦게 끝나도 로그아웃한 세션이 다시 저장되지 않는다',async()=>{
 const jar=await loginA(),cookie=jar.cookie,key=Number.parseInt(randomBytes(4).toString('hex'),16);
 // Test-owned schema/trigger/lock only. No response or PostgreSQL operation is mocked.
 await db.pool.query(`CREATE FUNCTION session_save_barrier() RETURNS trigger LANGUAGE plpgsql AS $probe$
 BEGIN
  IF NEW.sess->>'userId' IS NOT NULL THEN PERFORM pg_advisory_xact_lock(${key}); END IF;
  RETURN NEW;
 END;$probe$;
 CREATE TRIGGER session_save_barrier BEFORE INSERT OR UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION session_save_barrier()`);
 const blocker=await db.pool.connect();let released=false,finished=false,pending:Promise<{response?:Response;error?:unknown}>|undefined;
 try{
  await blocker.query('BEGIN');await blocker.query('SELECT pg_advisory_xact_lock($1)',[key]);
  pending=new CookieJar(base,cookie).request('auth/session',{signal:AbortSignal.timeout(6000)}).then(response=>{finished=true;return{response};},error=>{finished=true;return{error};});
  let blocked=false;const deadline=Date.now()+2000;
  while(!finished&&!blocked&&Date.now()<deadline){
   blocked=Boolean((await db.admin.query("SELECT 1 FROM pg_stat_activity WHERE wait_event='advisory' AND position($1 in query)>0",['"'+db.schema+'"."sessions"'])).rowCount);
   if(!finished&&!blocked)await new Promise(resolve=>setTimeout(resolve,20));
  }
  expect(finished||blocked).toBe(true);
  expect((await jar.request('auth/logout',{method:'POST',signal:AbortSignal.timeout(2000)})).status).toBe(204);
  await blocker.query('COMMIT');released=true;
  const outcome=await pending;if(outcome.error)throw outcome.error;expect(outcome.response?.status).toBe(200);
  expect((await new CookieJar(base,cookie).request('users/'+A+'/favorites')).status).toBe(401);
 }finally{
  if(!released)await blocker.query('ROLLBACK');blocker.release();await pending;
  await db.pool.query('DROP TRIGGER session_save_barrier ON sessions; DROP FUNCTION session_save_barrier()');
 }
});
it('DB store 만료는 보호 요청401이다',async()=>{
 const jar=await loginA();await db.pool.query("UPDATE sessions SET expire=now()-interval '1 minute' WHERE sess->>'userId'=$1",[A]);
 expect((await jar.request('users/'+A+'/favorites')).status).toBe(401);
});
it.each([-1800001,60000])('DB TTL이 남아도 절대 만료/미래 발급 시간을 거부한다: %s',async delta=>{
 const jar=await loginA();await db.pool.query("UPDATE sessions SET sess=jsonb_set(sess::jsonb,'{authenticatedAt}',to_jsonb($1::bigint))::json,expire=now()+interval '1 hour' WHERE sess->>'userId'=$2",[Date.now()+delta,A]);
 expect((await jar.request('users/'+A+'/favorites')).status).toBe(401);
});
it('삭제된 사용자의 세션은 다시 인증하지 못한다',async()=>{
 const jar=await loginA();await db.pool.query('DELETE FROM users WHERE id=$1',[A]);expect((await jar.request('users/'+A+'/favorites')).status).toBe(401);
});
it('새 앱 인스턴스에도 세션이 남고 로그아웃 폐기도 유지된다',async()=>{
 const jar=await loginA(),cookie=jar.cookie;const next=await makeApp();
 try{const copy=new CookieJar(await next.getUrl(),cookie);copy.csrf=jar.csrf;expect((await copy.request('users/'+A+'/favorites')).status).toBe(200);
  expect((await copy.request('auth/logout',{method:'POST'})).status).toBe(204);expect((await new CookieJar(base,cookie).request('users/'+A+'/favorites')).status).toBe(401);
 }finally{await next.close();}
 expect(Number((await pool.query('SELECT count(*) FROM users')).rows[0].count)).toBe(2);
});
it('즐겨찾기는 본인 목록만 조회하고 익명은 개인 상태가 없다',async()=>{
 await db.pool.query('INSERT INTO favorites(user_id,broadcast_id) VALUES($1,$2),($3,$4)',[A,'a',B,'e']);
 const anonymous=await new CookieJar(base).request('broadcasts');expect(anonymous.status).toBe(200);expect((await anonymous.json()).items.every((x:any)=>x.favorite===false)).toBe(true);
 expect((await new CookieJar(base).request('broadcasts?favoritesOnly=true')).status).toBe(401);
 const jar=await loginA(),list=await jar.request('users/'+A+'/favorites');expect(list.status).toBe(200);expect((await list.json()).items.map((x:any)=>x.id)).toEqual(['a']);
 expect((await jar.request('users/'+B+'/favorites')).status).toBe(403);
});
it.each(['PUT','DELETE'])('다른 사용자의 UUID로 %s하면403이고 DB는 불변이다',async method=>{
 await db.pool.query('INSERT INTO favorites(user_id,broadcast_id) VALUES($1,$2)',[B,'a']);const before=await rows(),jar=await loginA();
 expect((await jar.request(owner(B),{method})).status).toBe(403);expect(await rows()).toEqual(before);
});
it('본인 추가/삭제는 멱등이며 다른 사용자 행은 남는다',async()=>{
 await db.pool.query('INSERT INTO favorites(user_id,broadcast_id) VALUES($1,$2)',[B,'a']);const jar=await loginA();
 for(let i=0;i<2;i++)expect(await(await jar.request(owner(),{method:'PUT'})).json()).toEqual({id:'a',favorite:true});
 for(let i=0;i<2;i++)expect((await jar.request(owner(),{method:'DELETE'})).status).toBe(200);
 expect(await rows()).toEqual([{user_id:B,broadcast_id:'a'}]);
});
it('없는 방송/방은404, 잘못된 user UUID/id는400이다',async()=>{
 const jar=await loginA();expect((await jar.request(owner(A,'missing'),{method:'PUT'})).status).toBe(404);
 expect((await jar.request('rooms/missing')).status).toBe(404);expect((await jar.request(owner('bad-id'),{method:'PUT'})).status).toBe(400);
 expect((await jar.request(owner(A,'UPPER'),{method:'PUT'})).status).toBe(400);expect(await rows()).toEqual([]);
});
it('방 관리자는 자기 방만 수정하고 일반 사용자도403이다',async()=>{
 const jar=await loginA();expect((await(await jar.request('rooms/r1')).json()).canEdit).toBe(true);
 expect((await(await jar.request('rooms/r2')).json()).canEdit).toBe(false);
 expect((await jar.request('rooms/r1/notice',{method:'PUT',json:{notice:'새 안내'}})).status).toBe(200);
 expect((await jar.request('rooms/r2/notice',{method:'PUT',json:{notice:'우회'}})).status).toBe(403);
 await db.pool.query('DELETE FROM room_admins WHERE user_id=$1',[A]);
 expect((await jar.request('rooms/r1/notice',{method:'PUT',json:{notice:'역할 없음'}})).status).toBe(403);
 expect((await db.pool.query('SELECT id,notice FROM rooms ORDER BY id')).rows).toEqual([{id:'r1',notice:'새 안내'},{id:'r2',notice:'다른 공지'}]);
});
it('다른 방 관리자의 세션도403이며 공지를 바꾸지 않는다',async()=>{
 const jar=await loginB();expect((await jar.request('rooms/r1/notice',{method:'PUT',json:{notice:'다른 방'}})).status).toBe(403);
 expect((await db.pool.query("SELECT notice FROM rooms WHERE id='r1'")).rows[0].notice).toBe('처음 공지');
});
it('공지 HTML/SQL 문자열은 일반 텍스트이며500자 경계를 지킨다',async()=>{
 const jar=await loginA(),notice='<strong data-probe="notice">안내</strong>';const good=await jar.request('rooms/r1/notice',{method:'PUT',json:{notice}});
 expect(good.status).toBe(200);expect((await good.json()).notice).toBe(notice);
 expect((await jar.request('rooms/r1/notice',{method:'PUT',json:{notice:'가'.repeat(501)}})).status).toBe(400);
 expect((await db.pool.query("SELECT notice FROM rooms WHERE id='r1'")).rows[0].notice).toBe(notice);
});
it.each(['constructor','toString','prototype','hasOwnProperty','__proto__'])('DTO 변환 전 특수 키도400이다: %s',async key=>{
 const jar=await loginA(),extra=Object.fromEntries([[key,'admin']]);
 expect((await jar.request('auth/register',{method:'POST',json:{username:'learner_c',password:passwordA,...extra}})).status).toBe(400);
 expect((await jar.request('rooms/r1/notice',{method:'PUT',json:{notice:'우회',...extra}})).status).toBe(400);
 expect((await jar.request(owner(),{method:'PUT',json:extra})).status).toBe(400);expect(await rows()).toEqual([]);
});
it.each([
 {username:'UpperCase',password:'x'.repeat(20)},{username:'ab',password:'x'.repeat(20)},
 {username:'a'.repeat(25),password:'x'.repeat(20)},{username:['array_name'],password:'x'.repeat(20)},
 {username:'valid_name',password:'x'.repeat(14)},{username:'valid_name',password:'x'.repeat(129)},
 {username:'valid_name',password:42},{username:'valid_name',password:'x'.repeat(20),role:'admin'},
])('잘못된 가입 입력은400이며 새 사용자를 만들지 않는다: %#',async input=>{
 const jar=new CookieJar(base);await jar.session();expect((await jar.request('auth/register',{method:'POST',json:input})).status).toBe(400);
 expect(Number((await db.pool.query('SELECT count(*) FROM users')).rows[0].count)).toBe(2);
});
it.each(['owner=other','constructor=x','limit=2&limit=3','limit=0','offset=-1','sort=invalid','limit=2%0A','offset=0%0A'])('직접 query 입력을400으로 거부한다: %s',async query=>{
 const jar=await loginA();expect((await jar.request('broadcasts?'+query)).status).toBe(400);
});
it('외부 소유자/권한 body와 query는400이며 즐겨찾기가 그대로다',async()=>{
 const jar=await loginA();
 expect((await jar.request(owner()+'?userId='+B,{method:'PUT'})).status).toBe(400);
 expect((await jar.request(owner(),{method:'PUT',json:{userId:B,admin:true}})).status).toBe(400);expect(await rows()).toEqual([]);
});
it.each(['PUT','DELETE'])('폼 파서가 키를 지워도 %s는400이고 DB를 보존한다',async method=>{
 await db.pool.query('INSERT INTO favorites(user_id,broadcast_id) VALUES($1,$2)',[A,'a']);const before=await rows(),jar=await loginA();
 expect((await jar.request(owner(),{method,headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'__proto__[userId]=other'})).status).toBe(400);expect(await rows()).toEqual(before);
});
it('chunked 폼도 파싱 전에400이다',async()=>{
 const jar=await loginA(),body=new ReadableStream<Uint8Array>({start(c){c.enqueue(new TextEncoder().encode('__proto__[userId]=other'));c.close();}});
 expect((await jar.request(owner(),{method:'PUT',headers:{'Content-Type':'application/x-www-form-urlencoded'},body,duplex:'half'})).status).toBe(400);expect(await rows()).toEqual([]);
});
it('8kb보다 큰 JSON은413이며 거부 응답도 no-store다',async()=>{
 const jar=new CookieJar(base);await jar.session();const res=await jar.request('auth/register',{method:'POST',json:{username:'learner_c',password:'x'.repeat(9000)}});
 expect(res.status).toBe(413);expect(res.headers.get('cache-control')).toBe('no-store');
 expect(Number((await db.pool.query('SELECT count(*) FROM users')).rows[0].count)).toBe(2);
});
it('11번째 로그인은429이며 위조 X-Forwarded-For로 우회하지 못한다',async()=>{
 const jar=new CookieJar(base);await jar.session();
 for(let i=0;i<10;i++)expect((await jar.request('auth/login',{method:'POST',json:{username:'learner_a',password:passwordB},headers:{'X-Forwarded-For':'198.51.100.'+(i+1)}})).status).toBe(401);
 const res=await jar.request('auth/login',{method:'POST',json:{username:'learner_a',password:passwordA},headers:{'X-Forwarded-For':'203.0.113.55'}});
 expect(res.status).toBe(429);expect(Number(res.headers.get('retry-after'))>0).toBe(true);expect((await jar.session()).user).toBeNull();expect(await rows()).toEqual([]);
});
it('DB와 session store 연결 실패는 정제한503이다',async()=>{
 const jar=await loginA(),broken=new Pool({host:'127.0.0.1',port:1,user:'unused',database:'unused',connectionTimeoutMillis:200});
 const other=await makeApp(broken);
 try{
  for(const cookie of ['',jar.cookie]){
   const res=await new CookieJar(await other.getUrl(),cookie).request('broadcasts');expect(res.status).toBe(503);
   expect(await res.json()).toEqual({statusCode:503,message:'Service unavailable',error:'Service Unavailable'});
  }
 }finally{await other.close();await broken.end();}
});
