import {Profiler,StrictMode} from 'react';
import {act,fireEvent,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach,expect,it,vi} from 'vitest';
import App from '@submission/App';
import {A,B,PASSWORD,createServer,json} from './ui-fixture';
let fake:ReturnType<typeof createServer>;
beforeEach(()=>{localStorage.clear();fake=createServer();vi.stubGlobal('fetch',fake.fetch);});
async function login(user:ReturnType<typeof userEvent.setup>,username='learner_a'){
 await screen.findByLabelText('아이디');await user.clear(screen.getByLabelText('아이디'));await user.type(screen.getByLabelText('아이디'),username);
 await user.type(screen.getByLabelText('비밀번호'),PASSWORD);await user.click(screen.getByRole('button',{name:'로그인',exact:true}));await screen.findByRole('button',{name:'로그아웃'});await screen.findByText('방송 a');
}
it('StrictMode의 초기 계정 조회를 합치고 익명 저장 버튼을 비활성화한다',async()=>{
 render(<StrictMode><App/></StrictMode>);await screen.findByText('방송 a');expect(fake.fetch.mock.calls.filter(([url])=>url==='/api/auth/session')).toHaveLength(1);
 expect(screen.getByRole('button',{name:'방송 a 즐겨찾기 추가'}).hasAttribute('disabled')).toBe(true);expect(screen.queryByRole('button',{name:'공지 저장'})).toBeNull();expect(localStorage.length).toBe(0);
});
it('로그인 후 현재 사용자와 저장 기능을 표시하고 인증값을 저장하지 않는다',async()=>{
 const user=userEvent.setup();render(<App/>);await login(user);expect(screen.getByText('learner_a')).toBeTruthy();expect(screen.getByRole('button',{name:'방송 a 즐겨찾기 추가'}).hasAttribute('disabled')).toBe(false);
 expect(localStorage.length).toBe(0);expect(screen.queryByText('test-csrf-a')).toBeNull();
});
it('가입 뒤 로그인 화면으로 돌아가고 비밀번호를 비운다',async()=>{
 const user=userEvent.setup();render(<App/>);await screen.findByLabelText('아이디');await user.click(screen.getByRole('button',{name:'회원가입으로 전환'}));
 await user.type(screen.getByLabelText('아이디'),'learner_c');await user.type(screen.getByLabelText('비밀번호'),PASSWORD);await user.click(screen.getByRole('button',{name:'가입하기'}));
 await screen.findByText(/가입.*로그인/);expect((screen.getByLabelText('비밀번호') as HTMLInputElement).value).toBe('');
 expect(fake.fetch.mock.calls.some(([url])=>url==='/api/auth/login')).toBe(false);expect(screen.getByRole('button',{name:'로그인',exact:true})).toBeTruthy();
});
it('잘못된 로그인은 안내하고 비밀번호를 지우며 자동 재전송하지 않는다',async()=>{
 fake.server.loginStatus=401;const user=userEvent.setup();render(<App/>);await screen.findByLabelText('아이디');
 await user.type(screen.getByLabelText('아이디'),'learner_a');await user.type(screen.getByLabelText('비밀번호'),PASSWORD);await user.click(screen.getByRole('button',{name:'로그인',exact:true}));
 await screen.findByText(/아이디와 비밀번호/);expect((screen.getByLabelText('비밀번호') as HTMLInputElement).value).toBe('');expect(fake.fetch.mock.calls.filter(([url])=>url==='/api/auth/login')).toHaveLength(1);
});
it('로그아웃 뒤 개인 상태를 지우고 익명 세션을 다시 준비한다',async()=>{
 const user=userEvent.setup();render(<App/>);await login(user);await user.click(screen.getByRole('button',{name:'로그아웃'}));await screen.findByRole('button',{name:'로그인',exact:true});await screen.findByText('방송 a');
 expect(screen.queryByText('learner_a')).toBeNull();expect(screen.getByRole('button',{name:'방송 a 즐겨찾기 추가'}).hasAttribute('disabled')).toBe(true);
 const request=fake.fetch.mock.calls.find(([url])=>url==='/api/auth/logout')!;expect(new Headers(request[1]?.headers).get('x-csrf-token')).toBe('test-csrf-a');
});
it('현재 사용자 경로로 저장하고 서버를 다시 읽은 상태를 표시한다',async()=>{
 const user=userEvent.setup();render(<App/>);await login(user);await user.click(screen.getByRole('button',{name:'방송 a 즐겨찾기 추가'}));await screen.findByRole('button',{name:'방송 a 즐겨찾기 해제'});
 expect(fake.fetch.mock.calls.some(([url])=>url==='/api/users/'+A.id+'/favorites/a')).toBe(true);
});
it('저장 결과를 못 받으면 기존 표시와 재조회 안내를 유지한다',async()=>{
 fake.server.onFavorite=async()=>{throw new Error('Connection lost');};const user=userEvent.setup();render(<App/>);await login(user);
 await user.click(screen.getByRole('button',{name:'방송 a 즐겨찾기 추가'}));await screen.findByText(/저장 결과/);expect(screen.getByRole('button',{name:'방송 a 즐겨찾기 추가'})).toBeTruthy();expect(screen.getByText('방송 a')).toBeTruthy();
});
it('자기 방에만 공지 저장을 표시하고 방을 바꾸면 권한을 다시 읽는다',async()=>{
 const user=userEvent.setup();render(<App/>);await login(user);await screen.findByRole('button',{name:'공지 저장'});await user.selectOptions(screen.getByLabelText('방 선택'),'r2');
 await screen.findByText('다른 방 공지');expect(screen.queryByRole('button',{name:'공지 저장'})).toBeNull();await screen.findByText(/관리자만/);
});
it('공지 문자열은 글자로 표시하고 HTML 요소를 만들지 않는다',async()=>{
 const user=userEvent.setup(),notice='<strong data-probe="notice">새 안내</strong>';const {container}=render(<App/>);await login(user);await screen.findByLabelText('공지 내용');
 await user.clear(screen.getByLabelText('공지 내용'));await user.type(screen.getByLabelText('공지 내용'),notice);await user.click(screen.getByRole('button',{name:'공지 저장'}));
 await screen.findByText(notice,{selector:'p'});expect(container.querySelector('strong[data-probe="notice"]')).toBeNull();
});
it('공지403은 초안을 보존하고 권한 변경을 다시 반영한다',async()=>{
 fake.server.onNotice=async()=>{fake.server.denyRoom=true;return json({},403);};const user=userEvent.setup();render(<App/>);await login(user);await screen.findByLabelText('공지 내용');
 await user.clear(screen.getByLabelText('공지 내용'));await user.type(screen.getByLabelText('공지 내용'),'보존할 초안');await user.click(screen.getByRole('button',{name:'공지 저장'}));
 await screen.findByText(/수정할 권한/);expect((screen.getByLabelText('공지 내용') as HTMLTextAreaElement).value).toBe('보존할 초안');
 await waitFor(()=>expect(screen.queryByRole('button',{name:'공지 저장'})).toBeNull());expect(fake.server.notices.r1).toBe('처음 공지');
});
it('401 뒤 같은 계정으로 다시 로그인해도 초안을 자동 재전송하지 않는다',async()=>{
 fake.server.onNotice=async()=>{fake.server.user=null;return json({},401);};const user=userEvent.setup();render(<App/>);await login(user);await screen.findByLabelText('공지 내용');
 await user.clear(screen.getByLabelText('공지 내용'));await user.type(screen.getByLabelText('공지 내용'),'만료 중 작성');await user.click(screen.getByRole('button',{name:'공지 저장'}));await screen.findByText(/다시 로그인/);
 await login(user);await screen.findByRole('button',{name:'공지 저장'});expect((screen.getByLabelText('공지 내용') as HTMLTextAreaElement).value).toBe('만료 중 작성');
 expect(fake.fetch.mock.calls.filter(([url,options])=>url==='/api/rooms/r1/notice'&&options?.method==='PUT')).toHaveLength(1);
});
it('다른 계정으로 로그인하면 이전 계정의 초안을 지운다',async()=>{
 const exposed:boolean[]=[];
 fake.server.onNotice=async()=>{fake.server.user=null;return json({},401);};const user=userEvent.setup();
 render(<Profiler id="account-switch" onRender={()=>{if(screen.queryByText('learner_b'))exposed.push(screen.queryByDisplayValue('이전 계정 초안')!==null);}}><App/></Profiler>);await login(user);await screen.findByLabelText('공지 내용');
 await user.clear(screen.getByLabelText('공지 내용'));await user.type(screen.getByLabelText('공지 내용'),'이전 계정 초안');await user.click(screen.getByRole('button',{name:'공지 저장'}));await screen.findByText(/다시 로그인/);
 await login(user,'learner_b');await screen.findByText('learner_b');expect(screen.queryByDisplayValue('이전 계정 초안')).toBeNull();expect(screen.queryByRole('button',{name:'공지 저장'})).toBeNull();expect(exposed.length).toBeGreaterThan(0);expect(exposed.every(value=>!value)).toBe(true);
});
it('늦은 이전 계정 저장이 새 계정의 진행 중 요청을 완료시키지 않는다',async()=>{
 let older!:(value:Response)=>void,newer!:(value:Response)=>void;fake.server.onFavorite=(url)=>new Promise(resolve=>{if(url.pathname.includes(A.id))older=resolve;else newer=resolve;});
 const user=userEvent.setup();render(<App/>);await login(user);await user.click(screen.getByRole('button',{name:'방송 a 즐겨찾기 추가'}));await user.click(screen.getByRole('button',{name:'로그아웃'}));await screen.findByRole('button',{name:'로그인',exact:true});
 await login(user,'learner_b');const button=screen.getByRole('button',{name:'방송 a 즐겨찾기 추가'});expect(button.hasAttribute('disabled')).toBe(false);await user.click(button);await waitFor(()=>expect(newer).toBeTypeOf('function'));
 await act(async()=>older(json({id:'a',favorite:true})));expect(screen.getByRole('button',{name:'방송 a 즐겨찾기 추가'}).hasAttribute('disabled')).toBe(true);
 fake.server.favorites.add(B.id+':a');await act(async()=>newer(json({id:'a',favorite:true})));await screen.findByRole('button',{name:'방송 a 즐겨찾기 해제'});
});
it('늦은 이전 방 조회가 선택한 방과 권한을 덮지 않는다',async()=>{
 let older!:(value:Response)=>void;fake.server.onRoom=id=>id==='r1'?new Promise(resolve=>{older=resolve;}):Promise.resolve(json(fake.room(id)));
 const user=userEvent.setup();render(<App/>);await screen.findByLabelText('방 선택');await user.selectOptions(screen.getByLabelText('방 선택'),'r2');await screen.findByText('다른 방 공지');
 await act(async()=>older(json({id:'r1',title:'첫 번째 방',notice:'늦은 공지',canEdit:true})));expect(screen.queryByText('늦은 공지')).toBeNull();expect(screen.queryByRole('button',{name:'공지 저장'})).toBeNull();
});
