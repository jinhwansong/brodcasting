import type {Pool} from 'pg';
import {UnrecoverableError,type Job} from 'bullmq';
import {BadRequestException} from '@nestjs/common';
export type Delivery={id:string;mode:'normal'|'transient'|'permanent'|'after-commit'|'slow'};
export function parseDelivery(value:unknown):Delivery{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new BadRequestException('Invalid fake delivery');
 const row=value as Record<string,unknown>;
 if(Object.keys(row).length!==2||!Object.hasOwn(row,'id')||!Object.hasOwn(row,'mode')||typeof row.id!=='string'||!/^n-[a-f0-9]{16}$/.test(row.id)||typeof row.mode!=='string'||!['normal','transient','permanent','after-commit','slow'].includes(row.mode))throw new BadRequestException('Invalid fake delivery');
 return{id:row.id,mode:row.mode as Delivery['mode']};
}
export function databaseUrl(value:string|undefined):string{
 if(!value)throw new Error('Dedicated local database required');
 const url=new URL(value);
 if(url.protocol!=='postgresql:'||url.hostname!=='127.0.0.1'||!url.port||url.pathname!=='/brodcasting_runtime04_lab'||url.username!=='runtime04_app'||!url.password||url.search||url.hash)throw new Error('Dedicated local database required');
 return value;
}
export async function deliver(pool:Pool,value:Delivery):Promise<{id:string;duplicate:boolean}>{
 const data=parseDelivery(value),client=await pool.connect();let broken=false;
 try{
  await client.query('BEGIN');
  const inserted=await client.query('INSERT INTO delivery_receipts(id,mode) VALUES($1,$2) ON CONFLICT DO NOTHING RETURNING id',[data.id,data.mode]);
  if(inserted.rowCount){await client.query('INSERT INTO fake_deliveries(id) VALUES($1)',[data.id]);}
  else{
   const existing=await client.query('SELECT mode FROM delivery_receipts WHERE id=$1',[data.id]);
   if(existing.rows[0]?.mode!==data.mode)throw new UnrecoverableError('Identifier payload conflict');
  }
  await client.query('COMMIT');
  return{id:data.id,duplicate:inserted.rowCount===0};
 }catch(error){try{await client.query('ROLLBACK');}catch{broken=true;}throw error;}
 finally{client.release(broken);}
}
export async function processDelivery(pool:Pool,job:Job<Delivery>):Promise<{id:string;duplicate:boolean}>{
 const data=parseDelivery(job.data);
 if(data.mode==='permanent')throw new UnrecoverableError('Permanent fake delivery failure');
 if(data.mode==='transient'&&job.attemptsMade<2)throw new Error('Temporary fake delivery failure');
 if(data.mode==='slow')await new Promise(resolve=>setTimeout(resolve,500));
 const result=await deliver(pool,data);
 // This deliberately loses the acknowledgement after the durable fake effect committed.
 if(data.mode==='after-commit'&&!result.duplicate)throw new Error('Fake acknowledgement lost');
 return result;
}
