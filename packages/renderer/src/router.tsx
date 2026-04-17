import { lazy, Suspense } from 'react';
import { createMemoryRouter, Navigate } from 'react-router-dom';

import { useProjectStore } from '@/store/useProjectStore';

const WelcomeScreen = lazy(() => import('@/screens/WelcomeScreen'));
const SettingsScreen = lazy(() => import('@/screens/SettingsScreen'));
const ProcessesView = lazy(() => import('@/screens/ProcessesView'));

function RootRedirect() {
  const activePath = useProjectStore((s) => s.activePath);
  return <Navigate to={activePath ? '/processes' : '/welcome'} replace />;
}

function Loading() {
  return (
    <div className="flex h-screen items-center justify-center bg-neutral-950">
      <span className="text-neutral-400 text-sm">Chargement…</span>
    </div>
  );
}

export const router = createMemoryRouter([
  {
    path: '/',
    element: <RootRedirect />,
  },
  {
    path: '/welcome',
    element: (
      <Suspense fallback={<Loading />}>
        <WelcomeScreen />
      </Suspense>
    ),
  },
  {
    path: '/settings',
    element: (
      <Suspense fallback={<Loading />}>
        <SettingsScreen />
      </Suspense>
    ),
  },
  {
    path: '/processes',
    element: (
      <Suspense fallback={<Loading />}>
        <ProcessesView />
      </Suspense>
    ),
  },
]);
