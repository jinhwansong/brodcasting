import type { Broadcast, Scenario, SortOrder } from './types';
export class ApiError extends Error {
  constructor(public readonly status: number, message: string) { super(message); this.name = 'ApiError'; }
}
// 과제 C: fetch·상태 코드·JSON 구조·signal·캐시 정책을 실제 HTTP 계약에 연결하세요.
export async function fetchBroadcasts(_query: { search: string; sort: SortOrder; scenario: Scenario }, _signal: AbortSignal): Promise<Broadcast[]> {
  throw new Error('과제 C: 목록 HTTP 요청을 구현하세요.');
}
export async function fetchBroadcast(_id: string, _scenario: Scenario, _signal: AbortSignal): Promise<Broadcast> {
  throw new Error('과제 C: 상세 HTTP 요청을 구현하세요.');
}
export function describeError(error: Error): string {
  if (error instanceof ApiError) {
    if (error.status === 404) return '방송을 찾을 수 없습니다.';
    if (error.status === 400) return '요청 조건을 확인하세요.';
    if (error.status === 503) return '서버가 일시적으로 응답하지 않습니다.';
  }
  return '요청을 완료하지 못했습니다. 서버와 연결을 확인하세요.';
}
