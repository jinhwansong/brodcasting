import {useLayoutEffect,useRef,useState} from 'react';
import {HEIGHT,VIEW,range,type Row} from './window';
export function Timeline({rows,virtual}:{rows:Row[];virtual:boolean}){
 const list=useRef<HTMLDivElement>(null),follow=useRef(true),last=useRef({first:0,last:0});
 const [top,setTop]=useState(0),[unread,setUnread]=useState(0),[expired,setExpired]=useState(false);
 useLayoutEffect(()=>{
  const element=list.current;if(!element)return;
  const first=rows[0]?.id??0,end=rows.at(-1)?.id??0,previous=last.current;
  if(follow.current){element.scrollTop=Math.max(0,rows.length*HEIGHT-VIEW);setTop(element.scrollTop);setUnread(0);}
  else{
   const removed=previous.first?Math.max(0,first-previous.first):0;
   if(removed){const next=Math.max(0,element.scrollTop-removed*HEIGHT);if(removed*HEIGHT>element.scrollTop)setExpired(true);element.scrollTop=next;setTop(next);}
   setUnread(old=>Math.min(1000,old+Math.max(0,end-previous.last)));
  }
  last.current={first,last:end};
 },[rows]);
 const selected=virtual?range(rows.length,top):{start:0,end:rows.length};
 function latest(){follow.current=true;setUnread(0);setExpired(false);const element=list.current;if(element){element.scrollTop=Math.max(0,rows.length*HEIGHT-VIEW);setTop(element.scrollTop);}}
 return <section aria-label="채팅 목록">
  {unread>0&&<button onClick={latest}>새 메시지 {unread}개 보기</button>}
  {expired&&<p role="status">읽던 글이 보관 범위를 벗어났습니다. 남아 있는 가장 오래된 글부터 표시합니다.</p>}
  <div ref={list} className="timeline" aria-label="채팅 읽기" tabIndex={0} style={{height:VIEW,overflow:'auto'}} onScroll={event=>{const node=event.currentTarget;setTop(node.scrollTop);follow.current=node.scrollTop>=Math.max(0,rows.length*HEIGHT-VIEW)-4;if(follow.current){setUnread(0);setExpired(false);}}}>
   <ol style={{height:rows.length*HEIGHT,position:'relative',margin:0,padding:0,listStyle:'none'}} aria-label="보이는 메시지" aria-live="off">
    {rows.slice(selected.start,selected.end).map((row,index)=><li data-message key={row.id} aria-posinset={selected.start+index+1} aria-setsize={rows.length} style={{position:'absolute',top:(selected.start+index)*HEIGHT,height:HEIGHT,width:'100%'}}><span>#{row.id}</span> {row.text}</li>)}
   </ol>
  </div>
  <p>보관 <output data-testid="retained">{rows.length}</output>개 · 화면 {selected.end-selected.start}개</p>
 </section>;
}
