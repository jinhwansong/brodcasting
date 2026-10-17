import { useCallback, useRef, useState } from 'react';
import type { Query, Scenario } from './types';
import { describeError, fetchBroadcast, fetchBroadcasts } from './api';
import { useLatestRequest } from './useLatestRequest';
import { selectBroadcasts, toggleFavorite } from './domain';
import BroadcastList from './BroadcastList';
import BroadcastDetail from './BroadcastDetail';
import FilterDisclosure from './FilterDisclosure';
import { useElapsedSeconds } from './useElapsedSeconds';

export default function App() {
  const [query, setQuery] = useState<Query>({ search: '', sort: 'viewers-desc', favoritesOnly: false });
  const [favorites, setFavorites] = useState(new Set<string>());
  const [scenario, setScenario] = useState<Scenario>('normal');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [directId, setDirectId] = useState('missing');
  const [listRefresh, setListRefresh] = useState(0);
  const [detailRefresh, setDetailRefresh] = useState(0);
  const opener = useRef<HTMLButtonElement | null>(null);
  const searchInput = useRef<HTMLInputElement | null>(null);
  const listRequest = useCallback((signal: AbortSignal) => fetchBroadcasts({ search: query.search, sort: query.sort, scenario }, signal), [query.search, query.sort, scenario]);
  const detailRequest = useCallback((signal: AbortSignal) => fetchBroadcast(selectedId!, scenario, signal), [selectedId, scenario]);
  const list = useLatestRequest(listRequest, listRefresh);
  const detail = useLatestRequest(selectedId === null ? null : detailRequest, detailRefresh);
  const rows = selectBroadcasts(list.status === 'success' ? list.data : [], query, favorites);
  const elapsedSeconds = useElapsedSeconds(selectedId !== null && detail.status === 'success' ? detail.data.id : null);
  const favorite = (id: string) => setFavorites(previous => toggleFavorite(previous, id));
  const select = (id: string, trigger: HTMLButtonElement) => { opener.current = trigger; setSelectedId(id); };
  const close = () => {
    setSelectedId(null);
    if (opener.current?.isConnected) opener.current.focus();
    else searchInput.current?.focus();
  };
  return <div className="studio">
    <header className="masthead"><h1>방송 실험실</h1><p>2단계 · HTTP API와 느린 응답</p><span>시작 코드</span></header>
    <main>
      <section className="toolbar" aria-label="목록 조건">
        <label htmlFor="search">방송 검색</label><input ref={searchInput} id="search" type="search" maxLength={80} placeholder="제목 또는 진행자" value={query.search} onChange={e => setQuery({ ...query, search: e.target.value })}/>
        <label htmlFor="sort">정렬</label><select id="sort" value={query.sort} onChange={e => setQuery({ ...query, sort: e.target.value as Query['sort'] })}><option value="viewers-desc">시청자 많은 순</option><option value="title-asc">제목 순</option></select>
        <FilterDisclosure query={query} onChange={setQuery}/>
      </section>
      <div className="workspace">
        <section className="directory" aria-labelledby="list-title"><h2 id="list-title">방송 목록</h2>
          {(list.status === 'idle' || list.status === 'loading') && <p role="status">방송을 불러오는 중…</p>}
          {list.status === 'error' && <div role="alert"><p>{describeError(list.error)}</p><button onClick={() => setListRefresh(previous => previous + 1)}>목록 다시 시도</button></div>}
          {list.status === 'success' && <><p className="result-count">{rows.length}개 표시</p>{rows.length === 0 ? <p>검색 조건에 맞는 방송이 없습니다.</p> : <BroadcastList items={rows} favoriteIds={favorites} onSelect={select} onToggleFavorite={favorite}/>}</>}
        </section>
        {selectedId === null ? <section className="detail empty-detail"><h2>방송 상세</h2><p>목록에서 방송을 선택하세요.</p></section> : detail.status === 'success' ?
          <BroadcastDetail broadcast={detail.data} isFavorite={favorites.has(detail.data.id)} elapsedSeconds={elapsedSeconds} onClose={close} onToggleFavorite={favorite}/> :
          <section className="detail" aria-label="방송 상세"><button onClick={close}>상세 닫기</button><h2>방송 상세</h2>
            {(detail.status === 'idle' || detail.status === 'loading') && <p role="status">상세를 불러오는 중…</p>}
            {detail.status === 'error' && <div role="alert"><p>{describeError(detail.error)}</p><button onClick={() => setDetailRefresh(previous => previous + 1)}>상세 다시 시도</button></div>}
          </section>}
      </div>
      <section className="experiment" aria-label="HTTP 실험"><label htmlFor="scenario">응답 실험</label>
        <select id="scenario" value={scenario} onChange={e => setScenario(e.target.value as Scenario)}><option value="normal">정상 응답</option><option value="slow">짧은 검색을 느리게</option><option value="error">오류 응답</option></select>
        <button onClick={() => setListRefresh(previous => previous + 1)}>목록 다시 불러오기</button>
        <label htmlFor="direct-id">직접 조회할 방송 id</label><input id="direct-id" value={directId} onChange={e => setDirectId(e.target.value)}/>
        <button onClick={e => select(directId, e.currentTarget)}>상세 직접 조회</button>
      </section>
    </main><footer>로컬 메모리 API를 사용하는 실습입니다. 실제 영상·인증·데이터 저장은 이후 단계입니다.</footer>
  </div>;
}
