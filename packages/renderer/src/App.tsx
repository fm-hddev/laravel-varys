import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';

import { useFailedJobToasts } from '@/components/FailedJobToast';
import { ThemeProvider } from '@/components/ThemeProvider';
import { queryClient } from '@/lib/queryClient';
import { router } from '@/router';

function AppInner() {
  useFailedJobToasts();
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" richColors />
    </>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AppInner />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
