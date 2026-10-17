import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { AppModule } from './app.module.js';
import { RawInputKeysPipe } from './raw-input-keys.pipe.js';
export async function createApp(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: false, abortOnError: false });
  app.setGlobalPrefix('api');
  app.use((_req: IncomingMessage, res: ServerResponse, next: () => void) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  app.useBodyParser('json', { limit: '8kb' });
  app.useGlobalPipes(new RawInputKeysPipe(), new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true, forbidUnknownValues: true, transformOptions: { enableImplicitConversion: false } }));
  return app;
}
