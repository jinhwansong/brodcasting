import {randomUUID} from 'node:crypto';
import {ConflictException,HttpException,NotFoundException} from '@nestjs/common';
import type {Pool} from 'pg';
import {UnrecoverableError} from 'bullmq';
import {creation,id,pageQuery} from './input.js';
export type Notification={id:string;seq:string;body:string;createdAt:string;readAt:string|null};
export type NotificationPage={items:Notification[];hasMore:boolean;nextCursor:string|null};
export class InboxService{
 constructor(readonly pool:Pool){}
 async create(userId:string,value:unknown):Promise<{id:string;duplicate:boolean}>{
  const input=creation(value),client=await this.pool.connect();let broken=false;
  try{
   await client.query('BEGIN');await client.query('INSERT INTO notification_accounts(user_id) VALUES($1) ON CONFLICT DO NOTHING',[userId]);
   const account=await client.query('SELECT created_count FROM notification_accounts WHERE user_id=$1 FOR UPDATE',[userId]);
   const existing=await client.query('SELECT id,body FROM notification_events WHERE user_id=$1 AND client_key=$2',[userId,input.clientKey]);
   if(existing.rowCount){if(existing.rows[0].body!==input.body)throw new ConflictException('Client key body conflict');await client.query('COMMIT');return{id:existing.rows[0].id,duplicate:true};}
   if(account.rows[0].created_count>=100)throw new HttpException('Practice event limit reached',429);
   const eventId=randomUUID();await client.query('INSERT INTO notification_events(id,user_id,client_key,body) VALUES($1,$2,$3,$4)',[eventId,userId,input.clientKey,input.body]);
   await client.query('UPDATE notification_accounts SET created_count=created_count+1 WHERE user_id=$1',[userId]);await client.query('COMMIT');return{id:eventId,duplicate:false};
  }catch(error){try{await client.query('ROLLBACK');}catch{broken=true;}throw error;}finally{client.release(broken);}
 }
 async deliver(eventId:string):Promise<{id:string;duplicate:boolean}>{
  throw new Error("TODO: deliver를 구현하세요");
 }
 async list(userId:string,query:unknown):Promise<NotificationPage>{
  throw new Error("TODO: list를 구현하세요");
 }
 async markRead(userId:string,eventId:string):Promise<{id:string;readAt:string}>{
  const result=await this.pool.query('UPDATE notifications SET read_at=COALESCE(read_at,clock_timestamp()) WHERE id=$1 AND user_id=$2 RETURNING id,read_at',[id(eventId),userId]);
  if(!result.rowCount)throw new NotFoundException('Notification not found');return{id:result.rows[0].id,readAt:result.rows[0].read_at.toISOString()};
 }
 async pending(userId?:string):Promise<string[]>{const result=await this.pool.query('SELECT e.id FROM notification_events e LEFT JOIN notifications n ON n.id=e.id WHERE n.id IS NULL'+(userId?' AND e.user_id=$1':'')+' ORDER BY e.created_at,e.id LIMIT 50',userId?[userId]:[]);return result.rows.map(row=>row.id);}
 async queued(eventId:string){await this.pool.query('UPDATE notification_events SET queued_at=clock_timestamp() WHERE id=$1',[id(eventId)]);}
}
