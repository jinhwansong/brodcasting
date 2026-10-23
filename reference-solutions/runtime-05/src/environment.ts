import {Pool} from 'pg';
import {databaseUrl} from './input.js';
export function environment(){
 if(process.env.NODE_ENV==='production')throw new Error('Local practice only');
 const pool=new Pool({connectionString:databaseUrl(process.env.RUNTIME05_DATABASE_URL),max:6,connectionTimeoutMillis:1000,query_timeout:3000,statement_timeout:2500,idle_in_transaction_session_timeout:3000});pool.on('error',()=>console.error('Local DB unavailable'));
 return{pool,queue:{redisUrl:process.env.RUNTIME05_REDIS_URL??'',prefix:process.env.RUNTIME05_QUEUE_PREFIX??''}};
}
