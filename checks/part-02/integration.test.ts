import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { fetchBroadcast, fetchBroadcasts } from '@submission/api';
const root = fileURLToPath(new URL('../../', import.meta.url));
const target = process.env.LAB_TARGET === 'reference' ? 'reference-solutions/part-02' : 'labs/part-02';
const nativeFetch = globalThis.fetch;
type App = { listen: (port: number, host: string) => Promise<void>; getUrl: () => Promise<string>; close: () => Promise<void> };
let createApp: () => Promise<App>, app: App, base: string;
beforeAll(async () => {
  ({ createApp } = await import(/* @vite-ignore */ pathToFileURL(path.join(root, target, 'server/dist/create-app.js')).href));
  app = await createApp(); await app.listen(0, '127.0.0.1'); base = await app.getUrl();
});
afterAll(async () => { await app?.close(); });
beforeEach(() => vi.stubGlobal('fetch', (input: string | URL | Request, init?: RequestInit) => nativeFetch(new URL(String(input), base), init)));
afterEach(() => vi.unstubAllGlobals());
it('클라이언트 loader가 실제 Nest API의 목록과 상세를 읽는다', async () => {
  const signal = new AbortController().signal;
  const list = await fetchBroadcasts({ search: 'React', sort: 'viewers-desc', scenario: 'normal' }, signal);
  expect(list.map(row => row.id)).toEqual(['d', 'a']);
  expect(await fetchBroadcast('a', 'normal', signal)).toMatchObject({ id: 'a', title: '새벽 React 작업실' });
});
it('실제 서버의 404와 503을 클라이언트 오류로 전달한다', async () => {
  const signal = new AbortController().signal;
  await expect(fetchBroadcast('missing', 'normal', signal)).rejects.toMatchObject({ status: 404 });
  await expect(fetchBroadcasts({ search: '', sort: 'viewers-desc', scenario: 'error' }, signal)).rejects.toMatchObject({ status: 503 });
});
it('서버가 중단되면 HTTP 상태가 있는 성공 응답으로 꾸미지 않는다', async () => {
  const stopped = await createApp();
  await stopped.listen(0, '127.0.0.1'); const endpoint = await stopped.getUrl(); await stopped.close();
  vi.stubGlobal('fetch', (input: string | URL | Request, init?: RequestInit) => nativeFetch(new URL(String(input), endpoint), init));
  await expect(fetchBroadcasts({ search: '', sort: 'viewers-desc', scenario: 'normal' }, new AbortController().signal)).rejects.toMatchObject({ name: 'TypeError' });
});
