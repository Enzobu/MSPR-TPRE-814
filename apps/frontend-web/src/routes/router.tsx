import { createBrowserRouter } from 'react-router';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { RootLayout } from '@/components/layout/RootLayout';
import { RouteError } from '@/components/route-error';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import NotFoundPage from '@/pages/NotFoundPage';

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
          { index: true, element: <HomePage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
