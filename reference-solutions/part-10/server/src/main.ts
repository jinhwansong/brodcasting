import {Pool} from 'pg';import type {NestExpressApplication} from '@nestjs/platform-express';import {createApp} from './create-app.js';import {readDeployment} from './ops.js';
let app:NestExpressApplication|undefined,pool:Pool|undefined,closing=false;
async function close(){if(closing)return;closing=true;try{await app?.close();}finally{await pool?.end();}}
try{
 const config=readDeployment(process.env);pool=new Pool({connectionString:config.databaseUrl,max:10,connectionTimeoutMillis:1000,statement_timeout:3000});pool.on('error',()=>console.error(JSON.stringify({event:'db_pool_lost'})));await pool.query('SELECT 1');
 app=await createApp(pool,config);await app.listen(3010,'0.0.0.0');console.log(JSON.stringify({event:'ready',release:config.release}));
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{void close().catch(()=>{process.exitCode=1;});});
}catch{console.error(JSON.stringify({event:'startup_failed'}));await close();process.exitCode=1;}
