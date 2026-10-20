import {StrictMode} from 'react';
import {act,render,screen,waitFor,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach,expect,it,vi} from 'vitest';
import App from '@submission/App';
import {A,B,PASSWORD,createServer} from './ui-fixture';
import {transport,message,ioFake} from './chat-ui-fixture';
vi.mock('socket.io-client',async()=>({io:(await import('./chat-ui-fixture')).ioFake}));
let fake:ReturnType<typeof createServer>;
beforeEach(()=>{transport.reset();fake=createServer();fake.server.user=A;vi.stubGlobal('fetch',fake.fetch);});
const latest=()=>transport.sockets.at(-1)!;
async function ready(){await screen.findByText('채팅에 연결됐습니다.');}
async function login(user:ReturnType<typeof userEvent.setup>,username='learner_a'){
 await user.clear(screen.getByLabelText('아이디'));await user.type(screen.getByLabelText('아이디'),username);await user.type(screen.getByLabelText('비밀번호'),PASSWORD);await user.click(screen.getByRole('button',{name:'로그인',exact:true}));await ready();
}
it('익명은연결하지않고전송을비활성화한다',async()=>{
 fake.server.user=null;render(<App/>);await screen.findByLabelText('채팅 내용');expect(ioFake).toHaveBeenCalledTimes(0);expect(screen.getByRole('button',{name:'메시지 전송'}).hasAttribute('disabled')).toBe(true);
});
it('로그인한방의메시지를텍스트로보내고서버수신을표시한다',async()=>{
 const user=userEvent.setup(),{container}=render(<App/>);await ready();const text='<strong data-probe="chat">안녕</strong>';
 await user.type(screen.getByLabelText('채팅 내용'),text);await user.click(screen.getByRole('button',{name:'메시지 전송'}));
 await within(screen.getByRole('list',{name:'채팅 메시지'})).findByText(text);expect(container.querySelector('strong[data-probe="chat"]')).toBeNull();
 expect((screen.getByLabelText('채팅 내용') as HTMLTextAreaElement).value).toBe('');expect(localStorage.length).toBe(0);
});
it('방변경과unmount에서이전구독을정리하고늦은이벤트를무시한다',async()=>{
 const user=userEvent.setup(),view=render(<App/>);await ready();const old=latest(),handler=[...old.handlers.get('chat:message')!][0];
 await user.selectOptions(screen.getByLabelText('채팅방 선택'),'r2');await ready();expect(old.connected).toBe(false);expect([...old.handlers.values()].every(set=>set.size===0)).toBe(true);
 await act(async()=>handler(message('r1','이전 방 늦은 이벤트')));expect(screen.queryByText('이전 방 늦은 이벤트')).toBeNull();
 view.unmount();expect(transport.sockets.every(socket=>!socket.connected&&[...socket.handlers.values()].every(set=>set.size===0))).toBe(true);
});
it('StrictMode에서도활성연결한개와정리되는동일핸들러를유지한다',async()=>{
 const view=render(<StrictMode><App/></StrictMode>);await ready();expect(transport.sockets.filter(socket=>socket.connected)).toHaveLength(1);view.unmount();expect(transport.sockets.every(socket=>!socket.connected)).toBe(true);
});
it('권한거부는초안을보존하고수동재접속을안내한다',async()=>{
 transport.onSend=async()=>({ok:false,code:403,message:'denied'});const user=userEvent.setup();render(<App/>);await ready();await user.type(screen.getByLabelText('채팅 내용'),'남겨둘 글');await user.click(screen.getByRole('button',{name:'메시지 전송'}));
 await screen.findByText(/채팅 참여 권한/);expect((screen.getByLabelText('채팅 내용') as HTMLTextAreaElement).value).toBe('남겨둘 글');expect(ioFake).toHaveBeenCalledTimes(1);
});
it('ack결과불명은초안유지·자동재전송없음으로처리한다',async()=>{
 let sends=0;transport.onSend=async()=>{sends++;throw new Error('timeout');};const user=userEvent.setup();render(<App/>);await ready();await user.type(screen.getByLabelText('채팅 내용'),'결과 불명');await user.click(screen.getByRole('button',{name:'메시지 전송'}));
 await screen.findByText(/전송 결과/);expect((screen.getByLabelText('채팅 내용') as HTMLTextAreaElement).value).toBe('결과 불명');expect(sends).toBe(1);expect(ioFake).toHaveBeenCalledTimes(1);
});
it('401뒤같은계정재인증은초안을보존하고다른계정은지운다',async()=>{
 transport.onSend=async()=>{fake.server.user=null;return{ok:false,code:401,message:'expired'};};const user=userEvent.setup();render(<App/>);await ready();await user.type(screen.getByLabelText('채팅 내용'),'만료 초안');await user.click(screen.getByRole('button',{name:'메시지 전송'}));await screen.findByRole('button',{name:'로그인',exact:true});
 await login(user);expect((screen.getByLabelText('채팅 내용') as HTMLTextAreaElement).value).toBe('만료 초안');
 await user.click(screen.getByRole('button',{name:'메시지 전송'}));await screen.findByRole('button',{name:'로그인',exact:true});await login(user,'learner_b');expect((screen.getByLabelText('채팅 내용') as HTMLTextAreaElement).value).toBe('');
 fake.server.user=A;await user.click(screen.getByRole('button',{name:'계정 다시 확인'}));await ready();expect((screen.getByLabelText('채팅 내용') as HTMLTextAreaElement).value).toBe('');
});
it('이전방의늦은ack가현재방초안과저장상태를바꾸지않는다',async()=>{
 let resolve!:(value:unknown)=>void;transport.onSend=()=>new Promise(done=>{resolve=done;});const user=userEvent.setup();render(<App/>);await ready();await user.type(screen.getByLabelText('채팅 내용'),'옛 글');await user.click(screen.getByRole('button',{name:'메시지 전송'}));
 await user.selectOptions(screen.getByLabelText('채팅방 선택'),'r2');await ready();await user.type(screen.getByLabelText('채팅 내용'),'새 글');await act(async()=>resolve({ok:true,data:message('r1','옛 글')}));
 expect((screen.getByLabelText('채팅 내용') as HTMLTextAreaElement).value).toBe('새 글');expect(screen.getByRole('button',{name:'메시지 전송'}).hasAttribute('disabled')).toBe(false);
});
it('다른계정의늦은finally가새계정의전송중상태를해제하지않는다',async()=>{
 const resolves:((value:unknown)=>void)[]=[];transport.onSend=()=>new Promise(done=>resolves.push(done));const user=userEvent.setup();render(<App/>);await ready();await user.type(screen.getByLabelText('채팅 내용'),'A 글');await user.click(screen.getByRole('button',{name:'메시지 전송'}));
 fake.server.user=B;await user.click(screen.getByRole('button',{name:'계정 다시 확인'}));await screen.findByText('learner_b');await ready();await user.type(screen.getByLabelText('채팅 내용'),'B 글');await user.click(screen.getByRole('button',{name:'메시지 전송'}));await waitFor(()=>expect(resolves).toHaveLength(2));
 await act(async()=>resolves[0]({ok:true,data:message('r1','A 글')}));expect(screen.getByRole('button',{name:'메시지 전송'}).hasAttribute('disabled')).toBe(true);
 await act(async()=>resolves[1]({ok:true,data:message('r1','B 글')}));await waitFor(()=>expect(screen.getByLabelText('채팅 내용').hasAttribute('disabled')).toBe(false));
});
it('수신형식을검사하고방별보관100개상한을유지한다',async()=>{
 render(<App/>);await ready();await act(async()=>{
  latest().receive('chat:message',{text:'잘못된 응답'});latest().receive('chat:message',message('r2','다른 방'));
  for(let i=0;i<105;i++)latest().receive('chat:message',message('r1','수신 '+i));
 });
 const list=screen.getByRole('list',{name:'채팅 메시지'});expect(within(list).getAllByRole('listitem')).toHaveLength(100);expect(screen.queryByText('수신 0')).toBeNull();expect(screen.queryByText('잘못된 응답')).toBeNull();expect(screen.queryByText('다른 방')).toBeNull();expect(within(list).getByText('수신 104')).toBeTruthy();
});
