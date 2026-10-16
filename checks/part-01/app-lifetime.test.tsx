import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import App from '@submission/App';
it('상세 표시와 전환·닫기가 실제 타이머 수명에 연결된다', async () => {
  vi.useFakeTimers();
  try {
    render(<App />);
    await act(async () => { await vi.advanceTimersByTimeAsync(160); });
    // 클릭·포커스 상호작용은 selection.test.tsx의 실제 시간 userEvent가 담당합니다.
    // 이 검증에서는 가짜 시간과 비동기 입력 도구의 대기를 섞지 않습니다.
    fireEvent.click(screen.getByRole('button', { name: '새벽 React 작업실 상세 보기' }));
    expect(screen.getByLabelText('화면 머문 시간').textContent).toBe('0초');
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByLabelText('화면 머문 시간').textContent).toBe('3초');
    fireEvent.click(screen.getByRole('button', { name: 'React 상태 실험 상세 보기' }));
    expect(screen.getByLabelText('화면 머문 시간').textContent).toBe('0초');
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByLabelText('화면 머문 시간').textContent).toBe('1초');
    fireEvent.click(screen.getByRole('button', { name: '상세 닫기' }));
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(vi.getTimerCount()).toBe(0);
    cleanup();
    expect(vi.getTimerCount()).toBe(0);
  } finally { cleanup(); vi.useRealTimers(); }
});
