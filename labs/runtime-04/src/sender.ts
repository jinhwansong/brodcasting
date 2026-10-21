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
export async function deliver(_pool:Pool,_value:Delivery):Promise<{id:string;duplicate:boolean}>{
 // TODO A: 같은 client의 트랜잭션으로 영수증·가짜 효과를 저장하고 중복 ID의 mode를 확인하세요.
 throw new Error('Durable delivery not implemented');
}
export async function processDelivery(_pool:Pool,_job:Job<Delivery>):Promise<{id:string;duplicate:boolean}>{
 // TODO B: 일시 실패, 영구 실패, 느린 처리, commit 뒤 확인 손실을 구분하세요.
 throw new Error('Delivery processor not implemented');
}
