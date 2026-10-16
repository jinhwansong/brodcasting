import type { Broadcast, Query } from './types';

// 과제 A: 검색 → 즐겨찾기 조건 → 정렬을 함께 적용하세요. 입력을 바꾸지 마세요.
export function selectBroadcasts(items: readonly Broadcast[], _query: Query, _favorites: ReadonlySet<string>): Broadcast[] {
  return [...items]; // 미완성: 현재는 어떤 조건도 적용하지 않습니다.
}

// 과제 B: 원본 Set을 바꾸지 않고 id의 포함 여부를 뒤집으세요.
export function toggleFavorite(favorites: ReadonlySet<string>, _id: string): Set<string> {
  return new Set(favorites); // 미완성: 현재는 즐겨찾기를 바꾸지 않습니다.
}
