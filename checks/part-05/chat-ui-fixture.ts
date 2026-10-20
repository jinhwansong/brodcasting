import {vi} from 'vitest';
type Handler=(...values:any[])=>void;
export const transport={sockets:[] as FakeSocket[],onSend:null as null|((socket:FakeSocket,payload:any)=>Promise<unknown>),onJoin:null as null|((socket:FakeSocket,payload:any)=>Promise<unknown>),reset(){this.sockets=[];this.onSend=null;this.onJoin=null;ioFake.mockClear();}};
let nextId=0;
export function message(roomId='r1',text='서버 메시지'){
 return{id:'a1111111-1111-4111-8111-'+String(++nextId).padStart(12,'0'),roomId,text,user:{id:'a1111111-1111-4111-8111-111111111111',username:'chat_user'},sentAt:'2026-10-20T00:00:00.000Z'};
}
export class FakeSocket{
 connected=false;roomId='';handlers=new Map<string,Set<Handler>>();
 on(name:string,handler:Handler){if(!this.handlers.has(name))this.handlers.set(name,new Set());this.handlers.get(name)!.add(handler);return this;}
 off(name:string,handler:Handler){this.handlers.get(name)?.delete(handler);return this;}
 receive(name:string,...values:unknown[]){for(const handler of this.handlers.get(name)??[])handler(...values);}
 connect(){this.connected=true;queueMicrotask(()=>this.receive('connect'));return this;}
 disconnect(){this.connected=false;this.receive('disconnect','io client disconnect');return this;}
 timeout(_milliseconds:number){return this;}
 async emitWithAck(event:string,payload:any){
  if(event==='room:join'){this.roomId=payload.roomId;return transport.onJoin?transport.onJoin(this,payload):{ok:true,data:{roomId:this.roomId}};}
  if(event==='chat:send'){
   if(transport.onSend)return transport.onSend(this,payload);
   const value=message(payload.roomId,payload.text);this.receive('chat:message',value);return{ok:true,data:value};
  }
  throw new Error('Unsupported test event');
 }
}
export const ioFake=vi.fn((_uri?:unknown,_options?:unknown)=>{const socket=new FakeSocket();transport.sockets.push(socket);return socket;});
