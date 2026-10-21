import {BadRequestException,Body,Controller,Get,Injectable,Module,NotFoundException,Param,Post,Query} from '@nestjs/common';
import {Queue,Worker} from 'bullmq';
import {Pool} from 'pg';
import {jobOptions,readRedis} from './jobs.js';
import {databaseUrl,parseDelivery,processDelivery,type Delivery} from './sender.js';
type Result={id:string;duplicate:boolean};

function empty(value:unknown){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length)throw new BadRequestException('Unexpected query');}
function id(value:string){if(!/^n-[a-f0-9]{16}$/.test(value))throw new BadRequestException('Invalid notice ID');return value;}
@Injectable()
export class NoticeQueue{
 readonly queue:Queue<Delivery,Result>;
 private worker:Worker<Delivery,Result>|undefined;
 private readonly connection=readRedis(process.env.RUNTIME04_REDIS_URL);
 private readonly prefix=process.env.RUNTIME04_QUEUE_PREFIX??'';
 private readonly pool=new Pool({connectionString:databaseUrl(process.env.RUNTIME04_DATABASE_URL),max:4,connectionTimeoutMillis:1000,query_timeout:2000,statement_timeout:1500,idle_in_transaction_session_timeout:2000});
 constructor(){
  if(!/^course_r04_[a-f0-9]{8,32}$/.test(this.prefix))throw new Error('Dedicated queue prefix required');
  this.queue=new Queue<Delivery,Result>('notifications',{connection:{...this.connection,maxRetriesPerRequest:1,enableOfflineQueue:false,retryStrategy:times=>times<3?100:null},prefix:this.prefix});
  this.queue.on('error',()=>console.error('Local queue connection error'));
  this.pool.on('error',()=>console.error('Local database connection error'));
 }
 async onModuleInit(){try{await this.queue.waitUntilReady();await this.pool.query('SELECT 1');}catch{try{await this.queue.close();}finally{await this.pool.end();}throw new Error('Local service startup failed');}}
 async startWorker(){
  this.worker=new Worker<Delivery,Result>('notifications',job=>processDelivery(this.pool,job),{connection:{...this.connection,maxRetriesPerRequest:null},prefix:this.prefix,concurrency:1});
  this.worker.on('error',()=>console.error('Local worker connection error'));
  await this.worker.waitUntilReady();
 }
 async add(value:unknown){const data=parseDelivery(value);const job=await this.queue.add('notice',data,jobOptions(data.id));return{id:job.id};}
 async status(value:string){const job=await this.queue.getJob(id(value));if(!job)throw new NotFoundException('Notice not found');return{id:job.id,state:await job.getState(),attemptsMade:job.attemptsMade,result:job.returnvalue??null};}
 async onModuleDestroy(){try{await this.worker?.close();}finally{try{await this.queue.close();}finally{await this.pool.end();}}}
}
@Controller('jobs')
export class JobsController{
 constructor(private readonly notices:NoticeQueue){}
 @Post()add(@Body()body:unknown,@Query()query:unknown){empty(query);return this.notices.add(body);}
 @Get(':id')status(@Param('id')value:string,@Query()query:unknown){empty(query);return this.notices.status(value);}
}
@Module({providers:[NoticeQueue],exports:[NoticeQueue]})
export class QueueModule{}
