import {Body,Controller,Get,HttpCode,Post,Param,Query,Req,UseGuards} from '@nestjs/common';
import {AuthGuard} from './auth.guard.js';
import type {SessionRequest} from './session.js';
import {InboxService} from './notification-inbox.js';
import {NoticeQueue} from './notification-queue.js';
import {exact,id} from './notification-input.js';
@Controller('notifications') @UseGuards(AuthGuard)
export class InboxController{
 constructor(private readonly inbox:InboxService,private readonly queue:NoticeQueue){}
 @Post('demo') @HttpCode(202)
 async create(@Req()req:SessionRequest,@Body()body:unknown,@Query()query:unknown){exact(query,[]);const event=await this.inbox.create(req.actor!.id,body);return{...event,queued:await this.queue.enqueue(event.id)};}
 @Get('unread') async unread(@Req()req:SessionRequest,@Query()query:unknown){exact(query,[]);const result=await this.inbox.pool.query('SELECT count(*) FROM notifications WHERE user_id=$1 AND read_at IS NULL',[req.actor!.id]);return{count:Number(result.rows[0].count)};}
 @Get() list(@Req()req:SessionRequest,@Query()query:unknown){return this.inbox.list(req.actor!.id,query);}
 @Post('replay') @HttpCode(200)
 replay(@Req()req:SessionRequest,@Body()body:unknown,@Query()query:unknown){exact(body,[]);exact(query,[]);return this.queue.replay(req.actor!.id);}
 @Post(':id/read') @HttpCode(200)
 read(@Req()req:SessionRequest,@Param('id')value:string,@Body()body:unknown,@Query()query:unknown){exact(body,[]);exact(query,[]);return this.inbox.markRead(req.actor!.id,id(value));}
}
