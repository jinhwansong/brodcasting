import{ForbiddenException}from'@nestjs/common';
import type{Pool}from'pg';
import type{User}from'./types.js';
import type{SendInput,Message,HistoryInput,HistoryPage}from'./chat.types.js';
export class ChatRepository{
 constructor(private readonly pool:Pool){}
 async save(_user:User,_input:SendInput):Promise<{message:Message;inserted:boolean}>{
  // TODO A: 방 counter lock·회원권·발송 ID 중복·저장을 한 트랜잭션으로 처리한다.
  throw new ForbiddenException('TODO A: persistent storage');
 }
 async history(_user:User,_input:HistoryInput):Promise<HistoryPage>{
  // TODO A: 회원권을 확인하고 고정 until 안의 다음 50행과 cursor를 반환한다.
  throw new ForbiddenException('TODO A: history query');
 }
}
