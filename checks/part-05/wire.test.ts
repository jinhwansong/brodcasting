import {afterAll,afterEach,beforeAll,beforeEach,expect,it,vi} from 'vitest';
import {randomBytes} from 'node:crypto';
import {fixture,load,reset} from './db-fixture';
import {ORIGIN} from './cookie-jar';
import * as api from '@client-api';
let db:Awaited<ReturnType<typeof fixture>>,app:any,base:string,cookie='';
const actualFetch=globalThis.fetch;
const query={search:'',sort:'viewers-desc' as const,limit:2,offset:0,favoritesOnly:true};
beforeAll(async()=>{db=await fixture();const {createApp}=await load('create-app');app=await createApp(await db.limitedPool(),{secret:randomBytes(32).toString('hex'),browserOrigin:ORIGIN,schemaName:db.schema});await app.listen(0,'127.0.0.1');base=await app.getUrl();});
beforeEach(async()=>{
 await reset(db.pool);cookie='';
 // Node has no browser cookie jar. Resolve only this owned API URL and transport
 // its opaque Set-Cookie; every body/status comes from the actual HTTP/SQL server.
 vi.stubGlobal('fetch',async(input:string,options:RequestInit={})=>{
  const url=new URL(input,base);if(url.origin!==base)throw new Error('Wire test refuses external requests');
  const headers=new Headers(options.headers);
  if(options.credentials==='same-origin'&&cookie)headers.set('Cookie',cookie);
  if(!['GET','HEAD','OPTIONS'].includes(options.method??'GET'))headers.set('Origin',ORIGIN);
  const response=await actualFetch(url,{...options,headers});
  for(const value of response.headers.getSetCookie())if(value.startsWith('brodcasting.part05.sid=')){const pair=value.split(';',1)[0];cookie=pair==='brodcasting.part05.sid='?'':pair;}
  return response;
 });
});
afterEach(()=>vi.unstubAllGlobals());afterAll(async()=>{await app?.close();await db?.close();});
async function register(username:string){const password=randomBytes(20).toString('hex'),session=await api.getSession();const user=await api.register({username,password},session.csrfToken);expect(user.username).toBe(username);return{user,password};}
it('실제 client 함수의 가입/로그인/쿠키/CSRF로 개인 즐겨찾기를 저장한다',async()=>{
 const account=await register('wire_a'),anonymous=await api.getSession(),session=await api.login({username:'wire_a',password:account.password},anonymous.csrfToken);
 expect(session.user?.id).toBe(account.user.id);await api.setFavorite(account.user.id,'a',true,session.csrfToken);
 expect((await api.fetchPage(query,new AbortController().signal)).items.map((row:any)=>row.id)).toEqual(['a']);
 await api.logout(session.csrfToken);await expect(api.fetchPage(query,new AbortController().signal)).rejects.toMatchObject({status:401});
});
it('계정을 바꿔도 다른 계정의 경로는 실제403이며 원본 행이 남는다',async()=>{
 const first=await register('wire_a'),second=await register('wire_b'),anonymous=await api.getSession();
 const a=await api.login({username:'wire_a',password:first.password},anonymous.csrfToken);await api.setFavorite(first.user.id,'a',true,a.csrfToken);await api.logout(a.csrfToken);
 const next=await api.getSession(),b=await api.login({username:'wire_b',password:second.password},next.csrfToken);
 expect((await api.fetchPage(query,new AbortController().signal)).items).toEqual([]);
 await expect(api.setFavorite(first.user.id,'a',false,b.csrfToken)).rejects.toMatchObject({status:403});
 expect((await db.pool.query('SELECT user_id,broadcast_id FROM favorites')).rows).toEqual([{user_id:first.user.id,broadcast_id:'a'}]);
});
it('실제 서버의 방별 권한과 공지 문자열을 client가 그대로 사용한다',async()=>{
 const account=await register('wire_a');await(await load('db-config')).grantRoomAdmin(db.pool,'wire_a','r1');
 const anonymous=await api.getSession(),session=await api.login({username:'wire_a',password:account.password},anonymous.csrfToken);
 expect((await api.getRoom('r1',new AbortController().signal)).canEdit).toBe(true);
 const notice='<strong data-probe="wire">일반 텍스트</strong>';expect((await api.updateNotice('r1',notice,session.csrfToken)).notice).toBe(notice);
 await expect(api.updateNotice('r2','다른 방 변경',session.csrfToken)).rejects.toMatchObject({status:403});
 expect((await db.pool.query("SELECT notice FROM rooms WHERE id='r2'")).rows[0].notice).toBe('다른 공지');
});
