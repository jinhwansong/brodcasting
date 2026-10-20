import{vi}from'vitest';
type Handler=(...values:any[])=>void;
export const transport={sockets:[] as FakeSocket[],rows:[] as any[],calls:[] as {event:string;payload:any}[],onSend:null as null|((socket:FakeSocket,payload:any)=>Promise<unknown>),onJoin:null as null|((socket:FakeSocket,payload:any)=>Promise<unknown>),onHistory:null as null|((socket:FakeSocket,payload:any)=>Promise<unknown>),onConnect:null as null|((socket:FakeSocket)=>void),reset(){this.sockets=[];this.rows=[];this.calls=[];this.onSend=null;this.onJoin=null;this.onHistory=null;this.onConnect=null;nextId=0;ioFake.mockClear();}};
let nextId=0;
export function message(roomId='r1',text='서버 메시지',seq=String(++nextId),clientMessageId='c3333333-3333-4333-8333-333333333333'){
 return{id:'a1111111-1111-4111-8111-'+String(++nextId).padStart(12,'0'),seq,clientMessageId,roomId,text,user:{id:'a1111111-1111-4111-8111-111111111111',username:'chat_user'},sentAt:'2026-10-20T00:00:00.000Z'};
}
export function history(payload:any){
 const high=transport.rows.filter(r=>r.roomId===payload.roomId).reduce((max,r)=>BigInt(r.seq)>BigInt(max)?r.seq:max,'0'),until=payload.until??high;
 const rows=transport.rows.filter(r=>r.roomId===payload.roomId&&BigInt(r.seq)>BigInt(payload.after)&&BigInt(r.seq)<=BigInt(until)).sort((a,b)=>BigInt(a.seq)<BigInt(b.seq)?-1:1),items=rows.slice(0,50),done=rows.length<=50;
 return{ok:true,data:{items,until,next:done?until:items.at(-1)!.seq,done}};
}
export class FakeSocket{
 connected=false;roomId='';handlers=new Map<string,Set<Handler>>();
 on(name:string,handler:Handler){if(!this.handlers.has(name))this.handlers.set(name,new Set());this.handlers.get(name)!.add(handler);return this;}
 off(name:string,handler:Handler){this.handlers.get(name)?.delete(handler);return this;}
 receive(name:string,...values:any[]){if(name==='chat:message'&&values[0]?.seq&&!transport.rows.some(r=>r.id===values[0].id))transport.rows.push(values[0]);for(const handler of this.handlers.get(name)??[])handler(...values);}
 connect(){queueMicrotask(()=>{if(transport.onConnect){transport.onConnect(this);return;}this.connected=true;this.receive('connect');});return this;}
 disconnect(){const was=this.connected;this.connected=false;if(was)this.receive('disconnect','io client disconnect');return this;}
 timeout(_ms:number){return this;}
 async emitWithAck(event:string,payload:any){
  transport.calls.push({event,payload});
  if(event==='room:join'){this.roomId=payload.roomId;return transport.onJoin?transport.onJoin(this,payload):{ok:true,data:{roomId:this.roomId}};}
  if(event==='chat:history')return transport.onHistory?transport.onHistory(this,payload):history(payload);
  if(event==='chat:send'){
   if(transport.onSend)return transport.onSend(this,payload);
   const value=message(payload.roomId,payload.text,undefined,payload.clientMessageId);value.user={id:'a1111111-1111-4111-8111-111111111111',username:'learner_a'};this.receive('chat:message',value);return{ok:true,data:value};
  }
  throw Error('Unsupported fixture event');
 }
}
export const ioFake=vi.fn((_uri?:unknown,_options?:unknown)=>{const socket=new FakeSocket();transport.sockets.push(socket);return socket;});
