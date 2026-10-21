import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,test,vi} from 'vitest';
import App from '@submission/App';
afterEach(()=>{cleanup();vi.useRealTimers();});
test('500건/초를 5초 재생해도 DOM 14개·보관 1000개 이하이고 입력을 유지한다',()=>{
 vi.useFakeTimers();const {container}=render(<App/>);fireEvent.change(screen.getByLabelText('초당 메시지'),{target:{value:'500'}});fireEvent.click(screen.getByText('재생 시작'));
 for(let i=0;i<50;i++)act(()=>{vi.advanceTimersByTime(100);});
 expect(container.querySelectorAll('[data-message]').length).toBeLessThanOrEqual(14);expect(screen.getByTestId('retained').textContent).toBe('1000');
 fireEvent.change(screen.getByLabelText('입력 반응 연습'),{target:{value:'글을 읽는 중'}});act(()=>{vi.advanceTimersByTime(200);});expect((screen.getByLabelText('입력 반응 연습') as HTMLInputElement).value).toBe('글을 읽는 중');
});
test('위쪽을 읽을 때 새 글 표시가 생기고 최신 이동은 사용자 선택으로 한다',()=>{
 vi.useFakeTimers();render(<App/>);fireEvent.click(screen.getByText('재생 시작'));for(let i=0;i<30;i++)act(()=>{vi.advanceTimersByTime(100);});
 const list=screen.getByLabelText('채팅 읽기');fireEvent.scroll(list,{target:{scrollTop:0}});act(()=>{vi.advanceTimersByTime(300);});expect(screen.getByRole('button',{name:/새 메시지 .*개 보기/})).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:/새 메시지 .*개 보기/}));expect(screen.queryByRole('button',{name:/새 메시지 .*개 보기/})).toBeNull();
});
test('방 전환과 화면 종료 뒤 생성 타이머가 남지 않는다',()=>{
 vi.useFakeTimers();const page=render(<App/>);fireEvent.click(screen.getByText('재생 시작'));act(()=>{vi.advanceTimersByTime(400);});fireEvent.change(screen.getByLabelText('연습 방'),{target:{value:'r2'}});expect(screen.getByTestId('retained').textContent).toBe('0');expect(vi.getTimerCount()).toBe(0);page.unmount();expect(vi.getTimerCount()).toBe(0);
});
test('60초가 지나면 자동으로 멈추고 다시 시작할 수 있다',()=>{vi.useFakeTimers();render(<App/>);fireEvent.click(screen.getByText('재생 시작'));act(()=>{vi.advanceTimersByTime(60000);});expect(screen.getByText('재생 시작')).toBeTruthy();expect(vi.getTimerCount()).toBe(0);});
