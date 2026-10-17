import { useEffect, useState } from 'react';

export function useElapsedSeconds(broadcastId: string | null): number {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    setSeconds(0);
    if (broadcastId === null) return;
    const interval = setInterval(() => setSeconds(previous => previous + 1), 1000);
    return () => clearInterval(interval);
  }, [broadcastId]);
  return seconds;
}
