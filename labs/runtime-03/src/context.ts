import 'reflect-metadata';
import {NestFactory} from '@nestjs/core';
import type {INestApplicationContext} from '@nestjs/common';
import type {NestExpressApplication} from '@nestjs/platform-express';
import {ApiModule,WorkerModule} from './activity.js';

export async function createApi():Promise<NestExpressApplication>{
 const app=await NestFactory.create<NestExpressApplication>(ApiModule,{logger:false,abortOnError:false});
 app.useBodyParser('json',{limit:'8kb'});
 return app;
}
export function createWorker():Promise<INestApplicationContext>{
 return NestFactory.createApplicationContext(WorkerModule,{logger:false,abortOnError:false});
}
