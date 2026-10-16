import { expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@submission/App';

// Regressions caught: disconnected controls, status collapse, retry leaving error mode.
async function ready() {
  render(<App />);
  return screen.findByRole('list', { name: '방송 목록' });
}
const titles = () => within(screen.getByRole('list', { name: '방송 목록' }))
  .getAllByRole('heading', { level: 3 }).map(node => node.textContent);

it('초기 로딩 후 방송 6개를 표시한다', async () => {
  render(<App />);
  expect(screen.getByRole('status').textContent).toContain('불러오는 중');
  const list = await screen.findByRole('list', { name: '방송 목록' });
  expect(within(list).getAllByRole('listitem')).toHaveLength(6);
});
it('검색과 정렬을 함께 적용한다', async () => {
  await ready();
  const user = userEvent.setup();
  await user.type(screen.getByRole('searchbox', { name: '방송 검색' }), ' rEaCt ');
  expect(titles()).toEqual(['React 상태 실험', '새벽 React 작업실']);
  await user.selectOptions(screen.getByRole('combobox', { name: '정렬' }), 'title-asc');
  expect(titles()).toEqual(['새벽 React 작업실', 'React 상태 실험']);
});
it('즐겨찾기만 보기와 해제가 실제 목록에 반영된다', async () => {
  await ready();
  const user = userEvent.setup();
  const name = '새벽 React 작업실 즐겨찾기';
  await user.click(screen.getByRole('button', { name }));
  expect(screen.getByRole('button', { name }).getAttribute('aria-pressed')).toBe('true');
  await user.click(screen.getByRole('checkbox', { name: '즐겨찾기만' }));
  expect(titles()).toEqual(['새벽 React 작업실']);
  await user.click(screen.getByRole('button', { name }));
  expect(screen.getByText('검색 조건에 맞는 방송이 없습니다.')).toBeTruthy();
});
it('일치하지 않는 검색은 결과 없음 상태다', async () => {
  await ready();
  await userEvent.setup().type(screen.getByRole('searchbox', { name: '방송 검색' }), '없는방송');
  expect(screen.getByText('검색 조건에 맞는 방송이 없습니다.')).toBeTruthy();
});
it('실제 빈 데이터는 검색 결과 없음과 구별된다', async () => {
  await ready();
  const user = userEvent.setup();
  await user.selectOptions(screen.getByRole('combobox', { name: '실험 데이터' }), 'empty');
  await user.click(screen.getByRole('button', { name: '다시 불러오기' }));
  expect(await screen.findByText('등록된 방송이 없습니다.')).toBeTruthy();
  expect(screen.queryByText('검색 조건에 맞는 방송이 없습니다.')).toBeNull();
});
it('오류를 보여주고 다시 시도하면 정상 데이터로 복구한다', async () => {
  await ready();
  const user = userEvent.setup();
  await user.selectOptions(screen.getByRole('combobox', { name: '실험 데이터' }), 'error');
  await user.click(screen.getByRole('button', { name: '다시 불러오기' }));
  expect((await screen.findByRole('alert')).textContent).toContain('방송을 불러오지 못했습니다.');
  await user.click(screen.getByRole('button', { name: '다시 시도' }));
  expect(await screen.findByRole('list', { name: '방송 목록' })).toBeTruthy();
  expect(titles()).toHaveLength(6);
  expect(screen.queryByRole('alert')).toBeNull();
});
it('조건 초기화는 전체 방송으로 돌아간다', async () => {
  await ready();
  const user = userEvent.setup();
  await user.type(screen.getByRole('searchbox', { name: '방송 검색' }), 'React');
  await user.click(screen.getByRole('checkbox', { name: '즐겨찾기만' }));
  await user.click(screen.getByRole('button', { name: '조건 초기화' }));
  expect(titles()).toHaveLength(6);
});
