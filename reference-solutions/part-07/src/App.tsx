import {useCallback,useState} from 'react';
import {useReplay} from './useReplay';
import {Timeline} from './Timeline';
function Room(){
 const [rate,setRate]=useState(10),[running,setRunning]=useState(false),[virtual,setVirtual]=useState(true),[draft,setDraft]=useState('');
 const stop=useCallback(()=>setRunning(false),[]),replay=useReplay(rate,running,stop);
 return <>
  <div className="controls"><label>초당 메시지<select value={rate} disabled={running} onChange={e=>setRate(Number(e.target.value))}><option value="10">10개</option><option value="100">100개</option><option value="500">500개</option></select></label>
  <label>표시 방법<select value={virtual?'window':'all'} onChange={e=>setVirtual(e.target.value==='window')}><option value="window">보이는 부분만 그리기</option><option value="all">보관한 글 모두 그리기</option></select></label>
  <button onClick={()=>setRunning(!running)}>{running?'재생 중지':'재생 시작'}</button></div>
  <p>한 번에 60초까지. 서버에 보내지 않는 가짜 채팅입니다. 밀린 대기는 200개, 보관은 1,000개로 제한합니다.</p>
  <Timeline rows={replay.rows} virtual={virtual}/>
  <label>입력 반응 연습<input maxLength={500} value={draft} onChange={e=>setDraft(e.target.value)}/></label>
  <p role="status">대기 상한 때문에 생략한 글: {replay.skipped}개. 이 목록은 채팅 원본 저장소가 아닙니다.</p>
 </>;
}
export default function App(){const [room,setRoom]=useState('r1');return <main><header><p>7단계 · 브라우저 실험실</p><h1>글이 쏟아져도 읽던 자리를 지켜요</h1><p>낮은 속도부터 시작해 내 기기의 반응을 관찰하세요.</p></header><label>연습 방<select value={room} onChange={e=>setRoom(e.target.value)}><option value="r1">첫 번째 방</option><option value="r2">두 번째 방</option></select></label><Room key={room}/></main>;}
