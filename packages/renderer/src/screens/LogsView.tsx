import { useQuery } from '@tanstack/react-query';
import type { LogLine as LogLineType } from '@varys/core';
import { useEffect, useRef, useState } from 'react';

import { LogLine } from '@/components/LogLine';
import { useAppLogStream } from '@/hooks/useAppLogStream';

type Level = NonNullable<LogLineType['level']>;

const ALL_LEVELS: Level[] = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'];

const LEVEL_STYLE: Record<Level, { bg: string; color: string; border: string }> = {
  DEBUG:    { bg: 'rgba(148,116,245,0.12)', color: 'var(--log-debug)',        border: 'rgba(148,116,245,0.3)'  },
  INFO:     { bg: 'rgba(196,181,253,0.08)', color: 'var(--log-info)',         border: 'rgba(196,181,253,0.2)'  },
  WARNING:  { bg: 'rgba(245,158,11,0.12)',  color: 'var(--hd-warning-500)',   border: 'rgba(245,158,11,0.3)'   },
  ERROR:    { bg: 'rgba(239,68,68,0.12)',   color: 'var(--hd-danger-500)',    border: 'rgba(239,68,68,0.3)'    },
  CRITICAL: { bg: 'rgba(124,58,237,0.15)', color: 'var(--hd-violet-300)',    border: 'rgba(124,58,237,0.35)'  },
};

function basename(path: string): string {
  return path.split('/').pop() ?? path;
}

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
    setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
  }

  function toggleLevel(level: Level) {
    setEnabledLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) { next.delete(level); } else { next.add(level); }
      return next;
    });
  }

  const filtered = lines.filter((l) => enabledLevels.has(l.level ?? 'DEBUG'));

  const hasFiles = !isLoading && files && files.length > 0;
  const isEmpty  = !isLoading && (!files || files.length === 0);

  return (
    <div className="flex h-full flex-col" style={{ background: 'var(--bg-base)' }}>

      {/* ── Page header ── */}
      <div
        className="flex shrink-0 items-center justify-between gap-4 px-6 py-4"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}
      >
        <div className="flex items-center gap-3">
          <h1
            className="text-[17px] font-bold"
            style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}
          >
            Logs
          </h1>
          {lines.length > 0 && (
            <span className="live-dot">{autoScroll ? 'LIVE' : 'PAUSE'}</span>
          )}
        </div>

        {/* File selector */}
        {hasFiles && (
          <div className="flex items-center gap-2">
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <select
              value={selectedFile ?? ''}
              onChange={(e) => setSelectedFile(e.target.value)}
              aria-label="Sélectionner un fichier de log"
              style={{
                WebkitAppearance: 'none',
                appearance: 'none',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--hd-radius-md)',
                padding: '5px 28px 5px 10px',
                fontFamily: 'var(--hd-font-mono)',
                fontSize: 12,
                color: 'var(--text-1)',
                cursor: 'pointer',
                outline: 'none',
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239474F5' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
              }}
            >
              {files.map((f) => (
                <option key={f} value={f}>{basename(f)}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Level filter toolbar ── */}
      <div
        className="flex shrink-0 items-center gap-2 px-6 py-2"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}
        role="group"
        aria-label="Filtrer par niveau"
      >
        <span
          className="mr-1 text-[10px] font-bold uppercase"
          style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}
        >
          Niveaux
        </span>
        {ALL_LEVELS.map((level) => {
          const active = enabledLevels.has(level);
          const s = LEVEL_STYLE[level];
          return (
            <button
              key={level}
              type="button"
              onClick={() => toggleLevel(level)}
              aria-pressed={active}
              className="rounded-full px-2.5 py-0.5 text-[10.5px] font-bold transition-all"
              style={{
                fontFamily: 'var(--hd-font-mono)',
                letterSpacing: '0.04em',
                cursor: 'pointer',
                border: `1px solid ${active ? s.border : 'var(--border)'}`,
                background: active ? s.bg : 'transparent',
                color: active ? s.color : 'var(--text-muted)',
              }}
            >
              {level}
            </button>
          );
        })}
      </div>

      {/* ── Log terminal ── */}
      <div className="relative flex-1 overflow-hidden p-4">

        {isEmpty && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>
              Aucun fichier de log trouvé
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              Vérifiez que{' '}
              <code style={{ fontFamily: 'var(--hd-font-mono)', color: 'var(--text-3)' }}>
                storage/logs/
              </code>{' '}
              existe dans votre projet Laravel.
            </p>
          </div>
        )}

        {!isEmpty && (
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="h-full overflow-y-auto rounded-lg p-2.5"
            style={{ background: 'var(--log-bg)', border: '1px solid var(--log-border)' }}
            aria-label="Logs de l'application"
            aria-live="polite"
            aria-atomic="false"
          >
            {isLoading ? (
              <p className="py-4 text-center font-mono text-xs" style={{ color: 'var(--log-ts)' }}>
                Chargement…
              </p>
            ) : filtered.length === 0 ? (
              <p className="py-4 text-center font-mono text-xs" style={{ color: 'var(--log-ts)' }}>
                Aucune ligne à afficher
              </p>
            ) : (
              filtered.map((line, i) => <LogLine key={i} line={line} />)
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {!autoScroll && (
          <button
            type="button"
            onClick={() => {
              setAutoScroll(true);
              bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="absolute bottom-6 right-6 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hd-violet-400)]"
            style={{ background: 'var(--hd-violet-700)', color: '#fff' }}
          >
            ↓ Défiler vers le bas
          </button>
        )}
      </div>
    </div>
  );
}
