import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { ErrorBoundary } from '@/components/error-boundary';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { queryClient } from '@/lib/query-client';
import { router } from '@/routes/router';

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <Toaster />
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
