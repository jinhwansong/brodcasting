import{useCallback,useEffect,useRef,useState}from'react';
import{io,type Socket}from'socket.io-client';
import type{SessionHandle}from'./useSession';
import type{ChatHandle,ChatMessage,ChatStatus,Delivery}from'./chat-types';
import{record,message,page}from'./chat-history';
type Pending={clientMessageId:string;text:string};
type Bucket={cursor:string;messages:ChatMessage[];pending:Pending|null;delivery:Delivery;reconnects:number};
type Active={socket:Socket;epoch:number;roomId:string;userId:string;bucket:Bucket;ready:boolean;blocked:boolean;sending:boolean;pumping:boolean;dirty:boolean;retryScheduled:boolean;status:ChatStatus;error:string|null;waits:Set<{timer:ReturnType<typeof setTimeout>;done:(live:boolean)=>void}>};
type Snapshot={epoch:number;roomId:string;status:ChatStatus;messages:ChatMessage[];error:string|null;sending:boolean;delivery:Delivery;pendingText:string|null};
const delays=[500,1000,2000];
export function useChat(auth:SessionHandle,roomId:string):ChatHandle{
 const cache=useRef({owner:'',rooms:new Map<string,Bucket>()}),activeRef=useRef<Active|null>(null);
 const[attempt,setAttempt]=useState(0),[snapshot,setSnapshot]=useState<Snapshot>({epoch:-1,roomId:'',status:'idle',messages:[],error:null,sending:false,delivery:'idle',pendingText:null});
 const userId=auth.view?.user?.id;
 const current=useCallback((a:Active)=>activeRef.current===a&&auth.isCurrent(a.epoch),[auth.isCurrent]);
 const publish=useCallback((a:Active)=>{if(current(a))setSnapshot({epoch:a.epoch,roomId:a.roomId,status:a.status,messages:a.bucket.messages,error:a.error,sending:a.sending,delivery:a.bucket.delivery,pendingText:a.bucket.pending?.text??null});},[current]);
 const wait=useCallback((a:Active,ms:number)=>new Promise<boolean>(resolve=>{const pending={timer:setTimeout(()=>{a.waits.delete(pending);resolve(current(a));},ms),done:resolve};a.waits.add(pending);}),[current]);
 const issue=useCallback((a:Active,value:unknown,fallback:string)=>{
  if(!current(a))return;const code=record(value)?value.code:undefined;
  a.blocked=true;a.ready=false;a.status='error';a.error=code===401?'세션이 끝났어요. 다시 로그인해 주세요.':code===403?'채팅 참여 권한이 없습니다. 권한을 확인한 뒤 다시 접속하세요.':code===429?'채팅 요청이 많습니다. 잠시 뒤 다시 접속하세요.':code===409?'채팅 상태가 충돌했습니다. 이력과 발송 내용을 확인하세요.':fallback;
  if(a.bucket.pending)a.bucket.delivery='unknown';publish(a);a.socket.disconnect();if(code===401)void auth.expire();
 },[current,publish,auth.expire]);
 const reconnectLater=useCallback((a:Active)=>{
  if(!current(a)||a.blocked||a.retryScheduled)return;a.ready=false;a.retryScheduled=true;a.status='disconnected';
  if(a.bucket.pending)a.bucket.delivery='unknown';
  if(a.bucket.reconnects>=delays.length){a.error='재연결 상한에 도달했습니다. 연결을 확인한 뒤 직접 다시 접속하세요.';publish(a);return;}
  a.error='연결이 끊겼습니다. 제한된 횟수로 다시 접속합니다.';const delay=delays[a.bucket.reconnects++];publish(a);
  void wait(a,delay).then(live=>{if(live&&!a.blocked)setAttempt(value=>value+1);});
 },[current,publish,wait]);
 const pump=useCallback(async(a:Active)=>{
  if(!current(a)||!a.ready||a.pumping||a.blocked)return;a.pumping=true;a.status='recovering';a.error=null;publish(a);
  let until:string|undefined;
  try{
   for(let count=0;count<10;count++){
    if(!current(a)||!a.ready||a.blocked)return;if(until===undefined)a.dirty=false;
    const after=a.bucket.cursor,result:unknown=await a.socket.timeout(3000).emitWithAck('chat:history',{roomId:a.roomId,after,...until===undefined?{}:{until}});
    if(!current(a)||!a.ready||a.blocked)return;
    if(!record(result)||result.ok!==true){if(record(result)&&result.code===503)reconnectLater(a);else issue(a,result,'이력을 조회하지 못했습니다. 다시 접속하세요.');return;}
    const data=page(result.data,a.roomId,after,until);
    if(!data){issue(a,null,'이력 응답을 확인하지 못했습니다. 다시 접속하세요.');return;}
    const prior=new Map(a.bucket.messages.map(row=>[row.id,row]));
    if(data.items.some(row=>prior.has(row.id)&&JSON.stringify(prior.get(row.id))!==JSON.stringify(row))){issue(a,null,'이력 응답이 기존 메시지와 다릅니다. 다시 접속하세요.');return;}
    for(const row of data.items)prior.set(row.id,row);
    a.bucket.messages=[...prior.values()].sort((left,right)=>BigInt(left.seq)<BigInt(right.seq)?-1:BigInt(left.seq)>BigInt(right.seq)?1:0).slice(-100);a.bucket.cursor=data.next;until=data.until;publish(a);
    if(data.done){if(!a.dirty){a.status='ready';a.bucket.reconnects=0;publish(a);return;}until=undefined;}
    if(count<9&&!await wait(a,200))return;
   }
   issue(a,null,'복구 상한 500행에 도달했습니다. 채팅 다시 접속으로 마지막 확인 지점부터 계속 복구하세요.');
  }catch{if(current(a)&&a.ready)reconnectLater(a);}finally{a.pumping=false;}
 },[current,issue,publish,reconnectLater,wait]);
 useEffect(()=>{
  if(auth.reason==='logout'||(userId&&cache.current.owner&&cache.current.owner!==userId))cache.current={owner:userId??'',rooms:new Map()};
  if(!userId||auth.status!=='ready'||auth.busy)return;
  cache.current.owner=userId;let bucket=cache.current.rooms.get(roomId);
  if(!bucket){bucket={cursor:'0',messages:[],pending:null,delivery:'idle',reconnects:0};cache.current.rooms.set(roomId,bucket);}
  const socket=io({path:'/socket.io',transports:['websocket'],autoConnect:false,reconnection:false,forceNew:true,withCredentials:true});
  const a:Active={socket,epoch:auth.epoch,roomId,userId,bucket,ready:false,blocked:false,sending:false,pumping:false,dirty:false,retryScheduled:false,status:'connecting',error:null,waits:new Set()};activeRef.current=a;publish(a);
  const connected=()=>{void(async()=>{
   try{const result:unknown=await socket.timeout(3000).emitWithAck('room:join',{roomId});if(!current(a))return;
    if(record(result)&&result.ok===true&&record(result.data)&&result.data.roomId===roomId){a.ready=true;await pump(a);}
    else if(record(result)&&result.code===503)reconnectLater(a);else issue(a,result,'방 입장 결과를 확인하지 못했습니다. 다시 접속하세요.');
   }catch{if(current(a))reconnectLater(a);}
  })();};
  const received=(value:unknown)=>{if(current(a)&&!a.blocked&&message(value,roomId)){a.dirty=true;void pump(a);}};
  const disconnected=()=>{if(current(a)&&!a.blocked)reconnectLater(a);};
  const problem=(value:unknown)=>{if(record(value)&&value.code===503)reconnectLater(a);else issue(a,value,'채팅 상태를 확인하지 못했습니다. 다시 접속하세요.');};
  const denied=(error:Error&{data?:unknown})=>{const code=record(error.data)?error.data.code:undefined;if(code===401||code===403||code===400||code===409||code===429)problem(error.data);else reconnectLater(a);};
  socket.on('connect',connected);socket.on('chat:message',received);socket.on('disconnect',disconnected);socket.on('connect_error',denied);socket.on('chat:error',problem);socket.connect();
  return()=>{
   if(activeRef.current===a)activeRef.current=null;
   for(const pending of a.waits){clearTimeout(pending.timer);pending.done(false);}a.waits.clear();if(a.bucket.pending)a.bucket.delivery='unknown';
   socket.off('connect',connected);socket.off('chat:message',received);socket.off('disconnect',disconnected);socket.off('connect_error',denied);socket.off('chat:error',problem);socket.disconnect();
  };
 },[userId,auth.status,auth.busy,auth.epoch,auth.reason,roomId,attempt,current,issue,publish,pump,reconnectLater]);
 const perform=useCallback(async(a:Active,pending:Pending):Promise<boolean>=>{
  if(!current(a)||!a.ready||a.blocked||a.sending)return false;a.sending=true;a.error=null;
  try{
   for(let index=0;index<4;index++){
    if(!current(a)||!a.ready||a.blocked||!a.socket.connected)return false;a.bucket.delivery=index?'retrying':'sending';publish(a);
    try{
     const result:unknown=await a.socket.timeout(3000).emitWithAck('chat:send',{roomId:a.roomId,...pending});
     if(!current(a)||!a.ready||a.blocked)return false;
     if(record(result)&&result.ok===true&&message(result.data,a.roomId)&&result.data.clientMessageId===pending.clientMessageId&&result.data.text===pending.text&&result.data.user.id===a.userId){a.bucket.pending=null;a.bucket.delivery='confirmed';a.dirty=true;void pump(a);return true;}
     if(record(result)&&result.ok===false&&result.code!==503){issue(a,result,'발송 내용을 확인하세요.');return false;}
    }catch{if(!current(a))return false;}
    if(index<3&&!await wait(a,delays[index]))return false;
   }
   return false;
  }finally{if(current(a)){a.sending=false;if(a.bucket.pending)a.bucket.delivery='unknown';publish(a);}}
 },[current,issue,publish,pump,wait]);
 const send=useCallback(async(text:string):Promise<boolean>=>{
  const a=activeRef.current;if(!a||!current(a)||a.roomId!==roomId||!a.ready||a.blocked||a.bucket.pending||!text.trim()||Array.from(text).length>500)return false;
  const pending={clientMessageId:crypto.randomUUID(),text};a.bucket.pending=pending;return perform(a,pending);
 },[current,perform,roomId]);
 const retryPending=useCallback(async()=>{const a=activeRef.current;return a&&current(a)&&a.bucket.pending?perform(a,a.bucket.pending):false;},[current,perform]);
 const cancelPending=useCallback(()=>{const a=activeRef.current;if(a&&current(a)&&!a.sending){a.bucket.pending=null;a.bucket.delivery='idle';publish(a);}},[current,publish]);
 const reconnect=useCallback(()=>{const a=activeRef.current;if(a&&current(a))a.bucket.reconnects=0;setAttempt(value=>value+1);},[current]);
 const visible=!!userId&&auth.status==='ready'&&!auth.busy&&snapshot.epoch===auth.epoch&&snapshot.roomId===roomId;
 return{status:visible?snapshot.status:'idle',messages:visible?snapshot.messages:[],error:visible?snapshot.error:null,sending:visible&&snapshot.sending,delivery:visible?snapshot.delivery:'idle',pendingText:visible?snapshot.pendingText:null,send,reconnect,retryPending,cancelPending};
}
