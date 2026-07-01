import { Suspense, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { RootLayout } from '@/components/layout/RootLayout';
import { RouteError } from '@/components/route-error';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDetailPage,
  AlertsPage,
  HomePage,
  LotDetailPage,
  LotsPage,
  MonitoringPage,
  NotFoundPage,
} from '@/routes/lazy-pages';
import LoginPage from '@/pages/LoginPage';

function lazyPage(element: ReactNode): ReactNode {
  return (
    <Suspense fallback={<Skeleton className="h-48 w-full" />}>
      {element}
    </Suspense>
  );
}

// Data router (ADR-0005). /login est public ; tout le reste passe par la garde
// <ProtectedRoute> qui redirige vers /login si non authentifié (ADR-0006).
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <RouteError />,
  },
  {
    element: <ProtectedRoute />,
    errorElement: <RouteError />,
    children: [
      {
        path: '/',
        element: <RootLayout />,
        children: [
          { index: true, element: lazyPage(<HomePage />) },
          { path: 'monitoring', element: lazyPage(<MonitoringPage />) },
          { path: 'lots', element: lazyPage(<LotsPage />) },
          { path: 'lots/:id', element: lazyPage(<LotDetailPage />) },
          { path: 'alerts', element: lazyPage(<AlertsPage />) },
          { path: 'alerts/:id', element: lazyPage(<AlertDetailPage />) },
          { path: '*', element: lazyPage(<NotFoundPage />) },
        ],
      },
    ],
  },
]);
