import {BadRequestException} from '@nestjs/common';
import type {Job,JobsOptions} from 'bullmq';
export type Notice={id:string;failures:number};
export function parseNotice(value:unknown):Notice{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new BadRequestException('Invalid notice');
 const row=value as Record<string,unknown>;
 if(Object.keys(row).length!==2||!Object.hasOwn(row,'id')||!Object.hasOwn(row,'failures')
  ||typeof row.id!=='string'||!/^n-[a-f0-9]{16}$/.test(row.id)
  ||!Number.isInteger(row.failures)||Number(row.failures)<0||Number(row.failures)>5)throw new BadRequestException('Invalid notice');
 return{id:row.id,failures:row.failures as number};
}
export function jobOptions(id:string):JobsOptions{
 return{jobId:id,attempts:3,backoff:{type:'fixed',delay:100},removeOnComplete:{age:3600,count:100},removeOnFail:{age:3600,count:100}};
}
export async function processNotice(job:Job<Notice,number>):Promise<number>{
 const data=parseNotice(job.data);
 if(job.attemptsMade<data.failures)throw new Error('Temporary fake delivery failure');
 return job.attemptsMade+1;
}
export function readRedis(raw:string|undefined){
 if(!raw)throw new Error('Dedicated local Redis URL required');
 const url=new URL(raw);
 if(url.protocol!=='redis:'||url.hostname!=='127.0.0.1'||url.pathname!=='/0'||url.search||url.hash||url.username||url.password||!url.port)throw new Error('Dedicated loopback Redis required');
 return{host:url.hostname,port:Number(url.port),connectTimeout:1000};
}
