import type {Credentials,SessionView,User} from './types';
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
export type Notification={id:string;seq:string;body:string;createdAt:string;readAt:string|null};
export type NotificationPage={items:Notification[];hasMore:boolean;nextCursor:string|null};
function notification(value:unknown):value is Notification{
 return record(value)&&exact(value,['id','seq','body','createdAt','readAt'])&&typeof value.id==='string'&&uuid.test(value.id)&&typeof value.seq==='string'&&/^[1-9][0-9]{0,18}$/.test(value.seq)&&BigInt(value.seq)<=9223372036854775807n&&typeof value.body==='string'&&Array.from(value.body).length<=500&&!!value.body.trim()&&typeof value.createdAt==='string'&&Number.isFinite(Date.parse(value.createdAt))&&(value.readAt===null||typeof value.readAt==='string'&&Number.isFinite(Date.parse(value.readAt)));
}
export async function listNotifications(query:{before?:string;after?:string},signal:AbortSignal):Promise<NotificationPage>{
 const value=await readJson('/api/notifications?'+new URLSearchParams(query),{signal});
 if(!record(value)||!exact(value,['items','hasMore','nextCursor'])||!Array.isArray(value.items)||value.items.length>20||!value.items.every(notification)||typeof value.hasMore!=='boolean'||!(value.nextCursor===null||typeof value.nextCursor==='string'&&/^[1-9][0-9]{0,18}$/.test(value.nextCursor)))throw invalid('잘못된 알림 목록');
 const ascending=query.after!==undefined,items=value.items as Notification[];
 if(items.some(row=>query.after!==undefined&&BigInt(row.seq)<=BigInt(query.after)||query.before!==undefined&&BigInt(row.seq)>=BigInt(query.before)))throw invalid('잘못된 알림 경계');
 if(new Set(items.map(row=>row.id)).size!==items.length||items.some((row,index)=>index>0&&(ascending?BigInt(items[index-1].seq)>=BigInt(row.seq):BigInt(items[index-1].seq)<=BigInt(row.seq)))||value.hasMore&&(items.length!==20||value.nextCursor!==items.at(-1)?.seq)||!value.hasMore&&value.nextCursor!==null)throw invalid('잘못된 알림 순서');
 return{items,hasMore:value.hasMore,nextCursor:value.nextCursor};
}
const writeOptions=(body:object,csrf:string):RequestInit=>({method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify(body)});
export async function createNotification(input:{clientKey:string;body:string},csrf:string):Promise<{id:string;duplicate:boolean;queued:boolean}>{
 const value=await readJson('/api/notifications/demo',writeOptions(input,csrf));if(!record(value)||!exact(value,['id','duplicate','queued'])||typeof value.id!=='string'||!uuid.test(value.id)||typeof value.duplicate!=='boolean'||typeof value.queued!=='boolean')throw invalid('잘못된 알림 접수');return{id:value.id,duplicate:value.duplicate,queued:value.queued};
}
export async function readNotification(id:string,csrf:string):Promise<{id:string;readAt:string}>{
 const value=await readJson('/api/notifications/'+encodeURIComponent(id)+'/read',writeOptions({},csrf));if(!record(value)||!exact(value,['id','readAt'])||value.id!==id||typeof value.readAt!=='string'||!Number.isFinite(Date.parse(value.readAt)))throw invalid('잘못된 읽음 응답');return{id,readAt:value.readAt};
}
export async function replayNotifications(csrf:string):Promise<{pending:number;queued:number}>{
 const value=await readJson('/api/notifications/replay',writeOptions({},csrf));if(!record(value)||!exact(value,['pending','queued'])||!Number.isInteger(value.pending)||!Number.isInteger(value.queued)||Number(value.pending)<0||Number(value.pending)>50||Number(value.queued)<0||Number(value.queued)>Number(value.pending))throw invalid('잘못된 복구 접수');return{pending:Number(value.pending),queued:Number(value.queued)};
}
