import { useState } from 'react';
import { broadcasts } from './fixtures';
import { selectBroadcasts, toggleFavorite } from './domain';
import BroadcastView from './BroadcastView';
import type { LoadState } from './BroadcastView';
import type { LoadMode, Query } from './types';

export default function App() {
  const [query, setQuery] = useState<Query>({ search: '', sort: 'viewers-desc', favoritesOnly: false });
  const [favorites, setFavorites] = useState(new Set<string>());
  const [mode, setMode] = useState<LoadMode>('success');
  // 과제 C: 모의 로더와 로딩·성공·오류·재시도를 연결하세요.
  // 현재는 목록을 즉시 보여주며 아래 두 동작은 비어 있습니다.
  const [state] = useState<LoadState>({ status: 'success', items: [...broadcasts] });
  return <BroadcastView variant="exercise" state={state}
    rows={selectBroadcasts(state.items, query, favorites)} query={query} favorites={favorites} mode={mode}
    onQuery={setQuery} onMode={setMode}
    onFavorite={id => setFavorites(previous => toggleFavorite(previous, id))}
    onLoad={() => { /* 과제 C */ }} onRetry={() => { /* 과제 C */ }}/>;
}
