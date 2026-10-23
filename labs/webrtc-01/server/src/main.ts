import {Pool} from 'pg';
import type {NestExpressApplication} from '@nestjs/platform-express';
import {createApp} from './create-app.js';
import {requireLocalDatabase} from './db-config.js';
import {assertAppOptions} from './app-config.js';

let pool:Pool|undefined,app:NestExpressApplication|undefined;
let closing=false;
async function close(){
 if(closing)return;closing=true;
 try{await app?.close();}finally{await pool?.end();}
}
try{
 if(process.env.NODE_ENV==='production')throw new Error('Local course only');
 const url=requireLocalDatabase(process.env.PART06_DATABASE_URL,'brodcasting_part06_lab');
 if(url.username!=='part06_app')throw new Error('Use the limited app role');
 const rawPort=process.env.PORT??'3006',port=Number(rawPort);
 if(!/^[0-9]{1,5}(?![\s\S])/.test(rawPort)||port<1||port>65535)throw new Error('Invalid API port');
 const notifications=process.env.BROADCAST_REDIS_URL?{redisUrl:process.env.BROADCAST_REDIS_URL,prefix:process.env.BROADCAST_QUEUE_PREFIX??''}:undefined;
 const options={notifications,secret:process.env.SESSION_SECRET??'',browserOrigin:process.env.PART06_BROWSER_ORIGIN??'http://127.0.0.1:5186'};
 assertAppOptions(options);
 pool=new Pool({connectionString:url.href,max:10,connectionTimeoutMillis:1000,statement_timeout:3000});
 pool.on('error',()=>console.error('Database pool connection lost'));
 await pool.query('SELECT 1');
 app=await createApp(pool,options);await app.listen(port,'127.0.0.1');
 if(process.send)process.send({type:'ready',pid:process.pid});else console.log('Part 06 API ready on loopback port',port);
 process.on('message',(value:unknown)=>{if((value as {type?:string})?.type==='stop')void close().finally(()=>process.disconnect?.());});
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{void close().catch(()=>{console.error('Part 06 API cleanup failed');process.exitCode=1;});});
}catch{
 console.error('Part 06 API could not start. Check the local limited-role configuration.');
 try{await close();}catch{console.error('Part 06 API cleanup failed');}
 process.exitCode=1;
}
