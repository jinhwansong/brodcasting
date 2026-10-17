import { useEffect, useId, useRef, useState } from 'react';
import type { Query } from './types';
type Props = { query: Query; onChange: (query: Query) => void };
export default function FilterDisclosure({ query, onChange }: Props) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      trigger.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !container.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);
  return <div ref={container} className="disclosure">
    <button ref={trigger} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(previous => !previous)}>목록 옵션</button>
    <div id={panelId} className="options-panel" role="group" aria-label="목록 옵션 내용" hidden={!open}>
      <label className="check"><input type="checkbox" checked={query.favoritesOnly} onChange={e => onChange({ ...query, favoritesOnly: e.target.checked })}/>즐겨찾기만</label>
      <button onClick={() => onChange({ search: '', sort: 'viewers-desc', favoritesOnly: false })}>조건 초기화</button>
    </div>
  </div>;
}
