import {BadRequestException} from '@nestjs/common';
import type {Job,JobsOptions} from 'bullmq';
export type Notice={id:string;failures:number};
export function parseNotice(_value:unknown):Notice{
 // TODO A: 정확한 id/failures 모양과 범위를 검사해 새 객체로 반환하세요.
 throw new BadRequestException('Notice parser is not implemented');
}
export function jobOptions(_id:string):JobsOptions{
 // TODO B: 고유 jobId, 최대 세 번 시도, 100ms 대기와 완료/실패 보관 상한을 설정하세요.
 return{attempts:1};
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
