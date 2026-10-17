import 'reflect-metadata';
import {afterAll,beforeAll,beforeEach,expect,it} from 'vitest';
import {Pool} from 'pg';
import {fixture,load,reset} from './db-fixture';
let db:Awaited<ReturnType<typeof fixture>>,app:any,base:string;
beforeAll(async()=>{db=await fixture();const {createApp}=await load('create-app');app=await createApp(await db.limitedPool());await app.listen(0,'127.0.0.1');base=await app.getUrl();});
beforeEach(async()=>{await reset(db.pool);});
afterAll(async()=>{await app?.close();await db?.close();});
const get=(route:string)=>fetch(base+'/api/'+route);
const write=(id:string,method='PUT',body?:unknown,query='')=>fetch(base+'/api/favorites/'+encodeURIComponent(id)+query,{method,...(body===undefined?{}:{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})});
it('제한 DB 역할로 실제 HTTP 첫 페이지와 다음 페이지를 조회한다',async()=>{
  const first=await get('broadcasts');expect(first.status).toBe(200);expect(await first.json()).toMatchObject({items:[{id:'d',favorite:false},{id:'a'}],limit:2,offset:0,hasMore:true});
  const next=await get('broadcasts?limit=2&offset=2');expect((await next.json()).items.map((x:any)=>x.id)).toEqual(['e','b']);
});
it('빈 페이지는 정상200이며 상세와404를 구분한다',async()=>{
  const empty=await get('broadcasts?offset=100');expect(empty.status).toBe(200);expect(await empty.json()).toMatchObject({items:[],hasMore:false});
  expect(await (await get('broadcasts/a')).json()).toMatchObject({id:'a',favorite:false});
  expect((await get('broadcasts/missing')).status).toBe(404);
});
it.each(['sort=popular','sort='+encodeURIComponent('viewer_count;DROP TABLE broadcasts'),'limit=0','limit=51','limit=1.5','limit=1e1','limit=02','offset=-1','offset=100001','offset=0.5','limit=2&limit=3','search=a&search=b','favoritesOnly=1','search='+'a'.repeat(81),'owner=other'])('잘못된 query는 직접 요청해도400이다: %s',async query=>{expect((await get('broadcasts?'+query)).status).toBe(400);});
it.each(['constructor','toString','prototype','hasOwnProperty','__proto__'])('변환 전 특수 query 키도400이다: %s',async key=>{expect((await get('broadcasts?'+new URLSearchParams([[key,'x']]))).status).toBe(400);expect((await get('broadcasts/a?'+new URLSearchParams([[key,'x']]))).status).toBe(400);});
it.each(['bad id','UPPER','a'.repeat(33),'bad\n'])('잘못된 id는400이다: %j',async id=>{expect((await get('broadcasts/'+encodeURIComponent(id))).status).toBe(400);expect((await write(id)).status).toBe(400);});
it('SQL 주입값은 검색 데이터이며 원본과 DB가 남는다',async()=>{
  const res=await get('broadcasts?'+new URLSearchParams({search:"' OR 1=1; DROP TABLE broadcasts;--"}));expect(res.status).toBe(200);expect((await res.json()).items).toEqual([]);
  expect(Number((await db.pool.query('SELECT count(*) FROM broadcasts')).rows[0].count)).toBe(6);
});
it('동시 PUT·재시도는 하나만 저장하고 DELETE도 멱등이다',async()=>{
  const replies=await Promise.all(Array.from({length:6},()=>write('a')));expect(replies.map(r=>r.status)).toEqual(Array(6).fill(200));
  expect(await replies[0].json()).toEqual({id:'a',favorite:true});expect(Number((await db.pool.query('SELECT count(*) FROM favorites')).rows[0].count)).toBe(1);
  const list=await get('broadcasts?favoritesOnly=true');expect((await list.json()).items.map((x:any)=>x.id)).toEqual(['a']);
  expect(await (await write('a','DELETE')).json()).toEqual({id:'a',favorite:false});expect((await write('a','DELETE')).status).toBe(200);
  expect((await (await get('broadcasts?favoritesOnly=true')).json()).items).toEqual([]);
});
it.each([['PUT',{userId:'other'},''],['DELETE',{owner:'other'},''],['PUT',undefined,'?owner=other'],['PUT',Object.fromEntries([['__proto__','other']]),'']])('외부 소유자 입력은 거부하고 DB를 바꾸지 않는다: %s %j %s',async(method,body,query)=>{
  expect((await write('a',method as string,body,query as string)).status).toBe(400);expect((await db.pool.query('SELECT * FROM favorites')).rows).toEqual([]);
});
it('없는 방송의 즐겨찾기는404이며 행을 남기지 않는다',async()=>{expect((await write('missing')).status).toBe(404);expect((await db.pool.query('SELECT * FROM favorites')).rows).toEqual([]);});
it('새 앱 인스턴스에도 DB 즐겨찾기가 남는다',async()=>{
  expect((await write('a')).status).toBe(200);const {createApp}=await load('create-app');const next=await createApp(await db.limitedPool());
  try {await next.listen(0,'127.0.0.1');expect(await (await fetch(await next.getUrl()+'/api/broadcasts/a')).json()).toMatchObject({id:'a',favorite:true});}finally{await next.close();}
});
it('DB 연결 실패는 SQL·접속정보 없는503이다',async()=>{
  const broken=new Pool({host:'127.0.0.1',port:1,user:'unused',database:'unused',connectionTimeoutMillis:300});
  const {createApp}=await load('create-app');const next=await createApp(broken);
  try {await next.listen(0,'127.0.0.1');const res=await fetch(await next.getUrl()+'/api/broadcasts');expect(res.status).toBe(503);expect(await res.json()).toEqual({message:'Database unavailable',error:'Service Unavailable',statusCode:503});}finally{await next.close();await broken.end();}
});
it('성공과 검증 오류 응답은 no-store다',async()=>{expect((await get('broadcasts')).headers.get('cache-control')).toBe('no-store');const bad=await get('broadcasts?limit=0');expect(bad.status).toBe(400);expect(bad.headers.get('cache-control')).toBe('no-store');});
it('큰 JSON은 파서에서413이며 즐겨찾기는 그대로다',async()=>{expect((await write('a','PUT',{owner:'x'.repeat(9000)})).status).toBe(413);expect((await db.pool.query('SELECT * FROM favorites')).rows).toEqual([]);});
