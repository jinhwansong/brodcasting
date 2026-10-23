import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import {cleanup,render,screen,waitFor,fireEvent} from '@testing-library/react';
import {Inbox} from '../../reference-solutions/runtime-05/client/src/Inbox';
import {ApiError,createNotification,listNotifications,readNotification} from '../../reference-solutions/runtime-05/client/src/api';
import type {SessionHandle} from '../../reference-solutions/runtime-05/client/src/useSession';
vi.mock('../../reference-solutions/runtime-05/client/src/api',()=>({ApiError:class extends Error{constructor(readonly status:number){super('HTTP '+status);}},createNotification:vi.fn(),listNotifications:vi.fn(),readNotification:vi.fn(),replayNotifications:vi.fn()}));
const id='12345678-1234-4123-8123-123456789abc',row=(seq='5',body='내 알림')=>({id,seq,body,createdAt:'2026-10-21T00:00:00.000Z',readAt:null});
const page=(items=[row()])=>({items,hasMore:false,nextCursor:null});let epochNow=1;
function auth(epoch=1,userId='alice'):SessionHandle{return{view:{user:{id:userId,username:userId},csrfToken:'local-csrf'},status:'ready',busy:false,error:null,info:null,epoch,reason:'initial',isCurrent:value=>value===epochNow,expire:vi.fn(async()=>{}),signIn:vi.fn(),signUp:vi.fn(),signOut:vi.fn(),refresh:vi.fn()};}
beforeEach(()=>{epochNow=1;vi.mocked(listNotifications).mockReset().mockResolvedValue(page());vi.mocked(createNotification).mockReset();vi.mocked(readNotification).mockReset();});afterEach(cleanup);
it('renders notification markup as plain text',async()=>{vi.mocked(listNotifications).mockResolvedValue(page([row('5','<strong>그대로 보이기</strong>')]));const view=render(<Inbox auth={auth()}/>);await screen.findByText('<strong>그대로 보이기</strong>');expect(view.container.querySelector('strong')).toBeNull();});
it('retries an uncertain submission with exactly the original key and body',async()=>{
 vi.mocked(createNotification).mockRejectedValueOnce(new TypeError('network')).mockResolvedValueOnce({id,duplicate:true,queued:true});render(<Inbox auth={auth()}/>);await screen.findByText('내 알림');fireEvent.change(screen.getByLabelText('실습 알림 내용'),{target:{value:'한 번만 접수'}});fireEvent.click(screen.getByRole('button',{name:'실습 알림 접수'}));await screen.findByRole('alert');fireEvent.click(screen.getByRole('button',{name:'같은 접수 다시 확인'}));await waitFor(()=>expect(createNotification).toHaveBeenCalledTimes(2));const calls=vi.mocked(createNotification).mock.calls;expect(calls[1]).toEqual(calls[0]);expect(Object.keys(calls[0][0]).sort()).toEqual(['body','clientKey']);
});
it('clears the previous account draft as well as its inbox',async()=>{
 const view=render(<Inbox auth={auth()}/>);await screen.findByText('내 알림');fireEvent.change(screen.getByLabelText('실습 알림 내용'),{target:{value:'이전 계정만 볼 초안'}});epochNow=2;vi.mocked(listNotifications).mockResolvedValue(page([]));view.rerender(<Inbox auth={auth(2,'bob')}/>);await screen.findByText('해당하는 알림이 없어요.');expect((screen.getByLabelText('실습 알림 내용') as HTMLTextAreaElement).value).not.toBe('이전 계정만 볼 초안');expect(screen.queryByText('내 알림')).toBeNull();
});
it('discards an old account response that arrives after switching',async()=>{
 let resolve!:(value:ReturnType<typeof page>)=>void;vi.mocked(listNotifications).mockImplementationOnce(()=>new Promise(done=>resolve=done)).mockResolvedValue(page([]));const view=render(<Inbox auth={auth()}/>);epochNow=2;view.rerender(<Inbox auth={auth(2,'bob')}/>);await screen.findByText('해당하는 알림이 없어요.');resolve(page([row('5','이전 계정 늦은 응답')]));await Promise.resolve();expect(screen.queryByText('이전 계정 늦은 응답')).toBeNull();
});
it('uses the last seen sequence for ascending recovery and advances it',async()=>{
 render(<Inbox auth={auth()}/>);await screen.findByText('내 알림');vi.mocked(listNotifications).mockResolvedValue(page([row('6','새 알림6')]));fireEvent.click(screen.getByRole('button',{name:'새 알림 복구'}));await screen.findByText('새 알림6');expect(vi.mocked(listNotifications).mock.calls.at(-1)![0]).toEqual({after:'5'});vi.mocked(listNotifications).mockResolvedValue(page([]));fireEvent.click(screen.getByRole('button',{name:'새 알림 복구'}));await screen.findByText('해당하는 알림이 없어요.');expect(vi.mocked(listNotifications).mock.calls.at(-1)![0]).toEqual({after:'6'});
});
it('allows correcting a request that the server definitely rejected',async()=>{
 vi.mocked(createNotification).mockRejectedValueOnce(new ApiError(400,'bad input'));render(<Inbox auth={auth()}/>);await screen.findByText('내 알림');fireEvent.click(screen.getByRole('button',{name:'실습 알림 접수'}));await screen.findByRole('alert');expect((screen.getByLabelText('실습 알림 내용') as HTMLTextAreaElement).disabled).toBe(false);
});
it('expires the session on a read request returning 401',async()=>{const session=auth();vi.mocked(readNotification).mockRejectedValue(new ApiError(401,'expired'));render(<Inbox auth={session}/>);await screen.findByText('내 알림');fireEvent.click(screen.getByRole('button',{name:'읽음으로 표시'}));await waitFor(()=>expect(session.expire).toHaveBeenCalledOnce());});
