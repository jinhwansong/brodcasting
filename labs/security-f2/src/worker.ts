import {createWorker} from './create-app.js';
import {environment} from './environment.js';
let runtime:ReturnType<typeof environment>|undefined,app:Awaited<ReturnType<typeof createWorker>>|undefined,closing=false;
async function close(){if(closing)return;closing=true;try{await app?.close();}finally{await runtime?.pool.end();if(process.connected)process.disconnect();}}
try{
 runtime=environment();app=await createWorker(runtime.pool,runtime.queue);const ready={type:'ready',pid:process.pid,hasHttp:'getHttpServer'in app};if(process.send)process.send(ready);else console.log(JSON.stringify(ready));
 process.on('message',(value:unknown)=>{if((value as {type?:string})?.type==='stop')void close();});for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>void close());
}catch{console.error('Local inbox worker startup failed');process.exitCode=1;await close();}
