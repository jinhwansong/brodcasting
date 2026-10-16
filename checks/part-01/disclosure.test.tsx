import { StrictMode, useState } from 'react';
import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterDisclosure from '@submission/FilterDisclosure';
import type { Query } from '@submission/types';
function Harness() {
  const [query, setQuery] = useState<Query>({ search: 'React', sort: 'title-asc', favoritesOnly: false });
  return <><FilterDisclosure query={query} onChange={setQuery}/><output aria-label="현재 조건">{JSON.stringify(query)}</output><button>바깥 버튼</button></>;
}
const trigger = () => screen.getByRole('button', { name: '목록 옵션' });
it('접힌 제어 관계와 펼침 상태가 일치한다', async () => {
  render(<Harness />);
  const button = trigger();
  expect(button.getAttribute('aria-expanded')).toBe('false');
  expect(document.getElementById(button.getAttribute('aria-controls')!)).toBeTruthy();
  expect(screen.queryByRole('group', { name: '목록 옵션 내용' })).toBeNull();
  await userEvent.setup().click(button);
  expect(button.getAttribute('aria-expanded')).toBe('true');
  expect(screen.getByRole('group', { name: '목록 옵션 내용' })).toBeTruthy();
});
it('공유 조건을 바꾸되 검색과 정렬은 보존한다', async () => {
  render(<Harness />);
  const user = userEvent.setup();
  await user.click(trigger());
  await user.click(screen.getByRole('checkbox', { name: '즐겨찾기만' }));
  expect(JSON.parse(screen.getByLabelText('현재 조건').textContent!)).toEqual({ search: 'React', sort: 'title-asc', favoritesOnly: true });
});
it('Escape는 메뉴만 닫고 트리거로 포커스를 돌린다', async () => {
  render(<Harness />);
  const user = userEvent.setup();
  await user.click(trigger());
  screen.getByRole('checkbox', { name: '즐겨찾기만' }).focus();
  await user.keyboard('{Escape}');
  expect(trigger().getAttribute('aria-expanded')).toBe('false');
  expect(document.activeElement).toBe(trigger());
});
it('바깥 클릭은 메뉴를 닫지만 클릭한 요소의 포커스를 빼앗지 않는다', async () => {
  render(<Harness />);
  const user = userEvent.setup();
  await user.click(trigger());
  expect(trigger().getAttribute('aria-expanded')).toBe('true');
  const outside = screen.getByRole('button', { name: '바깥 버튼' });
  await user.click(outside);
  expect(trigger().getAttribute('aria-expanded')).toBe('false');
  expect(document.activeElement).toBe(outside);
});
it('다른 키 입력에는 메뉴가 닫히지 않는다', async () => {
  render(<Harness />);
  const user = userEvent.setup();
  await user.click(trigger());
  await user.keyboard('a');
  expect(trigger().getAttribute('aria-expanded')).toBe('true');
});
it('반복 열기와 StrictMode 언마운트 후 바깥 요소를 방해하지 않는다', async () => {
  const view = render(<StrictMode><Harness /></StrictMode>);
  const user = userEvent.setup();
  for (let i = 0; i < 2; i++) {
    await user.click(trigger());
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    await user.keyboard('{Escape}');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    const outside = screen.getByRole('button', { name: '바깥 버튼' });
    outside.focus();
    await user.keyboard('{Escape}');
    expect(document.activeElement).toBe(outside);
  }
  await user.click(trigger());
  expect(trigger().getAttribute('aria-expanded')).toBe('true');
  view.unmount();
  const outside = document.createElement('button');
  outside.textContent = '언마운트 후';
  document.body.append(outside);
  try {
    outside.focus();
    await user.keyboard('{Escape}');
    expect(document.activeElement).toBe(outside);
  } finally { outside.remove(); }
});
it('닫기와 언마운트에서 등록한 문서 이벤트가 남지 않는다', async () => {
  const user = userEvent.setup();
  const add = document.addEventListener.bind(document);
  const remove = document.removeEventListener.bind(document);
  type Registration = { type: string; listener: EventListenerOrEventListenerObject; capture: boolean };
  const active: Registration[] = [];
  const captured = (options?: boolean | EventListenerOptions) => typeof options === 'boolean' ? options : options?.capture ?? false;
  const tracked = (type: string) => type === 'keydown' || type === 'pointerdown';
  // 실제 DOM 등록을 유지하고 함수·type·capture의 짝을 추적합니다. 호출 순서는 고정하지 않습니다.
  vi.spyOn(document, 'addEventListener').mockImplementation((type, listener, options) => {
    const capture = captured(options);
    if (tracked(type) && !active.some(item => item.type === type && item.listener === listener && item.capture === capture)) active.push({ type, listener, capture });
    add(type, listener, options);
  });
  vi.spyOn(document, 'removeEventListener').mockImplementation((type, listener, options) => {
    const index = active.findIndex(item => item.type === type && item.listener === listener && item.capture === captured(options));
    if (index !== -1) active.splice(index, 1);
    remove(type, listener, options);
  });
  const view = render(<StrictMode><Harness /></StrictMode>);
  try {
    for (let i = 0; i < 2; i++) {
      await user.click(trigger());
      expect(trigger().getAttribute('aria-expanded')).toBe('true');
      await user.keyboard('{Escape}');
      expect(active).toEqual([]);
    }
    await user.click(trigger());
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    view.unmount();
    expect(active).toEqual([]);
  } finally {
    view.unmount();
    for (const item of active) remove(item.type, item.listener, item.capture);
    vi.restoreAllMocks();
  }
});
