import {act,fireEvent,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {expect,it,vi} from 'vitest';
import App from '@submission/App';
const row=(id:string,favorite=false)=>({id,title:'방송 '+id,hostName:'host',viewerCount:10,description:'text',favorite});
const page=(id='a',offset=0,favorite=false)=>({items:[row(id,favorite)],limit:2,offset,hasMore:offset===0});
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
it('다음·이전 페이지는 서버 조건을 바꾸고 결과를 표시한다',async()=>{
  const mock=vi.fn(async(input:string)=>{const offset=Number(new URL(input,'http://local').searchParams.get('offset'));return json(page(offset?'b':'a',offset));});vi.stubGlobal('fetch',mock);
  const user=userEvent.setup();render(<App/>);await screen.findByText('방송 a');await user.click(screen.getByRole('button',{name:'다음'}));await screen.findByText('방송 b');await user.click(screen.getByRole('button',{name:'이전'}));await screen.findByText('방송 a');expect(screen.getByRole('button',{name:'이전'}).hasAttribute('disabled')).toBe(true);
});
it.each(['search','sort','favorites'])('페이지2에서 %s 조건을 바꾸면 offset0으로 돌아간다',async kind=>{
  const mock=vi.fn(async(input:string)=>{const offset=Number(new URL(input,'http://local').searchParams.get('offset'));return json(page(offset?'b':'a',offset));});vi.stubGlobal('fetch',mock);
  const user=userEvent.setup();render(<App/>);await screen.findByText('방송 a');await user.click(screen.getByRole('button',{name:'다음'}));await screen.findByText('방송 b');
  if(kind==='search')fireEvent.change(screen.getByLabelText('방송 검색'),{target:{value:'React'}});
  if(kind==='sort')await user.selectOptions(screen.getByLabelText('정렬'),'title-asc');
  if(kind==='favorites')await user.click(screen.getByLabelText('즐겨찾기만'));
  await screen.findByText('방송 a');expect(new URL(mock.mock.calls.at(-1)![0],'http://local').searchParams.get('offset')).toBe('0');
});
it('저장 성공 뒤 다시 읽은 서버 즐겨찾기를 표시한다',async()=>{
  let favorite=false;vi.stubGlobal('fetch',vi.fn(async(_input:string,options?:RequestInit)=>{if(options?.method==='PUT'){favorite=true;return json({id:'a',favorite});}return json(page('a',0,favorite));}));
  const user=userEvent.setup();render(<App/>);await screen.findByText('방송 a');await user.click(screen.getByRole('button',{name:'방송 a 즐겨찾기 추가'}));await screen.findByRole('button',{name:'방송 a 즐겨찾기 해제'});
});
it('저장 실패는 현재 목록과 표시를 유지하고 결과 확인 안내를 준다',async()=>{
  vi.stubGlobal('fetch',vi.fn(async(_input:string,options?:RequestInit)=>options?.method==='PUT'?json({},503):json(page())));
  const user=userEvent.setup();render(<App/>);await screen.findByText('방송 a');await user.click(screen.getByRole('button',{name:'방송 a 즐겨찾기 추가'}));expect((await screen.findByRole('alert')).textContent).toContain('저장 결과');expect(screen.getByRole('button',{name:'방송 a 즐겨찾기 추가'})).toBeTruthy();expect(screen.getByText('방송 a')).toBeTruthy();
});
it('이전 요청의 늦은 성공은 최신 검색을 덮지 않는다',async()=>{
  let older!:(value:Response)=>void;let newer!:(value:Response)=>void;
  const mock=vi.fn().mockImplementationOnce(()=>new Promise(resolve=>{older=resolve;})).mockImplementationOnce(()=>new Promise(resolve=>{newer=resolve;}));vi.stubGlobal('fetch',mock);
  render(<App/>);await waitFor(()=>expect(mock).toHaveBeenCalledTimes(1));fireEvent.change(screen.getByLabelText('방송 검색'),{target:{value:'React'}});await waitFor(()=>expect(mock).toHaveBeenCalledTimes(2));
  await act(async()=>newer(json(page('newer'))));await screen.findByText('방송 newer');await act(async()=>older(json(page('older'))));expect(screen.queryByText('방송 older')).toBeNull();expect(mock.mock.calls[0][1].signal.aborted).toBe(true);
});
it('목록 오류에서 재시도할 수 있다',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce(json({},503)).mockResolvedValueOnce(json(page())));const user=userEvent.setup();render(<App/>);await screen.findByRole('alert');await user.click(screen.getByRole('button',{name:'목록 재시도'}));await screen.findByText('방송 a');
});
