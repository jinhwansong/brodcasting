import type {Broadcast,Credentials,ListQuery,Page,Room,SessionView,User} from './types';
export class ApiError extends Error{
 constructor(public readonly status:number,message:string){super(message);this.name='ApiError';}
}
const invalid=(message:string)=>new ApiError(200,message);
const record=(value:unknown):value is Record<string,unknown>=>typeof value==='object'&&value!==null&&!Array.isArray(value);
const exact=(value:Record<string,unknown>,keys:string[])=>Object.keys(value).length===keys.length&&keys.every(key=>Object.prototype.hasOwnProperty.call(value,key));
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?![\s\S])/i;
function isUser(value:unknown):value is User{
 return record(value)&&exact(value,['id','username'])&&typeof value.id==='string'&&uuid.test(value.id)
  &&typeof value.username==='string'&&/^[a-z][a-z0-9_]{2,23}(?![\s\S])/.test(value.username);
}
function sessionView(value:unknown):SessionView{
 if(!record(value)||!exact(value,['user','csrfToken'])||!(value.user===null||isUser(value.user))
  ||typeof value.csrfToken!=='string'||value.csrfToken.length<1||value.csrfToken.length>512)throw invalid('잘못된 계정 응답');
 return{user:value.user,csrfToken:value.csrfToken};
}
async function request(url:string,options:RequestInit={}):Promise<Response>{
 const response=await fetch(url,{...options,credentials:'same-origin',cache:'no-store'});
 if(!response.ok)throw new ApiError(response.status,'HTTP '+response.status);
 return response;
}
async function readJson(url:string,options:RequestInit={}):Promise<unknown>{
 const response=await request(url,options);
 try{return await response.json();}
 catch(error){
  if(typeof error==='object'&&error!==null&&'name' in error&&error.name==='AbortError')throw error;
  throw new ApiError(response.status,'JSON 응답을 읽을 수 없습니다.');
 }
}
let pendingSession:Promise<SessionView>|null=null;
export function getSession():Promise<SessionView>{
 if(!pendingSession)pendingSession=readJson('/api/auth/session').then(sessionView).finally(()=>{pendingSession=null;});
 return pendingSession;
}
const credentialsBody=(credentials:Credentials,csrf:string):RequestInit=>({method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify({username:credentials.username,password:credentials.password})});
export async function register(credentials:Credentials,csrf:string):Promise<User>{
 const value=await readJson('/api/auth/register',credentialsBody(credentials,csrf));if(!isUser(value))throw invalid('잘못된 가입 응답');return value;
}
export async function login(credentials:Credentials,csrf:string):Promise<SessionView>{
 const view=sessionView(await readJson('/api/auth/login',credentialsBody(credentials,csrf)));
 if(!view.user)throw invalid('잘못된 로그인 응답');return view;
}
export async function logout(csrf:string):Promise<void>{
 const response=await request('/api/auth/logout',{method:'POST',headers:{'X-CSRF-Token':csrf}});
 if(response.status!==204)throw new ApiError(response.status,'잘못된 로그아웃 응답');
}
function isBroadcast(value:unknown):value is Broadcast{
 return record(value)&&typeof value.id==='string'&&value.id.length>0&&typeof value.title==='string'&&typeof value.hostName==='string'
  &&typeof value.description==='string'&&Number.isSafeInteger(value.viewerCount)&&Number(value.viewerCount)>=0&&typeof value.favorite==='boolean';
}
export async function fetchPage(query:ListQuery,signal:AbortSignal):Promise<Page>{
 const params=new URLSearchParams({search:query.search,sort:query.sort,limit:String(query.limit),offset:String(query.offset),favoritesOnly:String(query.favoritesOnly)});
 const value=await readJson('/api/broadcasts?'+params,{signal});
 if(!record(value)||!Array.isArray(value.items)||!value.items.every(isBroadcast)||value.items.length>query.limit
  ||value.limit!==query.limit||value.offset!==query.offset||typeof value.hasMore!=='boolean')throw invalid('잘못된 목록 응답');
 return{items:value.items,limit:query.limit,offset:query.offset,hasMore:value.hasMore};
}
export async function setFavorite(userId:string,id:string,enabled:boolean,csrf:string):Promise<{id:string;favorite:boolean}>{
 const value=await readJson('/api/users/'+encodeURIComponent(userId)+'/favorites/'+encodeURIComponent(id),{method:enabled?'PUT':'DELETE',headers:{'X-CSRF-Token':csrf}});
 if(!record(value)||value.id!==id||value.favorite!==enabled)throw invalid('잘못된 저장 응답');
 return{id,favorite:enabled};
}
function roomView(value:unknown,id:string):Room{
 if(!record(value)||value.id!==id||typeof value.title!=='string'||typeof value.notice!=='string'
  ||Array.from(value.notice).length>500||typeof value.canEdit!=='boolean')throw invalid('잘못된 공지 응답');
 return{id,title:value.title,notice:value.notice,canEdit:value.canEdit};
}
export async function getRoom(id:string,signal:AbortSignal):Promise<Room>{
 return roomView(await readJson('/api/rooms/'+encodeURIComponent(id),{signal}),id);
}
export async function updateNotice(id:string,notice:string,csrf:string):Promise<Room>{
 const room=roomView(await readJson('/api/rooms/'+encodeURIComponent(id)+'/notice',{method:'PUT',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify({notice})}),id);
 if(room.notice!==notice)throw invalid('잘못된 공지 저장 응답');return room;
}
