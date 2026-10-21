import {useEffect,useId,useRef,useState} from 'react';
const labels={loading:'영상을 불러오는 중입니다.',ready:'재생 준비가 됐습니다.',playing:'재생 중입니다.',waiting:'끊김을 막으려고 영상을 기다리는 중입니다.',paused:'일시 정지했습니다.',ended:'영상이 끝났습니다.',error:'영상을 재생하지 못했습니다.'};
export function Player({src}:{src:string}){
 const [attempt,setAttempt]=useState(0);
 return <Media key={src+':'+attempt} src={src} retry={()=>setAttempt(old=>old+1)}/>;
}
function Media({src,retry}:{src:string;retry:()=>void}){
 const video=useRef<HTMLVideoElement>(null),alive=useRef(false),heading=useId();
 const [state,setState]=useState<keyof typeof labels>('loading'),[error,setError]=useState(''),[events,setEvents]=useState<string[]>([]);
 useEffect(()=>{
  const node=video.current!;alive.current=true;
  const states:Record<string,keyof typeof labels>={loadstart:'loading',loadedmetadata:'ready',playing:'playing',waiting:'waiting',pause:'paused',ended:'ended',error:'error'};
  const handlers=Object.entries(states).map(([name,next])=>{
   const handler=()=>{if(!alive.current)return;setState(next);setEvents(old=>[...old,name].slice(-8));if(next==='error')setError('영상을 재생하지 못했습니다. 파일이나 연결을 확인한 뒤 다시 불러오세요.');};
   node.addEventListener(name,handler);return {name,handler};
  });
  return ()=>{alive.current=false;for(const {name,handler}of handlers)node.removeEventListener(name,handler);node.pause();node.removeAttribute('src');node.load();};
 },[]);
 async function play(){
  setError('');
  try{await video.current!.play();}
  catch{if(alive.current)setError('재생을 시작하지 못했습니다. 브라우저의 재생 버튼을 직접 누르거나 파일을 확인하세요.');}
 }
 return <section aria-labelledby={heading}>
  <h2 id={heading}>연습 영상</h2>
  <video ref={video} src={src} controls playsInline preload="metadata" aria-label="연습 영상 플레이어"><track kind="captions" src="/media/captions.ko.vtt" srcLang="ko" label="한국어" default/>이 브라우저는 video를 지원하지 않습니다.</video>
  <p role="status">{labels[state]}</p>{error&&<p role="alert">{error}</p>}
  <button onClick={()=>void play()}>영상 재생</button>{' '}<button onClick={retry}>영상 다시 불러오기</button>
  <p>영상 위의 기본 조작으로 정지·시간 이동·소리·자막을 바꿀 수 있습니다. 아래는 실제로 받은 최근 이벤트 8개입니다.</p>
  <ol aria-label="최근 미디어 이벤트">{events.map((event,index)=><li key={index}>{event}</li>)}</ol>
 </section>;
}
