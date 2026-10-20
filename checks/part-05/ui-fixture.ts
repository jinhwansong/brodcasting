import {vi} from 'vitest';
export const A={id:'a1111111-1111-4111-8111-111111111111',username:'learner_a'},B={id:'b2222222-2222-4222-8222-222222222222',username:'learner_b'};
export const PASSWORD='public-ui-test-password';
export const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
export function createServer(){
 const server={user:null as typeof A|null,favorites:new Set<string>(),notices:{r1:'처음 공지',r2:'다른 방 공지'} as Record<string,string>,denyRoom:false,loginStatus:200,
  onFavorite:null as null|((url:URL,options:RequestInit)=>Promise<Response>),onNotice:null as null|((url:URL,options:RequestInit)=>Promise<Response>),onRoom:null as null|((id:string)=>Promise<Response>)};
 const token=()=>server.user?.id===A.id?'test-csrf-a':server.user?.id===B.id?'test-csrf-b':'test-anon';
 const room=(id:string)=>({id,title:id==='r1'?'첫 번째 방':'두 번째 방',notice:server.notices[id],canEdit:!server.denyRoom&&(server.user?.id===A.id&&id==='r1'||server.user?.id===B.id&&id==='r2')});
 const fetch=vi.fn(async(input:string,options:RequestInit={})=>{
  const url=new URL(input,'http://local'),method=options.method??'GET';
  if(url.pathname==='/api/auth/session')return json({user:server.user,csrfToken:token()});
  if(url.pathname==='/api/auth/login'){
   if(server.loginStatus!==200)return json({},server.loginStatus);
   const credentials=JSON.parse(String(options.body));server.user=credentials.username==='learner_b'?B:A;return json({user:server.user,csrfToken:token()});
  }
  if(url.pathname==='/api/auth/register')return json({...A,username:JSON.parse(String(options.body)).username},201);
  if(url.pathname==='/api/auth/logout'){server.user=null;return new Response(null,{status:204});}
  if(url.pathname==='/api/broadcasts'){
   const offset=Number(url.searchParams.get('offset')??0),id=offset?'b':'a',favorite=!!server.user&&server.favorites.has(server.user.id+':'+id);
   return json({items:[{id,title:'방송 '+id,hostName:'host',viewerCount:10,description:'text',favorite}],limit:2,offset,hasMore:offset===0});
  }
  if(url.pathname.includes('/favorites/')){
   if(server.onFavorite)return server.onFavorite(url,options);
   const parts=url.pathname.split('/'),userId=decodeURIComponent(parts[3]),id=decodeURIComponent(parts[5]);
   if(method==='PUT')server.favorites.add(userId+':'+id);else server.favorites.delete(userId+':'+id);
   return json({id,favorite:method==='PUT'});
  }
  if(url.pathname.startsWith('/api/rooms/')){
   const id=decodeURIComponent(url.pathname.split('/')[3]);
   if(method==='GET')return server.onRoom?server.onRoom(id):json(room(id));
   if(server.onNotice)return server.onNotice(url,options);
   server.notices[id]=JSON.parse(String(options.body)).notice;return json(room(id));
  }
  throw new Error('Unexpected test route '+url.pathname);
 });
 return{server,fetch,room};
}
