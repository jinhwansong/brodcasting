import type {INestApplicationContext} from '@nestjs/common';
import type {NestExpressApplication} from '@nestjs/platform-express';
export async function createApi():Promise<NestExpressApplication>{
 // TODO A: ApiModule로 HTTP 앱을 만드세요. 교재의 NestFactory 공식 예제를 확인하세요.
 throw new Error('API context is not implemented');
}
export async function createWorker():Promise<INestApplicationContext>{
 // TODO B: WorkerModule의 HTTP 없는 application context를 반환하세요.
 throw new Error('Worker context is not implemented');
}
