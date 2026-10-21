import {useCallback,useEffect,useRef,useState} from 'react';
import {ApiError,getRoom,updateNotice} from './api';
import {useLatestRequest} from './useLatestRequest';
import type {SessionHandle} from './useSession';

export function NoticePanel({auth}:{auth:SessionHandle}){
 const [roomId,setRoomId]=useState('r1'),[revision,setRevision]=useState(0),[refresh,setRefresh]=useState(0);
 const [drafts,setDrafts]=useState<Record<string,string>>({}),[error,setError]=useState<string|null>(null);
 const [saving,setSaving]=useState(false);
 const previousUser=useRef<string|null>(null),selection=useRef(0),pending=useRef(false);
 const userId=auth.view?.user?.id;
 useEffect(()=>{
  if(auth.reason==='logout'||(userId&&previousUser.current&&userId!==previousUser.current))setDrafts({});
  if(auth.reason==='logout')previousUser.current=null;
  if(userId)previousUser.current=userId;
  pending.current=false;setSaving(false);setError(null);
 },[auth.epoch,auth.reason,userId]);
 const loader=useCallback(async(signal:AbortSignal)=>({room:await getRoom(roomId,signal),epoch:auth.epoch,revision}),[roomId,auth.epoch,revision]);
 const state=useLatestRequest(auth.status==='ready'&&!auth.busy?loader:null,refresh);
 const room=state.status==='success'&&auth.isCurrent(state.data.epoch)&&state.data.revision===revision?state.data.room:null;
 const draftVisible=auth.reason!=='logout'&&(!userId||!previousUser.current||userId===previousUser.current);
 const hasDraft=draftVisible&&Object.prototype.hasOwnProperty.call(drafts,roomId);
 const draft=hasDraft?drafts[roomId]:room?.notice??'';
 const canEdit=!!userId&&!!room?.canEdit&&!auth.busy;
 useEffect(()=>{if(state.status==='error'&&state.error instanceof ApiError&&state.error.status===401)void auth.expire();},[state,auth.expire]);
 function choose(id:string){selection.current++;setRevision(selection.current);setRoomId(id);pending.current=false;setSaving(false);setError(null);}
 async function save(){
  if(!canEdit||!auth.view||pending.current)return;
  const epoch=auth.epoch,selected=selection.current;
  const current=()=>auth.isCurrent(epoch)&&selection.current===selected;
  pending.current=true;setSaving(true);setError(null);
  try{
   await updateNotice(roomId,draft,auth.view.csrfToken);
   if(current())setRefresh(value=>value+1);
  }catch(problem){if(current()){
   if(problem instanceof ApiError&&problem.status===401)void auth.expire();
   else if(problem instanceof ApiError&&problem.status===403){setError('수정할 권한이 바뀌었어요. 초안을 보존했으니 권한을 다시 확인해 주세요.');setRefresh(value=>value+1);}
   else setError('저장 결과를 확인하지 못했어요. 초안을 보존했으니 공지를 다시 조회해 확인해 주세요.');
  }}finally{if(current()){pending.current=false;setSaving(false);}}
 }
 return <section className="notice-panel" aria-labelledby="notice-heading">
  <h2 id="notice-heading">방 공지</h2>
  <label htmlFor="room">방 선택</label><select id="room" value={roomId} onChange={event=>choose(event.target.value)}><option value="r1">첫 번째 방</option><option value="r2">두 번째 방</option></select>
  {!room&&state.status!=='error'&&<p role="status">공지를 불러오는 중입니다.</p>}
  {room&&<><h3>{room.title}</h3><p className="notice-text">{room.notice||'등록된 공지가 없습니다.'}</p></>}
  {(canEdit||hasDraft)&&<div className="field"><label htmlFor="notice">공지 내용</label><textarea id="notice" rows={4} maxLength={1000} value={draft} disabled={!canEdit||saving} onChange={event=>setDrafts(previous=>({...previous,[roomId]:event.target.value}))}/><p className="form-hint">일반 텍스트 500자까지 저장할 수 있습니다.</p></div>}
  {canEdit?<button type="button" disabled={saving||Array.from(draft).length>500} onClick={()=>void save()}>공지 저장</button>:<p>이 방의 관리자만 공지를 수정할 수 있습니다.</p>}
  {saving&&<p role="status">공지를 저장하는 중입니다.</p>}
  {(error||state.status==='error')&&<p role="alert">{error??'공지를 불러오지 못했어요. 다시 조회해 주세요.'}</p>}
  <button type="button" onClick={()=>setRefresh(value=>value+1)}>공지 다시 조회</button>
 </section>;
}
