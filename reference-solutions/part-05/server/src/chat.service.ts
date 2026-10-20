import {BadRequestException,ForbiddenException} from '@nestjs/common';
import {randomUUID} from 'node:crypto';
import type {Pool} from 'pg';
import type {User} from './types.js';
import type {JoinInput,SendInput,Message} from './chat.types.js';
export class ChatService{
 constructor(private readonly pool:Pool){}
 parseJoin(value:unknown):JoinInput{
  this.keys(value,['roomId']);const input=value as Record<string,unknown>;
  if(input.roomId!=='r1'&&input.roomId!=='r2')throw new BadRequestException('Invalid room');
  return{roomId:input.roomId};
 }
 parseSend(value:unknown):SendInput{
  this.keys(value,['roomId','text']);const input=value as Record<string,unknown>;
  const {roomId}=this.parseJoin({roomId:input.roomId});
  if(typeof input.text!=='string'||!input.text.trim()||Array.from(input.text).length>500)throw new BadRequestException('Invalid message');
  return{roomId,text:input.text};
 }
 private keys(value:unknown,keys:string[]):void{
  if(typeof value!=='object'||value===null||Array.isArray(value)||Object.keys(value).length!==keys.length||!keys.every(key=>Object.prototype.hasOwnProperty.call(value,key)))throw new BadRequestException('Invalid payload');
 }
 async authorize(user:User,roomId:string):Promise<void>{
  const result=await this.pool.query('SELECT 1 FROM room_members WHERE user_id=$1 AND room_id=$2',[user.id,roomId]);
  if(result.rowCount!==1)throw new ForbiddenException('Room membership required');
 }
 message(user:User,input:SendInput):Message{return{id:randomUUID(),roomId:input.roomId,text:input.text,user:{id:user.id,username:user.username},sentAt:new Date().toISOString()};}
}
