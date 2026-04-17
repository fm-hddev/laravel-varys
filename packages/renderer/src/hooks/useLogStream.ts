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
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
      return;
    }

    void ipc.subscribe({ type: 'processLog', processId });

    unsubRef.current = ipc.onProcessLog((line) => {
      setLines((prev) => [...prev, line].slice(-MAX_LINES));
    });

    return () => {
      void ipc.unsubscribe({ type: 'processLog', processId });
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [active, processId]); // ipc est stable

  return lines;
}
