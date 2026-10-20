import {expect,it} from 'vitest';
import {Pool} from 'pg';
import {load,A} from './db-fixture';
const user={id:A,username:'learner_a'};
async function service(){const {ChatService}=await load('chat.service');return new ChatService(new Pool({host:'127.0.0.1',port:1}));}
it('허용 방의 join 입력만 받고 unknown identity 필드를 거부한다',async()=>{
 const s=await service();expect(s.parseJoin({roomId:'r1'})).toEqual({roomId:'r1'});expect(s.parseJoin({roomId:'r2'})).toEqual({roomId:'r2'});
 expect(()=>s.parseJoin({roomId:'r1',userId:A})).toThrow(expect.objectContaining({status:400}));
});
it.each([null,[],{},'r1',{roomId:'r3'},{roomId:1},{roomId:'r1\n'},{roomId:'r1',role:'admin'}])('잘못된 join 형식을400으로 거부한다: %#',async value=>{
 const s=await service();expect(()=>s.parseJoin(value)).toThrow(expect.objectContaining({status:400}));
});
it('일반 텍스트를 원문으로 받고 Unicode 코드포인트500자를 허용한다',async()=>{
 const s=await service();for(const text of [' 안녕 ','<script>alert(1)</script>','😀'.repeat(500)])expect(s.parseSend({roomId:'r1',text})).toEqual({roomId:'r1',text});
});
it.each([null,{},[],{roomId:'r1',text:''},{roomId:'r1',text:' \n '},{roomId:'r1',text:'😀'.repeat(501)},{roomId:'r1',text:1},{roomId:'r1',text:'hi',userId:A},{roomId:'r3',text:'hi'}])('잘못된 발송 입력을400으로 거부한다: %#',async value=>{
 const s=await service();expect(()=>s.parseSend(value)).toThrow(expect.objectContaining({status:400}));
});
it('메시지 식별자·사용자·시각은 서버가 정하고 공개 필드만 전달한다',async()=>{
 const s=await service(),input={roomId:'r1',text:'안녕'};const first=s.message(user,input),second=s.message(user,input);
 expect(first.id).toMatch(/^[0-9a-f-]{36}$/);expect(first.id===second.id).toBe(false);expect(first.user).toEqual(user);expect(first.text).toBe('안녕');
 expect(Number.isFinite(Date.parse(first.sentAt))).toBe(true);expect(Object.keys(first).sort()).toEqual(['id','roomId','sentAt','text','user']);
});
