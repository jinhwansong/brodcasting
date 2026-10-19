import type {Pool} from 'pg';
import type {Broadcast,ListQuery,Page,Room} from './types.js';
const columns='b.id,b.title,b.host_name AS "hostName",b.viewer_count AS "viewerCount",b.description,(f.broadcast_id IS NOT NULL) AS favorite';
const join='FROM broadcasts b LEFT JOIN favorites f ON f.broadcast_id=b.id AND f.user_id=$1';
export class BroadcastRepository {
 constructor(private readonly pool:Pool){}
 async list(query:ListQuery,userId?:string):Promise<Page>{
  const order=query.sort==='title-asc'?'b.title COLLATE "C" ASC,b.id ASC':'b.viewer_count DESC,b.id ASC';
  const pattern='%'+query.search.trim().replace(/[\\%_]/g,c=>'\\'+c)+'%';
  const {rows}=await this.pool.query<Broadcast>(`SELECT ${columns} ${join}
   WHERE (b.title ILIKE $2 OR b.host_name ILIKE $2) AND (NOT $3::boolean OR f.broadcast_id IS NOT NULL)
   ORDER BY ${order} LIMIT $4 OFFSET $5`,[userId??null,pattern,query.favoritesOnly,query.limit+1,query.offset]);
  return{items:rows.slice(0,query.limit),limit:query.limit,offset:query.offset,hasMore:rows.length>query.limit};
 }
 async get(id:string,userId?:string):Promise<Broadcast|null>{
  return(await this.pool.query<Broadcast>(`SELECT ${columns} ${join} WHERE b.id=$2`,[userId??null,id])).rows[0]??null;
 }
 async setFavorite(userId:string,id:string,enabled:boolean):Promise<void>{
  if(enabled)await this.pool.query('INSERT INTO favorites(user_id,broadcast_id) VALUES($1,$2) ON CONFLICT(user_id,broadcast_id) DO NOTHING',[userId,id]);
  else await this.pool.query('DELETE FROM favorites WHERE user_id=$1 AND broadcast_id=$2',[userId,id]);
 }
 async getRoom(id:string,userId?:string):Promise<Room|null>{
  return(await this.pool.query<Room>(`SELECT r.id,r.title,r.notice,
   EXISTS(SELECT 1 FROM room_admins a WHERE a.room_id=r.id AND a.user_id=$2) AS "canEdit"
   FROM rooms r WHERE r.id=$1`,[id,userId??null])).rows[0]??null;
 }
 async updateNotice(userId:string,id:string,notice:string):Promise<Room|null>{
  return(await this.pool.query<Room>(`UPDATE rooms r SET notice=$3 WHERE r.id=$2
   AND EXISTS(SELECT 1 FROM room_admins a WHERE a.room_id=r.id AND a.user_id=$1)
   RETURNING r.id,r.title,r.notice,true AS "canEdit"`,[userId,id,notice])).rows[0]??null;
 }
}
