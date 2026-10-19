import {ForbiddenException} from '@nestjs/common';
import type {Room,User} from './types.js';
export function assertOwner(_actor:User,_targetId:string):void {
  // C: 주체/자원을 비교하세요. 완성 전에는 모두 거부합니다.
  throw new ForbiddenException('Resource access denied');
}
export function assertRoomAdmin(_room:Room):void{
 // C: 서버가 조회한 방별 권한을 확인하세요. 완성 전에는 모두 거부합니다.
 throw new ForbiddenException('Room access denied');
}
