import {useEffect,useState} from 'react';
import {useChat} from './useChat';
import type {SessionHandle} from './useSession';
import {Button,TextAreaField} from './ui/components';
export function ChatPanel({auth,roomId}:{auth:SessionHandle;roomId:string}){
 const [drafts,setDrafts]=useState<{owner:string;values:Record<string,string>}>({owner:'',values:{}});
 const userId=auth.view?.user?.id,chat=useChat(auth,roomId);
 const draft=userId&&drafts.owner===userId&&auth.reason!=='logout'?drafts.values[roomId]??'':'';
 useEffect(()=>{setDrafts(previous=>auth.reason==='logout'||(userId&&previous.owner&&previous.owner!==userId)?{owner:userId??'',values:{}}:previous);},[auth.reason,userId]);
 async function submit(){
  if(await chat.send(draft))setDrafts(previous=>previous.owner===userId?{...previous,values:{...previous.values,[roomId]:''}}:previous);
 }
 async function retry(){if(await chat.retryPending())setDrafts(previous=>previous.owner===userId?{...previous,values:{...previous.values,[roomId]:''}}:previous);}
 return <section className="chat-panel" aria-labelledby="chat-heading">
  <div className="chat-title"><h2 id="chat-heading">실시간 채팅</h2><span>공동 연습방 {roomId==='r1'?'1':'2'}</span></div>
  <p role="status">{chat.status==='ready'?'채팅에 연결됐습니다.':chat.status==='recovering'?'놓친 메시지를 복구하는 중입니다.':chat.status==='connecting'?'채팅에 연결하는 중입니다.':!userId?'로그인 후 채팅에 참여할 수 있습니다.':'채팅에 연결되지 않았습니다.'}</p>
  {chat.error&&<p role="alert">{chat.error}</p>}
  {chat.delivery!=='idle'&&<p role="status">{chat.delivery==='confirmed'?'서버 저장을 확인했습니다.':chat.delivery==='unknown'?'저장 결과 미확인. 같은 ID로 다시 확인하거나 대기를 취소하세요.':chat.delivery==='retrying'?'같은 발송 ID로 재시도하는 중입니다.':'메시지 저장을 확인하는 중입니다.'}</p>}
  <ul className="chat-messages" tabIndex={0} aria-label="채팅 메시지" aria-live="polite" aria-relevant="additions">{chat.messages.map(row=><li key={row.id}><strong>{row.user.username}</strong><time dateTime={row.sentAt}>{new Date(row.sentAt).toLocaleTimeString('ko-KR')}</time><p>{row.text}</p></li>)}</ul>
  <form onSubmit={event=>{event.preventDefault();void submit();}}>
   <TextAreaField label="채팅 내용" id="chat-text" rows={3} maxLength={1000} value={draft} disabled={!userId||auth.busy||chat.pendingText!==null} onChange={event=>setDrafts(previous=>({owner:userId??'',values:{...(previous.owner===userId?previous.values:{}),[roomId]:event.target.value}}))}/>
   <p className="form-hint">서로 존중하며 대화해요. 500자까지 보낼 수 있어요.</p>
   <Button type="submit" variant="primary" size="small" busy={chat.sending} disabled={chat.status!=='ready'||chat.pendingText!==null||!draft.trim()||Array.from(draft).length>500}>메시지 전송</Button>
   {chat.pendingText!==null&&<><Button size="small" disabled={chat.sending||chat.status!=='ready'} onClick={()=>void retry()}>미확인 전송 다시 확인</Button><Button size="small" variant="ghost" disabled={chat.sending} onClick={chat.cancelPending}>전송 대기 취소</Button></>}
   <Button size="small" variant="ghost" disabled={!userId||auth.busy||chat.status==='connecting'} onClick={chat.reconnect}>채팅 다시 접속</Button>
  </form>
 </section>;
}
