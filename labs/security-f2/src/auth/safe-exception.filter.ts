import {Catch,HttpException,type ArgumentsHost,type ExceptionFilter} from '@nestjs/common';
import type {Response} from 'express';
@Catch()
export class SafeExceptionFilter implements ExceptionFilter{
 catch(error:unknown,host:ArgumentsHost):void{
  const res=host.switchToHttp().getResponse<Response>();
  if(res.headersSent)return;
  const status=error instanceof HttpException?error.getStatus():503;
  if(status>=500){res.status(503).json({statusCode:503,message:'Service unavailable',error:'Service Unavailable'});return;}
  const response=(error as HttpException).getResponse();
  res.status(status).json(typeof response==='string'?{statusCode:status,message:response}:response);
 }
}
