import type {Pool} from 'pg';
import type {Broadcast,ListQuery,Page} from './types.js';
export class BroadcastRepository {
  constructor(private readonly pool:Pool) {}
  async list(query:ListQuery):Promise<Page> { // 과제 B: 값 바인딩·안정 정렬·limit+1
    return {items:[],limit:query.limit,offset:query.offset,hasMore:false};
  }
  async get(_id:string):Promise<Broadcast|null> {return null;}
  async setFavorite(_id:string,_enabled:boolean):Promise<void> { // 과제 C: SQL 멱등 추가/삭제
  }
}
