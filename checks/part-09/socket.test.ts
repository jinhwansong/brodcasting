import{expect,it,vi}from'vitest';
import{load}from'./db-fixture';
import{ORIGIN}from'./cookie-jar';
import{f,app,actors,connect,ack,event,join,pause,setup,shutdown}from'./socket-fixture';
setup();
it('인증 연결 후 회원권이 있는 방만 입장하고 입장 전 발송을 거부한다',async()=>{
 const a=await connect();expect(await ack(a,'chat:send',{roomId:'r1',text:'입장 전'})).toMatchObject({ok:false,code:409});
 expect(await ack(a,'room:join',{roomId:'r1'})).toEqual({ok:true,data:{roomId:'r1'}});
 const b=await connect(1);expect(await ack(b,'room:join',{roomId:'r2'})).toMatchObject({ok:false,code:403});
});
it('익명·위조쿠키·다른Origin·누락Origin 연결을 거부한다',async()=>{
 await expect(connect(null)).rejects.toMatchObject({data:{code:401}});
 const cookie=actors[0].jar.cookie;actors[0].jar.cookie='brodcasting.part09.sid=forged';await expect(connect()).rejects.toMatchObject({data:{code:401}});actors[0].jar.cookie=cookie;
 await expect(connect(0,'http://other.invalid')).rejects.toBeTruthy();await expect(connect(0,null)).rejects.toBeTruthy();
});
it('같은방만수신하고identity·id·시각은서버가결정한다',async()=>{
 const a=await connect(0),b=await connect(1),c=await connect(2);let leaked=0;c.on('chat:message',()=>leaked++);
 await join(a,'r1');await join(b,'r1');await join(c,'r2');
 const receive=event(b,'chat:message');void receive.catch(()=>{});const result=await ack(a,'chat:send',{roomId:'r1',text:'<script>안녕</script>'});expect(result.ok).toBe(true);const message=await receive;
 expect(result).toEqual({ok:true,data:message});expect(message.user).toEqual(actors[0].user);expect(message.id).toMatch(/^[0-9a-f-]{36}$/);expect(message.text).toBe('<script>안녕</script>');expect(Number.isFinite(Date.parse(message.sentAt))).toBe(true);
 await pause();expect(leaked).toBe(0);
});
it('handshake auth의가짜계정은주체가되지않고payload추가키를거부한다',async()=>{
 const a=await connect(0,ORIGIN,{userId:actors[1].user.id,role:'admin'});await join(a,'r2');
 expect(await ack(a,'chat:send',{roomId:'r2',text:'위조',userId:actors[1].user.id})).toMatchObject({ok:false,code:400});
 const result=await ack(a,'chat:send',{roomId:'r2',text:'정상'});expect(result.ok).toBe(true);expect(result.data.user).toEqual(actors[0].user);
});
it.each(['','  \n','😀'.repeat(501),123])('빈/긴/잘못된메시지를거부하고방에전달하지않는다: %#',async text=>{
 const a=await connect();await join(a,'r1');let received=0;a.on('chat:message',()=>received++);
 expect(await ack(a,'chat:send',{roomId:'r1',text})).toMatchObject({ok:false,code:400});await pause();expect(received).toBe(0);
});
it('연속방이동은직렬이며이전방발송/수신이남지않는다',async()=>{
 const a=await connect(),b=await connect(1);await join(b,'r1');
 const results=await Promise.all([ack(a,'room:join',{roomId:'r1'}),ack(a,'room:join',{roomId:'r2'})]);expect(results.every(r=>r.ok)).toBe(true);
 expect(await ack(a,'chat:send',{roomId:'r1',text:'옛 방'})).toMatchObject({ok:false,code:409});
 let received=0;a.on('chat:message',()=>received++);await ack(b,'chat:send',{roomId:'r1',text:'다른 방'});await pause();expect(received).toBe(0);
});
it('거부된새방입장뒤이전방구독을남기지않는다',async()=>{
 const a=await connect(),b=await connect(1);await join(a,'r1');await join(b,'r1');
 expect(await ack(b,'room:join',{roomId:'r2'})).toMatchObject({ok:false,code:403});let received=0;b.on('chat:message',()=>received++);
 await ack(a,'chat:send',{roomId:'r1',text:'예전 구독'});await pause();expect(received).toBe(0);
});
it('회원권삭제후발송과수신을새DB상태로차단한다',async()=>{
 const a=await connect(),b=await connect(1);await join(a,'r1');await join(b,'r1');
 await f.pool.query('DELETE FROM room_members WHERE user_id=$1',[actors[1].user.id]);let received=0;b.on('chat:message',()=>received++);
 const denied=event(b,'chat:error');await ack(a,'chat:send',{roomId:'r1',text:'비공개'});expect(await denied).toMatchObject({code:403});
 expect(await ack(b,'chat:send',{roomId:'r1',text:'권한없음'})).toMatchObject({ok:false});await pause();expect(received).toBe(0);
});
it('로그아웃한기존연결은다음수신을받지못하고끊어진다',async()=>{
 const a=await connect(),b=await connect(1);await join(a,'r1');await join(b,'r1');
 expect((await actors[1].jar.request('auth/logout',{method:'POST'})).status).toBe(204);let received=0;b.on('chat:message',()=>received++);const disconnected=event(b,'disconnect');
 await ack(a,'chat:send',{roomId:'r1',text:'폐기 뒤'});await disconnected;expect(received).toBe(0);
});
it('늦은이전방수신거부가새방입장을취소하지않는다',async()=>{
 await f.pool.query('INSERT INTO room_members(user_id,room_id) VALUES($1,$2)',[actors[1].user.id,'r2']);
 const a=await connect(),b=await connect(1);await join(a,'r1');await join(b,'r1');
 const {ChatService}=await load('chat.service'),service=app.get(ChatService),original=service.authorize.bind(service);
 let resume!:()=>void,started!:()=>void;const blocked=new Promise<void>(resolve=>{resume=resolve;}),entered=new Promise<void>(resolve=>{started=resolve;});
 const spy=vi.spyOn(service,'authorize').mockImplementation(async(user:any,roomId:any)=>{if(user.id===actors[1].user.id&&roomId==='r1'){started();await blocked;}return original(user,roomId);});
 try{
  const sending=ack(a,'chat:send',{roomId:'r1',text:'지연 전달'});await entered;
  await f.pool.query('DELETE FROM room_members WHERE user_id=$1 AND room_id=$2',[actors[1].user.id,'r1']);expect((await ack(b,'room:join',{roomId:'r2'})).ok).toBe(true);
  resume();await sending;expect((await ack(b,'chat:send',{roomId:'r2',text:'현재 방'})).ok).toBe(true);
 }finally{resume();spy.mockRestore();}
});
it('유휴연결도절대만료와사용자삭제를확인해정리한다',async()=>{
 const a=await connect(),b=await connect(1),left=event(a,'disconnect'),right=event(b,'disconnect');
 await f.pool.query("UPDATE sessions SET sess=jsonb_set(sess::jsonb,'{authenticatedAt}','0')::json WHERE sess->>'userId'=$1",[actors[0].user.id]);
 await f.pool.query('DELETE FROM users WHERE id=$1',[actors[1].user.id]);await Promise.all([left,right]);expect(a.connected||b.connected).toBe(false);
});
it.each(['logout','expired','deleted'])('유휴sweep전첫발송도현재세션으로거부하고전달하지않는다: %s',async mode=>{
 const a=await connect(),b=await connect(1);await join(a,'r1');await join(b,'r1');let received=0;b.on('chat:message',()=>received++);
 if(mode==='logout')expect((await actors[0].jar.request('auth/logout',{method:'POST'})).status).toBe(204);
 else if(mode==='deleted')await f.pool.query('DELETE FROM users WHERE id=$1',[actors[0].user.id]);
 else await f.pool.query("UPDATE sessions SET sess=jsonb_set(sess::jsonb,'{authenticatedAt}','0')::json WHERE sess->>'userId'=$1",[actors[0].user.id]);
 const disconnected=event(a,'disconnect');expect(await ack(a,'chat:send',{roomId:'r1',text:'거부될 글'})).toMatchObject({ok:false,code:401});await disconnected;expect(received).toBe(0);
});
it('연결후sessionstore장애도정제503으로거부한다',async()=>{
 const a=await connect();await join(a,'r1');await f.pool.query('ALTER TABLE sessions RENAME TO unavailable_sessions');
 try{expect(await ack(a,'chat:send',{roomId:'r1',text:'장애 중'})).toEqual({ok:false,code:503,message:'Service unavailable'});}finally{await f.pool.query('ALTER TABLE unavailable_sessions RENAME TO sessions');}
});
it('세션store장애는정제503이고인증성공으로감추지않는다',async()=>{
 await f.pool.query('ALTER TABLE sessions RENAME TO unavailable_sessions');
 try{await expect(connect()).rejects.toMatchObject({data:{code:503}});}finally{await f.pool.query('ALTER TABLE unavailable_sessions RENAME TO sessions');}
});
it('회원권DB장애는정제503이며원문쿼리를응답하지않는다',async()=>{
 const a=await connect();await f.pool.query('ALTER TABLE room_members RENAME TO unavailable_members');
 try{const result=await ack(a,'room:join',{roomId:'r1'});expect(result).toEqual({ok:false,code:503,message:'Service unavailable'});}finally{await f.pool.query('ALTER TABLE unavailable_members RENAME TO room_members');}
});
it('이벤트10회상한과과도한frame을차단한다',async()=>{
 const a=await connect();for(let i=0;i<10;i++)expect((await ack(a,'room:join',{roomId:'r1'})).ok).toBe(true);
 expect(await ack(a,'room:join',{roomId:'r1'})).toMatchObject({ok:false,code:429});
 const disconnected=event(a,'disconnect');a.emit('chat:send',{roomId:'r1',text:'x'.repeat(9000)});await disconnected;
});
it('DB응답대기중에도동시대기4개를넘기지않는다',async()=>{
 const a=await connect(),client=await f.pool.connect();await client.query('BEGIN');await client.query('LOCK TABLE room_members IN ACCESS EXCLUSIVE MODE');
 try{const pending=Array.from({length:4},()=>ack(a,'room:join',{roomId:'r1'}));await pause(30);
  expect(await ack(a,'room:join',{roomId:'r1'})).toMatchObject({ok:false,code:429});await client.query('ROLLBACK');expect((await Promise.all(pending)).every(r=>r.ok)).toBe(true);
 }finally{await client.query('ROLLBACK');client.release();}
});
it('연결20개상한과서버종료시연결정리를검증한다',async()=>{
 const clients=[];for(let i=0;i<20;i++)clients.push(await connect());await expect(connect()).rejects.toMatchObject({data:{code:429}});
 const closed=clients.map(client=>event(client,'disconnect'));await shutdown();await Promise.all(closed);expect(clients.every(c=>!c.connected)).toBe(true);
});
