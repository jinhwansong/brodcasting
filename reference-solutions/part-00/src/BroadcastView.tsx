import type { Broadcast, LoadMode, Query } from './types';
export type LoadState =
  | { status: 'loading'; items: Broadcast[] }
  | { status: 'success'; items: Broadcast[] }
  | { status: 'error'; items: Broadcast[] };
type Props = {
  state: LoadState; rows: Broadcast[]; query: Query; favorites: ReadonlySet<string>; mode: LoadMode;
  variant: 'exercise' | 'reference'; onQuery: (query: Query) => void;
  onMode: (mode: LoadMode) => void; onLoad: () => void; onRetry: () => void;
  onFavorite: (id: string) => void;
};
export default function BroadcastView(p: Props) {
  return <div className="studio">
    <header className="masthead"><div className="station" aria-hidden="true">방</div><div><h1>방송 실험실</h1><p>목록 하나로 살펴보는 상태와 데이터 흐름</p></div><span className="edition">{p.variant === 'exercise' ? '0단계 · 시작 코드' : '0단계 · 참고 완성본'}</span></header>
    <main className="workspace">
      <aside className="controls" aria-label="목록 조건">
        <h2>보고 싶은 방송</h2>
        <label htmlFor="search">방송 검색</label>
        <input id="search" type="search" placeholder="제목 또는 진행자" value={p.query.search} onChange={e => p.onQuery({ ...p.query, search: e.target.value })}/>
        <label htmlFor="sort">정렬</label>
        <select id="sort" value={p.query.sort} onChange={e => p.onQuery({ ...p.query, sort: e.target.value as Query['sort'] })}><option value="viewers-desc">시청자 많은 순</option><option value="title-asc">제목 순</option></select>
        <label className="check"><input type="checkbox" checked={p.query.favoritesOnly} onChange={e => p.onQuery({ ...p.query, favoritesOnly: e.target.checked })}/>즐겨찾기만</label>
        <button className="quiet" onClick={() => p.onQuery({ search: '', sort: 'viewers-desc', favoritesOnly: false })}>조건 초기화</button>
        <section className="experiment" aria-labelledby="experiment-title"><h2 id="experiment-title">실패도 실험하기</h2>
          <label htmlFor="mode">실험 데이터</label>
          <select id="mode" value={p.mode} onChange={e => p.onMode(e.target.value as LoadMode)}><option value="success">정상 데이터</option><option value="empty">빈 데이터</option><option value="error">오류</option></select>
          <button className="reload" onClick={p.onLoad}>다시 불러오기</button><p>외부 서버 없이 로딩과 실패를 재현합니다.</p>
        </section>
      </aside>
      <section className="programs" aria-labelledby="programs-title">
        <div className="section-heading"><h2 id="programs-title">방송 목록</h2><span>모두 가상 방송입니다</span></div>
        {p.state.status === 'loading' && <p className="notice" role="status">방송을 불러오는 중…</p>}
        {p.state.status === 'error' && <div className="notice error" role="alert"><p>방송을 불러오지 못했습니다.</p><button onClick={p.onRetry}>다시 시도</button></div>}
        {p.state.status === 'success' && <>
          <p role="status" className="result-count">{p.state.items.length}개 중 {p.rows.length}개 표시</p>
          {p.state.items.length === 0 ? <p className="notice">등록된 방송이 없습니다.</p> : p.rows.length === 0 ? <p className="notice">검색 조건에 맞는 방송이 없습니다.</p> :
          <ul className="broadcasts" aria-label="방송 목록">{p.rows.map((row, i) => <li key={row.id}>
            <span className="channel" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
            <div className="program-title"><h3>{row.title}</h3><p>{row.hostName}</p></div>
            <span className="viewers">시청자 <strong>{row.viewerCount.toLocaleString('ko-KR')}</strong>명</span>
            <button className="favorite" aria-label={row.title + ' 즐겨찾기'} aria-pressed={p.favorites.has(row.id)} onClick={() => p.onFavorite(row.id)}><span aria-hidden="true">{p.favorites.has(row.id) ? '★' : '☆'}</span></button>
          </li>)}</ul>}
        </>}
      </section>
    </main><footer>예상하고, 실행하고, 차이를 설명해 보세요.</footer>
  </div>;
}
