import {MemoryStore,rateLimit} from 'express-rate-limit';
import type {RequestHandler} from 'express';
import type {OnModuleDestroy} from '@nestjs/common';
export class AuthRateLimiter implements OnModuleDestroy{
 private readonly store=new MemoryStore();
 readonly middleware:RequestHandler;
 constructor(options?:{windowMs:number;limit:number}){
  this.middleware=rateLimit({windowMs:options?.windowMs??60000,limit:options?.limit??10,store:this.store,standardHeaders:'draft-8',legacyHeaders:false,
   // This local server uses the socket peer and never trusts forwarded headers.
   validate:{xForwardedForHeader:false,forwardedHeader:false},
   message:{statusCode:429,message:'Too many authentication attempts',error:'Too Many Requests'}});
 }
 onModuleDestroy():void{this.store.shutdown();}
}
