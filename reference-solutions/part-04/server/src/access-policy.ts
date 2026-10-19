import {ForbiddenException} from '@nestjs/common';
import type {Room,User} from './types.js';
export function assertOwner(actor:User,targetId:string):void {
 if(actor.id!==targetId.toLowerCase())throw new ForbiddenException('Resource access denied');
}
export function assertRoomAdmin(room:Room):void{
 if(!room.canEdit)throw new ForbiddenException('Room access denied');
}
