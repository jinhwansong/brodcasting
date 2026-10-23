import './container-env.js';
import {createApi} from './create-app.js';
import {environment} from './environment.js';
let runtime:ReturnType<typeof environment>|undefined,app:Awaited<ReturnType<typeof createApi>>|undefined,closing=false;
async function close(){if(closing)return;closing=true;try{await app?.close();}finally{await runtime?.pool.end();if(process.connected)process.disconnect();}}
try{
 const raw=process.env.PORT??'3015';if(!/^(0|[1-9][0-9]{0,4})$/.test(raw)||Number(raw)>65535)throw new Error('Invalid API port');
 runtime=environment();app=await createApi(runtime.pool,runtime.queue,{secret:process.env.SESSION_SECRET??'',browserOrigin:process.env.RUNTIME05_BROWSER_ORIGIN??'http://127.0.0.1:5195'});await app.listen(Number(raw),process.env.RUNTIME07_CONTAINER==='local-practice'?'0.0.0.0':'127.0.0.1');const ready={type:'ready',url:await app.getUrl(),pid:process.pid};if(process.send)process.send(ready);else console.log(JSON.stringify(ready));
 process.on('message',(value:unknown)=>{if((value as {type?:string})?.type==='stop')void close();});for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>void close());
}catch{console.error('Local inbox API startup failed');process.exitCode=1;await close();}
