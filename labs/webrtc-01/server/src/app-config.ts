export const SESSION_COOKIE='brodcasting.part06.sid';
export const SESSION_TTL_MS=30*60*1000;
export const COOKIE_OPTIONS={httpOnly:true,sameSite:'lax',secure:false,path:'/'} as const;
export type AppOptions={secret:string;browserOrigin:string;schemaName?:string;sessionTtlMs?:number;authRateLimit?:{windowMs:number;limit:number}};
export function isPrivateIpv4(host:string):boolean{
 const parts=host.split('.');if(parts.length!==4||parts.some(part=>!/^\d{1,3}$/.test(part)||String(Number(part))!==part||Number(part)>255))return false;
 const [a,b]=parts.map(Number);return a===10||a===172&&b>=16&&b<=31||a===192&&b===168;
}
export function assertAppOptions(options:AppOptions):void{
 const invalid=()=>{throw new Error('Invalid local session configuration');};
 if(typeof options.secret!=='string'||!/^[0-9a-f]{64}(?![\s\S])/i.test(options.secret))invalid();
 let origin:URL;try{origin=new URL(options.browserOrigin);}catch{return invalid();}
 const loopback=['127.0.0.1','[::1]'].includes(origin.hostname);
 if(origin.origin!==options.browserOrigin||origin.username||origin.password||!(origin.protocol==='http:'&&loopback||origin.protocol==='https:'&&(loopback||isPrivateIpv4(origin.hostname))))invalid();
 if(!/^(?:public|part06_check_[0-9a-f]+)(?![\s\S])/.test(options.schemaName??'public'))invalid();
 const ttl=options.sessionTtlMs??SESSION_TTL_MS;
 if(!Number.isInteger(ttl)||ttl<=0||ttl>SESSION_TTL_MS)invalid();
 const {windowMs=60000,limit=10}=options.authRateLimit??{};
 if(!Number.isInteger(windowMs)||windowMs<=0||!Number.isInteger(limit)||limit<=0)invalid();
}
