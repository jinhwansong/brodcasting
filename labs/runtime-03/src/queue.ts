import {BadRequestException,Body,Controller,Get,Injectable,Module,NotFoundException,Param,Post,Query} from '@nestjs/common';
import {Queue,Worker} from 'bullmq';
import {jobOptions,parseNotice,processNotice,readRedis,type Notice} from './jobs.js';

function empty(value:unknown){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length)throw new BadRequestException('Unexpected query');}
function id(value:string){if(!/^n-[a-f0-9]{16}$/.test(value))throw new BadRequestException('Invalid notice ID');return value;}
@Injectable()
export class NoticeQueue{
 readonly queue:Queue<Notice,number>;
 private worker:Worker<Notice,number>|undefined;
 private readonly connection=readRedis(process.env.RUNTIME03_REDIS_URL);
 private readonly prefix=process.env.RUNTIME03_QUEUE_PREFIX??'';
 constructor(){
  if(!/^course_r03_[a-f0-9]{8,32}$/.test(this.prefix))throw new Error('Dedicated queue prefix required');
  this.queue=new Queue<Notice,number>('notifications',{connection:{...this.connection,maxRetriesPerRequest:1,enableOfflineQueue:false,retryStrategy:times=>times<3?100:null},prefix:this.prefix});
  this.queue.on('error',()=>console.error('Local queue connection error'));
 }
 async onModuleInit(){try{await this.queue.waitUntilReady();}catch{await this.queue.close();throw new Error('Local queue startup failed');}}
 async startWorker(){
  this.worker=new Worker<Notice,number>('notifications',processNotice,{connection:{...this.connection,maxRetriesPerRequest:null},prefix:this.prefix,concurrency:1});
  this.worker.on('error',()=>console.error('Local worker connection error'));
  await this.worker.waitUntilReady();
 }
 async add(value:unknown){const data=parseNotice(value);const job=await this.queue.add('notice',data,jobOptions(data.id));return{id:job.id};}
 async status(value:string){const job=await this.queue.getJob(id(value));if(!job)throw new NotFoundException('Notice not found');return{id:job.id,state:await job.getState(),attemptsMade:job.attemptsMade,result:job.returnvalue??null};}
 async onModuleDestroy(){try{await this.worker?.close();}finally{await this.queue.close();}}
}
@Controller('jobs')
export class JobsController{
 constructor(private readonly notices:NoticeQueue){}
 @Post()add(@Body()body:unknown,@Query()query:unknown){empty(query);return this.notices.add(body);}
 @Get(':id')status(@Param('id')value:string,@Query()query:unknown){empty(query);return this.notices.status(value);}
}
@Module({providers:[NoticeQueue],exports:[NoticeQueue]})
export class QueueModule{}
