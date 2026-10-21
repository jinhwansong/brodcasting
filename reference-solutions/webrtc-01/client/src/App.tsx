import {useCallback,useEffect,useRef,useState} from 'react';
import {ApiError,fetchBroadcast,fetchPage,setFavorite} from './api';
import {AuthPanel} from './AuthPanel';
import {ChatPanel} from './ChatPanel';
import {NoticePanel} from './NoticePanel';
import {VideoPlayer} from './VideoPlayer';
import {useSession} from './useSession';
import {useLatestRequest} from './useLatestRequest';
import {Icon} from './Icon';
import {RtcStudio} from './RtcStudio';
import {DesignSystem} from './DesignSystem';
import {Poster,BroadcastCard} from './BroadcastCard';
import {channelInfo as info} from './broadcast-meta';
import {Button,IconButton,EmptyState} from './ui/components';
import type {Broadcast,ListQuery,SortOrder} from './types';
const selectedId=()=>/^#\/watch\/([a-f])$/.exec(window.location.hash)?.[1]??null;
const liveRoute=()=>/^#\/live(?:\/([a-f0-9-]{36}))?$/.test(window.location.hash);
export default function App(){
 const auth=useSession(),user=auth.view?.user;
 const [query,setQuery]=useState<ListQuery>({search:'',sort:'viewers-desc',limit:6,offset:0,favoritesOnly:false});
 const [selected,setSelected]=useState(selectedId),[account,setAccount]=useState(false),[refresh,setRefresh]=useState(0),[saving,setSaving]=useState<{id:string;epoch:number}|null>(null),[writeError,setWriteError]=useState<string|null>(null);
 const [live,setLive]=useState(liveRoute),[design,setDesign]=useState(()=>window.location.hash==='#/design-system');
 const pending=useRef<number|null>(null),dialog=useRef<HTMLDialogElement>(null),heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{const update=()=>{setSelected(selectedId());setLive(liveRoute());setDesign(window.location.hash==='#/design-system');};window.addEventListener('hashchange',update);return()=>window.removeEventListener('hashchange',update);},[]);
 useEffect(()=>{if(account)dialog.current?.showModal();},[account]);
 useEffect(()=>{pending.current=null;setSaving(null);setWriteError(null);},[auth.epoch]);
 const loader=useCallback(async(signal:AbortSignal)=>({page:await fetchPage({...query,favoritesOnly:!!user&&query.favoritesOnly},signal),epoch:auth.epoch}),[query,auth.epoch,user]);
 const state=useLatestRequest(auth.status==='ready'&&!auth.busy?loader:null,refresh);
 const data=state.status==='success'&&auth.isCurrent(state.data.epoch)?state.data.page:null;
 const detailLoader=useCallback(async(signal:AbortSignal)=>({row:await fetchBroadcast(selected!,signal),epoch:auth.epoch}),[selected,auth.epoch]);
 const detail=useLatestRequest(selected&&auth.status==='ready'&&!auth.busy?detailLoader:null,refresh);
 const [lastDetail,setLastDetail]=useState<{row:Broadcast;epoch:number}|null>(null);
 useEffect(()=>{if(detail.status==='success')setLastDetail(detail.data);},[detail]);
 const currentDetail=detail.status==='success'?detail.data:detail.status==='loading'?lastDetail:null;
 const watching=selected&&currentDetail&&auth.isCurrent(currentDetail.epoch)&&currentDetail.row.id===selected?currentDetail.row:null;
 const loading=state.status!=='error'&&!data,savingNow=saving!==null&&auth.isCurrent(saving.epoch);
 useEffect(()=>{if(watching){heading.current?.focus({preventScroll:true});window.scrollTo({top:0,left:0,behavior:'auto'});}},[watching?.id]);
 useEffect(()=>{for(const value of [state,detail])if(value.status==='error'&&value.error instanceof ApiError&&value.error.status===401)void auth.expire();},[state,detail,auth.expire]);
 function home(favoritesOnly=false){if(favoritesOnly&&!user){setAccount(true);return;}setQuery(p=>({...p,search:'',offset:0,favoritesOnly}));window.location.hash='/';}
 function watch(id:string){window.location.hash='/watch/'+id;}
 async function toggle(row:Broadcast){
  if(!user){setAccount(true);return;}if(!auth.view||auth.busy||pending.current===auth.epoch)return;
  const epoch=auth.epoch;pending.current=epoch;setSaving({id:row.id,epoch});setWriteError(null);
  try{await setFavorite(user.id,row.id,!row.favorite,auth.view.csrfToken);if(auth.isCurrent(epoch))setRefresh(n=>n+1);}
  catch(error){if(auth.isCurrent(epoch)){if(error instanceof ApiError&&error.status===401)void auth.expire();else setWriteError(error instanceof ApiError&&error.status===403?'팔로우 권한을 확인해 주세요.':'저장 결과를 확인하지 못했어요. 다시 조회해 주세요.');}}
  finally{if(auth.isCurrent(epoch)){pending.current=null;setSaving(null);}}
 }
 const featured=data?.items[0];
 return <div className="app-shell">
  <a className="skip-link" href="#content" onClick={event=>{event.preventDefault();document.getElementById("content")?.focus();}}>본문으로 건너뛰기</a>
  <header className="topbar"><button className="brand" aria-label="온에어 라운지 홈" onClick={()=>home()}><span className="brand-mark"><Icon name="play"/></span><strong>onair<span>lounge</span></strong></button><nav aria-label="상단 탐색"><button className={!query.favoritesOnly?'active':''} onClick={()=>home()}>추천</button><button className={query.favoritesOnly?'active':''} onClick={()=>home(true)}>팔로잉</button></nav><form role="search" onSubmit={e=>{e.preventDefault();window.location.hash='/';}}><label className="sr-only" htmlFor="global-search">방송 검색</label><input id="global-search" type="search" placeholder="어떤 방송을 찾으세요?" maxLength={80} value={query.search} onChange={e=>{setQuery(p=>({...p,search:e.target.value,offset:0}));if(selected)window.location.hash='/';}}/><button aria-label="검색" type="submit"><Icon name="search"/></button></form><button className="account-button" aria-label={user?user.username+" 계정":"로그인"} onClick={()=>setAccount(true)}><Icon name="user"/><span>{user?.username??'로그인'}</span></button></header>
  <aside className="sidebar"><nav aria-label="주 메뉴"><button className={!query.favoritesOnly?'selected':''} onClick={()=>home()}><Icon name="home"/>추천 방송</button><button className={query.favoritesOnly?'selected':''} onClick={()=>home(true)}><Icon name="heart"/>팔로잉</button></nav><div className="sidebar-divider"/><h2>함께 둘러봐요</h2><ul className="channel-shortcuts">{data?.items.slice(0,5).map(row=><li key={row.id}><button onClick={()=>watch(row.id)}><span className={'avatar avatar-'+row.id}>{row.hostName.slice(0,1)}</span><span><strong>{row.hostName}</strong><small>{info(row.id).topic}</small></span><span className="channel-dot"/></button></li>)}</ul><div className="sidebar-bottom"><span className="sample-dot"/>학습용 샘플 공간<p>마음에 드는 방송을 발견하고<br/>함께 이야기 나눠요.</p></div></aside>
  <main id="content" className={selected?'main-content is-watching':'main-content'} tabIndex={-1}>
   <nav className="mobile-nav" aria-label="모바일 탐색"><button aria-pressed={!query.favoritesOnly} onClick={()=>home()}>추천</button><button aria-pressed={query.favoritesOnly} onClick={()=>home(true)}>팔로잉</button></nav>
   {writeError&&<p className="error-box" role="alert">{writeError}</p>}{savingNow&&<p className="sr-only" role="status">팔로우를 저장하는 중입니다.</p>}
   <div className="live-entry"><Button size="small" variant="ghost" aria-current={live?'page':undefined} onClick={()=>{window.location.hash='/live';}}>WebRTC 송출·시청 실습</Button><Button size="small" variant="ghost" aria-current={design?'page':undefined} onClick={()=>{window.location.hash='/design-system';}}>디자인 가이드</Button>{(live||design)&&<Button size="small" variant="ghost" onClick={()=>home()}>샘플 방송 목록</Button>}</div>
   {design?<DesignSystem/>:live?<RtcStudio auth={auth} initialRoom={/^#\/live\/([a-f0-9-]{36})$/.exec(window.location.hash)?.[1]??null} onLogin={()=>setAccount(true)}/>:<>
   {selected?<><button className="back-button" onClick={()=>home()}><Icon name="back"/>방송 목록으로</button>{watching?<div className="watch-layout"><div className="watch-main"><VideoPlayer key={watching.id} src={watching.id==='c'||watching.id==='f'?'/media/alternate.webm':'/media/pattern.webm'} poster={'/thumbnails/'+watching.id+'.svg'}/><div className="watch-info"><span className="watch-tag">학습용 샘플 방송</span><h1 ref={heading} tabIndex={-1}>{watching.title}</h1><div className="watch-host"><span className={'avatar avatar-'+watching.id}>{watching.hostName.slice(0,1)}</span><div><strong>{watching.hostName}</strong><p>{info(watching.id).tag} <span>#{info(watching.id).topic}</span></p></div><Button className="follow-button" variant={watching.favorite?'secondary':'primary'} disabled={auth.busy||savingNow} aria-pressed={watching.favorite} onClick={()=>void toggle(watching)}><Icon name="heart"/>{watching.favorite?'팔로잉':'팔로우'}</Button></div><p className="sample-note">직접 만든 샘플 영상입니다. 실시간 방송과 시청자 수를 재현한 화면이에요. 채팅은 표시된 공동 연습방에 연결됩니다.</p></div></div><ChatPanel key={"chat-"+watching.id} auth={auth} roomId={info(watching.id).room}/><NoticePanel key={"notice-"+watching.id} auth={auth} roomId={info(watching.id).room}/></div>:detail.status==='error'?<div className="error-box" role="alert"><p>방송을 불러오지 못했어요.</p><button onClick={()=>setRefresh(n=>n+1)}>방송 다시 조회</button></div>:<p role="status">방송을 준비하고 있어요.</p>}</>:<>
    <div className="page-intro"><div><p>취향이 만나는 곳</p><h1>오늘도, 온에어.</h1></div><span className="sample-label">학습용 샘플 방송</span></div>
    {!query.search&&!query.favoritesOnly&&featured&&<section className="featured" aria-label="추천 방송"><button className="featured-main" aria-label={featured.title+' 추천 방송 시청하기'} onClick={()=>watch(featured.id)}><Poster row={featured} large/><div className="featured-info"><span className={'avatar avatar-'+featured.id}>{featured.hostName.slice(0,1)}</span><div><strong>{featured.title}</strong><span>{featured.hostName} <i>#{info(featured.id).topic}</i></span></div><span className="watch-now">방송 보기 <Icon name="arrow"/></span></div></button><div className="featured-side"><h2>이런 방송은 어때요?</h2>{data.items.slice(1,4).map(row=><button key={row.id} className="mini-stream" onClick={()=>watch(row.id)}><img src={'/thumbnails/'+row.id+'.svg'} alt=""/><span><small>{info(row.id).topic}</small><strong>{row.title}</strong><span>{row.hostName}</span></span><Icon name="arrow"/></button>)}</div></section>}
    <section className="directory" aria-labelledby="directory-heading"><div className="section-heading"><h2 id="directory-heading">{query.favoritesOnly?'팔로잉 방송':'지금 둘러보기'}</h2><div><label className="sr-only" htmlFor="sort">방송 정렬</label><select id="sort" value={query.sort} onChange={e=>setQuery(p=>({...p,sort:e.target.value as SortOrder,offset:0}))}><option value="viewers-desc">샘플 시청자 순</option><option value="title-asc">제목 순</option></select><button className="icon-button" aria-label="목록 다시 조회" onClick={()=>setRefresh(n=>n+1)}><Icon name="refresh"/></button></div></div><div className="topic-tabs" aria-label="주제 검색">{[['전체',''],['React','React'],['TypeScript','TypeScript'],['토크 · 라디오','라디오'],['서버 개발','서버'],['음악','재즈']].map(([label,value])=><button key={label} aria-pressed={query.search===value} onClick={()=>setQuery(p=>({...p,search:value,offset:0}))}>{label}</button>)}</div>
    {loading&&<p role="status">방송을 불러오는 중입니다.</p>}{state.status==='error'&&<div className="error-box" role="alert"><p>목록을 불러오지 못했어요. 연결을 확인해 주세요.</p><button onClick={()=>setRefresh(n=>n+1)}>목록 재시도</button></div>}{data?.items.length===0&&<EmptyState icon={<Icon name="search"/>} title="조건에 맞는 방송이 없습니다." description="다른 검색어나 팔로우 조건으로 찾아보세요." action={<Button onClick={()=>home()}>전체 방송 보기</Button>}/>}
    <ul className="broadcast-grid" aria-label="방송 목록">{data?.items.map(row=><BroadcastCard key={row.id} row={row} onWatch={()=>watch(row.id)} onFollow={()=>void toggle(row)} followDisabled={auth.busy||savingNow}/>)}</ul>
    {data&&(data.hasMore||query.offset>0)&&<nav className="page-nav" aria-label="방송 페이지"><button disabled={loading||query.offset===0} onClick={()=>setQuery(p=>({...p,offset:Math.max(0,p.offset-p.limit)}))}>이전</button><span>{Math.floor(query.offset/query.limit)+1}</span><button disabled={loading||!data.hasMore} onClick={()=>setQuery(p=>({...p,offset:p.offset+p.limit}))}>다음</button></nav>}</section><footer className="site-footer"><strong>onair lounge</strong><span>방송을 발견하고 함께 만드는 작은 공간</span><span>학습용 샘플 · 실제 라이브 송출 아님</span></footer></>}
   </>}
  </main>
  {account&&<dialog ref={dialog} className="ui-dialog account-dialog" aria-label="내 계정" onClose={()=>setAccount(false)}><IconButton className="dialog-close" label="계정 창 닫기" onClick={()=>dialog.current?.close()}><Icon name="close"/></IconButton><AuthPanel auth={auth}/></dialog>}
 </div>;
}
