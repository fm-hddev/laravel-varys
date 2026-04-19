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
      <main className="flex min-h-screen items-center justify-center bg-neutral-950">
        <p className="text-sm text-neutral-400">Chargement des fichiers…</p>
      </main>
    );
  }

  if (!files || files.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950">
        <div className="text-center">
          <p className="text-sm font-medium text-neutral-300">Aucun fichier de log trouvé</p>
          <p className="mt-1 text-xs text-neutral-500">
            Vérifiez que <code className="text-neutral-400">storage/logs/</code> existe dans votre projet Laravel.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col bg-neutral-950 px-6 py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 min-h-0">
        <div className="flex items-end gap-4 flex-wrap">
          <h1 className="text-xl font-bold text-neutral-100">Logs</h1>
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
          <legend className="mb-1 text-xs text-neutral-500">Niveaux</legend>
          <div className="flex flex-wrap gap-2">
            {ALL_LEVELS.map((level) => (
              <label
                key={level}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs"
              >
                <input
                  type="checkbox"
                  checked={enabledLevels.has(level)}
                  onChange={() => toggleLevel(level)}
                  className="accent-indigo-500"
                />
                <span className="text-neutral-300">{level}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Log area */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-950 p-4 min-h-0"
          aria-label="Logs de l'application"
          aria-live="polite"
          aria-atomic="false"
        >
          {filtered.length === 0 ? (
            <p className="text-center text-xs text-neutral-600">Aucune ligne à afficher</p>
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
