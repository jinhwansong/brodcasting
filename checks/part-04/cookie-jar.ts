import {expect} from 'vitest';
export const ORIGIN='http://127.0.0.1:5184';
type Options={method?:string;json?:unknown;body?:BodyInit;headers?:HeadersInit;origin?:string|null;duplex?:'half'};
export class CookieJar {
 csrf='';
 constructor(readonly base:string,public cookie=''){}
 async request(route:string,options:Options={}):Promise<Response>{
  const {method='GET',json,body,headers:input,origin=ORIGIN,duplex}=options,headers=new Headers(input);
  if(this.cookie&&!headers.has('Cookie'))headers.set('Cookie',this.cookie);
  if(!['GET','HEAD','OPTIONS'].includes(method)){
   if(origin!==null&&!headers.has('Origin'))headers.set('Origin',origin);
   if(!headers.has('X-CSRF-Token')&&this.csrf)headers.set('X-CSRF-Token',this.csrf);
  }
  if(json!==undefined)headers.set('Content-Type','application/json');
  const init={method,headers,body:json===undefined?body:JSON.stringify(json),...(duplex?{duplex}:{})};
  const res=await fetch(this.base+'/api/'+route,init);
  for(const value of res.headers.getSetCookie()){
   const pair=value.split(';',1)[0];
   if(pair.startsWith('brodcasting.part04.sid='))this.cookie=pair==='brodcasting.part04.sid='?'':pair;
  }
  return res;
 }
 async session(){
  const res=await this.request('auth/session');expect(res.status).toBe(200);const value=await res.json();
  expect(typeof value.csrfToken==='string'&&value.csrfToken.length>0).toBe(true);this.csrf=value.csrfToken;return value;
 }
 async login(username:string,password:string){
  await this.session();const res=await this.request('auth/login',{method:'POST',json:{username,password}});
  expect(res.status).toBe(200);const value=await res.json();this.csrf=value.csrfToken;return value;
 }
}
