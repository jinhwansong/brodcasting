import {describe,expect,it} from 'vitest';
import {RtcRooms,fields,roomId,title,signal} from '../../apps/broadcast/server/src/rtc-rooms';
import {assertAppOptions,isPrivateIpv4} from '../../apps/broadcast/server/src/app-config';
const user=(id='a')=>({id,username:'learner_'+id});
const sdp='v=0\r\ns=RTC practice\r\n';
describe('WebRTC 입력과 소유한 방',()=>{
 it('제목과 중계 본문을 정확한 모양으로 제한한다',()=>{expect(title({title:'  연습 방송  '})).toBe('연습 방송');for(const value of [null,[],{title:'x',userId:'other'},{title:' '},{title:'x'.repeat(61)}])expect(()=>title(value)).toThrow();expect(()=>fields({x:1},[])).toThrow();expect(()=>roomId('wrong')).toThrow();expect(()=>signal({roomId:'wrong',target:'x',type:'offer',sdp})).toThrow();});
 it('자기 방만 만들고 공개 목록에 SDP나 계정 ID를 넣지 않는다',()=>{const rooms=new RtcRooms(),room=rooms.publish('publisher',user(),'테스트 방송');expect(roomId(room.id)).toBe(room.id);expect(rooms.list()).toEqual([{id:room.id,title:'테스트 방송',hostName:'learner_a',viewers:0,maxViewers:4}]);});
 it('한 계정의 두 번째 송출과 한 소켓의 중복 참여를 거부한다',()=>{const rooms=new RtcRooms(),room=rooms.publish('p',user(),'test');expect(()=>rooms.publish('p2',user(),'other')).toThrow();expect(()=>rooms.watch('p',room.id)).toThrow();rooms.watch('v',room.id);expect(()=>rooms.watch('v',room.id)).toThrow();});
 it('방은 다섯 개, 시청자는 방마다 네 명까지 허용한다',()=>{const rooms=new RtcRooms();for(let i=0;i<5;i++)rooms.publish('p'+i,user(String(i)),'test');expect(()=>rooms.publish('p5',user('5'),'test')).toThrow();const room=rooms.list()[0];for(let i=0;i<4;i++)rooms.watch('v'+i,room.id);expect(()=>rooms.watch('v4',room.id)).toThrow();expect(rooms.list()[0].viewers).toBe(4);});
 it('송출자와 같은 방의 시청자 사이에서만 올바른 SDP 방향을 허용한다',()=>{const rooms=new RtcRooms(),a=rooms.publish('pa',user('a'),'A'),b=rooms.publish('pb',user('b'),'B');rooms.watch('va',a.id);rooms.watch('vb',b.id);expect(()=>rooms.authorizeSignal('pa',{roomId:a.id,target:'va',type:'offer',sdp})).not.toThrow();expect(()=>rooms.authorizeSignal('va',{roomId:a.id,target:'pa',type:'answer',sdp})).not.toThrow();for(const [from,to,type]of [['pa','vb','offer'],['va','vb','answer'],['va','pa','offer'],['pa','va','answer'],['stranger','va','offer']] as const)expect(()=>rooms.authorizeSignal(from,{roomId:a.id,target:to,type,sdp})).toThrow();});
 it('시청자 퇴장과 송출자 종료 때 실제 등록을 제거한다',()=>{const rooms=new RtcRooms(),room=rooms.publish('p',user(),'test');rooms.watch('v1',room.id);rooms.watch('v2',room.id);expect(rooms.leave('v1')).toEqual({ended:[],publisher:'p'});expect(rooms.list()[0].viewers).toBe(1);expect(rooms.leave('p')).toEqual({ended:['v2'],publisher:null});expect(rooms.list()).toEqual([]);expect(()=>rooms.watch('late',room.id)).toThrow();expect(rooms.leave('unknown')).toEqual({ended:[],publisher:null});});
 it('LAN 주소는 사설 IPv4의 HTTPS 출처만 명시적으로 허용한다',()=>{
  const options={secret:'a'.repeat(64),browserOrigin:'http://127.0.0.1:5190'};
  for(const host of ['10.2.3.4','172.16.0.1','172.31.255.254','192.168.0.10']){expect(isPrivateIpv4(host)).toBe(true);expect(()=>assertAppOptions({...options,browserOrigin:'https://'+host+':5190'})).not.toThrow();}
  for(const origin of ['http://192.168.0.10:5190','https://example.com','https://8.8.8.8','https://172.32.0.1','https://user:pass@192.168.0.10','https://192.168.0.10/path'])expect(()=>assertAppOptions({...options,browserOrigin:origin})).toThrow();
  for(const host of ['192.168.0.999','192.168.00.1','172.15.0.1','0.0.0.0','localhost','127.0.0.1'])expect(isPrivateIpv4(host)).toBe(false);
 });
});
