import {Queue,Worker} from 'bullmq';
import {jobOptions,readRedis} from './notification-jobs.js';
import {exact,id} from './notification-input.js';
import {InboxService} from './notification-inbox.js';
export type QueueOptions={redisUrl:string;prefix:string};
type Result={id:string;duplicate:boolean};
export class NoticeQueue{
 readonly queue:Queue<{id:string},Result>;
 private worker?:Worker<{id:string},Result>;
 private readonly connection;
 constructor(private readonly inbox:InboxService,private readonly options:QueueOptions){
  this.connection=readRedis(options.redisUrl);if(!/^course_r05_[a-f0-9]{8,32}$/.test(options.prefix))throw new Error('Dedicated queue prefix required');
  this.queue=new Queue('notifications',{connection:{...this.connection,maxRetriesPerRequest:1,enableOfflineQueue:false,retryStrategy:times=>times<3?100:null},prefix:options.prefix});this.queue.on('error',()=>console.error('Local queue unavailable'));
 }
 async onModuleInit(){await this.queue.waitUntilReady();await this.inbox.pool.query('SELECT 1');}
 async enqueue(eventId:string,retry=false):Promise<boolean>{
  try{
   const event=id(eventId),existing=retry?await this.queue.getJob(event):null;
   if(existing){const state=await existing.getState();if(state==='failed')await existing.retry();else if(state==='completed'){await existing.remove();await this.queue.add('notice',{id:event},jobOptions(event));}}
   else await this.queue.add('notice',{id:event},jobOptions(event));
   await this.inbox.queued(event);return true;
  }catch{return false;}
 }
 async replay(userId?:string){const events=await this.inbox.pending(userId);let queued=0;for(const eventId of events)if(await this.enqueue(eventId,true))queued++;return{pending:events.length,queued};}
 async startWorker(){
  this.worker=new Worker('notifications',job=>{const payload=exact(job.data,['id']);return this.inbox.deliver(id(payload.id));},{connection:{...this.connection,maxRetriesPerRequest:null},prefix:this.options.prefix,concurrency:1});this.worker.on('error',()=>console.error('Local worker unavailable'));await this.worker.waitUntilReady();await this.replay();
 }
 async onModuleDestroy(){try{await this.worker?.close();}finally{await this.queue.close();}}
}
