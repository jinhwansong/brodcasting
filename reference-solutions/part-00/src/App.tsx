import { useEffect, useState } from 'react';
import { loadBroadcasts } from './loadBroadcasts';
import { selectBroadcasts, toggleFavorite } from './domain';
import BroadcastView from './BroadcastView';
import type { LoadState } from './BroadcastView';
import type { LoadMode, Query } from './types';

export default function App() {
  const [query, setQuery] = useState<Query>({ search: '', sort: 'viewers-desc', favoritesOnly: false });
  const [favorites, setFavorites] = useState(new Set<string>());
  const [mode, setMode] = useState<LoadMode>('success');
  const [request, setRequest] = useState<{ mode: LoadMode }>({ mode: 'success' });
  const [state, setState] = useState<LoadState>({ status: 'loading', items: [] });
  useEffect(() => {
    let active = true;
    setState({ status: 'loading', items: [] });
    loadBroadcasts(request.mode).then(items => {
      if (active) setState({ status: 'success', items });
    }, () => {
      if (active) setState({ status: 'error', items: [] });
    });
    // This ignores a stale result; it does not cancel server-side work.
    return () => { active = false; };
  }, [request]);
  return <BroadcastView variant="reference" state={state}
    rows={selectBroadcasts(state.items, query, favorites)} query={query} favorites={favorites} mode={mode}
    onQuery={setQuery} onMode={setMode}
    onFavorite={id => setFavorites(previous => toggleFavorite(previous, id))}
    onLoad={() => setRequest({ mode })}
    onRetry={() => { setMode('success'); setRequest({ mode: 'success' }); }}/ >;
}
