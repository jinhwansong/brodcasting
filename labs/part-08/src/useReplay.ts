import {useEffect,useRef,useState} from 'react';
import {retain,type Row} from './window';
export function useReplay(rate:number,running:boolean,stop:()=>void){
 const [rows,setRows]=useState<Row[]>([]),[skipped,setSkipped]=useState(0);
 const sequence=useRef(0);
 useEffect(()=>{
  if(!running)return;
  let queue:Row[]=[],dropped=0;
  const produce=setInterval(()=>{
   for(let i=0;i<rate/10;i++){const id=++sequence.current;queue.push({id,text:`연습 메시지 ${id} — <script>도 글자로 표시</script>`});}
   dropped+=Math.max(0,queue.length-200);queue=queue.slice(-200);
  },100);
  const flush=setInterval(()=>{const batch=queue;queue=[];if(batch.length)setRows(old=>retain(old,batch));if(dropped){setSkipped(old=>old+dropped);dropped=0;}},100);
  const deadline=setTimeout(stop,60000);
  return ()=>{clearInterval(produce);clearInterval(flush);clearTimeout(deadline);queue=[];};
 },[rate,running,stop]);
 return {rows,skipped};
}
