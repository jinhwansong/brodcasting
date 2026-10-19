import 'reflect-metadata';
import {Module} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import type {NestExpressApplication} from '@nestjs/platform-express';
import type {Pool} from 'pg';
export type AppOptions={secret:string;browserOrigin:string;schemaName?:string;sessionTtlMs?:number;authRateLimit?:{windowMs:number;limit:number}};
@Module({})class EmptyModule{}
export async function createApp(_pool:Pool,_options:AppOptions):Promise<NestExpressApplication>{
 return NestFactory.create<NestExpressApplication>(EmptyModule,{logger:false,abortOnError:false});
}
