import{expect,it,vi}from'vitest';
import{randomUUID}from'node:crypto';
import{load}from'./db-fixture';
import{f,app,actors,connect,ack,join,pause,setup}from'./socket-fixture';
setup();
const history=(socket:any,after='0',until?:string)=>ack(socket,'chat:history',{roomId:'r1',after,...until===undefined?{}:{until}});
it('저장뒤disconnect로ack를잃고재연결해같은ID를보내도1행만남는다',async()=>{
 const sender=await connect();await join(sender,'r1');const{ChatService}=await load('chat.service'),service=app.get(ChatService),original=service.save.bind(service);
 let done!:(value:any)=>void;const committed=new Promise<any>(resolve=>{done=resolve;}),clientMessageId=randomUUID();
 const spy=vi.spyOn(service,'save').mockImplementation(async(...args:any[])=>{const result=await original(...args);sender.disconnect();done(result.message);return result;});
 try{
  const lost=await sender.timeout(2000).emitWithAck('chat:send',{roomId:'r1',text:'응답 유실',clientMessageId}).then(()=>false,()=>true);expect(lost).toBe(true);const stored=await committed;spy.mockRestore();
  const next=await connect(),receiver=await connect(1);await join(next,'r1');await join(receiver,'r1');let repeated=0;receiver.on('chat:message',()=>repeated++);
  expect(await ack(next,'chat:send',{roomId:'r1',text:'응답 유실',clientMessageId})).toEqual({ok:true,data:stored});expect((await history(next)).data.items).toEqual([stored]);await pause();expect(repeated).toBe(0);expect((await f.pool.query('SELECT count(*)::int AS n FROM chat_messages')).rows[0].n).toBe(1);
 }finally{spy.mockRestore();}
});
it('commit후서버오류503도결과불명이며같은ID재시도는원본을확인한다',async()=>{
 const socket=await connect();await join(socket,'r1');const{ChatService}=await load('chat.service'),service=app.get(ChatService),original=service.save.bind(service),clientMessageId=randomUUID();let first=true;
 const spy=vi.spyOn(service,'save').mockImplementation(async(...args:any[])=>{const result=await original(...args);if(first){first=false;throw Error('private database marker');}return result;});
 try{const value={roomId:'r1',text:'불명 뒤 확인',clientMessageId};expect(await ack(socket,'chat:send',value)).toEqual({ok:false,code:503,message:'Service unavailable'});const retried=await ack(socket,'chat:send',value);expect(retried.ok).toBe(true);expect((await history(socket)).data.items).toEqual([retried.data]);}finally{spy.mockRestore();}
});
it('같은ID내용충돌409는저장행과공개응답을변조하지않는다',async()=>{
 const socket=await connect();await join(socket,'r1');const value={roomId:'r1',text:'원문',clientMessageId:randomUUID()},first=await ack(socket,'chat:send',value);expect(first.ok).toBe(true);expect(await ack(socket,'chat:send',{...value,text:'다른 내용'})).toMatchObject({ok:false,code:409});expect((await history(socket)).data.items).toEqual([first.data]);
});
it('실제소켓도고정watermark로51개와복구중새행을구분한다',async()=>{
 const{ChatService}=await load('chat.service'),service=app.get(ChatService);for(let i=0;i<51;i++)await service.save(actors[0].user,{roomId:'r1',text:'이력 '+i,clientMessageId:randomUUID()});const socket=await connect();await join(socket,'r1');const first=await history(socket);expect(first.ok).toBe(true);expect(first.data).toMatchObject({until:'51',next:'50',done:false});expect(first.data.items).toHaveLength(50);
 await service.save(actors[0].user,{roomId:'r1',text:'복구 중 새 행',clientMessageId:randomUUID()});const last=await history(socket,first.data.next,first.data.until);expect(last.data.items.map((r:any)=>r.seq)).toEqual(['51']);expect(last.data.done).toBe(true);expect((await history(socket,last.data.next)).data.items[0].text).toBe('복구 중 새 행');
});
it('이력은입장전/다른방/회원권삭제뒤거부한다',async()=>{
 const socket=await connect();expect(await history(socket)).toMatchObject({ok:false,code:409});await join(socket,'r2');expect(await history(socket)).toMatchObject({ok:false,code:409});await join(socket,'r1');await f.pool.query('DELETE FROM room_members WHERE user_id=$1',[actors[0].user.id]);expect(await history(socket)).toMatchObject({ok:false,code:403});
});
it('로그아웃한연결은첫이력요청부터401이다',async()=>{
 const socket=await connect();await join(socket,'r1');expect((await actors[0].jar.request('auth/logout',{method:'POST'})).status).toBe(204);expect(await history(socket)).toMatchObject({ok:false,code:401});
});
it('저장테이블장애는이력과발송모두정제503이다',async()=>{
 const socket=await connect();await join(socket,'r1');await f.pool.query('ALTER TABLE chat_messages RENAME TO unavailable_messages');
 try{expect(await ack(socket,'chat:send',{roomId:'r1',text:'장애 중'})).toEqual({ok:false,code:503,message:'Service unavailable'});expect(await history(socket)).toEqual({ok:false,code:503,message:'Service unavailable'});}finally{await f.pool.query('ALTER TABLE unavailable_messages RENAME TO chat_messages');}
});
it('발송ID누락과이력이상한추가키를실제wire에서400으로거부한다',async()=>{
 const socket=await connect();await join(socket,'r1');expect(await socket.timeout(2000).emitWithAck('chat:send',{roomId:'r1',text:'ID 없음'})).toMatchObject({ok:false,code:400});expect(await ack(socket,'chat:history',{roomId:'r1',after:'0',limit:1000})).toMatchObject({ok:false,code:400});expect(await history(socket,'1','0')).toMatchObject({ok:false,code:400});
});
