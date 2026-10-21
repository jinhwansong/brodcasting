import {useCallback,useEffect,useRef,useState} from 'react';
import {ApiError,fetchPage,setFavorite} from './api';
import {AuthPanel} from './AuthPanel';
import {NoticePanel} from './NoticePanel';
import {Player} from './Player';
import {ChatPanel} from './ChatPanel';
import {useSession} from './useSession';
import {useLatestRequest} from './useLatestRequest';
import type {Broadcast,ListQuery,SortOrder} from './types';

export default function App(){
 const auth=useSession(),user=auth.view?.user;
 const [query,setQuery]=useState<ListQuery>({search:'',sort:'viewers-desc',limit:2,offset:0,favoritesOnly:false});
 const [refresh,setRefresh]=useState(0),[saving,setSaving]=useState<{id:string;epoch:number}|null>(null);
 const [writeError,setWriteError]=useState<string|null>(null);
 const pending=useRef<number|null>(null);
 useEffect(()=>{pending.current=null;setSaving(null);setWriteError(null);},[auth.epoch]);
 const loader=useCallback(async(signal:AbortSignal)=>({page:await fetchPage({...query,favoritesOnly:!!user&&query.favoritesOnly},signal),epoch:auth.epoch}),[query,auth.epoch,user]);
 const state=useLatestRequest(auth.status==='ready'&&!auth.busy?loader:null,refresh);
 const data=state.status==='success'&&auth.isCurrent(state.data.epoch)?state.data.page:null;
 const loading=state.status!=='error'&&!data;
 const savingNow=saving!==null&&auth.isCurrent(saving.epoch);
 useEffect(()=>{if(state.status==='error'&&state.error instanceof ApiError&&state.error.status===401)void auth.expire();},[state,auth.expire]);
 async function toggle(row:Broadcast){
  if(!user||!auth.view||auth.busy||pending.current===auth.epoch)return;
  const epoch=auth.epoch;pending.current=epoch;setSaving({id:row.id,epoch});setWriteError(null);
  try{await setFavorite(user.id,row.id,!row.favorite,auth.view.csrfToken);if(auth.isCurrent(epoch))setRefresh(value=>value+1);}
  catch(error){if(auth.isCurrent(epoch)){
   if(error instanceof ApiError&&error.status===401)void auth.expire();
   else setWriteError(error instanceof ApiError&&error.status===403?'수정할 권한을 확인해 주세요. 계정과 목록을 다시 조회하세요.':'저장 결과를 확인하지 못했습니다. 목록을 다시 조회한 뒤 확인하세요.');
  }}finally{if(auth.isCurrent(epoch)){pending.current=null;setSaving(null);}}
 }
 return <main className="studio">
  <header className="masthead"><h1>방송 둘러보기</h1><p>내 계정의 관심 방송과 방별 공지를 확인하세요.</p><span>공동 연습 공간</span></header>
  <AuthPanel auth={auth}/>
  <form className="toolbar" onSubmit={event=>event.preventDefault()}>
   <label htmlFor="search">방송 검색</label><input id="search" value={query.search} maxLength={80} onChange={event=>setQuery(previous=>({...previous,search:event.target.value,offset:0}))}/>
   <label htmlFor="sort">정렬</label><select id="sort" value={query.sort} onChange={event=>setQuery(previous=>({...previous,sort:event.target.value as SortOrder,offset:0}))}><option value="viewers-desc">시청자 순</option><option value="title-asc">제목 순</option></select>
   <label className="check"><input type="checkbox" disabled={!user||auth.busy} checked={!!user&&query.favoritesOnly} onChange={event=>setQuery(previous=>({...previous,favoritesOnly:event.target.checked,offset:0}))}/>즐겨찾기만</label>
   <button type="button" onClick={()=>setRefresh(value=>value+1)}>목록 다시 조회</button>
  </form>
  {loading&&<p role="status">방송을 불러오는 중입니다.</p>}
  {state.status==='error'&&<div role="alert"><p>목록을 불러오지 못했습니다. 연결을 확인하고 다시 시도하세요.</p><button onClick={()=>setRefresh(value=>value+1)}>목록 재시도</button></div>}
  {writeError&&<p role="alert">{writeError}</p>}
  {savingNow&&<p role="status">즐겨찾기를 저장하는 중입니다.</p>}
  <section className="directory" aria-label="방송 목록">
   {data?.items.length===0&&<p>조건에 맞는 방송이 없습니다. 검색이나 즐겨찾기 조건을 바꿔보세요.</p>}
   <ul className="broadcasts">{data?.items.map(row=><li key={row.id}><h2 className="program-title">{row.title}</h2><p>{row.hostName}</p><span>시청자 {row.viewerCount.toLocaleString('ko-KR')}명</span><button disabled={!user||auth.busy||savingNow} aria-pressed={row.favorite} aria-label={`${row.title} 즐겨찾기 ${row.favorite?'해제':'추가'}`} onClick={()=>void toggle(row)}>{row.favorite?'즐겨찾기 해제':'즐겨찾기 추가'}</button></li>)}</ul>
  </section>
  <nav className="page-nav" aria-label="방송 페이지"><button disabled={loading||query.offset===0} onClick={()=>setQuery(previous=>({...previous,offset:Math.max(0,previous.offset-previous.limit)}))}>이전</button><span>{Math.floor(query.offset/query.limit)+1}페이지</span><button disabled={loading||!data?.hasMore} onClick={()=>setQuery(previous=>({...previous,offset:previous.offset+previous.limit}))}>다음</button></nav>
  <NoticePanel auth={auth}/>
  <Player src="/media/pattern.webm"/>
  <ChatPanel auth={auth}/>
  <footer>즐겨찾기는 현재 계정에 저장합니다. 공지 수정 권한은 서버에서 확인합니다.</footer>
 </main>;
}
