import type {Pool} from 'pg';
export async function grantRoomMember(pool:Pool,username:string,roomId:string):Promise<void>{
 const client=await pool.connect();
 try{
  await client.query('BEGIN');
  const result=await client.query('SELECT u.id AS user_id,r.id AS room_id FROM users u CROSS JOIN rooms r WHERE u.username=$1 AND r.id=$2 FOR SHARE OF u,r',[username,roomId]);
  if(result.rows.length!==1)throw new Error('Unknown local user or room');
  await client.query('INSERT INTO room_members(user_id,room_id) VALUES($1,$2) ON CONFLICT(user_id,room_id) DO NOTHING',[result.rows[0].user_id,result.rows[0].room_id]);
  await client.query('COMMIT');
 }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
}
export function requireLocalDatabase(raw:string|undefined,name:string):URL {
 if(!raw)throw new Error('A dedicated local PostgreSQL URL is required');
 let url:URL;try{url=new URL(raw);}catch{throw new Error('Invalid local PostgreSQL URL');}
 if(!['postgres:','postgresql:'].includes(url.protocol)||!['127.0.0.1','[::1]'].includes(url.hostname)||url.pathname!=='/'+name||url.search||url.hash)throw new Error('Use the dedicated loopback PostgreSQL database');
 return url;
}
export async function grantAppAccess(pool:Pick<Pool,'query'>,role:string,schema='public'):Promise<void>{
 if(!/^part09_(?:app|check_[0-9a-f]+)(?![\s\S])/.test(role)||!/^(?:public|part09_check_[0-9a-f]+)(?![\s\S])/.test(schema))throw new Error('Invalid internal role/schema');
 await pool.query(`REVOKE CREATE ON SCHEMA ${schema} FROM PUBLIC,${role};
 GRANT USAGE ON SCHEMA ${schema} TO ${role};
 REVOKE ALL ON users,broadcasts,favorites,rooms,room_admins,sessions,room_members,chat_messages,chat_room_counters FROM PUBLIC,${role};
 GRANT SELECT,INSERT ON chat_messages,chat_room_counters TO ${role};
 GRANT UPDATE(value) ON chat_room_counters TO ${role};
 GRANT SELECT,INSERT ON users TO ${role};
 GRANT SELECT ON broadcasts,rooms,room_admins,room_members TO ${role};
 GRANT SELECT,INSERT,DELETE ON favorites TO ${role};
 GRANT UPDATE(notice) ON rooms TO ${role};
 GRANT SELECT,INSERT,UPDATE,DELETE ON sessions TO ${role}`);
}
export async function grantRoomAdmin(pool:Pool,username:string,roomId:string):Promise<void>{
 const client=await pool.connect();
 try{
  await client.query('BEGIN');
  const result=await client.query('SELECT u.id AS user_id,r.id AS room_id FROM users u CROSS JOIN rooms r WHERE u.username=$1 AND r.id=$2 FOR SHARE OF u,r',[username,roomId]);
  if(result.rows.length!==1)throw new Error('Unknown local user or room');
  await client.query('INSERT INTO room_admins(user_id,room_id) VALUES($1,$2) ON CONFLICT(user_id,room_id) DO NOTHING',[result.rows[0].user_id,result.rows[0].room_id]);
  await client.query('COMMIT');
 }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
}
