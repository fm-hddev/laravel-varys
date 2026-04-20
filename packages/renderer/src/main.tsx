import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@/index.css';
import { App } from '@/App';

// Install browser mock only when running outside Electron (no preload = no window.varys).
// Using window.varys presence rather than import.meta.env.DEV ensures the mock never
// overrides the real IPC bridge in the packaged app, even if Forge builds in dev mode.
if (!('varys' in window)) {
  const { installBrowserMock } = await import('@/mocks/varys.browser');
  installBrowserMock();
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
