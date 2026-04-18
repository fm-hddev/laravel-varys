import type { LogLine } from '@varys/core';
import { useEffect, useRef, useState } from 'react';

const MAX_LINES = 1000;

export function useAppLogStream(selectedFile: string | null) {
  const [lines, setLines] = useState<LogLine[]>([]);
  const prevFileRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedFile) return;

    // Unsubscribe from previous file
    if (prevFileRef.current && prevFileRef.current !== selectedFile) {
      void window.varys.invoke('stream:unsubscribe', {
        type: 'appLog',
        file: prevFileRef.current,
      });
    }

    prevFileRef.current = selectedFile;
    setLines([]);

    void window.varys.invoke('stream:subscribe', { type: 'appLog', file: selectedFile });

    const unsub = window.varys.on('stream:appLog', (line) => {
      setLines((prev) => [...prev, line].slice(-MAX_LINES));
    });

    return () => {
      unsub();
      void window.varys.invoke('stream:unsubscribe', { type: 'appLog', file: selectedFile });
      prevFileRef.current = null;
    };
  }, [selectedFile]);

  return lines;
}
