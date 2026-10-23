import {useCallback,useEffect,useRef,useState} from 'react';
import {ApiError,createNotification,listNotifications,readNotification,replayNotifications,type NotificationPage} from './api';
import {Button,TextAreaField,InlineNotice,EmptyState} from './ui/components';
import type {SessionHandle} from './useSession';
type Pending={owner:string;clientKey:string;body:string};
export function Inbox({auth,onChanged}:{auth:SessionHandle;onChanged?:()=>void}){
 const user=auth.view?.user,enabled=auth.status==='ready'&&!auth.busy&&!!user;
 const [snapshot,setSnapshot]=useState<{epoch:number;page:NotificationPage;mode:'latest'|'older'|'after'}|null>(null),[error,setError]=useState<string|null>(null),[info,setInfo]=useState<string|null>(null),[loading,setLoading]=useState(false),[writing,setWriting]=useState(false),[body,setBody]=useState('나에게 보내는 첫 알림'),[pending,setPending]=useState<Pending|null>(null);
 const request=useRef<AbortController|null>(null),watermark=useRef('0'),writeBusy=useRef(false),owner=useRef<string|undefined>(undefined);
 const current=snapshot&&auth.isCurrent(snapshot.epoch)?snapshot:null,pendingNow=pending?.owner===user?.id?pending:null;
 const problem=useCallback((value:unknown)=>{if(value instanceof ApiError&&value.status===401){void auth.expire();return;}setError(value instanceof ApiError&&value.status===403?'요청 권한이 바뀌었어요. 계정을 다시 확인해 주세요.':value instanceof ApiError&&value.status===429?'이 실습 계정의 접수 상한에 도달했어요.':'결과를 확인하지 못했어요. 연결과 계정을 확인해 주세요.');},[auth.expire]);
 const load=useCallback(async(mode:'latest'|'older'|'after',cursor?:string)=>{
  if(!enabled)return;request.current?.abort();const abort=new AbortController();request.current=abort;const epoch=auth.epoch;setLoading(true);setError(null);
  try{const query=mode==='older'?{before:cursor!}:mode==='after'?{after:watermark.current}:{};const page=await listNotifications(query,abort.signal);
   if(abort.signal.aborted||!auth.isCurrent(epoch))return;
   if(mode==='latest')watermark.current=page.items[0]?.seq??'0';else if(mode==='after'&&page.items.length)watermark.current=page.items.at(-1)!.seq;
   setSnapshot({epoch,page,mode});onChanged?.();
  }catch(value){if(!abort.signal.aborted&&auth.isCurrent(epoch))problem(value);}finally{if(!abort.signal.aborted&&auth.isCurrent(epoch))setLoading(false);}
 },[enabled,auth.epoch,auth.isCurrent,problem]);
 useEffect(()=>{setSnapshot(null);setError(null);setInfo(null);setLoading(false);setWriting(false);writeBusy.current=false;watermark.current='0';if(owner.current!==user?.id){owner.current=user?.id;setPending(null);setBody('나에게 보내는 첫 알림');}if(enabled)void load('latest');return()=>request.current?.abort();},[enabled,auth.epoch,user?.id,load]);
 async function create(){
  if(!enabled||!auth.view||!user||writeBusy.current||!body.trim())return;writeBusy.current=true;setWriting(true);setError(null);const epoch=auth.epoch,input=pendingNow??{owner:user.id,clientKey:crypto.randomUUID(),body};setPending(input);
  try{const saved=await createNotification({clientKey:input.clientKey,body:input.body},auth.view.csrfToken);if(!auth.isCurrent(epoch))return;setPending(null);setInfo(saved.queued?'DB에 접수했고 큐에 넣었어요. Worker가 처리한 뒤 최신 목록을 확인하세요.':'DB에는 접수했지만 큐에 넣지 못했어요. 연결 복구 후 미처리 재접수를 눌러 주세요.');}
  catch(value){if(auth.isCurrent(epoch)){problem(value);if(value instanceof ApiError&&[400,403,409,413,429].includes(value.status)){setPending(null);setInfo('서버가 이 요청을 거부했어요. 입력·권한·실습 상한을 확인하세요.');}else setInfo('접수 여부가 불확실해요. 같은 접수 다시 확인은 같은 번호와 내용으로 요청합니다.');}}
  finally{if(auth.isCurrent(epoch)){writeBusy.current=false;setWriting(false);}}
 }
 async function write(kind:'read'|'replay',id?:string){
  if(!enabled||!auth.view||writeBusy.current)return;writeBusy.current=true;setWriting(true);setError(null);const epoch=auth.epoch;
  try{if(kind==='read'){const saved=await readNotification(id!,auth.view.csrfToken);if(auth.isCurrent(epoch))onChanged?.();if(auth.isCurrent(epoch))setSnapshot(old=>old?.epoch===epoch?{...old,page:{...old.page,items:old.page.items.map(row=>row.id===id?{...row,readAt:saved.readAt}:row)}}:old);}
   else{const result=await replayNotifications(auth.view.csrfToken);if(auth.isCurrent(epoch))setInfo('미처리 '+result.pending+'개 중 '+result.queued+'개를 큐에 다시 접수했어요. Worker 처리 후 새 알림 복구를 눌러 주세요.');}
  }catch(value){if(auth.isCurrent(epoch))problem(value);}finally{if(auth.isCurrent(epoch)){writeBusy.current=false;setWriting(false);}}
 }
 if(!enabled)return <section aria-label="내 알림함"><h2>내 알림함</h2><p>로그인하면 내 알림만 조회하고 읽음으로 바꿀 수 있어요.</p></section>;
 if(owner.current!==user?.id)return <p role="status">현재 계정의 알림을 준비하고 있어요.</p>;
 return <section aria-labelledby="inbox-heading"><h2 id="inbox-heading">내 알림함</h2><p>DB 접수와 알림 도착은 달라요. Worker를 켜고 최신 목록이나 새 알림 복구를 눌러 확인하세요. 한 화면에 최대20개, 실습 계정마다 사건100개까지입니다.</p>
  <form onSubmit={event=>{event.preventDefault();void create();}}><TextAreaField label="실습 알림 내용" id="notification-body" value={body} maxLength={500} onChange={event=>setBody(event.target.value)} disabled={writing||!!pendingNow}/><Button type="submit" variant="primary" busy={writing} disabled={writing||!body.trim()}>{pendingNow?'같은 접수 다시 확인':'실습 알림 접수'}</Button></form>
  <nav aria-label="알림 조회"><Button disabled={loading||writing} onClick={()=>void load('latest')}>최신 목록</Button><Button disabled={loading||writing} onClick={()=>void load('after')}>새 알림 복구</Button><Button disabled={loading||writing} onClick={()=>void write('replay')}>내 미처리 재접수</Button></nav>
  {loading&&<p role="status">알림을 조회하고 있어요.</p>}{error&&<InlineNotice tone="error">{error}</InlineNotice>}{info&&<InlineNotice>{info}</InlineNotice>}
  {current&&<><h3>{current.mode==='after'?'새 알림 복구 결과':current.mode==='older'?'이전 알림':'최신 알림'}</h3>{current.page.items.length===0&&<EmptyState title="해당하는 알림이 없어요." description="Worker가 처리한 뒤 최신 목록이나 새 알림 복구를 눌러 확인하세요."/>}<ul className="inbox-list" aria-label="알림 목록">{(current.mode==='after'?[...current.page.items].reverse():current.page.items).map(row=><li key={row.id}><p>{row.body}</p><small>순번 {row.seq} · <time dateTime={row.createdAt}>{new Date(row.createdAt).toLocaleString('ko-KR')}</time></small><span>{row.readAt?'읽음':'안 읽음'}</span><Button disabled={writing||!!row.readAt} onClick={()=>void write('read',row.id)}>읽음으로 표시</Button></li>)}</ul>{current.mode==='after'&&current.page.hasMore&&<p>복구할 새 알림이 더 있어요. 새 알림 복구를 다시 누르세요.</p>}{current.mode!=='after'&&current.page.hasMore&&<Button disabled={loading||writing} onClick={()=>void load('older',current.page.nextCursor!)}>이전20개</Button>}</>}
 </section>;
}
