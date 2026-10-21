import {deliver,DELIVERY_WIDTH} from './delivery.js';
import {WebSocketGateway,SubscribeMessage,ConnectedSocket,MessageBody,type OnGatewayInit} from '@nestjs/websockets';
import type {Server,Socket} from 'socket.io';
import {Inject,HttpException,UnauthorizedException,ConflictException,type OnModuleDestroy} from '@nestjs/common';
import type {Response} from 'express';
import type {IncomingMessage,ServerResponse} from 'node:http';
import type {User} from './types.js';
import {SessionRuntime,type SessionRequest} from './session.js';
import {ChatService} from './chat.service.js';
import type {Ack,ChatCode,JoinInput,Message,HistoryPage} from './chat.types.js';
@WebSocketGateway({transports:['websocket'],maxHttpBufferSize:8192,serveClient:false})
export class ChatGateway implements OnGatewayInit,OnModuleDestroy{
 private server!:Server;
 private timer?:ReturnType<typeof setInterval>;
 private sweeping=false;
 private stopped=false;
 constructor(private readonly sessions:SessionRuntime,private readonly chat:ChatService,@Inject(DELIVERY_WIDTH) private readonly width:1|4){}
 afterInit(server:Server){
  this.server=server;
  server.engine.use((req:IncomingMessage,res:ServerResponse,next:(error?:Error)=>void)=>this.sessions.middleware(req as SessionRequest,res as Response,error=>{
   if(error)(req as SessionRequest&{sessionLoadFailed?:boolean}).sessionLoadFailed=true;next();
  }));
  server.use((socket,next)=>{
   if((socket.request as SessionRequest&{sessionLoadFailed?:boolean}).sessionLoadFailed){next(Object.assign(new Error('Service unavailable'),{data:{code:503}}));return;}
   if(server.engine.clientsCount>20){next(Object.assign(new Error('Connection limit reached'),{data:{code:429}}));return;}
   void this.sessions.socketUser(socket.request as SessionRequest).then(user=>{
   if(!user){next(Object.assign(new Error('Authentication required'),{data:{code:401}}));return;}
   socket.data.userId=user.id;next();
   }).catch(()=>next(Object.assign(new Error('Service unavailable'),{data:{code:503}})));
  });
  this.timer=setInterval(()=>{void this.sweep();},1000);this.timer.unref();
 }
 private failure(error:unknown):{ok:false;code:ChatCode;message:string}{
  const status=error instanceof HttpException?error.getStatus():503;
  const code:ChatCode=[400,401,403,409,429].includes(status)?status as ChatCode:503;
  const messages={400:'Invalid payload',401:'Authentication required',403:'Room membership required',409:'Join the selected room first',429:'Chat limit reached',503:'Service unavailable'};
  return{ok:false,code,message:messages[code]};
 }
 private invalidate(socket:Socket){
  socket.emit('chat:error',{code:401,message:'Authentication required'});setImmediate(()=>socket.disconnect(true));
 }
 private async user(socket:Socket):Promise<User>{
  const user=await this.sessions.socketUser(socket.request as SessionRequest);
  if(!socket.connected||!user||user.id!==socket.data.userId){this.invalidate(socket);throw new UnauthorizedException();}
  return user;
 }
 private async run<T>(socket:Socket,work:(user:User)=>Promise<T>):Promise<Ack<T>>{
  const now=Date.now();if(!socket.data.windowAt||now-socket.data.windowAt>=1000){socket.data.windowAt=now;socket.data.count=0;}
  if(++socket.data.count>10||(socket.data.pending??0)>=4)return{ok:false,code:429,message:'Chat limit reached'};
  socket.data.pending=(socket.data.pending??0)+1;
  const job:Promise<T>=(socket.data.tail??Promise.resolve()).then(async()=>work(await this.user(socket)));
  socket.data.tail=job.then(()=>undefined,()=>undefined);
  try{return{ok:true,data:await job};}catch(error){return this.failure(error);}finally{socket.data.pending--;}
 }
 @SubscribeMessage('room:join')
 async join(@ConnectedSocket() socket:Socket,@MessageBody() value:unknown):Promise<Ack<JoinInput>>{
  return this.run(socket,async user=>{
   const input=this.chat.parseJoin(value);
   socket.data.roomVersion=(socket.data.roomVersion??0)+1;
   if(socket.data.roomId)await socket.leave(socket.data.roomId);socket.data.roomId=undefined;
   await this.chat.authorize(user,input.roomId);
   if(!socket.connected)throw new UnauthorizedException();await socket.join(input.roomId);socket.data.roomId=input.roomId;return input;
  });
 }
 @SubscribeMessage('chat:send')
 async send(@ConnectedSocket() socket:Socket,@MessageBody() value:unknown):Promise<Ack<Message>>{
  return this.run(socket,async user=>{
   const input=this.chat.parseSend(value);if(socket.data.roomId!==input.roomId)throw new ConflictException();
   await this.chat.authorize(user,input.roomId);const saved=await this.chat.save(user,input),message=saved.message;
   if(!saved.inserted)return message;
   await deliver([...this.server.sockets.sockets.values()],this.width,async target=>{
    if(target.data.roomId!==input.roomId)return;
    const version=target.data.roomVersion;
    try{
     const recipient=await this.user(target);await this.chat.authorize(recipient,input.roomId);
     if(target.connected&&target.data.roomId===input.roomId&&target.data.roomVersion===version)target.emit('chat:message',message);
    }catch(error){const failure=this.failure(error);
     if(failure.code===401)return;
     if(failure.code===403){if(target.data.roomVersion===version){await target.leave(input.roomId);target.data.roomId=undefined;target.emit('chat:error',{code:403,message:failure.message});}return;}
     throw error;
    }
   });
   return message;
  });
 }
 @SubscribeMessage('chat:history')
 async history(@ConnectedSocket() socket:Socket,@MessageBody() value:unknown):Promise<Ack<HistoryPage>>{
  return this.run(socket,async user=>{
   const input=this.chat.parseHistory(value);if(socket.data.roomId!==input.roomId)throw new ConflictException();
   return this.chat.history(user,input);
  });
 }
 private async sweep():Promise<void>{
  if(this.sweeping||this.stopped)return;this.sweeping=true;
  try{for(const socket of this.server.sockets.sockets.values()){
   if(this.stopped)break;
   const selected=socket.data.roomId,version=socket.data.roomVersion;
   try{const user=await this.user(socket);if(selected)await this.chat.authorize(user,selected);}
   catch(error){const failure=this.failure(error);if(failure.code===401)continue;
    if(failure.code===403){if(socket.data.roomVersion!==version)continue;if(selected)await socket.leave(selected);socket.data.roomId=undefined;}
    socket.emit('chat:error',{code:failure.code,message:failure.message});
   }
  }}finally{this.sweeping=false;}
 }
 activeConnections(){return this.server?.engine.clientsCount??0;}
 onModuleDestroy(){this.stopped=true;clearInterval(this.timer);}
}
