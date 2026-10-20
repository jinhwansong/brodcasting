import {BadRequestException,ForbiddenException} from '@nestjs/common';
import {randomUUID} from 'node:crypto';
import type {Pool} from 'pg';
import type {User} from './types.js';
import type {JoinInput,SendInput,Message} from './chat.types.js';
export class ChatService{
 constructor(private readonly pool:Pool){}
 // A: payload 형식·길이·허용 키와 실제 DB 회원권을 구현하세요.
 parseJoin(_value:unknown):JoinInput{throw new ForbiddenException('Chat exercise incomplete');}
 parseSend(_value:unknown):SendInput{throw new ForbiddenException('Chat exercise incomplete');}
 async authorize(_user:User,_roomId:string):Promise<void>{throw new ForbiddenException('Chat exercise incomplete');}
 message(user:User,input:SendInput):Message{return{id:randomUUID(),roomId:input.roomId,text:input.text,user:{id:user.id,username:user.username},sentAt:new Date().toISOString()};}
}
