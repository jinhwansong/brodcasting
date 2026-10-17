import type { RemoteState } from './types';
// 과제 D: 최신 요청만 반영하고 변경·닫기·언마운트에서 이전 요청을 정리하세요.
export function useLatestRequest<T>(_request: ((signal: AbortSignal) => Promise<T>) | null, _refreshKey = 0): RemoteState<T> {
  return { status: 'idle' };
}
