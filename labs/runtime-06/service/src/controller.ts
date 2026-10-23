import {Body,Controller,Get,HttpCode,Post,Param,Query,Req,UseGuards} from '@nestjs/common';
import {AuthGuard} from './auth/auth.guard.js';
import type {SessionRequest} from './auth/session.js';
import {InboxService} from './inbox.js';
import {NoticeQueue} from './queue.js';
import {exact,id} from './input.js';
@Controller('notifications') @UseGuards(AuthGuard)
export class InboxController{
 constructor(private readonly inbox:InboxService,private readonly queue:NoticeQueue){}
 @Post('demo') @HttpCode(202)
 async create(@Req()req:SessionRequest,@Body()body:unknown,@Query()query:unknown){exact(query,[]);const event=await this.inbox.create(req.actor!.id,body);return{...event,queued:await this.queue.enqueue(event.id)};}
 @Get() list(@Req()req:SessionRequest,@Query()query:unknown){return this.inbox.list(req.actor!.id,query);}
 @Post('replay') @HttpCode(200)
 replay(@Req()req:SessionRequest,@Body()body:unknown,@Query()query:unknown){exact(body,[]);exact(query,[]);return this.queue.replay(req.actor!.id);}
 @Post(':id/read') @HttpCode(200)
 read(@Req()req:SessionRequest,@Param('id')value:string,@Body()body:unknown,@Query()query:unknown){exact(body,[]);exact(query,[]);return this.inbox.markRead(req.actor!.id,id(value));}
}
