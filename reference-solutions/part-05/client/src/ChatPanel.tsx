import {useEffect,useState} from 'react';
import {useChat} from './useChat';
import type {SessionHandle} from './useSession';
export function ChatPanel({auth}:{auth:SessionHandle}){
 const [roomId,setRoomId]=useState('r1'),[drafts,setDrafts]=useState<{owner:string;values:Record<string,string>}>({owner:'',values:{}});
 const userId=auth.view?.user?.id,chat=useChat(auth,roomId);
 const draft=userId&&drafts.owner===userId&&auth.reason!=='logout'?drafts.values[roomId]??'':'';
 useEffect(()=>{setDrafts(previous=>auth.reason==='logout'||(userId&&previous.owner&&previous.owner!==userId)?{owner:userId??'',values:{}}:previous);},[auth.reason,userId]);
 async function submit(){
  if(await chat.send(draft))setDrafts(previous=>previous.owner===userId?{...previous,values:{...previous.values,[roomId]:''}}:previous);
 }
 return <section className="chat-panel" aria-labelledby="chat-heading">
  <h2 id="chat-heading">방 채팅</h2>
  <label htmlFor="chat-room">채팅방 선택</label><select id="chat-room" value={roomId} onChange={event=>setRoomId(event.target.value)}><option value="r1">첫 번째 방</option><option value="r2">두 번째 방</option></select>
  <p role="status">{chat.status==='ready'?'채팅에 연결됐습니다.':chat.status==='connecting'?'채팅에 연결하는 중입니다.':!userId?'로그인 후 채팅에 참여할 수 있습니다.':'채팅에 연결되지 않았습니다.'}</p>
  {chat.error&&<p role="alert">{chat.error}</p>}
  {chat.sending&&<p role="status">메시지 전송을 확인하는 중입니다.</p>}
  <ul className="chat-messages" tabIndex={0} aria-label="채팅 메시지" aria-live="polite" aria-relevant="additions">{chat.messages.map(row=><li key={row.id}><strong>{row.user.username}</strong><time dateTime={row.sentAt}>{new Date(row.sentAt).toLocaleTimeString('ko-KR')}</time><p>{row.text}</p></li>)}</ul>
  <form onSubmit={event=>{event.preventDefault();void submit();}}>
   <div className="field"><label htmlFor="chat-text">채팅 내용</label><textarea id="chat-text" rows={3} maxLength={1000} value={draft} disabled={!userId||auth.busy||chat.sending} onChange={event=>setDrafts(previous=>({owner:userId??'',values:{...(previous.owner===userId?previous.values:{}),[roomId]:event.target.value}}))}/></div>
   <p className="form-hint">일반 텍스트 500자까지. 메시지는 저장하지 않으며 최근 100개만 표시합니다.</p>
   <button type="submit" disabled={chat.status!=='ready'||chat.sending||!draft.trim()||Array.from(draft).length>500}>메시지 전송</button>
   <button type="button" disabled={!userId||auth.busy||chat.status==='connecting'} onClick={chat.reconnect}>채팅 다시 접속</button>
  </form>
 </section>;
}
