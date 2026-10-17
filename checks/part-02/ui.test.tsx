import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import App from '@submission/App';
const rows = [
  { id: 'a', title: '새벽 React 작업실', hostName: '세모', viewerCount: 210, description: '가상 방송 설명' },
  { id: 'd', title: 'React 상태 실험', hostName: '리프', viewerCount: 450, description: '가상 방송 설명' },
  { id: 'e', title: '작은 서버 만들기', hostName: 'NodeLab', viewerCount: 130, description: '가상 방송 설명' },
];
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
async function fakeApi(input: string | URL | Request) {
  const url = new URL(String(input), 'http://course.test');
  if (url.searchParams.get('scenario') === 'error') return json({ message: 'failure' }, 503);
  if (url.pathname !== '/api/broadcasts') {
    const id = decodeURIComponent(url.pathname.split('/').at(-1)!);
    const row = rows.find(item => item.id === id);
    return row ? json(row) : json({ message: 'missing' }, 404);
  }
  const search = (url.searchParams.get('search') ?? '').trim().toLowerCase();
  return json({ items: rows.filter(item => item.title.toLowerCase().includes(search) || item.hostName.toLowerCase().includes(search)) });
}
beforeEach(() => vi.stubGlobal('fetch', vi.fn(fakeApi)));
afterEach(() => vi.unstubAllGlobals());
it('HTTP 목록에서 선택해 별도 상세 요청의 제목을 표시한다', async () => {
  render(<App />);
  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', { name: '새벽 React 작업실 상세 보기' }));
  const title = await screen.findByRole('heading', { level: 2, name: '새벽 React 작업실' });
  expect(document.activeElement).toBe(title);
  expect(vi.mocked(fetch).mock.calls.some(([url]) => new URL(String(url), 'http://course.test').pathname === '/api/broadcasts/a')).toBe(true);
});
it('검색이 목록에서 선택 항목을 숨겨도 상세를 유지하고 닫기는 검색으로 돌아간다', async () => {
  render(<App />);
  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', { name: '새벽 React 작업실 상세 보기' }));
  await screen.findByRole('heading', { level: 2, name: '새벽 React 작업실' });
  await user.type(screen.getByRole('searchbox'), 'NodeLab');
  await screen.findByRole('button', { name: '작은 서버 만들기 상세 보기' });
  expect(screen.queryByRole('button', { name: '새벽 React 작업실 상세 보기' })).toBeNull();
  expect(screen.getByRole('heading', { level: 2, name: '새벽 React 작업실' })).toBeTruthy();
  await user.click(screen.getByRole('button', { name: '상세 닫기' }));
  expect(document.activeElement).toBe(screen.getByRole('searchbox'));
});
it('존재하지 않는 상세는 404 안내를 표시하고 정상 목록을 지우지 않는다', async () => {
  render(<App />);
  await screen.findByRole('button', { name: '새벽 React 작업실 상세 보기' });
  await userEvent.setup().click(screen.getByRole('button', { name: '상세 직접 조회' }));
  const region = screen.getByRole('region', { name: '방송 상세' });
  await waitFor(() => expect(within(region).getByRole('alert').textContent).toContain('방송을 찾을 수 없습니다.'));
  expect(screen.getByRole('button', { name: '새벽 React 작업실 상세 보기' })).toBeTruthy();
});
it('목록 실패는 같은 조건으로 다시 시도해 복구한다', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json({ message: 'failure' }, 503)).mockImplementation(fakeApi));
  render(<App />);
  const region = screen.getByRole('region', { name: '방송 목록' });
  await waitFor(() => expect(within(region).getByRole('alert').textContent).toContain('서버가 일시적으로 응답하지 않습니다.'));
  await userEvent.setup().click(screen.getByRole('button', { name: '목록 다시 시도' }));
  expect(await screen.findByRole('button', { name: '새벽 React 작업실 상세 보기' })).toBeTruthy();
});
it('상세 즐겨찾기를 바꾸면 목록의 같은 id에 즉시 반영한다', async () => {
  render(<App />);
  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', { name: '새벽 React 작업실 상세 보기' }));
  await screen.findByRole('heading', { level: 2, name: '새벽 React 작업실' });
  await user.click(screen.getByRole('button', { name: '상세 즐겨찾기' }));
  expect(screen.getByRole('button', { name: '새벽 React 작업실 즐겨찾기' }).getAttribute('aria-pressed')).toBe('true');
});
it('빠른 검색의 오래된 HTTP 응답이 최신 목록을 덮지 않는다', async () => {
  let oldResolve!: (response: Response) => void, newResolve!: (response: Response) => void;
  const older = new Promise<Response>(resolve => { oldResolve = resolve; });
  const newer = new Promise<Response>(resolve => { newResolve = resolve; });
  const fetcher = vi.fn((input: string | URL | Request, _options?: RequestInit) => {
    const query = new URL(String(input), 'http://course.test').searchParams.get('search');
    if (query === 'r') return older;
    if (query === 're') return newer;
    return fakeApi(input);
  });
  vi.stubGlobal('fetch', fetcher);
  render(<App />);
  await screen.findByRole('button', { name: '새벽 React 작업실 상세 보기' });
  await userEvent.setup().type(screen.getByRole('searchbox'), 're');
  await act(async () => { newResolve(json({ items: [rows[1]] })); });
  await screen.findByRole('button', { name: 'React 상태 실험 상세 보기' });
  await act(async () => { oldResolve(json({ items: [rows[0]] })); });
  expect(screen.queryByRole('button', { name: '새벽 React 작업실 상세 보기' })).toBeNull();
  const oldCall = fetcher.mock.calls.find(([url]) => new URL(String(url), 'http://course.test').searchParams.get('search') === 'r');
  expect(oldCall?.[1]?.signal?.aborted).toBe(true);
});
