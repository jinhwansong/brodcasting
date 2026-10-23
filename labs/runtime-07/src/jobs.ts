import type {JobsOptions} from 'bullmq';
export function jobOptions(id:string):JobsOptions{
 return{jobId:id,attempts:3,backoff:{type:'fixed',delay:100},removeOnComplete:{age:3600,count:100},removeOnFail:{age:3600,count:100}};
}
export function readRedis(raw:string|undefined){
 if(!raw)throw new Error('Dedicated local Redis URL required');
 const url=new URL(raw);
 if(url.protocol!=='redis:'||!(url.hostname==='127.0.0.1'||process.env.RUNTIME07_CONTAINER==='local-practice'&&url.hostname==='cache')||url.pathname!=='/0'||url.search||url.hash||url.username||url.password||!url.port)throw new Error('Dedicated loopback Redis required');
 return{host:url.hostname,port:Number(url.port),connectTimeout:1000};
}
