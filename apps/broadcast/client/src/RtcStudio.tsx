import {useEffect,useRef,useState} from 'react';
import {RtcClient,releaseMedia,type CapturedMedia,type LiveRoom} from './rtc-client';
import type {SessionHandle} from './useSession';
import {Button,TextField,Badge} from './ui/components';
import {Icon} from './Icon';
function testPattern():CapturedMedia{
 const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;
 const pen=canvas.getContext('2d');if(!pen||!canvas.captureStream)throw new Error('Canvas capture unavailable');
 let frame=0;
 const draw=()=>{frame++;pen.fillStyle='#121b29';pen.fillRect(0,0,640,360);pen.fillStyle='#78e1cd';pen.fillRect((frame*7)%540,70,100,100);pen.font='bold 28px sans-serif';pen.fillText('WebRTC · TEST PATTERN',28,230);pen.font='22px monospace';pen.fillText('frame '+frame,28,275);};
 draw();const timer=setInterval(draw,100);try{return{stream:canvas.captureStream(10),cleanup:()=>clearInterval(timer)};}catch(error){clearInterval(timer);throw error;}
}
export function RtcStudio({auth,initialRoom,onLogin}:{auth:SessionHandle;initialRoom:string|null;onLogin:()=>void}){
 const [rooms,setRooms]=useState<LiveRoom[]>([]),[room,setRoom]=useState<LiveRoom|null>(null),[status,setStatus]=useState('실습 서버에 연결하고 있어요.');
 const [title,setTitle]=useState('나의 첫 WebRTC 방송'),[microphone,setMicrophone]=useState(false),[busy,setBusy]=useState(false),[active,setActive]=useState(false),[stats,setStats]=useState({frames:0,bytes:0,peers:0});
 const video=useRef<HTMLVideoElement>(null),client=useRef<RtcClient|null>(null),generation=useRef(0),captureId=useRef(0),capturing=useRef(false),heading=useRef<HTMLHeadingElement>(null);
 const enabled=auth.status==='ready'&&!auth.busy&&!!auth.view?.user;
 useEffect(()=>{heading.current?.focus({preventScroll:true});window.scrollTo({top:0,left:0,behavior:'auto'});},[]);
 useEffect(()=>{
  const version=++generation.current;setRooms([]);setRoom(null);setActive(false);setBusy(false);capturing.current=false;setStats({frames:0,bytes:0,peers:0});
  if(!enabled){setStatus('로그인하면 송출하거나 다른 사람의 영상을 볼 수 있어요.');return;}
  if(!window.RTCPeerConnection){setStatus('이 브라우저는 WebRTC를 지원하지 않아요.');return;}
  const current=()=>generation.current===version;
  const rtc=new RtcClient({rooms:rows=>{if(current())setRooms(rows);},room:value=>{if(current()){setRoom(value);setActive(!!value);if(!value)setStats({frames:0,bytes:0,peers:0});}},status:value=>{if(current())setStatus(value);},stream:(stream,local)=>{
   if(!current()||!video.current)return;video.current.srcObject=stream;video.current.muted=local;
   if(stream)void video.current.play().catch(()=>{if(current())setStatus('브라우저가 자동 재생을 막았어요. 영상의 재생 버튼을 눌러 주세요.');});
  }});client.current=rtc;
  let sampling=false;const timer=setInterval(()=>{if(sampling)return;sampling=true;void rtc.stats().then(value=>{if(current())setStats(value);}).catch(()=>{}).finally(()=>{sampling=false;});},1000);
  return()=>{generation.current++;clearInterval(timer);rtc.close();if(client.current===rtc)client.current=null;if(video.current)video.current.srcObject=null;};
 },[enabled,auth.epoch]);
 async function publish(source:'pattern'|'camera'|'screen'){
  const rtc=client.current;if(!rtc||capturing.current||active)return;capturing.current=true;setBusy(true);const version=generation.current,ticket=++captureId.current;let media:CapturedMedia|null=null;
  try{
   if(!window.isSecureContext)throw new Error('Secure context required');
   if(source==='pattern')media=testPattern();
   else{const stream=source==='camera'?await navigator.mediaDevices.getUserMedia({video:{width:{ideal:1280},height:{ideal:720},frameRate:{ideal:24,max:30}},audio:microphone}):await navigator.mediaDevices.getDisplayMedia({video:true,audio:false});media={stream,cleanup:()=>{}};}
   if(generation.current!==version||captureId.current!==ticket){releaseMedia(media);return;}
   const captured=media;media=null;await rtc.publish(captured,title.trim());
  }catch{if(media)releaseMedia(media);if(generation.current===version&&captureId.current===ticket)setStatus('송출하지 못했어요. 권한 선택, 로그인, HTTPS 연결을 확인해 주세요.');}
  finally{if(generation.current===version&&captureId.current===ticket){capturing.current=false;setBusy(false);}}
 }
 async function watch(id:string){if(!client.current||busy||active)return;const version=generation.current;setBusy(true);try{await client.current.watch(id);}catch{}finally{if(generation.current===version)setBusy(false);}}
 function stop(){captureId.current++;capturing.current=false;setBusy(false);client.current?.stop();setActive(false);setStats({frames:0,bytes:0,peers:0});setStatus('송출·시청을 종료했어요.');}
 return <section className="rtc-studio" aria-labelledby="rtc-heading">
  <div className="page-intro"><div><p>직접 보내고, 함께 보는</p><h1 id="rtc-heading" ref={heading} tabIndex={-1}>WebRTC 실습실</h1></div><span className="sample-label">실제 브라우저 영상 연결</span></div>
  <p className="sample-note">이곳은 샘플 파일이 아닌 실제 WebRTC 영상입니다. 같은 PC의 두 탭 또는 같은 네트워크의 PC로 연습해요. 송출자 1명당 시청자는 최대 4명입니다.</p>
  {!enabled&&<Button variant="primary" className="follow-button" onClick={onLogin}>로그인하고 실습하기</Button>}
  <div className="rtc-layout"><div><div className="rtc-video"><video ref={video} controls={active} autoPlay playsInline aria-label="WebRTC 실시간 영상"/>{!active&&<div className="rtc-placeholder"><Icon name="play"/><p>송출하거나 방송을 선택하면<br/>이곳에서 영상을 볼 수 있어요.</p></div>}<span className="rtc-indicator">{active?'연결 참여 중':'송출·시청 대기'}</span></div><p role="status" className="rtc-status">{status}</p><dl className="rtc-stats"><div><dt>연결 상대</dt><dd>{stats.peers}명</dd></div><div><dt>처리한 영상 프레임</dt><dd>{stats.frames.toLocaleString()}장</dd></div><div><dt>영상 데이터</dt><dd>{stats.bytes.toLocaleString()} bytes</dd></div></dl><p className="sample-note">위 숫자는 브라우저 getStats()의 실제 누적 값이에요. 화면이 보이는지와 프레임 증가를 함께 확인하세요. 지연 시간 측정값은 아닙니다.</p>{room&&<div className="rtc-share"><TextField label="이 방의 주소" readOnly aria-label="WebRTC 방 공유 주소" value={window.location.origin+'/#/live/'+room.id} onFocus={event=>event.currentTarget.select()}/></div>}</div>
   <aside className="rtc-controls" aria-label="송출과 방송 목록"><h2>내 방송 시작</h2><TextField label="방송 제목" maxLength={60} value={title} onChange={event=>setTitle(event.target.value)} disabled={active||busy}/><label className="rtc-check"><input type="checkbox" checked={microphone} onChange={event=>setMicrophone(event.target.checked)} disabled={active||busy}/>카메라 송출에 마이크 포함</label><p className="sample-note">테스트 화면은 카메라를 켜지 않아요. 화면 공유는 브라우저에서 내가 고른 화면만 보냅니다. 화면 공유 소리는 보내지 않습니다.</p><div className="rtc-actions"><Button variant="primary" disabled={!enabled||busy||active||!title.trim()} onClick={()=>void publish('pattern')}>움직이는 테스트 화면 송출</Button><Button disabled={!enabled||busy||active||!title.trim()} onClick={()=>void publish('camera')}>카메라 송출</Button><Button disabled={!enabled||busy||active||!title.trim()} onClick={()=>void publish('screen')}>화면 공유 송출</Button><Button variant="danger" className="rtc-stop" disabled={!active&&!busy} onClick={stop}>송출·시청 종료</Button></div><div className="section-heading"><h2>지금 열린 실습 방송</h2><Button variant="ghost" size="small" disabled={!enabled||busy} onClick={()=>void client.current?.list()}>새로고침</Button></div>{rooms.length===0&&<p className="sample-note">열린 방송이 없어요. 먼저 테스트 화면을 송출해 보세요.</p>}<ul className="rtc-rooms">{rooms.map(row=><li key={row.id}><Badge tone="live" className="rtc-live">LIVE · WebRTC</Badge><strong>{row.title}</strong><span>{row.hostName} · {row.viewers}/{row.maxViewers}명</span>{initialRoom===row.id&&<small>공유받은 방</small>}<Button disabled={busy||active||row.viewers>=row.maxViewers} onClick={()=>void watch(row.id)}>이 방송 시청</Button></li>)}</ul></aside>
  </div><p className="sample-note">작은 실습용 구조라 시청자가 늘면 송출 PC의 업로드 사용량도 늘어요. 외부 STUN·TURN 서버는 사용하지 않으며, 서로 다른 인터넷 환경에서는 연결이 안 될 수 있어요. 다른 PC에서 카메라·화면을 쓰려면 신뢰할 수 있는 HTTPS 설정이 필요합니다.</p>
 </section>;
}
