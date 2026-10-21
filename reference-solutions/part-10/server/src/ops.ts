export type Deployment={databaseUrl:string;secret:string;browserOrigin:string;trustedProxy:string;release:string};
export function readDeployment(env:Record<string,string|undefined>):Deployment{
 const invalid=()=>{throw Error('Invalid private local deployment');};
 if(env.PART10_MODE!=='local-container'||!/^v[12](?![\s\S])/.test(env.RELEASE_LABEL??'')||!/^[0-9a-f]{64}(?![\s\S])/i.test(env.SESSION_SECRET??''))invalid();
 let url:URL;try{url=new URL(env.PART10_DATABASE_URL??'');}catch{return invalid();}
 if(url.protocol!=='postgres:'||url.hostname!=='db'||url.port!=='5432'||url.username!=='part10_app'||url.password.length<12||!['/brodcasting_part10_lab','/brodcasting_part10_restore'].includes(url.pathname)||url.search||url.hash)invalid();
 return {databaseUrl:env.PART10_DATABASE_URL!,secret:env.SESSION_SECRET!,browserOrigin:'https://127.0.0.1:8443',trustedProxy:'172.30.10.3',release:env.RELEASE_LABEL!};
}
export async function ready(pool:{query:(sql:string)=>Promise<unknown>}):Promise<boolean>{try{await pool.query('SELECT 1');return true;}catch{return false;}}
export function requestLog(value:Record<string,unknown>):Record<string,unknown>|null{
 if(typeof value.status!=='number'||value.status<400)return null;
 return {event:'http_error',requestId:value.id,method:value.method,status:value.status};
}
