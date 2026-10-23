import {BadRequestException,UnauthorizedException} from '@nestjs/common';
import type {SessionRequest} from './session.js';
import type {User} from './types.js';
export function assertEmpty(value:unknown):void{
 if(value!==undefined&&(typeof value!=='object'||value===null||Array.isArray(value)||Object.keys(value).length>0))throw new BadRequestException('No input fields allowed');
}
export function currentActor(req:SessionRequest):User{
 if(!req.actor)throw new UnauthorizedException('Authentication required');return req.actor;
}
