import { useEffect, useRef, useState } from 'react';
import type { Broadcast, LoadMode, Query } from './types';
import { loadBroadcasts } from './loadBroadcasts';
import { getSelectedBroadcast, selectBroadcasts, toggleFavorite } from './domain';
import BroadcastList from './BroadcastList';
import BroadcastDetail from './BroadcastDetail';
import FilterDisclosure from './FilterDisclosure';
import { useElapsedSeconds } from './useElapsedSeconds';
type LoadState = { status: 'loading' | 'success' | 'error'; items: Broadcast[] };

export default function App() {
  const [query, setQuery] = useState<Query>({ search: '', sort: 'viewers-desc', favoritesOnly: false });
  const [favorites, setFavorites] = useState(new Set<string>());
  const [mode, setMode] = useState<LoadMode>('success');
  const [request, setRequest] = useState<{ mode: LoadMode }>({ mode: 'success' });
  const [state, setState] = useState<LoadState>({ status: 'loading', items: [] });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const searchInput = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    let active = true;
    setState({ status: 'loading', items: [] });
    loadBroadcasts(request.mode).then(items => {
      if (active) setState({ status: 'success', items });
    }, () => { if (active) setState({ status: 'error', items: [] }); });
    return () => { active = false; };
  }, [request]);
  const rows = selectBroadcasts(state.items, query, favorites);
  const selected = getSelectedBroadcast(state.items, selectedId);
  const elapsedSeconds = useElapsedSeconds(selected?.id ?? null);
  const favorite = (id: string) => setFavorites(previous => toggleFavorite(previous, id));
  const reload = (next: LoadMode) => {
    setSelectedId(null);
    setRequest({ mode: next });
  };
  const select = (id: string, trigger: HTMLButtonElement) => {
    opener.current = trigger;
    setSelectedId(id);
  };
  const close = () => {
    setSelectedId(null);
    if (opener.current?.isConnected) opener.current.focus();
    else searchInput.current?.focus();
  };
  return <div className="studio">
    <header className="masthead"><h1>방송 실험실</h1><p>1단계 · 목록에서 상세까지</p><span>참고 완성본</span></header>
    <main>
      <section className="toolbar" aria-label="목록 조건">
        <label htmlFor="search">방송 검색</label>
        <input ref={searchInput} id="search" type="search" placeholder="제목 또는 진행자" value={query.search} onChange={e => setQuery({ ...query, search: e.target.value })}/>
        <label htmlFor="sort">정렬</label>
        <select id="sort" value={query.sort} onChange={e => setQuery({ ...query, sort: e.target.value as Query['sort'] })}><option value="viewers-desc">시청자 많은 순</option><option value="title-asc">제목 순</option></select>
        <FilterDisclosure query={query} onChange={setQuery}/>
      </section>
      <div className="workspace">
        <section className="directory" aria-labelledby="list-title"><h2 id="list-title">방송 목록</h2>
          {state.status === 'loading' && <p role="status">방송을 불러오는 중…</p>}
          {state.status === 'error' && <div role="alert"><p>방송을 불러오지 못했습니다.</p><button onClick={() => { setMode('success'); reload('success'); }}>다시 시도</button></div>}
          {state.status === 'success' && <>
            <p className="result-count">{state.items.length}개 중 {rows.length}개 표시</p>
            {state.items.length === 0 ? <p>등록된 방송이 없습니다.</p> : rows.length === 0 ? <p>검색 조건에 맞는 방송이 없습니다.</p> :
              <BroadcastList items={rows} favoriteIds={favorites} onSelect={select} onToggleFavorite={favorite}/>}
          </>}
        </section>
        {selected ? <BroadcastDetail broadcast={selected} isFavorite={favorites.has(selected.id)} elapsedSeconds={elapsedSeconds} onClose={close} onToggleFavorite={favorite}/> :
          <section className="detail empty-detail"><h2>방송 상세</h2><p>목록에서 방송을 선택하세요.</p></section>}
      </div>
      <section className="experiment" aria-label="실패 실험"><label htmlFor="mode">실험 데이터</label>
        <select id="mode" value={mode} onChange={e => setMode(e.target.value as LoadMode)}><option value="success">정상 데이터</option><option value="empty">빈 데이터</option><option value="error">오류</option></select>
        <button onClick={() => reload(mode)}>다시 불러오기</button>
      </section>
    </main><footer>실제 방송·영상·서버가 없는 학습용 화면입니다.</footer>
  </div>;
}
