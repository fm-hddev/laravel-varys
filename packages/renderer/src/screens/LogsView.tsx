import { useQuery } from '@tanstack/react-query';
import type { LogLine as LogLineType } from '@varys/core';
import { useEffect, useRef, useState } from 'react';

import { LogFileSelector } from '@/components/LogFileSelector';
import { LogLine } from '@/components/LogLine';
import { useAppLogStream } from '@/hooks/useAppLogStream';

type Level = NonNullable<LogLineType['level']>;
const ALL_LEVELS: Level[] = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'];

export default function LogsView() {
  const { data: files, isLoading } = useQuery({
    queryKey: ['logs:listFiles'],
    queryFn: () => window.varys.invoke('logs:listFiles'),
  });

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [enabledLevels, setEnabledLevels] = useState<Set<Level>>(new Set(ALL_LEVELS));
  const [autoScroll, setAutoScroll] = useState(true);

  const lines = useAppLogStream(selectedFile);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Default to laravel.log when files load
  useEffect(() => {
    if (!files || selectedFile !== null) return;
    const laravelLog = files.find((f) => f.endsWith('laravel.log'));
    setSelectedFile(laravelLog ?? files[0] ?? null);
  }, [files, selectedFile]);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lines, autoScroll]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(atBottom);
  }

  function toggleLevel(level: Level) {
    setEnabledLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  }

  const filtered = lines.filter((l) => enabledLevels.has(l.level ?? 'DEBUG'));

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>Chargement des fichiers…</p>
      </main>
    );
  }

  if (!files || files.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="text-center">
          <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>Aucun fichier de log trouvé</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            Vérifiez que <code style={{ color: 'var(--text-3)' }}>storage/logs/</code> existe dans votre projet Laravel.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col px-6 py-8" style={{ background: 'var(--bg-base)' }}>
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 min-h-0">
        <div className="flex items-end gap-4 flex-wrap">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>Logs</h1>
          {selectedFile !== null && (
            <LogFileSelector
              files={files}
              selected={selectedFile}
              onChange={setSelectedFile}
            />
          )}
        </div>

        {/* Level filters */}
        <fieldset>
          <legend className="mb-1 text-xs" style={{ color: 'var(--text-muted)' }}>Niveaux</legend>
          <div className="flex flex-wrap gap-2">
            {ALL_LEVELS.map((level) => (
              <label
                key={level}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs"
                style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}
              >
                <input
                  type="checkbox"
                  checked={enabledLevels.has(level)}
                  onChange={() => toggleLevel(level)}
                  className="accent-indigo-500"
                />
                <span style={{ color: 'var(--text-2)' }}>{level}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Log area */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto rounded-xl p-4 min-h-0"
          style={{ border: '1px solid var(--log-border)', background: 'var(--log-bg)' }}
          aria-label="Logs de l'application"
          aria-live="polite"
          aria-atomic="false"
        >
          {filtered.length === 0 ? (
            <p className="text-center text-xs" style={{ color: 'var(--log-ts)' }}>Aucune ligne à afficher</p>
          ) : (
            filtered.map((line, i) => <LogLine key={i} line={line} />)
          )}
          <div ref={bottomRef} />
        </div>

        {!autoScroll && (
          <button
            type="button"
            onClick={() => {
              setAutoScroll(true);
              bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="self-end rounded-lg bg-indigo-800 px-3 py-1.5 text-xs text-indigo-200 hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            Défiler vers le bas
          </button>
        )}
      </div>
    </main>
  );
}
