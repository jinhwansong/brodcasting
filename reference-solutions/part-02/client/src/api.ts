import type { Broadcast, Scenario, SortOrder } from './types';
export class ApiError extends Error {
  constructor(public readonly status: number, message: string) { super(message); this.name = 'ApiError'; }
}
function isBroadcast(value: unknown): value is Broadcast {
  if (typeof value !== 'object' || value === null) return false;
  const row = value as Record<string, unknown>;
  return typeof row.id === 'string' && row.id.length > 0 && typeof row.title === 'string' && typeof row.hostName === 'string' && typeof row.description === 'string' && typeof row.viewerCount === 'number' && Number.isSafeInteger(row.viewerCount) && row.viewerCount >= 0;
}
async function readJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal, cache: 'no-store' });
  if (!response.ok) throw new ApiError(response.status, `HTTP ${response.status}`);
  try { return await response.json(); }
  catch (error) {
    if (typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError') throw error;
    throw new ApiError(response.status, 'JSON 응답을 읽을 수 없습니다.');
  }
}
export async function fetchBroadcasts(query: { search: string; sort: SortOrder; scenario: Scenario }, signal: AbortSignal): Promise<Broadcast[]> {
  const body = await readJson('/api/broadcasts?' + new URLSearchParams(query), signal);
  if (typeof body !== 'object' || body === null || !('items' in body) || !Array.isArray(body.items) || !body.items.every(isBroadcast)) throw new ApiError(200, '목록 응답 형식이 올바르지 않습니다.');
  return body.items;
}
export async function fetchBroadcast(id: string, scenario: Scenario, signal: AbortSignal): Promise<Broadcast> {
  const body = await readJson('/api/broadcasts/' + encodeURIComponent(id) + '?' + new URLSearchParams({ scenario }), signal);
  if (!isBroadcast(body) || body.id !== id) throw new ApiError(200, '상세 응답 형식이 올바르지 않습니다.');
  return body;
}
export function describeError(error: Error): string {
  if (error instanceof ApiError) {
    if (error.status === 404) return '방송을 찾을 수 없습니다.';
    if (error.status === 400) return '요청 조건을 확인하세요.';
    if (error.status === 503) return '서버가 일시적으로 응답하지 않습니다.';
  }
  return '요청을 완료하지 못했습니다. 서버와 연결을 확인하세요.';
}
