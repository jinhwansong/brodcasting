import {ConflictException,ForbiddenException} from '@nestjs/common';
import {randomUUID} from 'node:crypto';
import type {Pool} from 'pg';
import type {User} from './types.js';
import type {SendInput,Message,HistoryInput,HistoryPage} from './chat.types.js';
export class ChatRepository{
 constructor(private readonly pool:Pool){}
 private async member(db:Pick<Pool,'query'>,user:User,roomId:string):Promise<void>{
  if((await db.query('SELECT 1 FROM room_members WHERE user_id=$1 AND room_id=$2',[user.id,roomId])).rowCount!==1)throw new ForbiddenException();
 }
 private message(row:{room_id:string;seq:string;id:string;user_id:string;username:string;text:string;client_message_id:string;sent_at:Date}):Message{
  return{roomId:row.room_id,seq:row.seq,id:row.id,user:{id:row.user_id,username:row.username},text:row.text,clientMessageId:row.client_message_id,sentAt:row.sent_at.toISOString()};
 }
 async save(user:User,input:SendInput):Promise<{message:Message;inserted:boolean}>{
  const db=await this.pool.connect();
  try{
   await db.query('BEGIN');
   await db.query('INSERT INTO chat_room_counters(room_id,value) VALUES($1,0) ON CONFLICT(room_id) DO NOTHING',[input.roomId]);
   await db.query('SELECT value FROM chat_room_counters WHERE room_id=$1 FOR UPDATE',[input.roomId]);
   await this.member(db,user,input.roomId);
   const existing=await db.query('SELECT * FROM chat_messages WHERE room_id=$1 AND user_id=$2 AND client_message_id=$3',[input.roomId,user.id,input.clientMessageId]);
   if(existing.rowCount){
    if(existing.rows[0].text!==input.text)throw new ConflictException();
    await db.query('COMMIT');return{message:this.message(existing.rows[0]),inserted:false};
   }
   const counter=await db.query('UPDATE chat_room_counters SET value=value+1 WHERE room_id=$1 RETURNING value::text',[input.roomId]);
   const result=await db.query('INSERT INTO chat_messages(room_id,seq,id,user_id,username,text,client_message_id) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',[input.roomId,counter.rows[0].value,randomUUID(),user.id,user.username,input.text,input.clientMessageId]);
   await db.query('COMMIT');return{message:this.message(result.rows[0]),inserted:true};
  }catch(error){await db.query('ROLLBACK');throw error;}finally{db.release();}
 }
 async history(user:User,input:HistoryInput):Promise<HistoryPage>{
  await this.member(this.pool,user,input.roomId);
  const counter=await this.pool.query('SELECT value::text FROM chat_room_counters WHERE room_id=$1',[input.roomId]),high:string=counter.rows[0]?.value??'0',until=input.until??high;
  if(BigInt(input.after)>BigInt(until)||BigInt(until)>BigInt(high))throw new ConflictException();
  const result=await this.pool.query('SELECT * FROM chat_messages WHERE room_id=$1 AND seq>$2 AND seq<=$3 ORDER BY seq ASC LIMIT 51',[input.roomId,input.after,until]);
  const items=result.rows.slice(0,50).map(row=>this.message(row)),done=result.rows.length<=50;
  return{items,until,next:done?until:items.at(-1)!.seq,done};
 }
}
