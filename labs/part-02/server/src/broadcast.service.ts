import { Injectable, NotFoundException } from '@nestjs/common';
import type { Broadcast, Scenario } from './types.js';
import type { ListDto } from './broadcast.dto.js';
@Injectable()
export class BroadcastsService {
  // 과제 A: 원본을 보존하는 조회·정렬·상세와 개발용 지연/실패를 구현하세요.
  async list(_query: ListDto): Promise<{ items: Broadcast[] }> { return { items: [] }; }
  async get(_id: string, _scenario?: Scenario): Promise<Broadcast> { throw new NotFoundException('방송을 찾을 수 없습니다.'); }
}
