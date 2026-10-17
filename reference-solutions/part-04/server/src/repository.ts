import type {Pool} from 'pg';
import type {Broadcast,ListQuery,Page,Room} from './types.js';
export class BroadcastRepository {
 constructor(private readonly pool:Pool){}
 async list(query:ListQuery,_userId?:string):Promise<Page>{return{items:[],limit:query.limit,offset:query.offset,hasMore:false};}
 async get(_id:string,_userId?:string):Promise<Broadcast|null>{return null;}
 async setFavorite(_userId:string,_id:string,_enabled:boolean):Promise<void>{}
 async getRoom(_id:string,_userId?:string):Promise<Room|null>{return null;}
 async updateNotice(_userId:string,_id:string,_notice:string):Promise<Room|null>{return null;}
}
