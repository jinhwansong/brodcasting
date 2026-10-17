import { afterAll, beforeAll, expect, it } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../../', import.meta.url));
const target = process.env.LAB_TARGET === 'reference' ? 'reference-solutions/part-02' : 'labs/part-02';
let app: { listen: (port: number, host: string) => Promise<void>; getUrl: () => Promise<string>; close: () => Promise<void> };
let base: string;
beforeAll(async () => {
  const { createApp } = await import(/* @vite-ignore */ pathToFileURL(path.join(root, target, 'server/dist/create-app.js')).href);
  app = await createApp();
  await app.listen(0, '127.0.0.1');
  base = await app.getUrl();
});
afterAll(async () => { await app?.close(); });
const get = (suffix: string) => fetch(base + '/api/' + suffix);
const preview = (body: unknown) => fetch(base + '/api/search-preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
it('목록은 실제 HTTP로 6개와 안정적인 시청자 정렬을 반환한다', async () => {
  const res = await get('broadcasts');
  expect(res.status).toBe(200);
  expect((await res.json()).items.map((row: { id: string }) => row.id)).toEqual(['d', 'a', 'e', 'b', 'c', 'f']);
});
it('공백·대소문자를 처리한 제목 또는 진행자 검색을 제공한다', async () => {
  const res = await get('broadcasts?search=' + encodeURIComponent(' rEaCt '));
  expect((await res.json()).items.map((row: { id: string }) => row.id)).toEqual(['d', 'a']);
  expect((await (await get('broadcasts?search=NodeLab')).json()).items.map((row: { id: string }) => row.id)).toEqual(['e']);
});
it('제목 정렬은 시청자 정렬과 다르며 원본을 잃지 않는다', async () => {
  const title = (await (await get('broadcasts?sort=title-asc')).json()).items;
  expect(title).toHaveLength(6);
  expect(title.map((row: { id: string }) => row.id)).not.toEqual(['d', 'a', 'e', 'b', 'c', 'f']);
  for (let i = 1; i < title.length; i++) expect(new Intl.Collator('ko-KR').compare(title[i - 1].title, title[i].title)).toBeLessThanOrEqual(0);
  expect((await (await get('broadcasts')).json()).items.map((row: { id: string }) => row.id)).toEqual(['d', 'a', 'e', 'b', 'c', 'f']);
});
it('없는 검색 결과는 200과 빈 배열이다', async () => {
  const res = await get('broadcasts?search=not-found-anywhere');
  expect(res.status).toBe(200); expect(await res.json()).toEqual({ items: [] });
});
it('상세는 원본의 현재 방송과 설명을 반환한다', async () => {
  const res = await get('broadcasts/a');
  expect(res.status).toBe(200);
  expect(await res.json()).toMatchObject({ id: 'a', title: '새벽 React 작업실', hostName: '세모', viewerCount: 210, description: expect.any(String) });
});
it('형식은 맞지만 없는 id는 404다', async () => { expect((await get('broadcasts/missing')).status).toBe(404); });
it('허용하지 않은 id 형식은 400이다', async () => { expect((await get('broadcasts/' + encodeURIComponent('bad id'))).status).toBe(400); });
it.each(['a'.repeat(33), 'bad\n'])('id의 길이·개행 경계를 거부한다: %j', async id => { expect((await get('broadcasts/' + encodeURIComponent(id))).status).toBe(400); });
it.each([
  ['알 수 없는 query', 'broadcasts?admin=true'],
  ['잘못된 sort', 'broadcasts?sort=popular'],
  ['잘못된 scenario', 'broadcasts?scenario=forever'],
  ['중복 query 배열', 'broadcasts?search=a&search=b'],
  ['80자 초과 검색어', 'broadcasts?search=' + 'a'.repeat(81)],
  ['상세의 미정의 query', 'broadcasts/a?search=React'],
])('%s를 서버에서 400으로 거부한다', async (_name, route) => { expect((await get(route)).status).toBe(400); });
it('JSON 검색 실험도 같은 규칙으로 200을 반환한다', async () => {
  const res = await preview({ search: 'React', sort: 'viewers-desc' });
  expect(res.status).toBe(200); expect((await res.json()).items.map((row: { id: string }) => row.id)).toEqual(['d', 'a']);
});
it.each([['숫자', { search: 12 }], ['null', { search: null }], ['배열', { search: ['React'] }], ['객체', { search: { value: 'React' } }], ['미정의 필드', { search: 'React', role: 'admin' }]])('타입 선언만으로 막을 수 없는 JSON %s를 400으로 거부한다', async (_name, body) => { expect((await preview(body)).status).toBe(400); });
it.each([{ scenario: null }, { sort: ['title-asc'] }])('선택적 열거 필드도 null·배열을 허용하지 않는다: %j', async body => { expect((await preview(body)).status).toBe(400); });
const unknownKeys = ['constructor', 'toString', 'prototype', 'hasOwnProperty', '__proto__'];
it.each(unknownKeys)('DTO 변환 전에 JSON의 미정의 own key %s를 400으로 거부한다', async key => {
  // 객체 리터럴의 __proto__ 문법 대신 실제 JSON own property를 보냅니다.
  expect((await preview(Object.fromEntries([[key, 'extra']]))).status).toBe(400);
});
it.each(unknownKeys.flatMap(key => ['broadcasts', 'broadcasts/a'].map(route => [route, key] as const)))('DTO 변환 전에 %s query의 미정의 key %s를 400으로 거부한다', async (route, key) => {
  expect((await get(route + '?' + new URLSearchParams([[key, 'extra']]))).status).toBe(400);
});
it('잘못된 JSON을 거부한 뒤에도 서버는 정상 응답한다', async () => {
  const res = await fetch(base + '/api/search-preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{broken' });
  expect(res.status).toBe(400); expect((await get('broadcasts')).status).toBe(200);
});
it('파싱 계층에서 8kb 초과 JSON을 413으로 제한한다', async () => {
  expect((await preview({ search: 'a'.repeat(9000) })).status).toBe(413);
  expect((await get('broadcasts')).status).toBe(200);
});
it('로컬 실패 시나리오는 503이며 캐시 저장을 허용하지 않는다', async () => {
  const res = await get('broadcasts?scenario=error');
  expect(res.status).toBe(503); expect(res.headers.get('cache-control')).toBe('no-store');
});
it('목록과 상세의 정상 응답도 no-store다', async () => {
  expect((await get('broadcasts')).headers.get('cache-control')).toBe('no-store');
  const detail = await get('broadcasts/a'); expect(detail.status).toBe(200); expect(detail.headers.get('cache-control')).toBe('no-store');
});
it('짧은 검색의 이전 응답이 긴 검색의 최신 응답보다 늦게 도착하는 실험이 가능하다', async () => {
  const order: string[] = [];
  const older = get('broadcasts?search=r&scenario=slow').then(async res => { expect(res.status).toBe(200); await res.json(); order.push('older'); });
  const newer = get('broadcasts?search=re&scenario=slow').then(async res => { expect(res.status).toBe(200); await res.json(); order.push('newer'); });
  await Promise.all([older, newer]); expect(order).toEqual(['newer', 'older']);
});
