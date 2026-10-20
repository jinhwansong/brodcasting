import {expect,it,vi} from 'vitest';
import * as api from '@submission/api';
const user={id:'a1111111-1111-4111-8111-111111111111',username:'learner_a'};
const session={user,csrfToken:'test-csrf-a'},credentials={username:'learner_a',password:'public-ui-test-password'};
const row={id:'a',title:'방송 a',hostName:'host',viewerCount:1,description:'text',favorite:false};
const query={search:'React & 한글',sort:'viewers-desc' as const,limit:2,offset:0,favoritesOnly:false};
const page={items:[row],limit:2,offset:0,hasMore:false};
const room={id:'r1',title:'첫 번째 방',notice:'처음 공지',canEdit:true};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
it('세션 조회는 같은 origin 쿠키와 no-store를 사용한다',async()=>{
 const mock=vi.fn().mockResolvedValue(json(session));vi.stubGlobal('fetch',mock);
 expect(await api.getSession()).toEqual(session);expect(mock.mock.calls[0]).toEqual(['/api/auth/session',expect.objectContaining({credentials:'same-origin',cache:'no-store'})]);
});
it('동시 초기 세션 조회를 합치고 완료 뒤에는 새로 조회한다',async()=>{
 let release!:(res:Response)=>void;const mock=vi.fn().mockImplementationOnce(()=>new Promise(resolve=>{release=resolve;})).mockResolvedValueOnce(json({user:null,csrfToken:'test-anon'}));vi.stubGlobal('fetch',mock);
 const first=api.getSession(),second=api.getSession();expect(mock).toHaveBeenCalledTimes(1);release(json(session));
 expect(await first).toEqual(session);expect(await second).toEqual(session);
 expect(await api.getSession()).toEqual({user:null,csrfToken:'test-anon'});expect(mock).toHaveBeenCalledTimes(2);
});
it('로그인은 비밀번호를 JSON에만 보내고 CSRF를 헤더로 전달한다',async()=>{
 const mock=vi.fn().mockResolvedValue(json(session));vi.stubGlobal('fetch',mock);
 expect(await api.login(credentials,'test-anon')).toEqual(session);
 const [url,options]=mock.mock.calls[0];expect(url).toBe('/api/auth/login');
 expect(options).toMatchObject({method:'POST',credentials:'same-origin',cache:'no-store'});
 expect(new Headers(options.headers).get('x-csrf-token')).toBe('test-anon');expect(JSON.parse(options.body)).toEqual(credentials);
});
it('가입은 User를 반환하고 자동 로그인 요청을 만들지 않는다',async()=>{
 const mock=vi.fn().mockResolvedValue(json(user,201));vi.stubGlobal('fetch',mock);
 expect(await api.register(credentials,'test-anon')).toEqual(user);expect(mock).toHaveBeenCalledTimes(1);expect(mock.mock.calls[0][0]).toBe('/api/auth/register');
});
it('로그인200이라도 익명 응답이면 인증 성공으로 취급하지 않는다',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(json({user:null,csrfToken:'test-anon'})));
 await expect(api.login(credentials,'test-anon')).rejects.toMatchObject({status:200});
});
it('로그아웃204는 JSON을 읽지 않고 POST와 CSRF를 사용한다',async()=>{
 const mock=vi.fn().mockResolvedValue(new Response(null,{status:204}));vi.stubGlobal('fetch',mock);
 await api.logout('test-csrf-a');expect(mock).toHaveBeenCalledTimes(1);const [url,options]=mock.mock.calls[0];expect(url).toBe('/api/auth/logout');expect(options.method).toBe('POST');
 expect(new Headers(options.headers).get('x-csrf-token')).toBe('test-csrf-a');
});
it('잘못된 로그아웃 응답을 성공으로 확정하지 않는다',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(json({ok:true})));await expect(api.logout('test-csrf-a')).rejects.toMatchObject({status:200});});
it('개인 즐겨찾기 경로를 인코딩하고 현재 CSRF로 PUT/DELETE한다',async()=>{
 const mock=vi.fn().mockResolvedValueOnce(json({id:'a/b',favorite:true})).mockResolvedValueOnce(json({id:'a/b',favorite:false}));vi.stubGlobal('fetch',mock);
 expect(await api.setFavorite('user/id','a/b',true,'test-csrf-a')).toEqual({id:'a/b',favorite:true});await api.setFavorite('user/id','a/b',false,'test-csrf-a');
 expect(mock).toHaveBeenCalledTimes(2);
 expect(mock.mock.calls[0][0]).toBe('/api/users/user%2Fid/favorites/a%2Fb');
 expect(mock.mock.calls[0][1].method).toBe('PUT');expect(mock.mock.calls[1][1].method).toBe('DELETE');
 expect(new Headers(mock.mock.calls[0][1].headers).get('x-csrf-token')).toBe('test-csrf-a');expect(mock.mock.calls[0][1].body).toBeUndefined();
});
it('목록 query와 abort signal을 전달하고 Page를 검사한다',async()=>{
 const signal=new AbortController().signal,mock=vi.fn().mockResolvedValue(json(page));vi.stubGlobal('fetch',mock);
 expect(await api.fetchPage(query,signal)).toEqual(page);const [url,options]=mock.mock.calls[0];
 expect(new URL(url,'http://local').searchParams.get('search')).toBe(query.search);expect(options).toMatchObject({signal,credentials:'same-origin',cache:'no-store'});
});
it('방 조회는 id와 signal을 전달하고 서버 canEdit을 읽는다',async()=>{
 const signal=new AbortController().signal,mock=vi.fn().mockResolvedValue(json({...room,id:'r/1',canEdit:false}));vi.stubGlobal('fetch',mock);
 expect(await api.getRoom('r/1',signal)).toMatchObject({id:'r/1',canEdit:false});expect(mock).toHaveBeenCalledTimes(1);expect(mock.mock.calls[0][0]).toBe('/api/rooms/r%2F1');expect(mock.mock.calls[0][1].signal).toBe(signal);
});
it('공지 변경은 notice만 JSON으로 보내고 결과를 확인한다',async()=>{
 const notice='새 안내\n둘째 줄',mock=vi.fn().mockResolvedValue(json({...room,notice}));vi.stubGlobal('fetch',mock);
 expect(await api.updateNotice('r1',notice,'test-csrf-a')).toEqual({...room,notice});
 expect(mock.mock.calls[0][0]).toBe('/api/rooms/r1/notice');expect(JSON.parse(mock.mock.calls[0][1].body)).toEqual({notice});
 expect(new Headers(mock.mock.calls[0][1].headers).get('x-csrf-token')).toBe('test-csrf-a');
});
it.each([401,403,429,503])('HTTP%s를 구분하고 로그인 요청을 자동 재시도하지 않는다',async status=>{
 const mock=vi.fn().mockResolvedValue(json({},status));vi.stubGlobal('fetch',mock);await expect(api.login(credentials,'test-anon')).rejects.toMatchObject({status});expect(mock).toHaveBeenCalledTimes(1);
});
it.each([{user,csrfToken:''},{user:{...user,id:'bad'},csrfToken:'test-token'},{user:{...user,passwordHash:'not-real'},csrfToken:'test-token'},{user:null}])('잘못된 세션 응답을 거부한다: %#',async value=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(json(value)));await expect(api.getSession()).rejects.toMatchObject({status:200});
});
it.each([{...page,offset:2},{...page,limit:1},{...page,items:[{...row,favorite:'yes'}]},{...page,items:[{...row,viewerCount:-1}]}])('잘못된 페이지 응답을 거부한다: %#',async value=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(json(value)));await expect(api.fetchPage(query,new AbortController().signal)).rejects.toMatchObject({status:200});
});
it('다른 방송/저장 상태 응답을 거부한다',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(json({id:'different',favorite:false})));await expect(api.setFavorite(user.id,'a',true,'test-csrf-a')).rejects.toMatchObject({status:200});
});
it('다른 방이나 잘못된 canEdit 응답을 거부한다',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce(json({...room,id:'r2'})).mockResolvedValueOnce(json({...room,canEdit:'admin'})));
 await expect(api.updateNotice('r1','변경','test-csrf-a')).rejects.toMatchObject({status:200});await expect(api.getRoom('r1',new AbortController().signal)).rejects.toMatchObject({status:200});
});
it('JSON 오류를 정제하고 abort 오류는 그대로 전달한다',async()=>{
 const aborted=new DOMException('Aborted','AbortError');vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce(new Response('invalid json',{status:200})).mockRejectedValueOnce(aborted));
 await expect(api.getRoom('r1',new AbortController().signal)).rejects.toMatchObject({status:200});await expect(api.fetchPage(query,new AbortController().signal)).rejects.toBe(aborted);
});
