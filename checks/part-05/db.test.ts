import {afterAll,beforeAll,beforeEach,expect,it} from 'vitest';
import {fixture,load,reset,A,B} from './db-fixture';
let db:Awaited<ReturnType<typeof fixture>>,repo:any,users:any;
const query={search:'',sort:'viewers-desc',limit:2,offset:0,favoritesOnly:false};
beforeAll(async()=>{db=await fixture();const {BroadcastRepository}=await load('repository'),{UserRepository}=await load('user.repository');repo=new BroadcastRepository(db.pool);users=new UserRepository(db.pool);});
beforeEach(async()=>reset(db.pool));afterAll(async()=>db?.close());
it('가입 repository는 저장하고 해시 없는 공개 User를 반환한다',async()=>{
 const user=await users.create('learner_c','non-auth-fixture-value');
 expect(Object.keys(user).sort()).toEqual(['id','username']);expect(user.username).toBe('learner_c');
 expect((await db.pool.query('SELECT username FROM users WHERE id=$1',[user.id])).rows).toEqual([{username:'learner_c'}]);
});
it('계정 조회는 내부 해시와 공개 사용자 조회를 분리한다',async()=>{
 expect(await users.findByUsername('learner_a')).toEqual({id:A,username:'learner_a',passwordHash:'not-an-auth-fixture'});
 expect(await users.get(A)).toEqual({id:A,username:'learner_a'});expect(await users.get('00000000-0000-4000-8000-000000000000')).toBeNull();
});
it('계정 조회의 SQL 문자열은 데이터이며 기존 사용자가 남는다',async()=>{expect(await users.findByUsername("' OR 1=1; DROP TABLE users;--")).toBeNull();expect(Number((await db.pool.query('SELECT count(*) FROM users')).rows[0].count)).toBe(2);});
it('동시 가입의 username 유일성은 DB가 보장한다',async()=>{
 const values=await Promise.allSettled(Array.from({length:4},()=>users.create('same_name','non-auth-fixture')));
 expect(values.filter(x=>x.status==='fulfilled')).toHaveLength(1);
 expect(values.filter(x=>x.status==='rejected')).toHaveLength(3);
});
it('공개 목록은 안정적인 첫/다음 페이지와 익명 favorite=false다',async()=>{
 const first=await repo.list(query);expect(first.items.map((r:any)=>[r.id,r.favorite])).toEqual([['d',false],['a',false]]);expect(first.hasMore).toBe(true);
 expect((await repo.list({...query,offset:2})).items.map((r:any)=>r.id)).toEqual(['e','b']);
});
it('개인 favorite 조회는 사용자별로 나뉜다',async()=>{
 await db.pool.query('INSERT INTO favorites(user_id,broadcast_id) VALUES($1,$2),($3,$4)',[A,'a',B,'e']);
 expect((await repo.list({...query,favoritesOnly:true},A)).items.map((r:any)=>r.id)).toEqual(['a']);
 expect((await repo.list({...query,favoritesOnly:true},B)).items.map((r:any)=>r.id)).toEqual(['e']);
 expect((await repo.get('a',A)).favorite).toBe(true);expect((await repo.get('a',B)).favorite).toBe(false);
});
it('같은 방송을 동시 추가해도 사용자마다 한 행이다',async()=>{
 await Promise.all(Array.from({length:5},()=>repo.setFavorite(A,'a',true)));await repo.setFavorite(B,'a',true);
 expect(Number((await db.pool.query('SELECT count(*) FROM favorites')).rows[0].count)).toBe(2);
});
it('삭제는 주체의 행만 지우며 반복해도 멱등이다',async()=>{
 await db.pool.query('INSERT INTO favorites(user_id,broadcast_id) VALUES($1,$2),($3,$4)',[A,'a',B,'a']);
 await repo.setFavorite(A,'a',false);await repo.setFavorite(A,'a',false);
 expect((await db.pool.query('SELECT user_id FROM favorites')).rows).toEqual([{user_id:B}]);
});
it('사용자/방송 FK와 즐겨찾기 복합PK가 직접 SQL에도 적용된다',async()=>{
 await expect(db.pool.query('INSERT INTO favorites(user_id,broadcast_id) VALUES($1,$2)',['00000000-0000-4000-8000-000000000000','a'])).rejects.toMatchObject({code:'23503'});
 await expect(db.pool.query('INSERT INTO favorites(user_id,broadcast_id) VALUES($1,$2)',[A,'missing'])).rejects.toMatchObject({code:'23503'});
 await db.pool.query('INSERT INTO favorites(user_id,broadcast_id) VALUES($1,$2)',[A,'a']);
 await expect(db.pool.query('INSERT INTO favorites(user_id,broadcast_id) VALUES($1,$2)',[A,'a'])).rejects.toMatchObject({code:'23505'});
});
it('방 관리 권한은 방마다 달라 익명/다른 방은 canEdit=false다',async()=>{
 expect(await repo.getRoom('r1')).toMatchObject({id:'r1',canEdit:false});
 expect(await repo.getRoom('r1',A)).toMatchObject({canEdit:true});expect(await repo.getRoom('r2',A)).toMatchObject({canEdit:false});
 expect(await repo.getRoom('missing',A)).toBeNull();
});
it('해당 방 관리자만 조건부 SQL로 공지를 수정한다',async()=>{
 expect(await repo.updateNotice(A,'r1','새 공지')).toMatchObject({notice:'새 공지',canEdit:true});
 expect(await repo.updateNotice(B,'r1','권한 없는 변경')).toBeNull();
 expect((await db.pool.query("SELECT notice FROM rooms WHERE id='r1'")).rows).toEqual([{notice:'새 공지'}]);
});
it('공지의 SQL/HTML 문자열은 일반 데이터로 저장한다',async()=>{
 const notice="<strong data-probe='notice'>안내</strong>'; DROP TABLE rooms;--";
 expect(await repo.updateNotice(A,'r1',notice)).toMatchObject({notice});expect(Number((await db.pool.query('SELECT count(*) FROM rooms')).rows[0].count)).toBe(2);
});
it('관리자 부여는 operator의 명시 작업이며 멱등이다',async()=>{
 const {grantRoomAdmin}=await load('db-config');await grantRoomAdmin(db.pool,'learner_a','r2');await grantRoomAdmin(db.pool,'learner_a','r2');
 expect(Number((await db.pool.query('SELECT count(*) FROM room_admins WHERE user_id=$1 AND room_id=$2',[A,'r2'])).rows[0].count)).toBe(1);
 await expect(grantRoomAdmin(db.pool,'missing','r1')).rejects.toThrow();
});
it('최소 DB 역할은 앱 작업만 하고 관리자 부여/사용자 수정/DDL은 못 한다',async()=>{
 const app=await db.limitedPool();
 await app.query('SELECT username FROM users');await app.query('SELECT * FROM broadcasts');
 await app.query('INSERT INTO favorites(user_id,broadcast_id) VALUES($1,$2)',[A,'a']);await app.query('DELETE FROM favorites WHERE user_id=$1',[A]);
 await app.query('INSERT INTO sessions(sid,sess,expire) VALUES($1,$2,now()+interval \'1 minute\')',['opaque-test-id',{}]);
 await app.query('UPDATE sessions SET sess=$1 WHERE sid=$2',[{},'opaque-test-id']);await app.query('DELETE FROM sessions WHERE sid=$1',['opaque-test-id']);
 await app.query('UPDATE rooms SET notice=$1 WHERE id=$2',['allowed-column','r1']);
 for(const sql of ["UPDATE users SET username='changed'","INSERT INTO room_admins(user_id,room_id) VALUES('"+A+"','r2')","UPDATE rooms SET title='wrong'","CREATE TABLE denied(id int)"]){await expect(app.query(sql)).rejects.toMatchObject({code:'42501'});}
});
it('seed는6방송/2방을 만들고 기존 공지를 덮지 않는다',async()=>{
 await db.pool.query('TRUNCATE favorites,room_admins,rooms,broadcasts CASCADE');const {seed}=await load('fixtures');await seed(db.pool);await seed(db.pool);
 expect(Number((await db.pool.query('SELECT count(*) FROM broadcasts')).rows[0].count)).toBe(6);expect(Number((await db.pool.query('SELECT count(*) FROM rooms')).rows[0].count)).toBe(2);
 await db.pool.query("UPDATE rooms SET notice='보존' WHERE id='r1'");await seed(db.pool);expect((await db.pool.query("SELECT notice FROM rooms WHERE id='r1'")).rows[0].notice).toBe('보존');
});
it('migration은 재실행/변경 checksum/실패 rollback을 구분한다',async()=>{
 const other=await fixture(false);const {applyMigrations}=await load('migrate');
 try{
  expect(await applyMigrations(other.pool)).toBe(1);expect(await applyMigrations(other.pool)).toBe(0);
  await expect(applyMigrations(other.pool,[{version:'001-schema.sql',sql:'SELECT 1'}])).rejects.toThrow('Migration changed');
  await expect(applyMigrations(other.pool,[{version:'bad',sql:'CREATE TABLE rollback_probe(id int); SELECT missing_field'}])).rejects.toThrow();
  expect((await other.pool.query("SELECT to_regclass('rollback_probe') AS name")).rows[0].name).toBeNull();
 }finally{await other.close();}
});
