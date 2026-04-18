import { lazy, Suspense } from 'react';
import { createMemoryRouter, Navigate } from 'react-router-dom';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { MainLayout } from '@/components/MainLayout';
import { useProjectStore } from '@/store/useProjectStore';

const WelcomeScreen = lazy(() => import('@/screens/WelcomeScreen'));
const SettingsScreen = lazy(() => import('@/screens/SettingsScreen'));
const ProcessesView = lazy(() => import('@/screens/ProcessesView'));
const EventsView = lazy(() => import('@/screens/EventsView'));
const QueuesView = lazy(() => import('@/screens/QueuesView'));
const LogsView = lazy(() => import('@/screens/LogsView'));

function RootRedirect() {
  const activePath = useProjectStore((s) => s.activePath);
  return <Navigate to={activePath ? '/processes' : '/welcome'} replace />;
}

function Loading() {
  return (
    <div className="flex h-full items-center justify-center bg-neutral-950">
      <span className="text-neutral-400 text-sm">Chargement…</span>
    </div>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>{children}</Suspense>
    </ErrorBoundary>
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
      <Wrap>
        <WelcomeScreen />
      </Wrap>
    ),
  },
  {
    path: '/settings',
    element: (
      <Wrap>
        <SettingsScreen />
      </Wrap>
    ),
  },
  {
    element: <MainLayout />,
    children: [
      {
        path: '/processes',
        element: (
          <Suspense fallback={<Loading />}>
            <ProcessesView />
          </Suspense>
        ),
      },
      {
        path: '/events',
        element: (
          <Suspense fallback={<Loading />}>
            <EventsView />
          </Suspense>
        ),
      },
      {
        path: '/queues',
        element: (
          <Suspense fallback={<Loading />}>
            <QueuesView />
          </Suspense>
        ),
      },
      {
        path: '/logs',
        element: (
          <Suspense fallback={<Loading />}>
            <LogsView />
          </Suspense>
        ),
      },
    ],
  },
]);
