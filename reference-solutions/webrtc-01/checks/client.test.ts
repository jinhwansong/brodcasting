import {describe,it,expect,vi} from 'vitest';
import {gatherIce,releaseMedia,RtcClient} from '../client/src/rtc-client';
const fake=vi.hoisted(()=>({sockets:[] as any[]}));
vi.mock('socket.io-client',()=>({io:()=>{
 const handlers=new Map<string,Function>();const socket={connected:false,on:vi.fn((name:string,handler:Function)=>{handlers.set(name,handler);return socket;}),connect:vi.fn(()=>{socket.connected=true;handlers.get('connect')?.();}),disconnect:vi.fn(()=>{socket.connected=false;handlers.get('disconnect')?.();}),removeAllListeners:vi.fn(()=>handlers.clear()),timeout:()=>socket,emitWithAck:vi.fn(async(name:string)=>({ok:true,data:name==='rtc:list'?[]:name==='rtc:watch'?{room:{id:'room'}}:{id:'room'}})),serverEmit:(name:string,value:unknown)=>handlers.get(name)?.(value)};fake.sockets.push(socket);return socket;
}}));
class MockPeer extends EventTarget{
 static instances:MockPeer[]=[];iceGatheringState='complete';signalingState='stable';connectionState='new';localDescription:RTCSessionDescriptionInit|null=null;ontrack:Function|null=null;onconnectionstatechange:Function|null=null;
 constructor(){super();MockPeer.instances.push(this);}
 addTrack=vi.fn();close=vi.fn();createOffer=vi.fn(async()=>({type:'offer',sdp:'v=0\r\n'}) as RTCSessionDescriptionInit);createAnswer=vi.fn(async()=>({type:'answer',sdp:'v=0\r\n'}) as RTCSessionDescriptionInit);
 setLocalDescription=vi.fn(async(value:RTCSessionDescriptionInit)=>{this.localDescription=value;this.signalingState=value.type==='offer'?'have-local-offer':'stable';});
 setRemoteDescription=vi.fn(async(value:RTCSessionDescriptionInit)=>{this.signalingState=value.type==='offer'?'have-remote-offer':'stable';});getStats=vi.fn(async()=>new Map());
}
const flush=async()=>{for(let i=0;i<15;i++)await Promise.resolve();};
function harness(){vi.stubGlobal('RTCPeerConnection',MockPeer);const changed={rooms:vi.fn(),status:vi.fn(),stream:vi.fn(),room:vi.fn()},rtc=new RtcClient(changed),socket=fake.sockets.at(-1),stop=vi.fn(),cleanup=vi.fn(),media={stream:{getTracks:()=>[{stop,addEventListener:vi.fn()}]} as unknown as MediaStream,cleanup};return{changed,rtc,socket,stop,cleanup,media};}
class Peer extends EventTarget{iceGatheringState='gathering';}
describe('RTC resource lifetime',()=>{
 it('waits for complete candidates instead of sending a partial description',async()=>{
  const peer=new Peer(),done=vi.fn(),abort=new AbortController();const waiting=gatherIce(peer as RTCPeerConnection,abort.signal).then(done);
  peer.dispatchEvent(new Event('icegatheringstatechange'));await Promise.resolve();expect(done).not.toHaveBeenCalled();
  peer.iceGatheringState='complete';peer.dispatchEvent(new Event('icegatheringstatechange'));await waiting;expect(done).toHaveBeenCalledOnce();
 });
 it('accepts already complete gathering',async()=>{const peer=new Peer();peer.iceGatheringState='complete';await expect(gatherIce(peer as RTCPeerConnection,new AbortController().signal)).resolves.toBeUndefined();});
 it('cancels incomplete gathering on stop',async()=>{const abort=new AbortController(),waiting=gatherIce(new Peer() as RTCPeerConnection,abort.signal);abort.abort();await expect(waiting).rejects.toThrow();});
 it('rejects an already cancelled operation even when gathering is complete',async()=>{const abort=new AbortController();abort.abort();const peer=new Peer();peer.iceGatheringState='complete';await expect(gatherIce(peer as RTCPeerConnection,abort.signal)).rejects.toThrow();});
 it('times out without leaving event handlers behind',async()=>{vi.useFakeTimers();try{const peer=new Peer(),remove=vi.spyOn(peer,'removeEventListener'),waiting=gatherIce(peer as RTCPeerConnection,new AbortController().signal);const assertion=expect(waiting).rejects.toThrow();await vi.advanceTimersByTimeAsync(8000);await assertion;expect(remove).toHaveBeenCalledWith('icegatheringstatechange',expect.any(Function));}finally{vi.useRealTimers();}});
 it('stops every local track and the drawing loop',()=>{const stop1=vi.fn(),stop2=vi.fn(),cleanup=vi.fn();releaseMedia({stream:{getTracks:()=>[{stop:stop1},{stop:stop2}]} as unknown as MediaStream,cleanup});expect(stop1).toHaveBeenCalledOnce();expect(stop2).toHaveBeenCalledOnce();expect(cleanup).toHaveBeenCalledOnce();});
});
describe('RTC session cleanup and stale signals',()=>{
 it('closes the peer, source tracks and drawing loop when the owner stops',async()=>{
  const h=harness();await h.rtc.publish(h.media,'title');h.socket.serverEmit('rtc:viewer',{roomId:'room',peerId:'viewer'});await flush();const peer=MockPeer.instances.at(-1)!;expect(peer.addTrack).toHaveBeenCalledOnce();expect(h.socket.emitWithAck).toHaveBeenCalledWith('rtc:signal',expect.objectContaining({target:'viewer',type:'offer'}));h.rtc.stop();expect(peer.close).toHaveBeenCalledOnce();expect(h.stop).toHaveBeenCalledOnce();expect(h.cleanup).toHaveBeenCalledOnce();expect(h.socket.emitWithAck).toHaveBeenCalledWith('rtc:leave',{});h.rtc.close();
 });
 it('discards an outstanding publish result after logout closes the session',async()=>{
  const h=harness();let resolve!:(value:unknown)=>void;h.socket.emitWithAck.mockImplementation((name:string)=>name==='rtc:publish'?new Promise(done=>resolve=done):Promise.resolve({ok:true,data:[]}));const pending=h.rtc.publish(h.media,'title');h.rtc.close();resolve({ok:true,data:{id:'room'}});await expect(pending).rejects.toThrow();expect(h.stop).toHaveBeenCalledOnce();expect(h.changed.room).not.toHaveBeenCalledWith({id:'room'});
 });
 it('releases a source that arrives after the client has closed',async()=>{const h=harness();h.rtc.close();await expect(h.rtc.publish(h.media,'title')).rejects.toThrow();expect(h.stop).toHaveBeenCalledOnce();});
 it('does not accept an offer for another room',async()=>{const h=harness();await h.rtc.watch('room');const peer=MockPeer.instances.at(-1)!;h.socket.serverEmit('rtc:signal',{roomId:'other',from:'publisher',type:'offer',sdp:'v=0'});await flush();expect(peer.setRemoteDescription).not.toHaveBeenCalled();h.rtc.close();expect(peer.close).toHaveBeenCalledOnce();});
 it('answers the offer on the pre-created receiving peer',async()=>{const h=harness();await h.rtc.watch('room');h.socket.serverEmit('rtc:signal',{roomId:'room',from:'publisher',type:'offer',sdp:'v=0'});await flush();expect(h.socket.emitWithAck).toHaveBeenCalledWith('rtc:signal',expect.objectContaining({roomId:'room',target:'publisher',type:'answer'}));h.socket.serverEmit('rtc:ended',undefined);expect(MockPeer.instances.at(-1)!.close).toHaveBeenCalledOnce();expect(h.changed.stream).toHaveBeenLastCalledWith(null,false);h.rtc.close();});
 it('does not send an offer after stop cancels candidate collection',async()=>{const h=harness();await h.rtc.publish(h.media,'title');h.socket.serverEmit('rtc:viewer',{roomId:'room',peerId:'viewer'});const peer=MockPeer.instances.at(-1)!;peer.iceGatheringState='gathering';await flush();h.rtc.close();await flush();expect(peer.close).toHaveBeenCalledOnce();expect(h.socket.emitWithAck.mock.calls.filter(([name]:[string])=>name==='rtc:signal')).toEqual([]);});
});
