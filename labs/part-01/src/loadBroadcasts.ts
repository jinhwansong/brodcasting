import type { Broadcast, LoadMode } from './types';
import { broadcasts } from './fixtures';
export function loadBroadcasts(mode: LoadMode): Promise<Broadcast[]> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (mode === 'error') reject(new Error('모의 로딩 실패'));
      else resolve(mode === 'empty' ? [] : broadcasts.map(row => ({ ...row })));
    }, 160);
  });
}
