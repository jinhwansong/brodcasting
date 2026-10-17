import 'reflect-metadata';
import {BadRequestException,Module,ValidationPipe} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import type {NestExpressApplication} from '@nestjs/platform-express';
import type {Pool} from 'pg';
import type {IncomingMessage,ServerResponse} from 'node:http';
import {BroadcastsController} from './broadcast.controller.js';
import {BroadcastsService} from './broadcast.service.js';
import {BroadcastRepository} from './repository.js';
import {RawInputKeysPipe} from './raw-input-keys.pipe.js';
@Module({controllers:[BroadcastsController],providers:[BroadcastsService]}) class BroadcastModule {}
export async function createApp(pool:Pool):Promise<NestExpressApplication> {
  const app=await NestFactory.create<NestExpressApplication>({module:BroadcastModule,providers:[{provide:BroadcastRepository,useFactory:()=>new BroadcastRepository(pool)}]},{logger:false,abortOnError:false});
  app.setGlobalPrefix('api');
  app.use((_req:IncomingMessage,res:ServerResponse,next:()=>void)=>{res.setHeader('Cache-Control','no-store');next();});
  // Reject unsupported bodies before a form parser can remove their fields.
  app.use('/api/favorites',(req:IncomingMessage,_res:ServerResponse,next:(error?:unknown)=>void)=>{
    const hasBody=Number(req.headers['content-length']??0)>0||Boolean(req.headers['transfer-encoding']);
    const mediaType=(req.headers['content-type']??'').split(';',1)[0].trim().toLowerCase();
    if((req.method==='PUT'||req.method==='DELETE')&&hasBody&&mediaType!=='application/json'){
      next(new BadRequestException('Only an empty body or an empty JSON object is allowed'));return;
    }
    next();
  });
  app.useBodyParser('json',{limit:'8kb'});
  app.useGlobalPipes(new RawInputKeysPipe(),new ValidationPipe({transform:true,whitelist:true,forbidNonWhitelisted:true,forbidUnknownValues:true,transformOptions:{enableImplicitConversion:false}}));
  return app;
}
