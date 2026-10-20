import {afterAll,afterEach,beforeAll,beforeEach,expect,it,vi} from 'vitest';
import {randomBytes,randomUUID} from 'node:crypto';
import {io,type Socket} from 'socket.io-client';
import {fixture,load,reset} from './db-fixture';
import {CookieJar,ORIGIN} from './cookie-jar';
export let f:Awaited<ReturnType<typeof fixture>>,app:any,base:string;
export let actors:{jar:CookieJar;user:{id:string;username:string}}[],sockets:Socket[]=[];
export function setup(){
beforeAll(async()=>{f=await fixture();});
beforeEach(async()=>{
 await reset(f.pool);const {createApp}=await load('create-app');app=await createApp(await f.limitedPool(),{secret:randomBytes(32).toString('hex'),schemaName:f.schema,browserOrigin:ORIGIN,authRateLimit:{windowMs:60000,limit:1000}});
 await app.listen(0,'127.0.0.1');base=await app.getUrl();actors=[];
 for(const username of ['chat_a','chat_b','chat_c']){
  const jar=new CookieJar(base),password=randomBytes(24).toString('hex');await jar.session();
  expect((await jar.request('auth/register',{method:'POST',json:{username,password}})).status).toBe(201);
  const view=await jar.login(username,password);actors.push({jar,user:view.user});
 }
 for(const [index,room] of [[0,'r1'],[0,'r2'],[1,'r1'],[2,'r2']] as const)await f.pool.query('INSERT INTO room_members(user_id,room_id) VALUES($1,$2)',[actors[index].user.id,room]);
});
afterEach(async()=>{for(const socket of sockets)socket.disconnect();sockets=[];await app?.close();});afterAll(async()=>{await f?.close();});
}
export async function shutdown(){await app?.close();app=undefined;}
export function connect(index:number|null=0,origin:string|null=ORIGIN,auth:Record<string,unknown>={}){
 const headers:Record<string,string>={};if(index!==null)headers.Cookie=actors[index].jar.cookie;if(origin!==null)headers.Origin=origin;
 const socket=io(base,{transports:['websocket'],autoConnect:false,reconnection:false,forceNew:true,timeout:1500,extraHeaders:headers,auth});sockets.push(socket);
 return new Promise<Socket>((resolve,reject)=>{socket.once('connect',()=>resolve(socket));socket.once('connect_error',error=>reject(Object.assign(new Error('Connection rejected'),{data:{code:error.data?.code??0}})));socket.connect();});
}
export const ack=(socket:Socket,event:string,payload:unknown)=>socket.timeout(2000).emitWithAck(event,event==='chat:send'&&typeof payload==='object'&&payload!==null&&!Array.isArray(payload)?{clientMessageId:randomUUID(),...payload}:payload);
export const event=(socket:Socket,name:string)=>new Promise<any>((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Expected '+name)),2500);socket.once(name,value=>{clearTimeout(timer);resolve(value);});});
export const join=async(socket:Socket,roomId:string)=>{expect(await ack(socket,'room:join',{roomId})).toEqual({ok:true,data:{roomId}});};
export const pause=(ms=100)=>new Promise(resolve=>setTimeout(resolve,ms));
