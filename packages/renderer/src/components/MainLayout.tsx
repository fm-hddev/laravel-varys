import { Outlet } from 'react-router-dom';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { NavBar } from '@/components/NavBar';

export function MainLayout() {
  return (
    <div className="flex h-screen flex-col bg-neutral-950">
      <NavBar />
      <div className="flex-1 overflow-y-auto">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </div>
    </div>
  );
}
