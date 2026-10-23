import {Body,Controller,Get,HttpCode,Post,Query,Req,Res,UseGuards} from '@nestjs/common';
import type {Response} from 'express';
import {CredentialsDto} from './auth.dto.js';
import {AuthService} from './auth.service.js';
import {SessionRuntime,type SessionRequest} from './session.js';
import {AuthGuard} from './auth.guard.js';
import {assertEmpty} from './input.js';
@Controller('auth')
export class AuthController{
 constructor(private readonly auth:AuthService,private readonly sessions:SessionRuntime){}
 @Get('session') session(@Req() req:SessionRequest,@Query() query:unknown){assertEmpty(query);return this.sessions.view(req);}
 @Post('register') register(@Body() dto:CredentialsDto,@Query() query:unknown){assertEmpty(query);return this.auth.register(dto.username,dto.password);}
 @Post('login') @HttpCode(200) async login(@Req() req:SessionRequest,@Body() dto:CredentialsDto,@Query() query:unknown){
  assertEmpty(query);return this.sessions.establish(req,await this.auth.login(dto.username,dto.password));
 }
 @Post('logout') @HttpCode(204) @UseGuards(AuthGuard)
 async logout(@Req() req:SessionRequest,@Res({passthrough:true}) res:Response,@Query() query:unknown,@Body() body:unknown){
  assertEmpty(query);assertEmpty(body);await this.sessions.end(req,res);
 }
}
