import { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

export function ThemeProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('varys-theme');
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    return 'light';
  });

  useEffect(() => {
    const apply = () => {
      document.documentElement.setAttribute('data-theme', resolveTheme(mode));
    };

    apply();

    if (mode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [mode]);

  const setMode = (m: ThemeMode) => {
    localStorage.setItem('varys-theme', m);
    setModeState(m);
  };

  return <ThemeContext.Provider value={{ mode, setMode }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
