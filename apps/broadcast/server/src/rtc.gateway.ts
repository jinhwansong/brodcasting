import {WebSocketGateway,SubscribeMessage,ConnectedSocket,MessageBody,type OnGatewayInit} from '@nestjs/websockets';
import {HttpException,UnauthorizedException,NotFoundException,type OnModuleDestroy} from '@nestjs/common';
import type {Namespace,Socket} from 'socket.io';
import type {Response} from 'express';
import type {IncomingMessage,ServerResponse} from 'node:http';
import {SessionRuntime,type SessionRequest} from './session.js';
import {RtcRooms,fields,roomId,signal,title} from './rtc-rooms.js';
import type {User} from './types.js';
@WebSocketGateway({namespace:'/rtc',path:'/rtc.io',transports:['websocket'],maxHttpBufferSize:32768,serveClient:false})
export class RtcGateway implements OnGatewayInit,OnModuleDestroy{
 private server!:Namespace;
 private timer?:ReturnType<typeof setInterval>;
 private sweeping=false;
 private stopped=false;
 constructor(private readonly sessions:SessionRuntime,private readonly rooms:RtcRooms){}
 afterInit(server:Namespace){
  this.server=server;
  server.server.engine.use((req:IncomingMessage,res:ServerResponse,next:(error?:Error)=>void)=>this.sessions.middleware(req as SessionRequest,res as Response,error=>{
   if(error)(req as SessionRequest&{sessionLoadFailed?:boolean}).sessionLoadFailed=true;next();
  }));
  server.use((socket,next)=>{
   if((socket.request as SessionRequest&{sessionLoadFailed?:boolean}).sessionLoadFailed){next(new Error('Service unavailable'));return;}
   if(server.server.engine.clientsCount>20){next(new Error('Connection limit reached'));return;}
   void this.sessions.socketUser(socket.request as SessionRequest).then(user=>{
    if(!user){next(new Error('Authentication required'));return;}socket.data.userId=user.id;next();
   }).catch(()=>next(new Error('Service unavailable')));
  });
  this.timer=setInterval(()=>{void this.sweep();},1000);this.timer.unref();
 }
 private leave(socket:Socket){
  const left=this.rooms.leave(socket.id);
  for(const id of left.ended)this.server.sockets.get(id)?.emit('rtc:ended');
  if(left.publisher)this.server.sockets.get(left.publisher)?.emit('rtc:peer-left',{peerId:socket.id});
  this.server.emit('rtc:rooms',this.rooms.list());
 }
 handleDisconnect(socket:Socket){this.leave(socket);}
 private async user(socket:Socket):Promise<User>{
  const user=await this.sessions.socketUser(socket.request as SessionRequest);
  if(!socket.connected||!user||user.id!==socket.data.userId){this.leave(socket);socket.disconnect(true);throw new UnauthorizedException();}return user;
 }
 private async run<T>(socket:Socket,work:(user:User)=>Promise<T>){
  const now=Date.now();if(!socket.data.windowAt||now-socket.data.windowAt>=1000){socket.data.windowAt=now;socket.data.count=0;}
  if(++socket.data.count>20||(socket.data.pending??0)>=4)return{ok:false,code:429,message:'RTC limit reached'};
  socket.data.pending=(socket.data.pending??0)+1;
  const job:Promise<T>=(socket.data.tail??Promise.resolve()).then(async()=>work(await this.user(socket)));
  socket.data.tail=job.then(()=>undefined,()=>undefined);
  try{return{ok:true,data:await job};}catch(error){const status=error instanceof HttpException?error.getStatus():503;return{ok:false,code:[400,401,403,404,409,429].includes(status)?status:503,message:'RTC request failed'};}finally{socket.data.pending--;}
 }
 @SubscribeMessage('rtc:list')
 list(@ConnectedSocket() socket:Socket,@MessageBody() value:unknown){return this.run(socket,async()=>{fields(value,[]);return this.rooms.list();});}
 @SubscribeMessage('rtc:publish')
 publish(@ConnectedSocket() socket:Socket,@MessageBody() value:unknown){return this.run(socket,async user=>{const result=this.rooms.publish(socket.id,user,title(value));this.server.emit('rtc:rooms',this.rooms.list());return result;});}
 @SubscribeMessage('rtc:watch')
 watch(@ConnectedSocket() socket:Socket,@MessageBody() value:unknown){return this.run(socket,async()=>{
  const row=fields(value,['roomId']),id=roomId(row.roomId),result=this.rooms.watch(socket.id,id),publisher=this.server.sockets.get(result.publisherId);
  if(!publisher){this.leave(socket);throw new NotFoundException();}
  try{await this.user(publisher);}catch(error){this.leave(socket);throw error;}
  if(!socket.connected){this.leave(socket);throw new UnauthorizedException();}
  publisher.emit('rtc:viewer',{roomId:id,peerId:socket.id});this.server.emit('rtc:rooms',this.rooms.list());return result;
 });}
 @SubscribeMessage('rtc:signal')
 relay(@ConnectedSocket() socket:Socket,@MessageBody() value:unknown){return this.run(socket,async()=>{
  const input=signal(value);this.rooms.authorizeSignal(socket.id,input);const target=this.server.sockets.get(input.target);if(!target)throw new NotFoundException();
  await this.user(target);this.rooms.authorizeSignal(socket.id,input);if(!socket.connected)throw new UnauthorizedException();
  target.emit('rtc:signal',{roomId:input.roomId,from:socket.id,type:input.type,sdp:input.sdp});return{};
 });}
 @SubscribeMessage('rtc:leave')
 stop(@ConnectedSocket() socket:Socket,@MessageBody() value:unknown){return this.run(socket,async()=>{fields(value,[]);this.leave(socket);return{};});}
 private async sweep(){if(this.sweeping||this.stopped)return;this.sweeping=true;try{for(const socket of this.server.sockets.values()){
  if(this.stopped)break;try{await this.user(socket);}catch(error){if(!(error instanceof UnauthorizedException)){this.leave(socket);socket.disconnect(true);}}
 }}finally{this.sweeping=false;}}
 onModuleDestroy(){this.stopped=true;clearInterval(this.timer);}
}
