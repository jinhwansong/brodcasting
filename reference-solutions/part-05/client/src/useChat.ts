import {useCallback,useEffect,useRef,useState} from 'react';
import {io,type Socket} from 'socket.io-client';
import type {SessionHandle} from './useSession';
import type {ChatHandle,ChatMessage,ChatStatus} from './chat-types';
const record=(value:unknown):value is Record<string,unknown>=>typeof value==='object'&&value!==null&&!Array.isArray(value);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function message(value:unknown,roomId:string):value is ChatMessage{
 return record(value)&&Object.keys(value).length===5&&value.roomId===roomId&&typeof value.id==='string'&&uuid.test(value.id)
  &&typeof value.text==='string'&&!!value.text.trim()&&Array.from(value.text).length<=500
  &&typeof value.sentAt==='string'&&Number.isFinite(Date.parse(value.sentAt))&&record(value.user)&&Object.keys(value.user).length===2
  &&typeof value.user.id==='string'&&uuid.test(value.user.id)&&typeof value.user.username==='string'&&/^[a-z][a-z0-9_]{2,23}$/.test(value.user.username);
}
type Active={socket:Socket;epoch:number;roomId:string;ready:boolean;sending:boolean};
type Snapshot={epoch:number;roomId:string;status:ChatStatus;messages:ChatMessage[];error:string|null;sending:boolean};
export function useChat(auth:SessionHandle,roomId:string):ChatHandle{
 const [attempt,setAttempt]=useState(0),[snapshot,setSnapshot]=useState<Snapshot>({epoch:-1,roomId:'',status:'idle',messages:[],error:null,sending:false});
 const activeRef=useRef<Active|null>(null),userId=auth.view?.user?.id;
 const current=useCallback((active:Active)=>activeRef.current===active&&auth.isCurrent(active.epoch),[auth.isCurrent]);
 const issue=useCallback((active:Active,value:unknown,fallback:string)=>{
  if(!current(active))return;active.ready=false;
  const code=record(value)?value.code:undefined;
  const error=code===401?'세션이 끝났어요. 다시 로그인해 주세요.':code===403?'채팅 참여 권한이 없습니다. 권한을 확인한 뒤 다시 접속하세요.':code===429?'채팅 요청이 많습니다. 잠시 뒤 다시 접속하세요.':fallback;
  setSnapshot(previous=>({...previous,status:'error',error}));
  if(code===401)void auth.expire();
 },[current,auth.expire]);
 useEffect(()=>{
  if(!userId||auth.status!=='ready'||auth.busy)return;
  const socket=io({path:'/socket.io',transports:['websocket'],autoConnect:false,reconnection:false,forceNew:true,withCredentials:true});
  const active:Active={socket,epoch:auth.epoch,roomId,ready:false,sending:false};activeRef.current=active;
  setSnapshot({epoch:auth.epoch,roomId,status:'connecting',messages:[],error:null,sending:false});
  const connected=()=>{void(async()=>{
   try{const result:unknown=await socket.timeout(3000).emitWithAck('room:join',{roomId});
    if(!current(active))return;
    if(record(result)&&result.ok===true&&record(result.data)&&result.data.roomId===roomId){active.ready=true;setSnapshot(previous=>({...previous,status:'ready',error:null}));}
    else issue(active,result,'방 입장 결과를 확인하지 못했습니다. 다시 접속하세요.');
   }catch{issue(active,null,'방 입장 결과를 확인하지 못했습니다. 다시 접속하세요.');}
  })();};
  const received=(value:unknown)=>{if(current(active)&&active.ready&&message(value,roomId))setSnapshot(previous=>({...previous,messages:[...previous.messages,value].slice(-100)}));};
  const disconnected=()=>{if(current(active)){active.ready=false;setSnapshot(previous=>({...previous,status:'disconnected',sending:false,error:'연결이 끊겼습니다. 놓친 메시지는 자동 복구하지 않습니다. 다시 접속하세요.'}));}};
  const denied=(error:Error&{data?:unknown})=>issue(active,error.data,'채팅 연결을 확인하지 못했습니다. 다시 접속하세요.');
  const problem=(value:unknown)=>issue(active,value,'채팅 상태를 확인하지 못했습니다. 다시 접속하세요.');
  socket.on('connect',connected);socket.on('chat:message',received);socket.on('disconnect',disconnected);socket.on('connect_error',denied);socket.on('chat:error',problem);socket.connect();
  return()=>{
   if(activeRef.current===active)activeRef.current=null;
   socket.off('connect',connected);socket.off('chat:message',received);socket.off('disconnect',disconnected);socket.off('connect_error',denied);socket.off('chat:error',problem);socket.disconnect();
  };
 },[userId,auth.status,auth.busy,auth.epoch,roomId,attempt,current,issue]);
 const send=useCallback(async(text:string):Promise<boolean>=>{
  const active=activeRef.current;
  if(!active||!current(active)||!active.ready||active.roomId!==roomId||active.sending||!text.trim()||Array.from(text).length>500)return false;
  active.sending=true;setSnapshot(previous=>({...previous,sending:true,error:null}));
  try{const result:unknown=await active.socket.timeout(3000).emitWithAck('chat:send',{roomId,text});
   if(!current(active))return false;
   if(record(result)&&result.ok===true&&message(result.data,roomId)&&result.data.text===text)return true;
   if(record(result)&&result.ok===false)issue(active,result,'전송 결과를 확인하지 못했습니다. 초안을 유지했으니 확인 후 직접 다시 시도하세요.');
   else setSnapshot(previous=>({...previous,error:'전송 결과를 확인하지 못했습니다. 초안을 유지했으니 확인 후 직접 다시 시도하세요.'}));
   return false;
  }catch{if(current(active))setSnapshot(previous=>({...previous,error:'전송 결과를 확인하지 못했습니다. 초안을 유지했으니 확인 후 직접 다시 시도하세요.'}));return false;}
  finally{if(current(active)){active.sending=false;setSnapshot(previous=>({...previous,sending:false}));}}
 },[current,issue,roomId]);
 const reconnect=useCallback(()=>setAttempt(value=>value+1),[]);
 const visible=!!userId&&auth.status==='ready'&&!auth.busy&&snapshot.epoch===auth.epoch&&snapshot.roomId===roomId;
 return{status:visible?snapshot.status:'idle',messages:visible?snapshot.messages:[],error:visible?snapshot.error:null,sending:visible&&snapshot.sending,send,reconnect};
}
