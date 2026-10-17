import 'reflect-metadata';
import {afterAll,beforeAll,beforeEach,expect,it,vi} from 'vitest';
import {fetchPage,setFavorite} from '@client-api';
import {fixture,load,reset} from './db-fixture';
let db:Awaited<ReturnType<typeof fixture>>,app:any;
beforeAll(async()=>{
  db=await fixture();const {createApp}=await load('create-app');app=await createApp(await db.limitedPool());await app.listen(0,'127.0.0.1');
  const base=await app.getUrl(),nativeFetch=globalThis.fetch;
  // 응답은 대체하지 않습니다. 상대 URL만 실제 loopback API로 해석합니다.
  vi.stubGlobal('fetch',(url:string,options?:RequestInit)=>nativeFetch(new URL(url,base),options));
});
beforeEach(async()=>{await reset(db.pool);});
afterAll(async()=>{vi.unstubAllGlobals();await app?.close();await db?.close();});
const query={search:'React',sort:'viewers-desc' as const,limit:1,offset:1,favoritesOnly:false};
it('실제 client loader→HTTP→제한 역할 SQL의 검색/페이지 계약이 일치한다',async()=>{
  const page=await fetchPage(query,new AbortController().signal);expect(page).toMatchObject({items:[{id:'a',favorite:false}],limit:1,offset:1,hasMore:false});
});
it('실제 client 저장과 즐겨찾기 조회·해제가 연결된다',async()=>{
  expect(await setFavorite('a',true)).toEqual({id:'a',favorite:true});
  const filters={...query,search:'',offset:0,limit:2,favoritesOnly:true};
  expect((await fetchPage(filters,new AbortController().signal)).items.map(x=>x.id)).toEqual(['a']);
  await setFavorite('a',false);expect((await fetchPage(filters,new AbortController().signal)).items).toEqual([]);
});
it('실제 missing 방송의404를 client가 오류로 전달한다',async()=>{await expect(setFavorite('missing',true)).rejects.toMatchObject({status:404});});
