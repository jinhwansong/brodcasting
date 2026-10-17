import { useEffect, useRef } from 'react';
import type { Broadcast } from './types';
type Props = {
  broadcast: Broadcast; isFavorite: boolean; elapsedSeconds: number;
  onClose: () => void; onToggleFavorite: (id: string) => void;
};
export default function BroadcastDetail({ broadcast, isFavorite, elapsedSeconds, onClose, onToggleFavorite }: Props) {
  const heading = useRef<HTMLHeadingElement | null>(null);
  useEffect(() => { heading.current?.focus(); }, [broadcast.id]);
  return <section className="detail" aria-label="방송 상세">
    <button className="quiet" onClick={onClose}>상세 닫기</button>
    <h2 ref={heading} tabIndex={-1}>{broadcast.title}</h2><p className="host">{broadcast.hostName}</p>
    <div className="media-placeholder"><p>영상 자리 표시자</p><small>실제 영상 재생은 8단계에서 다룹니다.</small></div>
    <p>{broadcast.description}</p>
    <button aria-label="상세 즐겨찾기" aria-pressed={isFavorite} onClick={() => onToggleFavorite(broadcast.id)}>{isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}</button>
    <p>화면 머문 시간: <output aria-label="화면 머문 시간">{elapsedSeconds}초</output></p>
  </section>;
}
