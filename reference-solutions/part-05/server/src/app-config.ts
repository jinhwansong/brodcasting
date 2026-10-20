export const SESSION_COOKIE='brodcasting.part05.sid';
export const SESSION_TTL_MS=30*60*1000;
export const COOKIE_OPTIONS={httpOnly:true,sameSite:'lax',secure:false,path:'/'} as const;
export type AppOptions={secret:string;browserOrigin:string;schemaName?:string;sessionTtlMs?:number;authRateLimit?:{windowMs:number;limit:number}};
export function assertAppOptions(options:AppOptions):void{
 const invalid=()=>{throw new Error('Invalid local session configuration');};
 if(typeof options.secret!=='string'||!/^[0-9a-f]{64}(?![\s\S])/i.test(options.secret))invalid();
 let origin:URL;try{origin=new URL(options.browserOrigin);}catch{return invalid();}
 if(origin.origin!==options.browserOrigin||origin.protocol!=='http:'||!['127.0.0.1','[::1]'].includes(origin.hostname))invalid();
 if(!/^(?:public|part05_check_[0-9a-f]+)(?![\s\S])/.test(options.schemaName??'public'))invalid();
 const ttl=options.sessionTtlMs??SESSION_TTL_MS;
 if(!Number.isInteger(ttl)||ttl<=0||ttl>SESSION_TTL_MS)invalid();
 const {windowMs=60000,limit=10}=options.authRateLimit??{};
 if(!Number.isInteger(windowMs)||windowMs<=0||!Number.isInteger(limit)||limit<=0)invalid();
}
