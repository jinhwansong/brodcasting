import { StrictMode } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useElapsedSeconds } from '@submission/useElapsedSeconds';
beforeEach(() => vi.useFakeTimers());
afterEach(() => { cleanup(); vi.useRealTimers(); });
it('선택이 없으면 0이며 interval이 없다', () => {
  const view = renderHook(() => useElapsedSeconds(null));
  expect(view.result.current).toBe(0);
  expect(vi.getTimerCount()).toBe(0);
});
it('선택한 상세 화면의 체류 시간을 초 단위로 센다', () => {
  const view = renderHook(() => useElapsedSeconds('a'));
  act(() => vi.advanceTimersByTime(3000));
  expect(view.result.current).toBe(3);
});
it('방송 전환 시 초기화하고 이전 interval을 정리한다', () => {
  const view = renderHook(({ id }) => useElapsedSeconds(id), { initialProps: { id: 'a' } });
  act(() => vi.advanceTimersByTime(3000));
  expect(view.result.current).toBe(3);
  view.rerender({ id: 'b' });
  expect(view.result.current).toBe(0);
  act(() => vi.advanceTimersByTime(1000));
  expect(view.result.current).toBe(1);
  expect(vi.getTimerCount()).toBe(1);
});
it('선택 해제 시 0으로 돌아가고 interval이 없다', () => {
  const view = renderHook(({ id }: { id: string | null }) => useElapsedSeconds(id), { initialProps: { id: 'a' as string | null } });
  act(() => vi.advanceTimersByTime(2000));
  expect(view.result.current).toBe(2);
  view.rerender({ id: null });
  expect(view.result.current).toBe(0);
  expect(vi.getTimerCount()).toBe(0);
});
it('StrictMode에서도 중복 증가하지 않고 언마운트 후 interval이 없다', () => {
  const view = renderHook(() => useElapsedSeconds('a'), { wrapper: StrictMode });
  act(() => vi.advanceTimersByTime(1000));
  expect(view.result.current).toBe(1);
  expect(vi.getTimerCount()).toBe(1);
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});
