import { StrictMode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useLatestRequest } from '@submission/useLatestRequest';
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
it('요청이 없으면 idle이다', () => {
  const view = renderHook(() => useLatestRequest<string>(null));
  expect(view.result.current).toEqual({ status: 'idle' });
});
it('로딩에서 현재 요청 성공으로 전환한다', async () => {
  const pending = deferred<string>();
  const request = vi.fn((_signal: AbortSignal) => pending.promise);
  const view = renderHook(() => useLatestRequest(request));
  expect(view.result.current.status).toBe('loading');
  expect(request).toHaveBeenCalledOnce(); expect(request.mock.calls[0][0].aborted).toBe(false);
  await act(async () => { pending.resolve('current'); });
  expect(view.result.current).toEqual({ status: 'success', data: 'current' });
});
it('abort를 무시하고 늦게 성공한 이전 요청이 최신 성공을 덮지 않는다', async () => {
  const older = deferred<string>(), newer = deferred<string>();
  const first = vi.fn((_signal: AbortSignal) => older.promise), second = vi.fn((_signal: AbortSignal) => newer.promise);
  const view = renderHook(({ request }) => useLatestRequest(request), { initialProps: { request: first } });
  expect(first).toHaveBeenCalledOnce();
  view.rerender({ request: second });
  expect(second).toHaveBeenCalledOnce();
  expect(first.mock.calls[0][0].aborted).toBe(true);
  await act(async () => { newer.resolve('latest'); });
  await act(async () => { older.resolve('stale'); });
  expect(view.result.current).toEqual({ status: 'success', data: 'latest' });
});
it('abort를 무시하고 늦게 실패한 이전 요청도 최신 성공을 덮지 않는다', async () => {
  const older = deferred<string>(), newer = deferred<string>();
  const first = (_signal: AbortSignal) => older.promise, second = (_signal: AbortSignal) => newer.promise;
  const view = renderHook(({ request }) => useLatestRequest(request), { initialProps: { request: first } });
  expect(view.result.current.status).toBe('loading');
  view.rerender({ request: second });
  await act(async () => { newer.resolve('latest'); });
  await act(async () => { older.reject(new Error('old failure')); });
  expect(view.result.current).toEqual({ status: 'success', data: 'latest' });
});
it('최신 요청이 실패하면 이전 성공으로 되돌아가지 않는다', async () => {
  const older = deferred<string>(), newer = deferred<string>();
  const view = renderHook(({ request }) => useLatestRequest(request), { initialProps: { request: (_signal: AbortSignal) => older.promise } });
  expect(view.result.current.status).toBe('loading');
  view.rerender({ request: (_signal: AbortSignal) => newer.promise });
  const failure = new Error('current failure');
  await act(async () => { newer.reject(failure); });
  await act(async () => { older.resolve('stale'); });
  expect(view.result.current).toEqual({ status: 'error', error: failure });
});
it('닫기(null)는 abort하고 늦은 성공을 무시하며 idle로 돌아간다', async () => {
  const pending = deferred<string>();
  const request = vi.fn((_signal: AbortSignal) => pending.promise);
  const view = renderHook(({ load }: { load: typeof request | null }) => useLatestRequest(load), { initialProps: { load: request as typeof request | null } });
  expect(request).toHaveBeenCalledOnce();
  view.rerender({ load: null });
  expect(request.mock.calls[0][0].aborted).toBe(true);
  await act(async () => { pending.resolve('late'); });
  expect(view.result.current).toEqual({ status: 'idle' });
});
it('언마운트는 활성 요청을 abort한다', async () => {
  const pending = deferred<string>();
  const request = vi.fn((_signal: AbortSignal) => pending.promise);
  const view = renderHook(() => useLatestRequest(request));
  expect(request).toHaveBeenCalledOnce();
  view.unmount(); expect(request.mock.calls[0][0].aborted).toBe(true);
  await act(async () => { pending.resolve('late'); });
});
it('refreshKey를 바꾸면 같은 조건의 실패를 재시도한다', async () => {
  const failure = new Error('offline');
  const request = vi.fn((_signal: AbortSignal) => Promise.resolve('recovered')).mockRejectedValueOnce(failure);
  const view = renderHook(({ key }) => useLatestRequest(request, key), { initialProps: { key: 0 } });
  await waitFor(() => expect(view.result.current).toEqual({ status: 'error', error: failure }));
  view.rerender({ key: 1 });
  await waitFor(() => expect(view.result.current).toEqual({ status: 'success', data: 'recovered' }));
  expect(request).toHaveBeenCalledTimes(2);
});
it('동기적으로 throw한 loader도 오류 상태로 처리한다', async () => {
  const failure = new Error('sync failure');
  const request = (_signal: AbortSignal): Promise<string> => { throw failure; };
  const view = renderHook(() => useLatestRequest(request));
  await waitFor(() => expect(view.result.current).toEqual({ status: 'error', error: failure }));
});
it('StrictMode 정리 이후 활성 요청을 중복으로 남기지 않는다', async () => {
  const signals: AbortSignal[] = [];
  const request = (signal: AbortSignal) => { signals.push(signal); return Promise.resolve('ready'); };
  const view = renderHook(() => useLatestRequest(request), { wrapper: StrictMode });
  await waitFor(() => expect(view.result.current).toEqual({ status: 'success', data: 'ready' }));
  expect(signals.filter(signal => !signal.aborted)).toHaveLength(1);
  view.unmount(); expect(signals.every(signal => signal.aborted)).toBe(true);
});
