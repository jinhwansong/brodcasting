import {Body,Controller,Delete,Get,Param,Put,Query,Req,UseGuards} from '@nestjs/common';
import {IdDto,ListDto,UserDto,FavoriteDto} from './broadcast.dto.js';
import {NoticeDto} from './auth.dto.js';
import {BroadcastsService} from './broadcast.service.js';
import {AuthGuard} from './auth.guard.js';
import type {SessionRequest} from './session.js';
import {assertEmpty,currentActor} from './input.js';
@Controller()
export class BroadcastsController{
 constructor(private readonly broadcasts:BroadcastsService){}
 @Get('broadcasts') list(@Query() query:ListDto,@Req() req:SessionRequest){return this.broadcasts.list(query,req);}
 @Get('broadcasts/:id') detail(@Param() params:IdDto,@Query() query:unknown,@Req() req:SessionRequest){assertEmpty(query);return this.broadcasts.get(params.id,req);}
 @Get('users/:userId/favorites') @UseGuards(AuthGuard)
 favorites(@Param() params:UserDto,@Query() query:ListDto,@Req() req:SessionRequest){return this.broadcasts.favorites(currentActor(req),params.userId,query);}
 @Put('users/:userId/favorites/:id') @UseGuards(AuthGuard)
 put(@Param() params:FavoriteDto,@Req() req:SessionRequest,@Query() query:unknown,@Body() body:unknown){
  assertEmpty(query);assertEmpty(body);return this.broadcasts.setFavorite(currentActor(req),params.userId,params.id,true);
 }
 @Delete('users/:userId/favorites/:id') @UseGuards(AuthGuard)
 remove(@Param() params:FavoriteDto,@Req() req:SessionRequest,@Query() query:unknown,@Body() body:unknown){
  assertEmpty(query);assertEmpty(body);return this.broadcasts.setFavorite(currentActor(req),params.userId,params.id,false);
 }
 @Get('rooms/:id') room(@Param() params:IdDto,@Query() query:unknown,@Req() req:SessionRequest){assertEmpty(query);return this.broadcasts.room(params.id,req);}
 @Put('rooms/:id/notice') @UseGuards(AuthGuard)
 notice(@Param() params:IdDto,@Body() dto:NoticeDto,@Query() query:unknown,@Req() req:SessionRequest){assertEmpty(query);return this.broadcasts.updateNotice(currentActor(req),params.id,dto.notice);}
}
