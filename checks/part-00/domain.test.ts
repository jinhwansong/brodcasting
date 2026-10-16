import { describe, expect, it } from 'vitest';
import { selectBroadcasts, toggleFavorite } from '@submission/domain';
import type { Broadcast, Query } from '@submission/types';

// Regressions caught: dropped search/combined filter, unstable ties, sort/Set mutation.
const items: readonly Broadcast[] = [
  { id: 'b', title: '나 방송', hostName: 'Alpha', viewerCount: 20 },
  { id: 'a', title: '가 React', hostName: '베타', viewerCount: 20 },
  { id: 'c', title: '다 React', hostName: '감마', viewerCount: 50 },
];
const base: Query = { search: '', sort: 'viewers-desc', favoritesOnly: false };
const ids = (rows: Broadcast[]) => rows.map(row => row.id);
const select = (query: Partial<Query> = {}, favorites: ReadonlySet<string> = new Set()) =>
  selectBroadcasts(items, { ...base, ...query }, favorites);

describe('selectBroadcasts', () => {
  it('공백 검색어는 전체 목록을 시청자 내림차순과 id 동률 순으로 반환한다', () => {
    expect(ids(select({ search: '  ' }))).toEqual(['c', 'a', 'b']);
  });
  it('제목을 대소문자 무시하고 trim 후 검색한다', () => {
    expect(ids(select({ search: '  rEaCt  ' }))).toEqual(['c', 'a']);
  });
  it('진행자 이름도 검색한다', () => {
    expect(ids(select({ search: 'ALPHA' }))).toEqual(['b']);
  });
  it('검색과 즐겨찾기 조건을 동시에 적용한다', () => {
    expect(ids(select({ search: 'React', favoritesOnly: true }, new Set(['a', 'b'])))).toEqual(['a']);
  });
  it('즐겨찾기 조건을 해제하면 검색 결과 전체로 돌아온다', () => {
    expect(ids(select({ search: 'React', favoritesOnly: false }, new Set(['a'])))).toEqual(['c', 'a']);
  });
  it('한국어 제목 오름차순을 적용한다', () => {
    expect(ids(select({ sort: 'title-asc' }))).toEqual(['a', 'b', 'c']);
  });
  it('제목이 같을 때도 id 오름차순을 적용한다', () => {
    const same = [{ ...items[0], title: '같음' }, { ...items[1], title: '같음' }];
    expect(ids(selectBroadcasts(same, { ...base, sort: 'title-asc' }, new Set()))).toEqual(['a', 'b']);
  });
  it('일치하지 않는 검색과 빈 즐겨찾기는 빈 결과다', () => {
    expect(select({ search: '없는 제목' })).toEqual([]);
    expect(select({ favoritesOnly: true })).toEqual([]);
  });
  it('빈 입력 목록을 처리한다', () => {
    expect(selectBroadcasts([], base, new Set())).toEqual([]);
  });
  it('입력 배열·객체·즐겨찾기를 변경하지 않는다', () => {
    const frozen = Object.freeze(items.map(row => Object.freeze({ ...row })));
    const favorites = new Set(['a']);
    expect(ids(selectBroadcasts(frozen, base, favorites))).toEqual(['c', 'a', 'b']);
    expect(frozen.map(row => row.id)).toEqual(['b', 'a', 'c']);
    expect([...favorites]).toEqual(['a']);
  });
});

describe('toggleFavorite', () => {
  it('없는 id를 추가한다', () => {
    expect([...toggleFavorite(new Set(), 'a')]).toEqual(['a']);
  });
  it('있는 id를 제거한다', () => {
    expect([...toggleFavorite(new Set(['a', 'b']), 'a')]).toEqual(['b']);
  });
  it('두 번 토글하면 초기 내용으로 돌아온다', () => {
    expect([...toggleFavorite(toggleFavorite(new Set(['b']), 'a'), 'a')]).toEqual(['b']);
  });
  it('원본 Set을 변경하지 않고 새 Set을 반환한다', () => {
    const original = new Set(['b']);
    const next = toggleFavorite(original, 'a');
    expect(next).not.toBe(original);
    expect([...original]).toEqual(['b']);
    expect([...next]).toEqual(['b', 'a']);
  });
});
