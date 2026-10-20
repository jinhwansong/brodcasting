import {beforeAll,beforeEach,afterAll,expect,it} from 'vitest';
import {randomUUID} from 'node:crypto';
import {fixture,load,reset,A,B} from './db-fixture';
let f:Awaited<ReturnType<typeof fixture>>,repo:any;
const a={id:A,username:'learner_a'},b={id:B,username:'learner_b'};
const input=(text='저장 확인',roomId='r1',clientMessageId=randomUUID())=>({roomId,text,clientMessageId});
beforeAll(async()=>{f=await fixture();const{ChatRepository}=await load('chat.repository');repo=new ChatRepository(await f.limitedPool());});
beforeEach(async()=>{await reset(f.pool);await f.pool.query('INSERT INTO room_members(user_id,room_id) VALUES($1,$3),($1,$4),($2,$3)',[A,B,'r1','r2']);});
afterAll(async()=>{await f?.close();});
it('저장한행의ID·순서·사용자·시각을DB에서되읽고재생성후복구한다',async()=>{
 const value=input(),result=await repo.save(a,value);expect(result.inserted).toBe(true);expect(result.message).toMatchObject({...value,seq:'1',user:a});expect(result.message.id).toMatch(/^[0-9a-f-]{36}$/);expect(Number.isFinite(Date.parse(result.message.sentAt))).toBe(true);
 const{ChatRepository}=await load('chat.repository'),fresh=new ChatRepository(await f.limitedPool());expect(await fresh.history(a,{roomId:'r1',after:'0'})).toEqual({items:[result.message],until:'1',next:'1',done:true});
});
it('동시같은ID재전송은한행·한순서와동일서버메시지를반환한다',async()=>{
 const value=input(),results=await Promise.all(Array.from({length:4},()=>repo.save(a,value)));expect(results.filter(r=>r.inserted)).toHaveLength(1);expect(results.every(r=>JSON.stringify(r.message)===JSON.stringify(results[0].message))).toBe(true);
 expect((await f.pool.query('SELECT count(*)::int AS n FROM chat_messages')).rows[0].n).toBe(1);expect((await f.pool.query('SELECT value::text FROM chat_room_counters')).rows[0].value).toBe('1');
});
it('같은ID의다른내용은409이며기존행을고치지않는다',async()=>{
 const value=input();const first=await repo.save(a,value);await expect(repo.save(a,{...value,text:'내용 교체'})).rejects.toMatchObject({status:409});expect((await repo.history(a,{roomId:'r1',after:'0'})).items).toEqual([first.message]);
});
it('ID중복범위는같은사용자·같은방이며다른방/사용자는독립이다',async()=>{
 const id=randomUUID();const results=await Promise.all([repo.save(a,input('A1','r1',id)),repo.save(b,input('B1','r1',id)),repo.save(a,input('A2','r2',id))]);expect(results.every(r=>r.inserted)).toBe(true);expect(results.map(r=>r.message.id).length).toBe(new Set(results.map(r=>r.message.id)).size);expect(results[2].message.seq).toBe('1');expect((await repo.history(a,{roomId:'r1',after:'0'})).items.map((r:any)=>r.seq)).toEqual(['1','2']);
});
it('INSERT실패는counter증가와행을함께rollback한다',async()=>{
 await repo.save(a,input('첫 행'));await expect(repo.save(a,input('x'.repeat(501)))).rejects.toBeTruthy();const next=await repo.save(a,input('다음 행'));expect(next.message.seq).toBe('2');expect((await repo.history(a,{roomId:'r1',after:'0'})).items).toHaveLength(2);
});
it('방별lock을commit까지유지해미커밋앞번호를커서가건너뛰지않는다',async()=>{
 const client=await f.pool.connect();await client.query("INSERT INTO chat_room_counters(room_id,value) VALUES('r1',0)");await client.query('BEGIN');
 let pending:Promise<any>|undefined;
 try{
  await client.query("UPDATE chat_room_counters SET value=1 WHERE room_id='r1'");await client.query('INSERT INTO chat_messages(room_id,seq,id,user_id,username,text,client_message_id) VALUES($1,1,$2,$3,$4,$5,$6)',['r1',randomUUID(),A,a.username,'미커밋 앞 행',randomUUID()]);
  const role=(await(await f.limitedPool()).query('SELECT current_user AS name')).rows[0].name;
  let settled=false;pending=repo.save(b,input('뒤 행')).then((v:any)=>{settled=true;return v;},(error:unknown)=>{settled=true;throw error;});void pending.catch(()=>{});
  let waiting=false;const deadline=Date.now()+2500;
  while(!settled&&Date.now()<deadline){const locks=await f.pool.query("SELECT 1 FROM pg_stat_activity WHERE usename=$1 AND wait_event_type='Lock' AND query LIKE '%chat_room_counters%'",[role]);if(locks.rowCount){waiting=true;break;}await new Promise(resolve=>setTimeout(resolve,10));}
  expect(waiting).toBe(true);expect(settled).toBe(false);
  expect(await repo.history(a,{roomId:'r1',after:'0'})).toEqual({items:[],until:'0',next:'0',done:true});
  await client.query('COMMIT');expect((await pending).message.seq).toBe('2');expect((await repo.history(a,{roomId:'r1',after:'0'})).items.map((r:any)=>r.text)).toEqual(['미커밋 앞 행','뒤 행']);
 }finally{await client.query('ROLLBACK');client.release();if(pending)await pending.catch(()=>{});}
});
it('50개페이지의고정watermark뒤에저장된행은다음snapshot으로복구한다',async()=>{
 for(let i=0;i<51;i++)await repo.save(a,input('행 '+i));const first=await repo.history(a,{roomId:'r1',after:'0'});expect(first.items).toHaveLength(50);expect(first).toMatchObject({until:'51',next:'50',done:false});await repo.save(a,input('복구 중 새 행'));
 const last=await repo.history(a,{roomId:'r1',after:first.next,until:first.until});expect(last.items.map((r:any)=>r.seq)).toEqual(['51']);expect(last).toMatchObject({until:'51',next:'51',done:true});expect((await repo.history(a,{roomId:'r1',after:'51'})).items[0].text).toBe('복구 중 새 행');
});
it('정확히50개면추가페이지없이완료하고삭제구멍뒤에도커서를진전한다',async()=>{
 for(let i=0;i<50;i++)await repo.save(a,input('행 '+i));expect(await repo.history(a,{roomId:'r1',after:'0'})).toMatchObject({until:'50',next:'50',done:true});await f.pool.query("DELETE FROM chat_messages WHERE room_id='r1' AND seq>=45");const page=await repo.history(a,{roomId:'r1',after:'44'});expect(page).toEqual({items:[],until:'50',next:'50',done:true});
});
it('bigint순서를JS정수로손실시키지않고문자열로보존한다',async()=>{
 await f.pool.query("INSERT INTO chat_room_counters(room_id,value) VALUES('r1',9007199254740992)");const result=await repo.save(a,input());expect(result.message.seq).toBe('9007199254740993');expect((await repo.history(a,{roomId:'r1',after:'9007199254740992'})).next).toBe('9007199254740993');
});
it('회원권이없거나삭제되면저장·중복조회·이력을모두거부한다',async()=>{
 const value=input();await repo.save(a,value);await f.pool.query('DELETE FROM room_members WHERE user_id=$1',[A]);await expect(repo.save(a,value)).rejects.toMatchObject({status:403});await expect(repo.history(a,{roomId:'r1',after:'0'})).rejects.toMatchObject({status:403});
});
it('미래watermark와이전DB보다큰cursor는409로거부한다',async()=>{
 await expect(repo.history(a,{roomId:'r1',after:'1'})).rejects.toMatchObject({status:409});await expect(repo.history(a,{roomId:'r1',after:'0',until:'1'})).rejects.toMatchObject({status:409});
});
it('제한역할은저장/조회만가능하고행수정·삭제·회원권생성·DDL은거부된다',async()=>{
 await repo.save(a,input());const pool=await f.limitedPool();for(const sql of ["DELETE FROM chat_messages","UPDATE chat_messages SET text='변조'","DELETE FROM chat_room_counters","UPDATE chat_room_counters SET room_id='r2'","INSERT INTO room_members VALUES('a1111111-1111-4111-8111-111111111111','r2')","CREATE TABLE chat_elevation(id int)"])await expect(pool.query(sql)).rejects.toMatchObject({code:'42501'});
});
