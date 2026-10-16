import type { Broadcast, Query } from './types';

export function selectBroadcasts(items: readonly Broadcast[], query: Query, favorites: ReadonlySet<string>): Broadcast[] {
  const search = query.search.trim().toLocaleLowerCase('ko-KR');
  const collator = new Intl.Collator('ko-KR');
  return items.filter(row =>
    (row.title.toLocaleLowerCase('ko-KR').includes(search) || row.hostName.toLocaleLowerCase('ko-KR').includes(search)) &&
    (!query.favoritesOnly || favorites.has(row.id)),
  ).sort((left, right) => {
    const primary = query.sort === 'viewers-desc'
      ? right.viewerCount - left.viewerCount
      : collator.compare(left.title, right.title);
    return primary || (left.id < right.id ? -1 : left.id > right.id ? 1 : 0);
  });
}

export function toggleFavorite(favorites: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(favorites);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}
