import {afterAll,beforeAll,beforeEach,expect,it} from 'vitest';
import {fixture,reset,load,A,B} from './db-fixture';
let f:Awaited<ReturnType<typeof fixture>>;
beforeAll(async()=>{f=await fixture();});beforeEach(async()=>{await reset(f.pool);});afterAll(async()=>{await f?.close();});
it('채팅 membership은 공지 관리자 권한과 별개이고 현재DB를 매번 확인한다',async()=>{
 const {ChatService}=await load('chat.service'),s=new ChatService(f.pool),user={id:A,username:'learner_a'};
 await expect(s.authorize(user,'r1')).rejects.toMatchObject({status:403});
 await f.pool.query('INSERT INTO room_members(user_id,room_id) VALUES($1,$2)',[A,'r2']);
 await expect(s.authorize(user,'r2')).resolves.toBeUndefined();await expect(s.authorize(user,'r1')).rejects.toMatchObject({status:403});
 await f.pool.query('DELETE FROM room_members WHERE user_id=$1',[A]);await expect(s.authorize(user,'r2')).rejects.toMatchObject({status:403});
});
it('operator의 membership 부여는 멱등이고 없는 사용자/방은 거부한다',async()=>{
 const {grantRoomMember}=await load('db-config');await grantRoomMember(f.pool,'learner_a','r1');await grantRoomMember(f.pool,'learner_a','r1');
 expect((await f.pool.query('SELECT user_id,room_id FROM room_members')).rows).toEqual([{user_id:A,room_id:'r1'}]);
 await expect(grantRoomMember(f.pool,'unknown','r1')).rejects.toThrow();await expect(grantRoomMember(f.pool,'learner_a','r3')).rejects.toThrow();
});
it('membership의FK/복합PK와제한역할SELECT만을검증한다',async()=>{
 await f.pool.query('INSERT INTO room_members(user_id,room_id) VALUES($1,$2)',[A,'r1']);
 await expect(f.pool.query('INSERT INTO room_members(user_id,room_id) VALUES($1,$2)',[A,'r1'])).rejects.toMatchObject({code:'23505'});
 const pool=await f.limitedPool();expect((await pool.query('SELECT * FROM room_members')).rowCount).toBe(1);
 await expect(pool.query('INSERT INTO room_members(user_id,room_id) VALUES($1,$2)',[B,'r1'])).rejects.toMatchObject({code:'42501'});
 await f.pool.query('DELETE FROM users WHERE id=$1',[A]);expect((await f.pool.query('SELECT * FROM room_members')).rowCount).toBe(0);
});
