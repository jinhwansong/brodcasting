import {randomUUID} from 'node:crypto';
import {ConflictException,HttpException,NotFoundException} from '@nestjs/common';
import type {Pool} from 'pg';
import {UnrecoverableError} from 'bullmq';
import {creation,id,pageQuery} from './notification-input.js';
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
  const value=id(eventId),client=await this.pool.connect();let broken=false;
  try{
   await client.query('BEGIN');
   const event=await client.query('SELECT user_id,body FROM notification_events WHERE id=$1 FOR UPDATE',[value]);
   if(!event.rowCount)throw new UnrecoverableError('Stored event not found');
   const existing=await client.query('SELECT id FROM notifications WHERE id=$1',[value]);
   if(existing.rowCount){await client.query('COMMIT');return{id:value,duplicate:true};}
   // The row lock is held until COMMIT, so a higher sequence cannot commit before this one.
   const counter=await client.query('UPDATE notification_accounts SET inbox_seq=inbox_seq+1 WHERE user_id=$1 RETURNING inbox_seq',[event.rows[0].user_id]);
   if(!counter.rowCount)throw new UnrecoverableError('Stored account counter not found');
   await client.query('INSERT INTO notifications(id,user_id,seq,body) VALUES($1,$2,$3,$4)',[value,event.rows[0].user_id,counter.rows[0].inbox_seq,event.rows[0].body]);
   await client.query('COMMIT');return{id:value,duplicate:false};
  }catch(error){try{await client.query('ROLLBACK');}catch{broken=true;}throw error;}finally{client.release(broken);}
 }
 async list(userId:string,query:unknown):Promise<NotificationPage>{
  const page=pageQuery(query),ascending=page.direction==='after';
  const result=await this.pool.query('SELECT id,seq,body,created_at,read_at FROM notifications WHERE user_id=$1 AND ($2::bigint IS NULL OR seq '+(ascending?'>':'<')+' $2::bigint) ORDER BY seq '+(ascending?'ASC':'DESC')+' LIMIT 21',[userId,page.cursor]);
  const hasMore=result.rows.length>20,items=result.rows.slice(0,20).map(row=>({id:row.id,seq:row.seq,body:row.body,createdAt:row.created_at.toISOString(),readAt:row.read_at?.toISOString()??null}));
  return{items,hasMore,nextCursor:hasMore?items.at(-1)!.seq:null};
 }
 async markRead(userId:string,eventId:string):Promise<{id:string;readAt:string}>{
  const result=await this.pool.query('UPDATE notifications SET read_at=COALESCE(read_at,clock_timestamp()) WHERE id=$1 AND user_id=$2 RETURNING id,read_at',[id(eventId),userId]);
  if(!result.rowCount)throw new NotFoundException('Notification not found');return{id:result.rows[0].id,readAt:result.rows[0].read_at.toISOString()};
 }
 async pending(userId?:string):Promise<string[]>{const result=await this.pool.query('SELECT e.id FROM notification_events e LEFT JOIN notifications n ON n.id=e.id WHERE n.id IS NULL'+(userId?' AND e.user_id=$1':'')+' ORDER BY e.created_at,e.id LIMIT 50',userId?[userId]:[]);return result.rows.map(row=>row.id);}
 async queued(eventId:string){await this.pool.query('UPDATE notification_events SET queued_at=clock_timestamp() WHERE id=$1',[id(eventId)]);}
}
