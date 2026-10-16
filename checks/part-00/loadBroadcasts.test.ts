import { afterEach, expect, it, vi } from 'vitest';
import { loadBroadcasts } from '@submission/loadBroadcasts';
afterEach(() => vi.useRealTimers());
// Regressions caught: immediate load, shared mutable fixture, empty/error treated as success.
it('정상 데이터는 지연 후 서로 독립적인 객체로 반환한다', async () => {
  vi.useFakeTimers();
  let settled = false;
  const pending = loadBroadcasts('success').then(items => { settled = true; return items; });
  await Promise.resolve();
  expect(settled).toBe(false);
  await vi.runAllTimersAsync();
  const first = await pending;
  expect(first).toHaveLength(6);
  first[0].title = '변경';
  const again = loadBroadcasts('success');
  await vi.runAllTimersAsync();
  expect((await again)[0].title).toBe('새벽 React 작업실');
});
it('빈 데이터 모드는 빈 배열을 반환한다', async () => {
  vi.useFakeTimers();
  const pending = loadBroadcasts('empty');
  await vi.runAllTimersAsync();
  expect(await pending).toEqual([]);
});
it('오류 모드는 거절된 Promise를 반환한다', async () => {
  vi.useFakeTimers();
  const observed = loadBroadcasts('error').then(() => 'resolved', error => error.message);
  await vi.runAllTimersAsync();
  expect(await observed).toBe('모의 로딩 실패');
});
