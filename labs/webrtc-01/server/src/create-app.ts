import {InboxService} from './notification-inbox.js';
import {NoticeQueue,type QueueOptions} from './notification-queue.js';
import {InboxController} from './notification.controller.js';
import 'reflect-metadata';
import {randomBytes} from 'node:crypto';
import {BadRequestException,ForbiddenException,Module,PayloadTooLargeException,ServiceUnavailableException,ValidationPipe} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import type {NestExpressApplication} from '@nestjs/platform-express';
import type {Request,Response,NextFunction} from 'express';
import type {Pool} from 'pg';
import {assertAppOptions,type AppOptions as SessionOptions} from './app-config.js';
import {SessionRuntime} from './session.js';
import {AuthRateLimiter} from './auth-rate-limit.js';
import {PasswordService} from './passwords.js';
import {UserRepository} from './user.repository.js';
import {BroadcastRepository} from './repository.js';
import {AuthService} from './auth.service.js';
import {AuthGuard} from './auth.guard.js';
import {AuthController} from './auth.controller.js';
import {BroadcastsController} from './broadcast.controller.js';
import {BroadcastsService} from './broadcast.service.js';
import {RawInputKeysPipe} from './raw-input-keys.pipe.js';
import {IoAdapter} from '@nestjs/platform-socket.io';
import type {ServerOptions} from 'socket.io';
import {ChatGateway} from './chat.gateway.js';
import {RtcGateway} from './rtc.gateway.js';
import {RtcRooms} from './rtc-rooms.js';
import {ChatService} from './chat.service.js';
import {SafeExceptionFilter} from './safe-exception.filter.js';
export type AppOptions=SessionOptions&{notifications?:QueueOptions};
class LocalIoAdapter extends IoAdapter{
 constructor(app:NestExpressApplication,private readonly origin:string){super(app);}
 createIOServer(port:number,options?:ServerOptions){
  const server=super.createIOServer(port,options);
  server.engine.opts.allowRequest=(req,callback)=>callback(null,req.headers.origin===this.origin);return server;
 }
}
@Module({controllers:[AuthController,BroadcastsController,InboxController],providers:[AuthGuard,BroadcastsService,ChatGateway,RtcGateway]})
class ApiModule{}
export async function createApp(pool:Pool,options:AppOptions):Promise<NestExpressApplication>{
 assertAppOptions(options);
 const passwords=new PasswordService(),dummyHash=await passwords.hash(randomBytes(32).toString('hex'));
 const sessions=new SessionRuntime(pool,options),limiter=new AuthRateLimiter(options.authRateLimit),inbox=new InboxService(pool);
 const notices=options.notifications?new NoticeQueue(inbox,options.notifications):{enqueue:async()=>false,replay:async(userId:string)=>({pending:(await inbox.pending(userId)).length,queued:0})};
 let app:NestExpressApplication|undefined;
 try{
  app=await NestFactory.create<NestExpressApplication>({module:ApiModule,providers:[
   {provide:InboxService,useValue:inbox},{provide:NoticeQueue,useValue:notices},{provide:SessionRuntime,useValue:sessions},{provide:AuthRateLimiter,useValue:limiter},
   {provide:ChatService,useValue:new ChatService(pool)},
   {provide:RtcRooms,useValue:new RtcRooms()},
   {provide:BroadcastRepository,useValue:new BroadcastRepository(pool)},
   {provide:AuthService,useValue:new AuthService(new UserRepository(pool),passwords,dummyHash)}
  ]},{logger:false,abortOnError:false});
  app.useWebSocketAdapter(new LocalIoAdapter(app,options.browserOrigin));
  app.setGlobalPrefix('api');app.getHttpAdapter().getInstance().set('trust proxy',false);
  app.use((_req:Request,res:Response,next:NextFunction)=>{res.setHeader('Cache-Control','no-store');next();});
  app.use('/api',(req:Request,_res:Response,next:NextFunction)=>{
   const unsafe=!['GET','HEAD','OPTIONS'].includes(req.method);
   const hasBody=Number(req.headers['content-length']??0)>0||Boolean(req.headers['transfer-encoding']);
   const mediaType=(req.headers['content-type']??'').split(';',1)[0].trim().toLowerCase();
   if(unsafe&&hasBody&&mediaType!=='application/json'){next(new BadRequestException('Unsupported body format'));return;}
   next();
  });
  app.useBodyParser('json',{limit:'8kb'});
  app.use((error:unknown,_req:Request,_res:Response,next:NextFunction)=>{
   const status=error&&typeof error==='object'&&'status' in error?error.status:undefined;
   if(status===413){next(new PayloadTooLargeException('Request body too large'));return;}
   if(status===400||status===415){next(new BadRequestException('Invalid JSON body'));return;}
   next(error);
  });
  app.use('/api',(req:Request,res:Response,next:NextFunction)=>sessions.middleware(req,res,error=>next(error?new ServiceUnavailableException('Service unavailable'):undefined)));
  app.use('/api',(req:Request,res:Response,next:NextFunction)=>{
   if(!['GET','HEAD','OPTIONS'].includes(req.method)&&req.headers.origin!==undefined&&req.headers.origin!==options.browserOrigin){
    next(new ForbiddenException('Origin not allowed'));return;
   }
   sessions.csrfProtection(req,res,error=>next(error?new ForbiddenException('Invalid CSRF token'):undefined));
  });
  app.use(['/api/auth/register','/api/auth/login'],(req:Request,res:Response,next:NextFunction)=>{
   if(req.method==='POST')limiter.middleware(req,res,next);else next();
  });
  app.useGlobalPipes(new RawInputKeysPipe(),new ValidationPipe({transform:true,whitelist:true,forbidNonWhitelisted:true,forbidUnknownValues:true,
   transformOptions:{enableImplicitConversion:false},validationError:{target:false,value:false}}));
  app.useGlobalFilters(new SafeExceptionFilter());
  return app;
 }catch(error){
  if(app)await app.close();else{if(notices instanceof NoticeQueue)await notices.onModuleDestroy();await sessions.onModuleDestroy();limiter.onModuleDestroy();}
  throw error;
 }
}
