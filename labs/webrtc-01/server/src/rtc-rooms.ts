import {BadRequestException,ConflictException,ForbiddenException,HttpException,NotFoundException} from '@nestjs/common';
import {randomUUID} from 'node:crypto';
import type {User} from './types.js';
export type LiveRoom={id:string;title:string;hostName:string;viewers:number;maxViewers:number};
export type Signal={roomId:string;target:string;type:'offer'|'answer';sdp:string};
export function fields(value:unknown,keys:string[]):Record<string,unknown>{
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==keys.length||!keys.every(key=>Object.hasOwn(value,key)))throw new BadRequestException('Invalid RTC payload');return value as Record<string,unknown>;
}
export function roomId(value:unknown):string{
 if(typeof value!=='string'||value.length!==36||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value))throw new BadRequestException('Invalid RTC room');return value;
}
export function title(value:unknown):string{const row=fields(value,['title']);if(typeof row.title!=='string'||!row.title.trim()||Array.from(row.title).length>60)throw new BadRequestException('Invalid RTC title');return row.title.trim();}
export function signal(value:unknown):Signal{
 const row=fields(value,['roomId','target','type','sdp']);
 if(typeof row.target!=='string'||row.target.length<1||row.target.length>100||!['offer','answer'].includes(String(row.type))||typeof row.type!=='string'||typeof row.sdp!=='string'||row.sdp.length>20000||!row.sdp.startsWith('v=0')||!/^[\t\r\n\x20-\x7e]+$/.test(row.sdp))throw new BadRequestException('Invalid RTC signal');
 return{roomId:roomId(row.roomId),target:row.target,type:row.type as Signal['type'],sdp:row.sdp};
}
export class RtcRooms{
 private readonly rooms=new Map<string,{id:string;title:string;hostName:string;userId:string;publisher:string;viewers:Set<string>}>();
 private member(socketId:string){return[...this.rooms.values()].some(room=>room.publisher===socketId||room.viewers.has(socketId));}
 list():LiveRoom[]{return[...this.rooms.values()].map(room=>({id:room.id,title:room.title,hostName:room.hostName,viewers:room.viewers.size,maxViewers:4}));}
 publish(socketId:string,user:User,heading:string):LiveRoom{
  if(this.member(socketId)||[...this.rooms.values()].some(room=>room.userId===user.id))throw new ConflictException('Already participating');
  if(this.rooms.size>=5)throw new HttpException('RTC room limit reached',429);
  const id=randomUUID();this.rooms.set(id,{id,title:heading,hostName:user.username,userId:user.id,publisher:socketId,viewers:new Set()});return this.list().find(room=>room.id===id)!;
 }
 watch(socketId:string,id:string):{room:LiveRoom;publisherId:string}{
  if(this.member(socketId))throw new ConflictException('Already participating');const room=this.rooms.get(id);if(!room)throw new NotFoundException('RTC room offline');
  if(room.viewers.size>=4)throw new HttpException('RTC viewer limit reached',429);
  room.viewers.add(socketId);return{room:this.list().find(row=>row.id===id)!,publisherId:room.publisher};
 }
 authorizeSignal(_socketId:string,_input:Signal):void{
  // TODO B: 같은 방의 송출자→시청자 offer, 시청자→송출자 answer만 허용하세요.
  throw new ForbiddenException('TODO: RTC peer authorization');
 }
 leave(socketId:string):{ended:string[];publisher:string|null}{
  for(const room of this.rooms.values()){
   if(room.publisher===socketId){this.rooms.delete(room.id);return{ended:[...room.viewers],publisher:null};}
   if(room.viewers.delete(socketId))return{ended:[],publisher:room.publisher};
  }
  return{ended:[],publisher:null};
 }
}
