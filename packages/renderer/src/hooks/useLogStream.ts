import type { LogLine } from '@varys/core';
import { useEffect, useRef, useState } from 'react';

import { useIpc } from '@/hooks/useIpc';

const MAX_LINES = 200;

export function useLogStream(processId: string, active: boolean) {
  const ipc = useIpc();
  const [lines, setLines] = useState<LogLine[]>([]);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!active) {
      unsubRef.current?.();
      unsubRef.current = null;
      return;
    }

    let cancelled = false;

    // Delay subscribe so React StrictMode's synchronous cleanup can fire first
    // (cleanup clears this timer, preventing a double-subscribe race in the main process)
    const timer = setTimeout(() => {
      if (!cancelled) void ipc.subscribe({ type: 'processLog', processId });
    }, 50);

    unsubRef.current = ipc.onProcessLog((line) => {
      if (!cancelled) setLines((prev) => [...prev, line].slice(-MAX_LINES));
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      void ipc.unsubscribe({ type: 'processLog', processId });
      unsubRef.current?.();
      unsubRef.current = null;
    };
  }, [active, processId]); // ipc est stable

  return lines;
}
