import {ForbiddenException} from '@nestjs/common';
import type {User} from './types.js';
export function assertOwner(_actor:User,_targetId:string):void {
  // C: 주체/자원을 비교하세요. 완성 전에는 모두 거부합니다.
  throw new ForbiddenException('Resource access denied');
}
