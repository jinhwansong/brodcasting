import 'reflect-metadata';
import {Module} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import type {NestExpressApplication} from '@nestjs/platform-express';
import type {Pool} from 'pg';
@Module({}) class PendingHttpModule {}
export async function createApp(_pool:Pool):Promise<NestExpressApplication> {
  const app=await NestFactory.create<NestExpressApplication>(PendingHttpModule,{logger:false,abortOnError:false});
  app.setGlobalPrefix('api');return app;
}
