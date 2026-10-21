import {io,type Socket} from 'socket.io-client';
export type CapturedMedia={stream:MediaStream;cleanup:()=>void};
export type LiveRoom={id:string;title:string;hostName:string;viewers:number;maxViewers:number};
type Ack<T>={ok:true;data:T}|{ok:false;code:number};
type Context={abort:AbortController;roomId:string;publisher:boolean;media:CapturedMedia|null;peers:Map<string,RTCPeerConnection>;timers:Map<string,ReturnType<typeof setTimeout>>};
export async function gatherIce(_peer:RTCPeerConnection,_abort:AbortSignal):Promise<void>{
 // TODO A: ICE 완료·중단·8초 제한을 처리하고 이벤트와 타이머를 정리하세요.
 throw new Error('TODO: ICE gathering');
}
export function releaseMedia(media:CapturedMedia):void{media.cleanup();for(const track of media.stream.getTracks())track.stop();}
export class RtcClient{
 private readonly socket:Socket;
 private context:Context|null=null;
 private closed=false;
 constructor(private readonly changed:{rooms:(rooms:LiveRoom[])=>void;status:(message:string)=>void;stream:(stream:MediaStream|null,local:boolean)=>void;room:(room:LiveRoom|null)=>void}){
  this.socket=io('/rtc',{path:'/rtc.io',transports:['websocket'],autoConnect:false,reconnection:false,withCredentials:true,timeout:5000});
  this.socket.on('connect',()=>{this.changed.status('연결됐어요. 송출하거나 방송을 골라 주세요.');void this.list();});
  this.socket.on('connect_error',()=>this.fail('실습 서버에 연결하지 못했어요. 로그인과 연결을 확인해 주세요.'));
  this.socket.on('disconnect',()=>{this.stop(false);this.changed.rooms([]);this.changed.status('연결이 끝났어요. 계정을 다시 확인해 주세요.');});
  this.socket.on('rtc:rooms',(rooms:LiveRoom[])=>this.changed.rooms(rooms));
  this.socket.on('rtc:viewer',(value:{roomId:string;peerId:string})=>{const ctx=this.context;if(ctx?.publisher&&ctx.roomId===value.roomId)void this.offer(ctx,value.peerId).catch(()=>this.dropPeer(ctx,value.peerId));});
  this.socket.on('rtc:signal',(value:{roomId:string;from:string;type:'offer'|'answer';sdp:string})=>{const ctx=this.context;if(ctx&&ctx.roomId===value.roomId)void this.receive(ctx,value).catch(()=>{if(this.context===ctx)this.fail('영상 연결에 실패했어요. 같은 네트워크인지 확인하고 다시 시도해 주세요.');});});
  this.socket.on('rtc:peer-left',({peerId}:{peerId:string})=>{if(this.context)this.dropPeer(this.context,peerId);});
  this.socket.on('rtc:ended',()=>{this.stop(false);this.changed.status('송출자가 방송을 종료했어요.');});
  this.socket.connect();
 }
 private async rpc<T>(event:string,payload:object={}):Promise<T>{
  if(this.closed||!this.socket.connected)throw new Error('RTC offline');
  const result=await this.socket.timeout(3000).emitWithAck(event,payload) as Ack<T>;
  if(!result.ok)throw new Error('RTC request rejected ('+result.code+')');return result.data;
 }
 private active(ctx:Context){if(this.closed||ctx.abort.signal.aborted||this.context!==ctx)throw new Error('RTC cancelled');}
 private fail(message:string){if(this.closed)return;this.stop();this.changed.status(message);}
 private dropPeer(ctx:Context,id:string){clearTimeout(ctx.timers.get(id));ctx.timers.delete(id);const peer=ctx.peers.get(id);if(peer){peer.ontrack=null;peer.onconnectionstatechange=null;peer.close();ctx.peers.delete(id);}}
 private peer(ctx:Context,id:string){
  this.active(ctx);if(ctx.peers.size>=4)throw new Error('RTC peer limit');
  const peer=new RTCPeerConnection({iceServers:[]});ctx.peers.set(id,peer);
  const failed=()=>{if(this.context!==ctx)return;if(ctx.publisher){this.dropPeer(ctx,id);this.changed.status('시청자 한 명의 연결에 실패했어요.');}else this.fail('영상 연결에 실패했어요. 같은 네트워크에서 다시 시도해 주세요.');};
  ctx.timers.set(id,setTimeout(failed,20000));
  if(ctx.publisher)for(const track of ctx.media!.stream.getTracks())peer.addTrack(track,ctx.media!.stream);
  else peer.ontrack=event=>{if(this.context===ctx&&!ctx.abort.signal.aborted){this.changed.stream(event.streams[0]??new MediaStream([event.track]),false);}};
  peer.onconnectionstatechange=()=>{
   if(this.context!==ctx)return;
   if(peer.connectionState==='connected'){clearTimeout(ctx.timers.get(id));ctx.timers.delete(id);this.changed.status('WebRTC 영상이 연결됐어요.');}
   if(peer.connectionState==='disconnected'&&!ctx.timers.has(id)){this.changed.status('영상 연결이 끊겼어요. 잠시 연결을 기다립니다.');ctx.timers.set(id,setTimeout(failed,10000));}
   if(peer.connectionState==='failed')failed();
  };
  return peer;
 }
 private async description(ctx:Context,peer:RTCPeerConnection,target:string){
  await gatherIce(peer,ctx.abort.signal);this.active(ctx);
  const description=peer.localDescription;if(!description?.sdp||description.sdp.length>20000)throw new Error('RTC description unavailable');
  await this.rpc('rtc:signal',{roomId:ctx.roomId,target,type:description.type,sdp:description.sdp});this.active(ctx);
 }
 private async offer(ctx:Context,id:string){
  if(ctx.peers.has(id))return;const peer=this.peer(ctx,id);await peer.setLocalDescription(await peer.createOffer());this.active(ctx);await this.description(ctx,peer,id);
 }
 private async receive(ctx:Context,value:{from:string;type:'offer'|'answer';sdp:string}){
  if(ctx.publisher){const peer=ctx.peers.get(value.from);if(value.type!=='answer'||!peer||peer.signalingState!=='have-local-offer')return;await peer.setRemoteDescription({type:'answer',sdp:value.sdp});}
  else{
   if(value.type!=='offer')return;
   const peer=ctx.peers.get('publisher');if(!peer||peer.signalingState!=='stable')return;
   await peer.setRemoteDescription({type:'offer',sdp:value.sdp});this.active(ctx);await peer.setLocalDescription(await peer.createAnswer());this.active(ctx);await this.description(ctx,peer,value.from);
  }
 }
 async list(){try{this.changed.rooms(await this.rpc<LiveRoom[]>('rtc:list'));}catch{this.fail('방송 목록을 불러오지 못했어요. 계정을 다시 확인해 주세요.');}}
 async publish(media:CapturedMedia,title:string){
  if(this.closed||this.context){releaseMedia(media);throw new Error('Already participating or closed');}
  const ctx:Context={abort:new AbortController(),roomId:'',publisher:true,media,peers:new Map(),timers:new Map()};this.context=ctx;
  try{
   const room=await this.rpc<LiveRoom>('rtc:publish',{title});this.active(ctx);ctx.roomId=room.id;
   for(const track of media.stream.getTracks())track.addEventListener('ended',()=>{if(this.context===ctx)this.fail('화면 또는 카메라 공유가 끝났어요.');},{once:true});
   this.changed.room(room);this.changed.stream(media.stream,true);this.changed.status('송출 중입니다. 다른 탭이나 PC에서 이 방을 선택해 주세요.');
  }catch(error){if(this.context===ctx)this.fail('송출을 시작하지 못했어요. 계정과 방 개수를 확인해 주세요.');throw error;}
 }
 async watch(id:string){
  if(this.context)throw new Error('Already participating');
  const ctx:Context={abort:new AbortController(),roomId:id,publisher:false,media:null,peers:new Map(),timers:new Map()};this.context=ctx;
  try{this.peer(ctx,'publisher');this.changed.status('송출자와 영상을 연결하고 있어요.');const result=await this.rpc<{room:LiveRoom}>('rtc:watch',{roomId:id});this.active(ctx);this.changed.room(result.room);}
  catch(error){if(this.context===ctx)this.fail('시청을 시작하지 못했어요. 방송 종료나 시청자 상한을 확인해 주세요.');throw error;}
 }
 async stats():Promise<{frames:number;bytes:number;peers:number}>{
  const ctx=this.context;let frames=0,bytes=0;if(!ctx)return{frames,bytes,peers:0};
  for(const peer of ctx.peers.values()){const reports=await peer.getStats();reports.forEach(report=>{
   if(report.type==='inbound-rtp'&&report.kind==='video'){frames+=report.framesDecoded??0;bytes+=report.bytesReceived??0;}
   if(report.type==='outbound-rtp'&&report.kind==='video'){frames+=report.framesEncoded??0;bytes+=report.bytesSent??0;}
  });}this.active(ctx);return{frames,bytes,peers:ctx.peers.size};
 }
 stop(notify=true){
  const ctx=this.context;this.context=null;
  if(ctx){ctx.abort.abort();for(const id of [...ctx.peers.keys()])this.dropPeer(ctx,id);if(ctx.media)releaseMedia(ctx.media);}
  this.changed.stream(null,false);this.changed.room(null);
  if(notify&&ctx&&this.socket.connected)void this.rpc('rtc:leave').catch(()=>{this.socket.disconnect();});
 }
 close(){if(this.closed)return;this.stop(false);this.closed=true;this.socket.removeAllListeners();this.socket.disconnect();}
}
