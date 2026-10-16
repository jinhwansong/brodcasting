import type { Broadcast } from './types';
type Props = {
  items: readonly Broadcast[]; favoriteIds: ReadonlySet<string>;
  onSelect: (id: string, trigger: HTMLButtonElement) => void;
  onToggleFavorite: (id: string) => void;
};
export default function BroadcastList({ items, favoriteIds, onSelect, onToggleFavorite }: Props) {
  return <ul className="broadcasts" aria-label="방송 목록">{items.map(row =>
    <li key={row.id}>
      <div className="program-title"><h3><button className="title-button" aria-label={row.title + ' 상세 보기'} onClick={event => onSelect(row.id, event.currentTarget)}>{row.title}</button></h3><p>{row.hostName}</p></div>
      <span className="viewers">시청자 {row.viewerCount.toLocaleString('ko-KR')}명</span>
      <button className="favorite" aria-label={row.title + ' 즐겨찾기'} aria-pressed={favoriteIds.has(row.id)} onClick={() => onToggleFavorite(row.id)}>{favoriteIds.has(row.id) ? '★' : '☆'}</button>
    </li>,
  )}</ul>;
}
