import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { AppModule } from './app.module.js';
export async function createApp(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: false, abortOnError: false });
  app.setGlobalPrefix('api');
  app.use((_req: IncomingMessage, res: ServerResponse, next: () => void) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  app.useBodyParser('json', { limit: '8kb' });
  // 과제 B: RawInputKeysPipe를 먼저, transform + whitelist ValidationPipe를 다음에 연결하세요.
  return app;
}
