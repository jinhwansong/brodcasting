import {expect,it,vi} from 'vitest';
import {fetchPage,setFavorite} from '@submission/api';
const row={id:'a',title:'방송 a',hostName:'host',viewerCount:1,description:'text',favorite:false};
const query={search:'React & 한글',sort:'viewers-desc' as const,limit:2,offset:0,favoritesOnly:false};
const page={items:[row],limit:2,offset:0,hasMore:false};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
it('페이지 조건을 인코딩하고 signal·no-store를 전달한다',async()=>{
  const signal=new AbortController().signal;const mock=vi.fn().mockResolvedValue(json(page));vi.stubGlobal('fetch',mock);
  expect(await fetchPage(query,signal)).toEqual(page);
  const [url,options]=mock.mock.calls[0];expect(new URL(url,'http://local').searchParams.get('search')).toBe(query.search);expect(options).toMatchObject({signal,cache:'no-store'});
});
it.each([400,503])('HTTP%s를 성공 JSON으로 취급하지 않는다',async status=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(json({items:[]},status)));await expect(fetchPage(query,new AbortController().signal)).rejects.toMatchObject({status});});
it.each([{...page,items:[{...row,favorite:'yes'}]},{...page,hasMore:'yes'},{...page,limit:1},{...page,offset:2},{...page,items:[{...row,viewerCount:-1}]}])('잘못된 Page 구조를 거부한다: %j',async body=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(json(body)));await expect(fetchPage(query,new AbortController().signal)).rejects.toMatchObject({status:200});});
it('저장 API는 id를 인코딩하고 PUT/DELETE 응답을 확인한다',async()=>{
  const mock=vi.fn().mockResolvedValueOnce(json({id:'a/b',favorite:true})).mockResolvedValueOnce(json({id:'a/b',favorite:false}));vi.stubGlobal('fetch',mock);
  expect(await setFavorite('a/b',true)).toEqual({id:'a/b',favorite:true});expect(await setFavorite('a/b',false)).toEqual({id:'a/b',favorite:false});
  expect(mock.mock.calls[0][0]).toBe('/api/favorites/a%2Fb');expect(mock.mock.calls[0][1]).toMatchObject({method:'PUT'});expect(mock.mock.calls[1][1]).toMatchObject({method:'DELETE'});
});
it('저장 응답의 id/상태가 다르면 거부한다',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(json({id:'different',favorite:false})));await expect(setFavorite('a',true)).rejects.toMatchObject({status:200});});
