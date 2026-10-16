import { useId } from 'react';
import type { Query } from './types';
type Props = { query: Query; onChange: (query: Query) => void };
export default function FilterDisclosure({ query, onChange }: Props) {
  const panelId = useId();
  const open = false; // 과제 B: 열기·닫기·Escape·바깥 클릭과 이벤트 정리를 구현하세요.
  return <div className="disclosure">
    <button aria-expanded={open} aria-controls={panelId}>목록 옵션</button>
    <div id={panelId} className="options-panel" role="group" aria-label="목록 옵션 내용" hidden={!open}>
      <label className="check"><input type="checkbox" checked={query.favoritesOnly} onChange={e => onChange({ ...query, favoritesOnly: e.target.checked })}/>즐겨찾기만</label>
      <button onClick={() => onChange({ search: '', sort: 'viewers-desc', favoritesOnly: false })}>조건 초기화</button>
    </div>
  </div>;
}
