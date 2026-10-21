import 'reflect-metadata';
import {createApi} from './context.js';
import {ActivityService} from './activity.js';
let app:Awaited<ReturnType<typeof createApi>>|undefined;
let closing=false;
async function close(){if(closing)return;closing=true;await app?.close();if(process.connected)process.disconnect();}
try{
 const raw=process.env.PORT??'3013';
 if(!/^(0|[1-9][0-9]{0,4})$/.test(raw)||Number(raw)>65535)throw new Error('Invalid local port');
 app=await createApi();await app.listen(Number(raw),'127.0.0.1');
 const message={type:'ready',url:await app.getUrl(),...app.get(ActivityService).snapshot('api')};
 if(process.send)process.send(message);else console.log(JSON.stringify(message));
 process.on('message',(message:unknown)=>{if((message as {type?:string})?.type==='stop')void close();});
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>void close());
}catch{console.error('Local API startup failed');process.exitCode=1;await close();}
