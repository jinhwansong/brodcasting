import {BadRequestException} from '@nestjs/common';
export const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export function exact(value:unknown,keys:string[]):Record<string,unknown>{
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))throw new BadRequestException('Invalid notification input');return value as Record<string,unknown>;
}
export function id(value:unknown):string{if(typeof value!=='string'||!uuid.test(value))throw new BadRequestException('Invalid identifier');return value;}
export function creation(value:unknown){const row=exact(value,['clientKey','body']);if(typeof row.body!=='string'||!row.body.trim()||Array.from(row.body).length>500)throw new BadRequestException('Invalid body');return{clientKey:id(row.clientKey),body:row.body};}
export function pageQuery(value:unknown):{direction:'before'|'after';cursor:string|null}{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new BadRequestException('Invalid page query');const row=value as Record<string,unknown>,keys=Object.keys(row);
 if(keys.length===0)return{direction:'before',cursor:null};if(keys.length!==1||!['before','after'].includes(keys[0]))throw new BadRequestException('Invalid page query');
 const cursor=row[keys[0]];if(typeof cursor!=='string'||!/^(0|[1-9][0-9]{0,18})$/.test(cursor)||BigInt(cursor)>9223372036854775807n||keys[0]==='before'&&cursor==='0')throw new BadRequestException('Invalid cursor');
 return{direction:keys[0] as 'before'|'after',cursor};
}
export function databaseUrl(raw:string|undefined){
 if(!raw)throw new Error('Dedicated local DB required');const url=new URL(raw);
 if(url.protocol!=='postgresql:'||url.hostname!=='127.0.0.1'||!url.port||url.pathname!=='/brodcasting_runtime05_lab'||url.username!=='runtime05_app'||!url.password||url.search||url.hash)throw new Error('Dedicated local DB required');return raw;
}
