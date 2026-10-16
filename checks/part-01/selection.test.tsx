import { expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@submission/App';
import { getSelectedBroadcast } from '@submission/domain';
import { broadcasts } from '@submission/fixtures';

// Regressions caught: duplicated selected objects, filter-driven deselection, lost focus/shared favorites.
async function ready() {
  render(<App />);
  await screen.findByRole('list', { name: '방송 목록' });
  return userEvent.setup();
}
const choose = () => screen.getByRole('button', { name: '새벽 React 작업실 상세 보기' });
it('선택 id가 없거나 존재하지 않으면 상세 데이터가 없다', () => {
  expect(getSelectedBroadcast(broadcasts, null)).toBeUndefined();
  expect(getSelectedBroadcast(broadcasts, 'missing')).toBeUndefined();
});
it('선택은 입력의 최신 객체에서 파생된다', () => {
  const latest = [{ ...broadcasts[0], title: '갱신한 제목' }];
  expect(getSelectedBroadcast(latest, 'a')).toBe(latest[0]);
  expect(latest[0].title).toBe('갱신한 제목');
});
it('초기에는 상세 선택 안내가 보인다', async () => {
  await ready();
  expect(screen.getByText('목록에서 방송을 선택하세요.')).toBeTruthy();
  expect(screen.queryByRole('button', { name: '상세 닫기' })).toBeNull();
});
it('목록에서 고르면 해당 방송 제목·설명과 제목 포커스가 표시된다', async () => {
  const user = await ready();
  await user.click(choose());
  const detail = screen.getByRole('region', { name: '방송 상세' });
  const title = within(detail).getByRole('heading', { level: 2, name: '새벽 React 작업실' });
  expect(within(detail).getByText(broadcasts[0].description)).toBeTruthy();
  expect(document.activeElement).toBe(title);
});
it('상세를 닫으면 원래 목록 버튼으로 포커스가 돌아간다', async () => {
  const user = await ready();
  const opener = choose();
  await user.click(opener);
  await user.click(screen.getByRole('button', { name: '상세 닫기' }));
  expect(document.activeElement).toBe(opener);
  expect(screen.getByText('목록에서 방송을 선택하세요.')).toBeTruthy();
});
it('필터로 선택 방송을 숨겨도 상세가 유지되고 닫으면 검색으로 돌아간다', async () => {
  const user = await ready();
  await user.click(choose());
  const input = screen.getByRole('searchbox', { name: '방송 검색' });
  await user.type(input, 'NodeLab');
  expect(screen.queryByRole('button', { name: '새벽 React 작업실 상세 보기' })).toBeNull();
  expect(screen.getByRole('heading', { level: 2, name: '새벽 React 작업실' })).toBeTruthy();
  await user.click(screen.getByRole('button', { name: '상세 닫기' }));
  expect(document.activeElement).toBe(input);
  expect((input as HTMLInputElement).value).toBe('NodeLab');
});
it('목록과 상세의 즐겨찾기가 공유되며 조건을 잃지 않는다', async () => {
  const user = await ready();
  const search = screen.getByRole('searchbox', { name: '방송 검색' });
  await user.type(search, 'React');
  await user.selectOptions(screen.getByRole('combobox', { name: '정렬' }), 'title-asc');
  await user.click(choose());
  const detailStar = screen.getByRole('button', { name: '상세 즐겨찾기' });
  const listStar = screen.getByRole('button', { name: '새벽 React 작업실 즐겨찾기' });
  await user.click(detailStar);
  expect(listStar.getAttribute('aria-pressed')).toBe('true');
  await user.click(listStar);
  expect(detailStar.getAttribute('aria-pressed')).toBe('false');
  expect((search as HTMLInputElement).value).toBe('React');
  expect((screen.getByRole('combobox', { name: '정렬' }) as HTMLSelectElement).value).toBe('title-asc');
});
it('다른 방송을 고르면 상세가 교체되고 새 제목으로 포커스된다', async () => {
  const user = await ready();
  await user.click(choose());
  await user.click(screen.getByRole('button', { name: 'React 상태 실험 상세 보기' }));
  const title = screen.getByRole('heading', { level: 2, name: 'React 상태 실험' });
  expect(document.activeElement).toBe(title);
  expect(screen.queryByRole('heading', { level: 2, name: '새벽 React 작업실' })).toBeNull();
});
it('데이터를 다시 불러오면 선택은 해제된다', async () => {
  const user = await ready();
  await user.click(choose());
  expect(screen.getByRole('region', { name: '방송 상세' })).toBeTruthy();
  await user.click(screen.getByRole('button', { name: '다시 불러오기' }));
  await screen.findByRole('list', { name: '방송 목록' });
  expect(screen.queryByRole('button', { name: '상세 닫기' })).toBeNull();
});
