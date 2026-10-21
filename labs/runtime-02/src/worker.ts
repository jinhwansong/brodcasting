import 'reflect-metadata';
import {createWorker} from './context.js';
import {ActivityService} from './activity.js';
let app:Awaited<ReturnType<typeof createWorker>>|undefined;
let timer:NodeJS.Timeout|undefined,closing=false;
async function send(message:object){if(process.send)await new Promise<void>((resolve,reject)=>process.send!(message,error=>error?reject(error):resolve()));else console.log(JSON.stringify(message));}
async function close(){if(closing)return;closing=true;clearInterval(timer);await app?.close();await send({type:'closed'});if(process.connected)process.disconnect();}
try{
 app=await createWorker();
 const activity:ActivityService=app.get(ActivityService);
 timer=setInterval(()=>activity.snapshot('worker'),100);
 await send({type:'ready',...activity.snapshot('worker'),hasHttp:'getHttpServer' in app});
 process.on('message',(message:unknown)=>{
  const type=(message as {type?:string})?.type;
  if(type==='stop')void close();
  if(type==='snapshot')void send({type:'snapshot',...activity.snapshot('worker')});
  if(type==='crash')process.exit(7);
 });
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>void close());
}catch{console.error('Local worker startup failed');process.exitCode=1;await close();}
