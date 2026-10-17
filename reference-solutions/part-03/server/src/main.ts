import {Pool} from 'pg';
import {createApp} from './create-app.js';
import {requireLocalDatabase} from './db-config.js';
let pool:Pool|undefined;
try {
  const url=requireLocalDatabase(process.env.PART03_DATABASE_URL,'brodcasting_part03_lab');
  if(url.username!=='part03_app')throw new Error('Use the limited part03_app role');
  const port=Number(process.env.PORT??3003);
  if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid API port');
  pool=new Pool({connectionString:url.href,max:10,connectionTimeoutMillis:1000,statement_timeout:3000});
  pool.on('error',()=>console.error('Database pool connection lost'));
  const app=await createApp(pool);await app.listen(port,'127.0.0.1');
  console.log('Part 03 API ready on loopback port',port);
  let closing=false;
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{if(closing)return;closing=true;await app.close();await pool?.end();});
}catch{console.error('Part 03 API could not start. Check the local limited-role configuration.');await pool?.end();process.exitCode=1;}
