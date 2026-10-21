import 'reflect-metadata';
import {NestFactory} from '@nestjs/core';
import type {INestApplicationContext} from '@nestjs/common';
import type {NestExpressApplication} from '@nestjs/platform-express';
import {ApiModule,WorkerModule} from './activity.js';

export function createApi():Promise<NestExpressApplication>{
 return NestFactory.create<NestExpressApplication>(ApiModule,{logger:false,abortOnError:false});
}
export function createWorker():Promise<INestApplicationContext>{
 return NestFactory.createApplicationContext(WorkerModule,{logger:false,abortOnError:false});
}
