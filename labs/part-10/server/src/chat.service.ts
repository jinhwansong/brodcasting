import {BadRequestException,ForbiddenException} from '@nestjs/common';
import type {Pool} from 'pg';
import type {User} from './types.js';
import type {JoinInput,SendInput,HistoryInput} from './chat.types.js';
import {ChatRepository} from './chat.repository.js';
export class ChatService{
 constructor(private readonly pool:Pool){}
 parseJoin(value:unknown):JoinInput{
  this.keys(value,['roomId']);const input=value as Record<string,unknown>;
  if(input.roomId!=='r1'&&input.roomId!=='r2')throw new BadRequestException('Invalid room');
  return{roomId:input.roomId};
 }
 parseSend(value:unknown):SendInput{
  this.keys(value,['roomId','text','clientMessageId']);const input=value as Record<string,unknown>;
  const {roomId}=this.parseJoin({roomId:input.roomId});
  if(typeof input.text!=='string'||!input.text.trim()||Array.from(input.text).length>500||typeof input.clientMessageId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?![\s\S])/i.test(input.clientMessageId))throw new BadRequestException();
  return{roomId,text:input.text,clientMessageId:input.clientMessageId.toLowerCase()};
 }
 parseHistory(value:unknown):HistoryInput{
  const withUntil=typeof value==='object'&&value!==null&&Object.prototype.hasOwnProperty.call(value,'until');
  this.keys(value,withUntil?['roomId','after','until']:['roomId','after']);const input=value as Record<string,unknown>;
  const {roomId}=this.parseJoin({roomId:input.roomId});
  const valid=(v:unknown):v is string=>typeof v==='string'&&/^(?:0|[1-9][0-9]{0,18})(?![\s\S])/.test(v)&&BigInt(v)<=9223372036854775807n;
  if(!valid(input.after)||(withUntil&&(!valid(input.until)||BigInt(input.until)<BigInt(input.after))))throw new BadRequestException();
  return withUntil?{roomId,after:input.after,until:input.until as string}:{roomId,after:input.after};
 }
 save(user:User,input:SendInput){return new ChatRepository(this.pool).save(user,input);}
 history(user:User,input:HistoryInput){return new ChatRepository(this.pool).history(user,input);}
 private keys(value:unknown,keys:string[]):void{
  if(typeof value!=='object'||value===null||Array.isArray(value)||Object.keys(value).length!==keys.length||!keys.every(key=>Object.prototype.hasOwnProperty.call(value,key)))throw new BadRequestException('Invalid payload');
 }
 async authorize(user:User,roomId:string):Promise<void>{
  const result=await this.pool.query('SELECT 1 FROM room_members WHERE user_id=$1 AND room_id=$2',[user.id,roomId]);
  if(result.rowCount!==1)throw new ForbiddenException('Room membership required');
 }
}
