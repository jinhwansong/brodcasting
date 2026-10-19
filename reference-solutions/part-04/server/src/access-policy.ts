import {ForbiddenException} from '@nestjs/common';
import type {User} from './types.js';
export function assertOwner(actor:User,targetId:string):void {
 if(actor.id!==targetId.toLowerCase())throw new ForbiddenException('Resource access denied');
}
