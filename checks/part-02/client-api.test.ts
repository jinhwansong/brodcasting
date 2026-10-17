import { afterEach, expect, it, vi } from 'vitest';
import { ApiError, fetchBroadcast, fetchBroadcasts } from '@submission/api';
const row = { id: 'a', title: '방송', hostName: '진행자', viewerCount: 12, description: '설명' };
const query = { search: ' React & 서버 ', sort: 'title-asc' as const, scenario: 'slow' as const };
const signal = () => new AbortController().signal;
afterEach(() => vi.unstubAllGlobals());
it('목록 query를 인코딩하고 signal·no-store를 fetch에 전달한다', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [row] })));
  vi.stubGlobal('fetch', fetcher);
  const abortSignal = signal();
  expect(await fetchBroadcasts(query, abortSignal)).toEqual([row]);
  const url = new URL(String(fetcher.mock.calls[0][0]), 'http://course.test');
  expect(url.pathname).toBe('/api/broadcasts'); expect(url.searchParams.get('search')).toBe(query.search);
  expect(url.searchParams.get('sort')).toBe('title-asc'); expect(url.searchParams.get('scenario')).toBe('slow');
  expect(fetcher.mock.calls[0][1]).toMatchObject({ signal: abortSignal, cache: 'no-store' });
});
it('상세 id를 단일 경로 세그먼트로 인코딩한다', async () => {
  const unusual = { ...row, id: 'bad/id' };
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(unusual)));
  vi.stubGlobal('fetch', fetcher);
  expect(await fetchBroadcast('bad/id', 'normal', signal())).toEqual(unusual);
  const url = new URL(String(fetcher.mock.calls[0][0]), 'http://course.test');
  expect(url.pathname).toBe('/api/broadcasts/bad%2Fid'); expect(url.searchParams.get('scenario')).toBe('normal');
});
it.each([404, 503])('실패 HTTP %s를 성공 데이터로 취급하지 않는다', async status => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'failure' }), { status })));
  await expect(fetchBroadcast('a', 'normal', signal())).rejects.toMatchObject({ name: 'ApiError', status });
});
it('잘못된 JSON 응답을 명시적인 형식 오류로 처리한다', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not json')));
  await expect(fetchBroadcasts(query, signal())).rejects.toMatchObject({ name: 'ApiError', status: 200 });
});
it.each([{ items: null }, { items: [row, { ...row, viewerCount: -1 }] }, { items: [{ ...row, description: null }] }])('잘못된 목록 응답 shape를 거부한다: %j', async body => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body))));
  await expect(fetchBroadcasts(query, signal())).rejects.toBeInstanceOf(ApiError);
});
it('요청 id와 다른 상세 응답을 거부한다', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...row, id: 'b' }))));
  await expect(fetchBroadcast('a', 'normal', signal())).rejects.toBeInstanceOf(ApiError);
});
it('네트워크 거부는 HTTP 성공으로 감추지 않는다', async () => {
  const offline = new TypeError('offline');
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(offline));
  await expect(fetchBroadcasts(query, signal())).rejects.toBe(offline);
});
