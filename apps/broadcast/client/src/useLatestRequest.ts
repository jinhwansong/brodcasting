import type { RemoteState } from './types';
import { useEffect, useState } from 'react';
export function useLatestRequest<T>(request: ((signal: AbortSignal) => Promise<T>) | null, refreshKey = 0): RemoteState<T> {
  const [state, setState] = useState<RemoteState<T>>({ status: 'idle' });
  useEffect(() => {
    if (request === null) { setState({ status: 'idle' }); return; }
    const controller = new AbortController();
    let active = true;
    setState({ status: 'loading' });
    void (async () => {
      try {
        const data = await request(controller.signal);
        if (active) setState({ status: 'success', data });
      } catch (error) {
        if (active) setState({ status: 'error', error: error instanceof Error ? error : new Error(String(error)) });
      }
    })();
    return () => { active = false; controller.abort(); };
  }, [request, refreshKey]);
  return state;
}
