import 'reflect-metadata';
import {randomBytes} from 'node:crypto';
import {BadRequestException,ForbiddenException,Module,PayloadTooLargeException,ServiceUnavailableException,ValidationPipe,type PipeTransform,type ArgumentMetadata} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import type {NestExpressApplication} from '@nestjs/platform-express';
import type {Request,Response,NextFunction} from 'express';
import type {Pool} from 'pg';
import {assertAppOptions,type AppOptions} from './auth/app-config.js';
import {SessionRuntime} from './auth/session.js';
import {AuthRateLimiter} from './auth/auth-rate-limit.js';
import {PasswordService} from './auth/passwords.js';
import {UserRepository} from './auth/user.repository.js';
import {AuthService} from './auth/auth.service.js';
import {AuthGuard} from './auth/auth.guard.js';
import {AuthController} from './auth/auth.controller.js';
import {CredentialsDto} from './auth/auth.dto.js';
import {SafeExceptionFilter} from './auth/safe-exception.filter.js';
import {InboxService} from './inbox.js';
import {NoticeQueue,type QueueOptions} from './queue.js';
import {InboxController} from './controller.js';
class CredentialKeys implements PipeTransform{
 transform(value:unknown,metadata:ArgumentMetadata){if(metadata.metatype===CredentialsDto&&value&&typeof value==='object'&&Object.keys(value).some(key=>!['username','password'].includes(key)))throw new BadRequestException('Unknown credential field');return value;}
}
@Module({controllers:[AuthController,InboxController],providers:[AuthGuard]})class ApiModule{}
@Module({})class WorkerModule{}
export async function createApi(pool:Pool,queueOptions:QueueOptions,options:AppOptions):Promise<NestExpressApplication>{
 assertAppOptions(options);const inbox=new InboxService(pool),notices=new NoticeQueue(inbox,queueOptions),sessions=new SessionRuntime(pool,options),limiter=new AuthRateLimiter(options.authRateLimit);
 let app:NestExpressApplication|undefined;
 try{
  const passwords=new PasswordService(),dummy=await passwords.hash(randomBytes(32).toString('hex'));
  app=await NestFactory.create<NestExpressApplication>({module:ApiModule,providers:[{provide:InboxService,useValue:inbox},{provide:NoticeQueue,useValue:notices},{provide:SessionRuntime,useValue:sessions},{provide:AuthRateLimiter,useValue:limiter},{provide:AuthService,useValue:new AuthService(new UserRepository(pool),passwords,dummy)}]},{logger:false,abortOnError:false});
  app.setGlobalPrefix('api');app.getHttpAdapter().getInstance().set('trust proxy',false);
  app.use((_req:Request,res:Response,next:NextFunction)=>{res.setHeader('Cache-Control','no-store');next();});
  app.use('/api',(req:Request,_res:Response,next:NextFunction)=>{
   const unsafe=!['GET','HEAD','OPTIONS'].includes(req.method),hasBody=Number(req.headers['content-length']??0)>0||Boolean(req.headers['transfer-encoding']),type=(req.headers['content-type']??'').split(';',1)[0].trim().toLowerCase();
   next(unsafe&&hasBody&&type!=='application/json'?new BadRequestException('Unsupported body format'):undefined);
  });
  app.useBodyParser('json',{limit:'8kb'});
  app.use((error:unknown,_req:Request,_res:Response,next:NextFunction)=>{const status=error&&typeof error==='object'&&'status'in error?error.status:undefined;next(status===413?new PayloadTooLargeException():status===400||status===415?new BadRequestException('Invalid JSON body'):error);});
  app.use('/api',(req:Request,res:Response,next:NextFunction)=>sessions.middleware(req,res,error=>next(error?new ServiceUnavailableException():undefined)));
  app.use('/api',(req:Request,res:Response,next:NextFunction)=>{if(!['GET','HEAD','OPTIONS'].includes(req.method)&&req.headers.origin!==undefined&&req.headers.origin!==options.browserOrigin){next(new ForbiddenException());return;}sessions.csrfProtection(req,res,error=>next(error?new ForbiddenException('Invalid CSRF token'):undefined));});
  app.use(['/api/auth/register','/api/auth/login'],(req:Request,res:Response,next:NextFunction)=>{if(req.method==='POST')limiter.middleware(req,res,next);else next();});
  app.useGlobalPipes(new CredentialKeys(),new ValidationPipe({transform:true,whitelist:true,forbidNonWhitelisted:true,forbidUnknownValues:true,transformOptions:{enableImplicitConversion:false},validationError:{target:false,value:false}}));app.useGlobalFilters(new SafeExceptionFilter());return app;
 }catch(error){if(app)await app.close();else{await notices.onModuleDestroy();await sessions.onModuleDestroy();limiter.onModuleDestroy();}throw error;}
}
export async function createWorker(pool:Pool,options:QueueOptions){
 const inbox=new InboxService(pool),notices=new NoticeQueue(inbox,options);let app:Awaited<ReturnType<typeof NestFactory.createApplicationContext>>|undefined;
 try{app=await NestFactory.createApplicationContext({module:WorkerModule,providers:[{provide:InboxService,useValue:inbox},{provide:NoticeQueue,useValue:notices}]},{logger:false,abortOnError:false});await notices.startWorker();return app;}
 catch(error){if(app)await app.close();else await notices.onModuleDestroy();throw error;}
}
