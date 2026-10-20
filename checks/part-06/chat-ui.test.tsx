import{StrictMode}from'react';
import{act,fireEvent,render,screen,waitFor,within}from'@testing-library/react';
import userEvent from'@testing-library/user-event';
import{afterEach,beforeEach,expect,it,vi}from'vitest';
import App from'@submission/App';
import{A,B,PASSWORD,createServer}from'./ui-fixture';
import{transport,message,history,ioFake}from'./chat-ui-fixture';
vi.mock('socket.io-client',async()=>({io:(await import('./chat-ui-fixture')).ioFake}));
let fake:ReturnType<typeof createServer>;
beforeEach(()=>{transport.reset();fake=createServer();fake.server.user=A;vi.stubGlobal('fetch',fake.fetch);});afterEach(()=>vi.useRealTimers());
const latest=()=>transport.sockets.at(-1)!,calls=(event:string)=>transport.calls.filter(c=>c.event===event),list=()=>screen.getByRole('list',{name:'채팅 메시지'});
const ready=()=>screen.findByText('채팅에 연결됐습니다.');
const send=(text:string)=>{fireEvent.change(screen.getByLabelText('채팅 내용'),{target:{value:text}});fireEvent.click(screen.getByRole('button',{name:'메시지 전송',exact:true}));};
async function login(user:ReturnType<typeof userEvent.setup>,username='learner_a'){
 await user.clear(screen.getByLabelText('아이디'));await user.type(screen.getByLabelText('아이디'),username);await user.type(screen.getByLabelText('비밀번호'),PASSWORD);await user.click(screen.getByRole('button',{name:'로그인',exact:true}));await ready();
}
it('익명은연결하지않고발송을비활성화한다',async()=>{fake.server.user=null;render(<App/>);await screen.findByLabelText('채팅 내용');expect(ioFake).toHaveBeenCalledTimes(0);expect(screen.getByRole('button',{name:'메시지 전송'}).hasAttribute('disabled')).toBe(true);});
it('입장후이력을조회하고발송ID로저장을확인하며일반텍스트로표시한다',async()=>{
 const{container}=render(<App/>);await ready();const text='<strong data-probe="chat">안녕</strong>';send(text);await within(list()).findByText(text);await screen.findByText('서버 저장을 확인했습니다.');expect(container.querySelector('strong[data-probe="chat"]')).toBeNull();expect(calls('chat:send')[0].payload.clientMessageId).toMatch(/^[0-9a-f-]{36}$/);expect(calls('chat:history')[0].payload.after).toBe('0');expect((screen.getByLabelText('채팅 내용')as HTMLTextAreaElement).value).toBe('');expect(localStorage.length).toBe(0);
});
it('복구중실시간중첩과늦은낮은seq도DB이력순서로한번씩표시한다',async()=>{
 const first=message('r1','첫 행','1'),second=message('r1','둘째 행','2');transport.rows=[first];let release!:(value:any)=>void,initial=true;transport.onHistory=async(_s,p)=>{if(initial){initial=false;return new Promise(done=>{release=done;});}return history(p);};
 render(<App/>);await waitFor(()=>expect(calls('chat:history')).toHaveLength(1));await act(async()=>{latest().receive('chat:message',second);latest().receive('chat:message',first);release({ok:true,data:{items:[first],until:'1',next:'1',done:true}});});await within(list()).findByText('둘째 행');await ready();expect(within(list()).getAllByRole('listitem').map(li=>li.querySelector('p')?.textContent)).toEqual(['첫 행','둘째 행']);expect(calls('chat:history')[1].payload.after).toBe('1');
});
it('51개복구는첫watermark를고정하고페이지진전후끝까지읽는다',async()=>{
 transport.rows=Array.from({length:51},(_,i)=>message('r1','이력 '+i,String(i+1)));render(<App/>);await ready();expect(within(list()).getAllByRole('listitem')).toHaveLength(51);expect(calls('chat:history').map(c=>c.payload)).toEqual([{roomId:'r1',after:'0'},{roomId:'r1',after:'50',until:'51'}]);
});
it('보관은100개이고같은방복귀는확인cursor부터이어읽는다',async()=>{
 transport.rows=Array.from({length:105},(_,i)=>message('r1','이력 '+i,String(i+1)));const user=userEvent.setup();render(<App/>);await ready();expect(within(list()).getAllByRole('listitem')).toHaveLength(100);expect(screen.queryByText('이력 0')).toBeNull();await user.selectOptions(screen.getByLabelText('채팅방 선택'),'r2');await ready();await user.selectOptions(screen.getByLabelText('채팅방 선택'),'r1');await ready();expect(calls('chat:history').at(-1)?.payload.after).toBe('105');expect(within(list()).getAllByRole('listitem')).toHaveLength(100);
});
it('잘못된페이지는cursor를진전시키지않고수동복구도같은경계에서시작한다',async()=>{
 transport.onHistory=async()=>({ok:true,data:{items:[],until:'5',next:'4',done:true}});const user=userEvent.setup();render(<App/>);await screen.findByText(/이력 응답/);transport.onHistory=null;await user.click(screen.getByRole('button',{name:'채팅 다시 접속'}));await ready();expect(calls('chat:history').map(c=>c.payload.after)).toEqual(['0','0']);
});
it('500행상한뒤자동복구를멈추고마지막확인cursor에서수동재개한다',async()=>{
 transport.rows=Array.from({length:501},(_,i)=>message('r1','많은 이력 '+i,String(i+1)));const user=userEvent.setup();render(<App/>);await screen.findByText(/복구 상한/,{},{timeout:4000});expect(calls('chat:history')).toHaveLength(10);expect(calls('chat:history').at(-1)?.payload.after).toBe('450');await user.click(screen.getByRole('button',{name:'채팅 다시 접속'}));await ready();expect(calls('chat:history').at(-1)?.payload.after).toBe('500');expect(within(list()).getByText('많은 이력 500')).toBeTruthy();
});
it('ack유실은같은ID로3회만추가시도하고불명상태와수동확인을남긴다',async()=>{
 transport.onSend=async()=>{throw Error('transport unavailable');};render(<App/>);await ready();vi.useFakeTimers();send('미확인 초안');await act(async()=>{await vi.advanceTimersByTimeAsync(3500);});expect(calls('chat:send')).toHaveLength(4);expect(new Set(calls('chat:send').map(c=>c.payload.clientMessageId)).size).toBe(1);expect(screen.getByText(/저장 결과 미확인/)).toBeTruthy();await act(async()=>{await vi.advanceTimersByTimeAsync(10000);});expect(calls('chat:send')).toHaveLength(4);
 transport.onSend=null;fireEvent.click(screen.getByRole('button',{name:'미확인 전송 다시 확인'}));await act(async()=>{await vi.advanceTimersByTimeAsync(0);});expect(calls('chat:send')).toHaveLength(5);expect(new Set(calls('chat:send').map(c=>c.payload.clientMessageId)).size).toBe(1);expect(screen.getByText('서버 저장을 확인했습니다.')).toBeTruthy();
});
it('403은자동재시도없이초안과미확인발송을보존한다',async()=>{
 transport.onSend=async()=>({ok:false,code:403});render(<App/>);await ready();send('권한 확인');await screen.findByText(/채팅 참여 권한/);expect(calls('chat:send')).toHaveLength(1);expect((screen.getByLabelText('채팅 내용')as HTMLTextAreaElement).value).toBe('권한 확인');expect(screen.getByRole('button',{name:'전송 대기 취소'})).toBeTruthy();
});
it('연결실패는500/1000/2000ms세번뒤멈추고정리시타이머를남기지않는다',async()=>{
 const view=render(<App/>);await ready();vi.useFakeTimers();let attempts=0;transport.onConnect=socket=>{attempts++;socket.receive('connect_error',Object.assign(Error('network'),{data:{code:0}}));};await act(async()=>{latest().connected=false;latest().receive('disconnect');});for(const delay of [500,1000,2000])await act(async()=>{await vi.advanceTimersByTimeAsync(delay);});expect(attempts).toBe(3);expect(screen.getByText(/재연결 상한/)).toBeTruthy();await act(async()=>{await vi.advanceTimersByTimeAsync(10000);});expect(attempts).toBe(3);view.unmount();expect(vi.getTimerCount()).toBe(0);
});
it('401뒤같은계정은초안과ID를보존하고다른계정과logout은지운다',async()=>{
 transport.onSend=async()=>{fake.server.user=null;return{ok:false,code:401};};const user=userEvent.setup();render(<App/>);await ready();send('계정 초안');await screen.findByRole('button',{name:'로그인',exact:true});await login(user);expect((screen.getByLabelText('채팅 내용')as HTMLTextAreaElement).value).toBe('계정 초안');await user.click(screen.getByRole('button',{name:'미확인 전송 다시 확인'}));await screen.findByRole('button',{name:'로그인',exact:true});expect(calls('chat:send')[1].payload.clientMessageId).toBe(calls('chat:send')[0].payload.clientMessageId);await login(user,'learner_b');expect(screen.queryByRole('button',{name:'미확인 전송 다시 확인'})).toBeNull();expect((screen.getByLabelText('채팅 내용')as HTMLTextAreaElement).value).toBe('');fake.server.user=A;await user.click(screen.getByRole('button',{name:'계정 다시 확인'}));await ready();expect(screen.queryByRole('button',{name:'미확인 전송 다시 확인'})).toBeNull();expect((screen.getByLabelText('채팅 내용')as HTMLTextAreaElement).value).toBe('');await user.click(screen.getByRole('button',{name:'로그아웃',exact:true}));await screen.findByRole('button',{name:'로그인',exact:true});expect(within(list()).queryAllByRole('listitem')).toHaveLength(0);
});
it('이전방ack와계정finally는현재방/계정의초안과전송상태를바꾸지않는다',async()=>{
 const pending:{payload:any;resolve:(value:any)=>void}[]=[];transport.onSend=async(_s,payload)=>new Promise(resolve=>pending.push({payload,resolve}));const user=userEvent.setup();render(<App/>);await ready();send('A 옛 글');await user.selectOptions(screen.getByLabelText('채팅방 선택'),'r2');await ready();send('A 새 방');expect(pending).toHaveLength(2);await act(async()=>pending[0].resolve({ok:true,data:{...message('r1','A 옛 글','1',pending[0].payload.clientMessageId),user:A}}));expect((screen.getByLabelText('채팅 내용')as HTMLTextAreaElement).value).toBe('A 새 방');expect(screen.getByLabelText('채팅 내용').hasAttribute('disabled')).toBe(true);
 fake.server.user=B;await user.click(screen.getByRole('button',{name:'계정 다시 확인'}));await ready();send('B 글');expect(pending).toHaveLength(3);await act(async()=>pending[1].resolve({ok:true,data:{...message('r2','A 새 방','1',pending[1].payload.clientMessageId),user:A}}));expect(screen.getByLabelText('채팅 내용').hasAttribute('disabled')).toBe(true);await act(async()=>pending[2].resolve({ok:true,data:{...message('r2','B 글','2',pending[2].payload.clientMessageId),user:B}}));await waitFor(()=>expect(screen.getByLabelText('채팅 내용').hasAttribute('disabled')).toBe(false));
});
it('미확인대기취소는초안을보존하며저장행을삭제하지않는다',async()=>{
 transport.onSend=async(_s,p)=>{transport.rows.push({...message(p.roomId,p.text,'1',p.clientMessageId),user:A});return{ok:false,code:409};};render(<App/>);await ready();send('취소는 삭제 아님');await screen.findByRole('button',{name:'전송 대기 취소'});fireEvent.click(screen.getByRole('button',{name:'전송 대기 취소'}));expect((screen.getByLabelText('채팅 내용')as HTMLTextAreaElement).value).toBe('취소는 삭제 아님');expect(transport.rows).toHaveLength(1);expect(screen.queryByRole('button',{name:'미확인 전송 다시 확인'})).toBeNull();
});
it('StrictMode와unmount는동일handler·이전이력·구독·연결을정리한다',async()=>{
 const view=render(<StrictMode><App/></StrictMode>);await ready();expect(transport.sockets.filter(s=>s.connected)).toHaveLength(1);const old=latest(),handler=[...old.handlers.get('chat:message')!][0];view.unmount();await act(async()=>handler(message()));expect(transport.sockets.every(s=>!s.connected&&[...s.handlers.values()].every(set=>set.size===0))).toBe(true);
});
it('재연결전옛페이지가늦게끝나도새연결cursor와이력을덮지않는다',async()=>{
 let release!:(value:any)=>void,first=true;transport.onHistory=async(_s,p)=>{if(first){first=false;return new Promise(done=>{release=done;});}return history(p);};render(<App/>);await waitFor(()=>expect(calls('chat:history')).toHaveLength(1));const old=latest();vi.useFakeTimers();await act(async()=>{old.connected=false;old.receive('disconnect');});await act(async()=>{await vi.advanceTimersByTimeAsync(500);});expect(calls('chat:history')).toHaveLength(2);const row=message('r1','현재 연결','1');await act(async()=>{latest().receive('chat:message',row);await vi.advanceTimersByTimeAsync(0);});await act(async()=>release({ok:true,data:{items:[message('r1','옛 페이지','99')],until:'99',next:'99',done:true}}));expect(screen.queryByText('옛 페이지')).toBeNull();expect(within(list()).getByText('현재 연결')).toBeTruthy();expect(calls('chat:history')[1].payload.after).toBe('0');
});
it('끊긴미확인발송은재연결만으로재전송하지않고수동확인에서ID를재사용한다',async()=>{
 let release!:(value:any)=>void;transport.onSend=async()=>new Promise(done=>{release=done;});render(<App/>);await ready();vi.useFakeTimers();send('오프라인 대기');await act(async()=>{});const old=latest(),original=calls('chat:send')[0].payload;await act(async()=>{old.connected=false;old.receive('disconnect');});await act(async()=>{await vi.advanceTimersByTimeAsync(500);});expect(calls('chat:send')).toHaveLength(1);expect(screen.getByText(/저장 결과 미확인/)).toBeTruthy();transport.onSend=null;fireEvent.click(screen.getByRole('button',{name:'미확인 전송 다시 확인'}));await act(async()=>{await vi.advanceTimersByTimeAsync(0);});expect(calls('chat:send')[1].payload.clientMessageId).toBe(original.clientMessageId);await act(async()=>release({ok:true,data:{...message('r1',original.text,'1',original.clientMessageId),user:A}}));expect(screen.getByText('서버 저장을 확인했습니다.')).toBeTruthy();
});
