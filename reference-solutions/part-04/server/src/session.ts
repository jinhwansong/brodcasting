import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import {csrfSync} from 'csrf-sync';
import type {Request,RequestHandler,Response} from 'express';
import type {Pool} from 'pg';
import type {OnModuleDestroy} from '@nestjs/common';
import {COOKIE_OPTIONS,SESSION_COOKIE,SESSION_TTL_MS,type AppOptions} from './app-config.js';
import {UserRepository} from './user.repository.js';
import type {SessionView,User} from './types.js';
declare module 'express-session'{interface SessionData{userId?:string;authenticatedAt?:number;}}
export type SessionRequest=Request&{actor?:User};
const PgStore=connectPgSimple(session);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?![\s\S])/i;
const action=(operation:(done:(error?:unknown)=>void)=>void)=>new Promise<void>((resolve,reject)=>operation(error=>error?reject(error):resolve()));
export class SessionRuntime implements OnModuleDestroy{
 readonly middleware:RequestHandler;
 readonly csrfProtection:RequestHandler;
 readonly generateToken:ReturnType<typeof csrfSync>['generateToken'];
 private readonly store:InstanceType<typeof PgStore>;
 private readonly users:UserRepository;
 private readonly ttl:number;
 constructor(pool:Pool,options:Pick<AppOptions,'secret'|'schemaName'|'sessionTtlMs'>){
  this.users=new UserRepository(pool);this.ttl=options.sessionTtlMs??SESSION_TTL_MS;
  this.store=new PgStore({pool,schemaName:options.schemaName??'public',tableName:'sessions',createTableIfMissing:false,disableTouch:true,pruneSessionInterval:900,errorLog:()=>{}});
  this.middleware=session({name:SESSION_COOKIE,secret:options.secret,store:this.store,resave:false,saveUninitialized:false,rolling:false,cookie:{...COOKIE_OPTIONS,maxAge:this.ttl}});
  const csrf=csrfSync();this.generateToken=csrf.generateToken;this.csrfProtection=csrf.csrfSynchronisedProtection;
 }
 async currentUser(req:SessionRequest):Promise<User|null>{
  const id=req.session.userId;if(id===undefined)return null;
  const issued=req.session.authenticatedAt,now=Date.now();
  if(typeof id!=='string'||!uuid.test(id)||typeof issued!=='number'||!Number.isFinite(issued)||issued>now||now-issued>=this.ttl){
   await action(done=>req.session.regenerate(done));return null;
  }
  const user=await this.users.get(id);
  if(!user)await action(done=>req.session.regenerate(done));
  return user;
 }
 async view(req:SessionRequest):Promise<SessionView>{
  const user=await this.currentUser(req),csrfToken=this.generateToken(req);
  await action(done=>req.session.save(done));return{user,csrfToken};
 }
 async establish(req:SessionRequest,user:User):Promise<SessionView>{
  await action(done=>req.session.regenerate(done));
  req.session.userId=user.id;req.session.authenticatedAt=Date.now();
  const csrfToken=this.generateToken(req);await action(done=>req.session.save(done));return{user,csrfToken};
 }
 async end(req:SessionRequest,res:Response):Promise<void>{
  await action(done=>req.session.destroy(done));res.clearCookie(SESSION_COOKIE,COOKIE_OPTIONS);
 }
 async onModuleDestroy():Promise<void>{await this.store.close();}
}
